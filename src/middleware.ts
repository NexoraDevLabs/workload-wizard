import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const publicRoutePatterns = [
  /^\/$/,
  /^\/sign-in(?:\/.*)?$/,
  /^\/terms$/,
  /^\/privacy$/,
  /^\/blog(?:\/.*)?$/,
  /^\/api\/auth(?:\/.*)?$/,
  /^\/api\/user$/,
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
    req.cookies.get('wos-session')?.value ??
    req.cookies.get('workos_session')?.value
  );

  if (!hasWorkOSSession) {
    const loginUrl = new URL('/api/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
