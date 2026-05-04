import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
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
    const session = await getAuthContext();
    if (!session) {
      return new NextResponse('Unauthorised', { status: 401 });
    }

    try {
      const sync = await getConvexClient().mutation(api.users.syncUser, {
        userId: session.userId,
        email: session.email,
      });

      return NextResponse.json(
        {
          userId: session.userId,
          email: session.email,
          organisationId: session.organisationId,
          needsOrganisation: sync.needsOrganisation,
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          userId: session.userId,
          email: session.email,
          organisationId: session.organisationId,
          needsOrganisation: session.organisationId === null,
          syncError:
            error instanceof Error ? error.message : 'Unable to sync user',
        },
        { status: 200 }
      );
    }
  } catch {
    return new NextResponse('Unauthorised', { status: 401 });
  }
}

export const GET = withApiTracing('api:/api/user', handleGet);
