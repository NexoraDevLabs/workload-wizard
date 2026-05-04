import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getWorkOSClient,
  getWorkOSCookiePassword,
  WORKOS_SESSION_COOKIE_NAME,
} from '@/lib/auth/workos';

function clearWorkOSCookies(response: NextResponse) {
  response.cookies.set(WORKOS_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('workos_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

async function logout(request: NextRequest) {
  const returnTo = new URL('/', request.url).toString();
  const fallbackResponse = NextResponse.redirect(returnTo);
  clearWorkOSCookies(fallbackResponse);

  const workos = getWorkOSClient();
  const cookiePassword = getWorkOSCookiePassword();

  const sessionData =
    request.cookies.get(WORKOS_SESSION_COOKIE_NAME)?.value ||
    request.cookies.get('workos_session')?.value;

  if (!workos || !cookiePassword || !sessionData) {
    return fallbackResponse;
  }

  try {
    const session = await workos.userManagement.authenticateWithSessionCookie({
      sessionData,
      cookiePassword,
    });

    if (!session.authenticated) {
      return fallbackResponse;
    }

    const logoutUrl = workos.userManagement.getLogoutUrl({
      sessionId: session.sessionId,
      returnTo,
    });

    const response = NextResponse.redirect(logoutUrl);
    clearWorkOSCookies(response);

    return response;
  } catch {
    return fallbackResponse;
  }
}

export async function GET(request: NextRequest) {
  return logout(request);
}

export async function POST(request: NextRequest) {
  return logout(request);
}