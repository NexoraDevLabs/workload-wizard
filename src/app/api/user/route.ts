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
      userId: authUser.id, // WorkOS user.id → your Convex userId/subject
      email: authUser.email,
      givenName, // now supported by your updated syncUser
      familyName,
    });

    return NextResponse.json(
      {
        userId: authUser.id,
        email: authUser.email,
        fullName:
          [givenName, familyName].filter(Boolean).join(' ') || authUser.email,
        givenName,
        familyName,
        organisationId: authUser.organisationId ?? null,
        needsOrganisation: sync?.needsOrganisation ?? false,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unauthorised',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 401 }
    );
  }
}

export const GET = withApiTracing('api:/api/user', handleGet);
