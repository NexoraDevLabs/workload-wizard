import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

const isOnboardingRoute = createRouteMatcher([
  '/onboarding',
  '/onboarding-success',
  '/api/complete-onboarding',
]);
const isDevOnlyRoute = createRouteMatcher([
  '/dev/posthog-test(.*)',
  '/sentry-example-page(.*)',
  '/api/sentry-example-api(.*)',
]);
const isAdminDevToolsRoute = createRouteMatcher(['/api/admin/dev-tools(.*)']);

function hasSystemAdminRole(sessionClaims: unknown): boolean {
  const claims = sessionClaims as
    | {
        publicMetadata?: { role?: unknown; roles?: unknown };
        metadata?: { publicMetadata?: { role?: unknown; roles?: unknown } };
      }
    | undefined;
  const metadata =
    claims?.publicMetadata ?? claims?.metadata?.publicMetadata ?? {};
  const roles = Array.isArray(metadata.roles)
    ? metadata.roles
    : typeof metadata.role === 'string'
      ? [metadata.role]
      : [];

  return roles.some((role) => role === 'sysadmin' || role === 'developer');
}

function hasCompletedOnboarding(sessionClaims: unknown) {
  const claims = sessionClaims as {
    publicMetadata?: Record<string, unknown>;
    metadata?: { publicMetadata?: Record<string, unknown> };
  };

  return Boolean(
    claims.publicMetadata?.onboardingCompleted ??
      claims.metadata?.publicMetadata?.onboardingCompleted
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  await auth.protect();

  const { sessionClaims } = await auth();
  const onboardingComplete = hasCompletedOnboarding(sessionClaims);

  if (!onboardingComplete && !isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  if (onboardingComplete && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
