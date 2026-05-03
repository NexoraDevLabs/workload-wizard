'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { can } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/authz';

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

export async function syncUsernamesFromClerk() {
  const currentUserData = await currentUser();

  if (!currentUserData) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const authUser = await getAuthUser();

  if (!can(authUser, 'sync.users')) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    // Get all users from Clerk
    const clerk = await clerkClient();
    let allClerkUsers: Array<{
      id: string;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      emailAddresses: Array<{ emailAddress: string }>;
    }> = [];
    let hasNextPage = true;
    let lastUserId: string | undefined = undefined;

    // Paginate through all Clerk users
    while (hasNextPage) {
      const clerkUsersResponse = await clerk.users.getUserList({
        limit: 100,
        ...(lastUserId && { lastUserId }),
      });

      allClerkUsers = allClerkUsers.concat(clerkUsersResponse.data);
      hasNextPage = clerkUsersResponse.totalCount > allClerkUsers.length;

      if ((clerkUsersResponse.data?.length || 0) > 0) {
        lastUserId =
          clerkUsersResponse.data[clerkUsersResponse.data.length - 1]!.id;
      } else {
        hasNextPage = false;
      }
    }

    // Found users in Clerk

    const results = [];
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const clerkUser of allClerkUsers) {
      try {
        // Find corresponding user in Convex
        const convexUser = await getConvexClient().query(
          api.users.getBySubject,
          {
            subject: clerkUser.id,
          }
        );

        if (!convexUser) {
          // Clerk user not found in Convex, skipping
          results.push({
            userId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown',
            status: 'skipped',
            message: 'User not found in Convex',
          });
          skippedCount++;
          continue;
        }

        // Check if username needs updating
        const clerkUsername = clerkUser.username || '';
        const convexUsername = convexUser.username || '';

        if (clerkUsername === convexUsername) {
          // Username already synced
          results.push({
            userId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown',
            status: 'skipped',
            message: 'Username already up to date',
          });
          skippedCount++;
          continue;
        }

        // Get current user's Convex ID for permission check
        const currentConvexUser = await getConvexClient().query(
          api.users.getBySubject,
          {
            subject: currentUserData.id,
          }
        );
        if (!currentConvexUser) {
          throw new Error('Current user not found in Convex');
        }

        // Update username in Convex
        await getConvexClient().mutation(api.users.update, {
          id: convexUser._id,
          username: clerkUsername,
          currentUserId: currentConvexUser._id,
        });

        // Username updated
        results.push({
          userId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown',
          status: 'updated',
          message: `Username updated: "${convexUsername}" -> "${clerkUsername}"`,
        });
        updatedCount++;
      } catch (innerError) {
        // Error updating user
        results.push({
          userId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown',
          status: 'error',
          message:
            innerError instanceof Error ? innerError.message : 'Unknown error',
        });
        errorCount++;
      }
    }

    // Username sync completed

    return {
      success: true,
      summary: {
        total: allClerkUsers.length,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      results,
    };
  } catch (error) {
    throw new Error(
      `Failed to sync usernames: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
