import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getWorkOSClient,
  getWorkOSCookiePassword,
  getWorkOSRedirectUri,
  WORKOS_SESSION_COOKIE_NAME,
} from '@/lib/auth/workos';

export async function GET(request: NextRequest) {
  const workos = getWorkOSClient();
  const code = request.nextUrl.searchParams.get('code');
  const returnTo = request.nextUrl.searchParams.get('state') || '/dashboard';
  const cookiePassword = getWorkOSCookiePassword();

  if (!workos || !process.env.WORKOS_CLIENT_ID || !cookiePassword) {
    return NextResponse.json(
      { error: 'WorkOS is not configured' },
      { status: 503 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing WorkOS authorization code' },
      { status: 400 }
    );
  }

  const session = await workos.userManagement.authenticateWithCode({
    code,
    clientId: process.env.WORKOS_CLIENT_ID,
    session: {
      sealSession: true,
      cookiePassword,
    },
  });

  if (!session.sealedSession) {
    return NextResponse.json(
      { error: 'WorkOS did not return a session' },
      { status: 401 }
    );
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.set(WORKOS_SESSION_COOKIE_NAME, session.sealedSession, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  response.headers.set('x-workos-redirect-uri', getWorkOSRedirectUri());

  return response;
}
