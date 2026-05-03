import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import {
  logRoleAssignedToUser,
  logRoleRevokedFromUser,
} from '@/lib/actions/auditActions';
import type { Id } from '@/convex/_generated/dataModel';
import { z } from 'zod';
import { can, hasRole } from '@/lib/auth/permissions';
import { getAuthUser, getOrganisationIdFromSession } from '@/lib/authz';

const BodySchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Za-z0-9_.-]+$/)
    .optional(),
  systemRoles: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  organisationId: z.string().optional(),
  organisationalRoleId: z.string().optional(),
  organisationalRoleIds: z.array(z.string()).optional(),
});

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

export async function POST(request: NextRequest) {
  try {
    // Check if the current user is authenticated and has admin privileges
    const currentUserData = await currentUser();

    if (!currentUserData) {
      return NextResponse.json(
        { error: 'Unauthorised: User not authenticated' },
        { status: 401 }
      );
    }

    const authUser = await getAuthUser();
    const isAdmin = hasRole(authUser, 'sysadmin');
    const isOrgAdmin = hasRole(authUser, 'org_admin');

    if (!can(authUser, 'users.admin')) {
      return NextResponse.json(
        { error: 'Unauthorised: Admin access required' },
        { status: 403 }
      );
    }

    let parsed;
    try {
      parsed = BodySchema.parse(await request.json());
    } catch (err) {
      if (err && typeof err === 'object' && 'errors' in err) {
        return NextResponse.json(
          {
            error: 'Invalid request body',
            details: (err as { errors: unknown }).errors,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const {
      userId,
      firstName,
      lastName,
      username,
      systemRoles,
      isActive,
      organisationId,
      organisationalRoleId,
      organisationalRoleIds,
    } = parsed;

    // userId existence validated by schema

    // Guardrail: orgadmin (who is NOT sysadmin/developer) cannot assign or revoke system-level roles
    if (!isAdmin && isOrgAdmin && Array.isArray(systemRoles)) {
      const targetUserPreview = await getConvexClient().query(
        api.users.getAuthContext,
        { subject: userId }
      );
      const targetIsSystem = hasRole(targetUserPreview, 'sysadmin');
      const addingSystem = systemRoles.some((role: string) =>
        hasRole({ systemRoles: [role] }, 'sysadmin')
      );
      if (targetIsSystem || addingSystem) {
        return NextResponse.json(
          {
            error:
              'Unauthorised: Org admins cannot modify system roles or users with system roles',
          },
          { status: 403 }
        );
      }
    }

    // Initialize Clerk client
    const clerk = await clerkClient();

    // If orgadmin (and not sysadmin/developer), ensure they can only update users in their own organisation
    if (!isAdmin && isOrgAdmin) {
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
              'Unauthorised: Can only update users in your own organisation',
          },
          { status: 403 }
        );
      }
    }

    // Get existing user from Clerk to compare values
    let existingClerkUser;
    try {
      existingClerkUser = await clerk.users.getUser(userId);
    } catch (error) {
      const httpStatus = (error as { status?: number } | undefined)?.status;
      if (httpStatus === 404) {
        // User not found in Clerk, skipping Clerk update
        existingClerkUser = null;
      } else {
        throw error;
      }
    }

    // Only update Clerk if user exists and values have changed
    if (existingClerkUser) {
      const clerkUpdates: Record<string, unknown> = {};

      // Only update if values are different
      if (firstName && firstName !== existingClerkUser.firstName) {
        clerkUpdates.firstName = firstName;
      }
      if (lastName && lastName !== existingClerkUser.lastName) {
        clerkUpdates.lastName = lastName;
      }
      if (username && username !== existingClerkUser.username) {
        clerkUpdates.username = username;
      }

      // Only make API call if there are actual changes
      if (Object.keys(clerkUpdates).length > 0) {
        // Updating Clerk user
        await clerk.users.updateUser(userId, clerkUpdates);
      } else {
        // No Clerk updates needed for user
      }
    }

    // Update user in Convex
    try {
      // Query Convex to find the target user by their subject (Clerk ID)
      const convexUser = await getConvexClient().query(api.users.getBySubject, {
        subject: userId,
      });

      if (!convexUser) {
        // User not found in Convex with subject
        // Continue without failing since Clerk update succeeded
      } else {
        // Also get the current user's Convex ID for permissions
        const currentConvexUser = await getConvexClient().query(
          api.users.getBySubject,
          {
            subject: currentUserData.id,
          }
        );

        if (!currentConvexUser) {
          // Current user not found in Convex with subject
          // Continue without failing since Clerk update succeeded
        } else {
          // Prepare Convex updates
          const previousSystemRoles: string[] = Array.isArray(
            convexUser.systemRoles
          )
            ? convexUser.systemRoles
            : [];
          const convexUpdates: Record<string, unknown> = {};
          if (firstName) convexUpdates.givenName = firstName;
          if (lastName) convexUpdates.familyName = lastName;
          if (username) convexUpdates.username = username;
          if (firstName || lastName) {
            convexUpdates.fullName = `${firstName || convexUser.givenName} ${lastName || convexUser.familyName}`;
          }
          if (systemRoles) convexUpdates.systemRoles = systemRoles;
          // Apply organisation change to Convex when admin
          if (isAdmin && organisationId) {
            convexUpdates.organisationId = organisationId;
          }
          if (typeof isActive === 'boolean') convexUpdates.isActive = isActive;

          if (Object.keys(convexUpdates).length > 0) {
            await getConvexClient().mutation(api.users.update, {
              id: convexUser._id,
              currentUserId: currentUserData.id, // Pass Clerk subject ID
              ...convexUpdates,
            });
          }

          // Ensure membership row for new organisation when org changed
          if (isAdmin && organisationId) {
            try {
              await getConvexClient().mutation(api.users.ensureMembership, {
                userId,
                organisationId: organisationId as Id<'organisations'>,
                isPrimary: true,
              });
            } catch {
              // ensureMembership failed
            }
          }

          // Log system role changes
          if (Array.isArray(systemRoles)) {
            const added = systemRoles.filter(
              (r: string) => !previousSystemRoles.includes(r)
            );
            const removed = previousSystemRoles.filter(
              (r: string) => !systemRoles.includes(r)
            );
            const userLabel = convexUser.fullName || convexUser.email;
            for (const role of added) {
              await logRoleAssignedToUser(userId, userLabel, role, 'system');
            }
            for (const role of removed) {
              await logRoleRevokedFromUser(userId, userLabel, role, 'system');
            }
          }
        }
      }
    } catch {
      // Error updating user
      // If Convex update fails, we'll continue since Clerk is the primary source
    }

    // Organisational role assignment change (optional)
    if (Array.isArray(organisationalRoleIds)) {
      try {
        const targetOrganisationId = await getOrganisationIdFromSession();
        if (targetOrganisationId) {
          // Guardrail: orgadmin cannot assign roles in other organisations
          if (
            !isAdmin &&
            isOrgAdmin &&
            targetOrganisationId !== (await getOrganisationIdFromSession())
          ) {
            return NextResponse.json(
              {
                error:
                  'Unauthorized: Cannot assign roles outside your organisation',
              },
              { status: 403 }
            );
          }
          // Assign multiple roles when provided; skip on empty to avoid server error
          if (organisationalRoleIds.length > 0) {
            await getConvexClient().mutation(
              api.organisationalRoles.assignMultipleToUser,
              {
                userId,
                roleIds: organisationalRoleIds as unknown as Id<'user_roles'>[],
                assignedBy: currentUserData.id,
              }
            );
          }
        }
      } catch {
        // Organisational multi-role change failed
      }
    } else if (organisationalRoleId) {
      try {
        const targetOrganisationId = await getOrganisationIdFromSession();
        if (targetOrganisationId) {
          // Guardrail: orgadmin cannot assign roles in other organisations
          if (
            !isAdmin &&
            isOrgAdmin &&
            targetOrganisationId !== (await getOrganisationIdFromSession())
          ) {
            return NextResponse.json(
              {
                error:
                  'Unauthorized: Cannot assign roles outside your organisation',
              },
              { status: 403 }
            );
          }
          const existingAssignment = await getConvexClient().query(
            api.organisationalRoles.getUserRole,
            { userId }
          );

          await getConvexClient().mutation(
            api.organisationalRoles.assignToUser,
            {
              userId,
              roleId: organisationalRoleId as unknown as Id<'user_roles'>,
              assignedBy: currentUserData.id,
            }
          );

          // Audit revoke + assign
          const convexUserAfter = await getConvexClient().query(
            api.users.getBySubject,
            {
              subject: userId,
            }
          );
          const userLabel = convexUserAfter?.fullName || convexUserAfter?.email;
          if (
            existingAssignment?.role?._id &&
            existingAssignment.role.name &&
            existingAssignment.role._id !== organisationalRoleId
          ) {
            await logRoleRevokedFromUser(
              userId,
              userLabel,
              existingAssignment.role.name,
              'organisation',
              {
                organisationId: targetOrganisationId,
                roleId: existingAssignment.role._id,
              }
            );
          }
          try {
            const newRole = await getConvexClient().query(
              api.organisationalRoles.getById,
              { roleId: organisationalRoleId as unknown as Id<'user_roles'> }
            );
            if (newRole?.name) {
              await logRoleAssignedToUser(
                userId,
                userLabel,
                newRole.name,
                'organisation',
                {
                  organisationId: targetOrganisationId,
                  roleId: organisationalRoleId,
                }
              );
            }
          } catch {
            // Ignore role lookup errors silently
          }
        }
      } catch {
        // Organisational role change failed
      }
    }

    return NextResponse.json(
      { message: 'User updated successfully' },
      { status: 200 }
    );
  } catch {
    // Error updating user

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
