import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getAuthUserFromWorkOS } from '@/lib/auth/workos';
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

type CompleteOnboardingBody = {
  organisationId?: string;
  givenName?: string;
  familyName?: string;
  firstName?: string; // Back-compat with old form
  lastName?: string; // Back-compat with old form
  jobRole?: string;
  department?: string;
  phone?: string;
};

function normaliseString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function handlePost(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromWorkOS();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = (await request.json()) as CompleteOnboardingBody;

    const organisationId = normaliseString(body.organisationId);
    if (!organisationId) {
      return NextResponse.json(
        { error: 'organisationId is required' },
        { status: 400 }
      );
    }

    const givenName =
      normaliseString(body.givenName) ||
      normaliseString(body.firstName) ||
      authUser.firstName ||
      '';

    const familyName =
      normaliseString(body.familyName) ||
      normaliseString(body.lastName) ||
      authUser.lastName ||
      '';

    const result = await withDbSpan('convex:completeOnboardingAndCreateProfile', () =>
      getConvexClient().mutation(api.users.completeOnboardingAndCreateProfile, {
        subject: authUser.id,
        organisationId: organisationId as Id<'organisations'>,
        givenName,
        familyName,
        email: authUser.email,
        ...(normaliseString(body.jobRole)
          ? { jobRole: normaliseString(body.jobRole) }
          : {}),
        ...(normaliseString(body.department)
          ? { department: normaliseString(body.department) }
          : {}),
        ...(normaliseString(body.phone)
          ? { phone: normaliseString(body.phone) }
          : {}),
      })
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

export const POST = withApiTracing('api:/api/complete-onboarding', handlePost);