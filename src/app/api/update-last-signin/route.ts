import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Lazy client creation to avoid build-time issues
let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

export async function POST() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Update last sign in time in Convex
    await getConvexClient().mutation(api.users.updateLastSignIn, {
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error updating last sign in time
    return NextResponse.json(
      { error: 'Failed to update last sign in time' },
      { status: 500 }
    );
  }
}
