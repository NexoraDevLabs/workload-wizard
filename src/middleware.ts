import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { createLimiterFor } from './lib/rateLimiter';
import { trackRateLimitEvent } from './lib/metrics';

function clientId(req: NextRequest) {
  // Prefer a user id header/cookie if your app sets one; fallback to IP.
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-user-id') || `ip:${ip}`;
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/landing',
  '/api/webhooks/clerk',
  '/terms',
  '/privacy',
  '/reset-password',
  '/studio(.*)', // Sanity Studio handles its own auth
  '/blog(.*)', // Make blog routes publicly accessible
  '/support', // Make support route publicly accessible
]);
const isAccountRoute = createRouteMatcher(['/account(.*)']);
const isApiRoute = createRouteMatcher([
  '/api/complete-onboarding',
  '/api/update-user-email',
  '/api/admin/dev-tools(.*)', // Allow admin dev tools API routes
  // Feature flag routes removed
  '/api/admin/reset-password', // Allow admin password reset
]);
const isOnboardingRoute = createRouteMatcher([
  '/onboarding',
  '/onboarding-success',
]);

function getConvex(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

// Rate limiting middleware for API routes
async function rateLimitMiddleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Only apply rate limiting to API routes
  if (!path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const id = `${path}:${clientId(req)}`;
  const limiter = await createLimiterFor(path);
  const result = await limiter.limit(id);

  const resetSec = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  const headers = new Headers({
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(resetSec),
  });

  // Try to flush analytics without blocking response (Edge-safe)
  const waitUntil = (
    req as unknown as { waitUntil?: (promise: Promise<unknown>) => void }
  ).waitUntil;
  if (waitUntil) {
    waitUntil(result.pending);
  }

  if (!result.success) {
    headers.set('Retry-After', String(resetSec || 60));
    trackRateLimitEvent('block', {
      path,
      id,
      remaining: result.remaining,
      limit: result.limit,
    });
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers,
    });
  }

  trackRateLimitEvent('hit', {
    path,
    id,
    remaining: result.remaining,
    limit: result.limit,
  });
  return NextResponse.next({ headers });
}

export default clerkMiddleware(async (auth, req) => {
  // First apply rate limiting for API routes
  const rateLimitResponse = await rateLimitMiddleware(req);
  if (rateLimitResponse.status !== 200) {
    return rateLimitResponse;
  }

  // HTTPS redirect - DISABLED for Vercel deployments (handled at platform level)
  // const proto = req.headers.get('x-forwarded-proto');
  // if (proto && proto !== 'https') {
  //   const url = new URL(req.url);
  //   url.protocol = 'https:';
  //   return NextResponse.redirect(url, 308);
  // }

  const { userId, sessionClaims } = await auth();

  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Allow account routes for authenticated users (but don't check onboarding status)
  if (isAccountRoute(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  // Allow API routes for authenticated users (but don't check onboarding status)
  if (isApiRoute(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  // Allow onboarding route for authenticated users
  if (isOnboardingRoute(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  // Protect all other routes
  await auth.protect();

  // Enforce onboarding completion
  if (userId) {
    try {
      // Prefer Clerk session claims (publicMetadata) for the flag
      const claimsAny = sessionClaims as {
        publicMetadata?: Record<string, unknown>;
        metadata?: { publicMetadata?: Record<string, unknown> };
      };
      const hasCompletedInClaims = Boolean(
        claimsAny?.publicMetadata?.onboardingCompleted ??
          claimsAny?.metadata?.publicMetadata?.onboardingCompleted
      );

      let hasCompletedOnboarding = hasCompletedInClaims;

      // Fallback to Convex user record if claims missing or false
      if (!hasCompletedOnboarding) {
        try {
          const convex = getConvex();
          if (!convex) throw new Error('Convex URL not configured');
          const user = await convex.query(api.users.getBySubject, {
            subject: userId,
          });
          hasCompletedOnboarding = Boolean(user?.onboardingCompleted);
        } catch {
          // Non-fatal; proceed with claims-only decision
        }
      }

      // Final fallback: check Clerk live user metadata (session claims may be stale immediately after update)
      if (!hasCompletedOnboarding) {
        try {
          const client = await clerkClient();
          const liveUser = await client.users.getUser(userId);
          hasCompletedOnboarding = Boolean(
            (
              liveUser as unknown as {
                publicMetadata?: Record<string, unknown>;
              }
            )?.publicMetadata?.onboardingCompleted
          );
        } catch {
          // Clerk live metadata check failed
        }
      }

      // Redirects based on onboarding status
      if (!hasCompletedOnboarding && !isOnboardingRoute(req)) {
        const onboardingUrl = new URL('/onboarding', req.url);
        return NextResponse.redirect(onboardingUrl);
      }

      if (hasCompletedOnboarding && isOnboardingRoute(req)) {
        const dashboardUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(dashboardUrl);
      }
    } catch {
      // Allow access if check fails unexpectedly
    }
  }

  return NextResponse.next();
});

// Handle 403 responses by redirecting to unauthorized page
// Remove extraneous named middleware exports; Clerk's default export handles protection

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
