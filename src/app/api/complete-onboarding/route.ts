import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getAuthUser } from '@/lib/authz';
import { withApiTracing } from '@/lib/otel/withApiTracing';
import { withDbSpan } from '@/lib/otel/withDbSpan';

let convexClient: ConvexHttpClient | null = null;
function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
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
    const user = await getAuthUser();
    const body = (await request.json()) as { onboardingData: OnboardingData };
    await withDbSpan('convex:completeOnboarding', () =>
      getConvexClient().mutation(api.users.completeOnboarding, {
        subject: user.id,
        onboardingData: body.onboardingData,
      })
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}

export const POST = withApiTracing('api:/api/complete-onboarding', handlePost);
