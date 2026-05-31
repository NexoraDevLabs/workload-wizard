import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasWorkOSSession = Boolean(
    req.cookies.get('wos-session')?.value ??
    req.cookies.get('workos_session')?.value
  );

  if (!hasWorkOSSession) {
    const loginUrl = new URL('/api/auth/login', req.url);
    loginUrl.searchParams.set(
      'returnTo',
      `${pathname}${req.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/admin/:path*',
    '/organisation/:path*',
    '/settings/:path*',
    '/courses/:path*',
    '/modules/:path*',
    '/staff/:path*',
    '/notifications/:path*',
    '/onboarding/:path*',
    '/onboarding-success/:path*',
    '/dev/:path*',
    '/api/account/:path*',
    '/api/admin/:path*',
    '/api/complete-onboarding',
    '/api/env-check',
    '/api/featurebase/:path*',
    '/api/sync-usernames',
    '/api/update-last-signin',
    '/api/update-user',
    '/api/update-user-email',
    '/api/update-user-username',
    '/api/user/:path*',
  ],
};
