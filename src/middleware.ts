import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/webhooks(.*)',
]);

const isOnboardingRoute = createRouteMatcher([
  '/onboarding',
  '/onboarding-success',
  '/api/complete-onboarding',
]);
const isBuildTimeClerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_build_time_only';

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

const middleware = isBuildTimeClerkKey
  ? () => NextResponse.next()
  : clerkMiddleware(async (auth, req) => {
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

export default middleware;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
