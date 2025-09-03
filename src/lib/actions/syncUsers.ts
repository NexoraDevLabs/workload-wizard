'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { hasAdminAccess } from '@/lib/auth/permissions';

// Define proper types for Statsig adapter based on the actual types from @flags-sdk/statsig
interface StatsigAdapterResponse {
  initialize: () => Promise<{
    logEvent: (
      user: {
        userID: string;
        email?: string;
        custom?: Record<string, unknown>;
      },
      eventName: string
    ) => void;
    flush: () => Promise<void>;
  }>;
}

// Lazy import to avoid build-time issues
let statsigAdapter: StatsigAdapterResponse | null = null;
async function getStatsigAdapter(): Promise<StatsigAdapterResponse> {
  if (!statsigAdapter) {
    const { statsigAdapter: adapter } = await import('@/flags');
    statsigAdapter = adapter as StatsigAdapterResponse;
  }
  return statsigAdapter;
}

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

export async function syncUsersFromClerk() {
  const currentUserData = await currentUser();

  if (!currentUserData) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // Check if user has admin role in Clerk metadata
  const userRole = currentUserData.publicMetadata?.role as string;
  const userRoles = currentUserData.publicMetadata?.roles as string[];

  if (
    !hasAdminAccess(userRole) &&
    !(
      userRoles &&
      (userRoles.includes('sysadmin') || userRoles.includes('developer'))
    )
  ) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    // Initialize Statsig once for the batch
    const adapter = await getStatsigAdapter();
    const Statsig = await adapter.initialize();

    // Get all users from Clerk
    const clerk = await clerkClient();
    const clerkUsersResponse = await clerk.users.getUserList({
      limit: 100,
    });
    const clerkUsers = clerkUsersResponse.data;

    // Get the first organisation from Convex (we'll use this as default)
    const organisations = await getConvexClient().query(api.organisations.list);
    if ((organisations?.length || 0) === 0) {
      throw new Error(
        'No organisations found in Convex. Please create an organisation first.'
      );
    }
    const defaultOrganisationId = organisations[0]!._id;

    const results = [];

    for (const clerkUser of clerkUsers) {
      try {
        const primaryEmail = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;

        if (!primaryEmail) {
          // Clerk user has no primary email address, skipping
          results.push({
            userId: clerkUser.id,
            status: 'failed',
            message: 'No primary email address found',
          });
          continue;
        }

        // Check if user exists in Convex
        const existingConvexUser = await getConvexClient().query(
          api.users.getBySubject,
          {
            subject: clerkUser.id,
          }
        );

        if (!existingConvexUser) {
          // Create user in Convex if not found
          const systemRole =
            (clerkUser.publicMetadata?.role as
              | 'orgadmin'
              | 'sysadmin'
              | 'developer'
              | 'user'
              | 'trial') || 'user';

          const createData = {
            email: primaryEmail,
            username: clerkUser.username || '',
            givenName: clerkUser.firstName || '',
            familyName: clerkUser.lastName || '',
            fullName:
              clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                : primaryEmail,
            systemRoles: [systemRole],
            // API accepts optional organisationId for system flows; Convex derives for actor-driven flows
            organisationId: defaultOrganisationId,
            pictureUrl: clerkUser.imageUrl || '',
            subject: clerkUser.id,
            tokenIdentifier: `https://clerk.com/users/${clerkUser.id}`,
          };

          await getConvexClient().mutation(api.users.create, createData);
          results.push({
            userId: clerkUser.id,
            status: 'created',
            message: 'User created in Convex',
          });
        } else {
          // User already exists in Convex
          results.push({
            userId: clerkUser.id,
            status: 'skipped',
            message: 'User already exists in Convex',
          });
        }

        // Ensure the user exists in Statsig Users by logging an event
        Statsig.logEvent(
          {
            userID: clerkUser.id,
            email: primaryEmail,
            custom: {
              fullName:
                clerkUser.firstName && clerkUser.lastName
                  ? `${clerkUser.firstName} ${clerkUser.lastName}`
                  : primaryEmail,
              roles:
                (clerkUser.publicMetadata?.roles as string[] | undefined) ||
                (clerkUser.publicMetadata?.role
                  ? [clerkUser.publicMetadata.role as string]
                  : []),
              source: 'manual_sync',
            },
          },
          'user_synced'
        );
      } catch (innerError) {
        // Error processing Clerk user
        const errorMessage =
          innerError instanceof Error ? innerError.message : String(innerError);
        results.push({
          userId: clerkUser.id,
          status: 'failed',
          message: `Failed to process: ${errorMessage}`,
        });
      }
    }

    // Flush Statsig events once at the end of the batch
    try {
      await Statsig.flush();
    } catch {
      // Statsig flush failed after sync batch
    }

    return {
      success: true,
      totalUsers: clerkUsers.length,
      message: `Sync complete. Processed ${clerkUsers.length} users.`,
      results,
    };
  } catch {
    throw new Error('Failed to sync users from Clerk');
  }
}

export async function getSyncStatus() {
  const currentUserData = await currentUser();

  if (!currentUserData) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // Check if user has admin role in Clerk metadata
  const userRole = currentUserData.publicMetadata?.role as string;
  const userRoles = currentUserData.publicMetadata?.roles as string[];

  if (
    !hasAdminAccess(userRole) &&
    !(
      userRoles &&
      (userRoles.includes('sysadmin') || userRoles.includes('developer'))
    )
  ) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const clerk = await clerkClient();
    const clerkUsersResponse = await clerk.users.getUserList({ limit: 100 });
    const clerkUsers = clerkUsersResponse.data;
    const clerkUserIds = new Set(clerkUsers.map((u) => u.id));

    const convexUsers = await getConvexClient().query(api.users.list, {});
    const convexUserSubjects = new Set(convexUsers.map((u) => u.subject));

    const missingInConvex = clerkUsers.filter(
      (clerkUser) => !convexUserSubjects.has(clerkUser.id)
    );
    const extraInConvex = convexUsers.filter(
      (convexUser) => !clerkUserIds.has(convexUser.subject)
    );

    return {
      clerkUserCount: clerkUsers.length,
      convexUserCount: convexUsers.length,
      missingInConvex: missingInConvex.length,
      extraInConvex: extraInConvex.length,
      isSynced: missingInConvex.length === 0 && extraInConvex.length === 0,
    };
  } catch {
    throw new Error('Failed to get sync status');
  }
}
