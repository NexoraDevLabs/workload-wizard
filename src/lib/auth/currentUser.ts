'use server';

import { currentUser } from '@clerk/nextjs/server';
import { getAuthUser, normalizeRole } from '@/lib/authz';

export async function getCurrentUserDetails() {
  const clerkUser = await currentUser();

  if (!clerkUser) return null;

  const fullName = clerkUser.firstName + ' ' + clerkUser.lastName;

  try {
    const user = await getAuthUser();
    return {
      id: user.id,
      email: user.email,
      fullName,
      organisationId: user.orgId,
      role: user.role,
    };
  } catch (error) {
    if (error instanceof Error && error.message !== 'Missing organisationId') {
      throw error;
    }

    return {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      fullName,
      organisationId: clerkUser.publicMetadata?.organisationId as
        | string
        | undefined,
      role: normalizeRole(clerkUser.publicMetadata?.role as string | undefined),
    };
  }
}

/**
 * Gets current user and throws if they don't have an organisationId
 * Use this for actions that require organisation context
 */
export async function getUserOrgOrThrow() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error('Unauthorised: User not authenticated');
  }

  let user;
  try {
    user = await getAuthUser();
  } catch (error) {
    if (error instanceof Error && error.message === 'Missing organisationId') {
      throw new Error('Unauthorised: User must be assigned to an organisation');
    }
    throw new Error('Unauthorised: User not authenticated');
  }

  return {
    id: user.id,
    email: user.email,
    fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    organisationId: user.orgId,
    role: user.role,
  };
}

/**
 * Gets current user and throws if they don't have an organisationId
 * Also validates that the user's organisationId matches the provided organisationId
 * Use this for actions that require specific organisation access
 */
export async function getUserOrgOrThrowWithValidation(
  requiredOrganisationId: string
) {
  const user = await getUserOrgOrThrow();

  if (user.organisationId !== requiredOrganisationId) {
    throw new Error('Unauthorised: Access denied to this organisation');
  }

  return user;
}

// Permission utility functions moved to src/lib/auth/permissions.ts
