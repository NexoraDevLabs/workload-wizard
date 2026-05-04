import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getWorkOSClient,
  getWorkOSCookiePassword,
  WORKOS_SESSION_COOKIE_NAME,
} from '@/lib/auth/workos';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/sign-in', request.url));
  const workos = getWorkOSClient();
  const sessionData = request.cookies.get(WORKOS_SESSION_COOKIE_NAME)?.value;

  response.cookies.delete(WORKOS_SESSION_COOKIE_NAME);
  response.cookies.delete('workos_session');

  if (!workos || !sessionData) {
    return response;
  }

  const cookiePassword = getWorkOSCookiePassword();
  const session = await workos.userManagement.authenticateWithSessionCookie({
    sessionData,
    ...(cookiePassword ? { cookiePassword } : {}),
  });

  if (!session.authenticated) {
    return response;
  }

  return NextResponse.redirect(
    workos.userManagement.getLogoutUrl({
      sessionId: session.sessionId,
      returnTo: new URL('/sign-in', request.url).toString(),
    })
  );
}
