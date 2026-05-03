import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

const publicRoutePatterns = [
  /^\/$/,
  /^\/sign-in(?:\/.*)?$/,
  /^\/sign-up(?:\/.*)?$/,
  /^\/api\/health$/,
  /^\/api\/webhooks(?:\/.*)?$/,
];

const onboardingRoutePatterns = [
  /^\/onboarding$/,
  /^\/onboarding-success$/,
  /^\/api\/complete-onboarding$/,
];

function matches(pathname: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(pathname));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (matches(pathname, publicRoutePatterns)) {
    return NextResponse.next();
  }

  const hasWorkOSSession = Boolean(
    req.cookies.get('wos-session')?.value ?? req.cookies.get('workos_session')?.value
  );

  if (!hasWorkOSSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  if (matches(pathname, onboardingRoutePatterns)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
