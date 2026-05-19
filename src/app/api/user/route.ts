import { NextResponse } from 'next/server';
import { getAuthUserFromWorkOS } from '@/lib/auth/workos';
import { withApiTracing } from '@/lib/otel/withApiTracing';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

async function handleGet() {
  try {
    const authUser = await getAuthUserFromWorkOS();

    if (!authUser) {
      return new NextResponse('Unauthorised', { status: 401 });
    }

    const givenName = authUser.firstName ?? '';
    const familyName = authUser.lastName ?? '';

    const sync = await getConvexClient().mutation(api.users.syncUser, {
      userId: authUser.id,
      email: authUser.email,
      givenName,
      familyName,
    });

    return NextResponse.json(
      {
        userId: authUser.id,
        email: authUser.email,
        fullName:
          sync.user?.fullName ??
          [givenName, familyName].filter(Boolean).join(' ') ??
          authUser.email,
        givenName: sync.user?.givenName ?? givenName,
        familyName: sync.user?.familyName ?? familyName,
        organisationId: sync.user?.organisationId ?? null,
        needsOrganisation: sync.needsOrganisation,
        onboardingCompleted: sync.onboardingCompleted,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}

export const GET = withApiTracing('api:/api/user', handleGet);
