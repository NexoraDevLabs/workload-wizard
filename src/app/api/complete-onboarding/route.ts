import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { withApiTracing } from '@/lib/otel/withApiTracing';
import { withDbSpan } from '@/lib/otel/withDbSpan';

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

interface OnboardingData {
  firstName?: string;
  lastName?: string;
  jobRole?: string;
  department?: string;
  phone?: string;
}

async function handlePost(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      // No current user found in onboarding completion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { onboardingData: OnboardingData };
    const { onboardingData } = body;

    // Only call Convex if the user exists there; avoid 500s if webhook hasn't created it yet
    try {
      const existing = await withDbSpan('convex:getBySubject', () =>
        getConvexClient().query(api.users.getBySubject, {
          subject: user.id,
        })
      );

      if (existing) {
        await withDbSpan('convex:completeOnboarding', () =>
          getConvexClient().mutation(api.users.completeOnboarding, {
            subject: user.id,
            onboardingData: onboardingData,
          })
        );
      } else {
        // complete-onboarding: Convex user not found; skipping Convex update
      }
    } catch {
      // complete-onboarding: Convex call failed
      // Continue; Clerk will still be updated below
    }

    // Also update Clerk user record for name changes to keep in sync
    const clerk = await clerkClient();
    const clerkUpdates: Record<string, unknown> = {};

    if (
      onboardingData.firstName &&
      onboardingData.firstName !== user.firstName
    ) {
      clerkUpdates.firstName = onboardingData.firstName;
    }

    if (onboardingData.lastName && onboardingData.lastName !== user.lastName) {
      clerkUpdates.lastName = onboardingData.lastName;
    }

    // Only update Clerk if there are name changes to sync
    if (Object.keys(clerkUpdates).length > 0) {
      await clerk.users.updateUser(user.id, clerkUpdates);
    }

    // Update Clerk metadata with just completion status
    await clerk.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    // Error completing onboarding
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

export const POST = withApiTracing('api:/api/complete-onboarding', handlePost);
