import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getAuthUser } from '@/lib/authz';

let convexClient: ConvexHttpClient | null = null;
function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

export async function POST() {
  try {
    const user = await getAuthUser();
    await getConvexClient().mutation(
      api.permissions.seedPlanningMvpPermissions,
      {
        performedBy: user.id,
      }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to seed permissions',
      },
      { status: 500 }
    );
  }
}
