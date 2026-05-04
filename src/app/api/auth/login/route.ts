import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getWorkOSClient, getWorkOSRedirectUri } from '@/lib/auth/workos';

export async function GET(request: NextRequest) {
  const workos = getWorkOSClient();
  const clientId = process.env.WORKOS_CLIENT_ID;

  if (!workos || !clientId) {
    return NextResponse.json(
      { error: 'WorkOS is not configured' },
      { status: 503 }
    );
  }

  const returnTo =
    request.nextUrl.searchParams.get('returnTo') || '/dashboard';
  const url = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId,
    redirectUri: getWorkOSRedirectUri(),
    state: returnTo,
  });

  return NextResponse.redirect(url);
}
