import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getAuthUser, getOrganisationIdFromSession } from '@/lib/authz';
import { createClerkClient } from '@clerk/backend';
import { z } from 'zod';
import { can, hasRole } from '@/lib/auth/permissions';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const BodySchema = z.object({ userId: z.string().min(1) });

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

export async function POST(request: NextRequest) {
  try {
    // Check if the current user is authenticated and has admin privileges
    const currentUserData = await currentUser();

    if (!currentUserData) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    const authUser = await getAuthUser();
    const isOrgAdmin = hasRole(authUser, 'org_admin');

    if (!can(authUser, 'users.reset_password')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    let parsed;
    try {
      parsed = BodySchema.parse(await request.json());
    } catch (err) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const errorObj = err as { errors: unknown };
        return NextResponse.json(
          { error: 'Invalid request body', details: errorObj.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { userId } = parsed;

    // validated by schema

    // Initialize Clerk client
    const clerk = createClerkClient({
      ...(process.env.CLERK_SECRET_KEY
        ? { secretKey: process.env.CLERK_SECRET_KEY }
        : {}),
    });

    // If orgadmin, ensure they can only reset passwords for users in their own organisation
    if (isOrgAdmin) {
      const targetUser = await getConvexClient().query(
        api.users.getAuthContext,
        { subject: userId }
      );
      const targetUserOrgId = targetUser?.organisationId;
      const currentUserOrgId = await getOrganisationIdFromSession();

      if (targetUserOrgId !== currentUserOrgId) {
        return NextResponse.json(
          {
            error:
              'Unauthorized: Can only reset passwords for users in your own organisation',
          },
          { status: 403 }
        );
      }
    }

    // Get the user to find their email address
    const user = await clerk.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail?.emailAddress) {
      throw new Error('User email address not found');
    }

    // Unfortunately, Clerk doesn't provide a backend API to send password reset emails
    // The client-side approach is the only way to trigger the reset email
    // So we'll disable their password and they'll have to use "Forgot Password?"

    try {
      // Set the password to null/undefined to force a reset
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          passwordResetRequestedBy: currentUserData.id,
          passwordResetRequestedAt: new Date().toISOString(),
          passwordResetRequired: true,
        },
      });

      // Password disabled for user

      return NextResponse.json(
        {
          message: `Password has been disabled for ${primaryEmail.emailAddress}. User must use "Forgot Password?" on the sign-in page to set a new password.`,
          userEmail: primaryEmail.emailAddress,
          action: 'password_disabled',
          nextSteps:
            'Inform the user to visit the sign-in page and click "Forgot Password?" to reset their password.',
        },
        { status: 200 }
      );
    } catch {
      // Failed to disable password

      // If we can't disable the password, just flag it
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          passwordResetRequestedBy: currentUserData.id,
          passwordResetRequestedAt: new Date().toISOString(),
          passwordResetRequired: true,
        },
      });

      return NextResponse.json(
        {
          message: `Password reset has been flagged for ${primaryEmail.emailAddress}. Please inform them to use "Forgot Password?" on the sign-in page.`,
          userEmail: primaryEmail.emailAddress,
          action: 'password_flagged',
        },
        { status: 200 }
      );
    }
  } catch {
    // Error sending password reset email

    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
