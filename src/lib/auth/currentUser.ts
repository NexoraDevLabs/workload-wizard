'use server';

import { getAuthUser } from '@/lib/authz';

export async function getCurrentUserDetails() {
  try {
    const user = await getAuthUser();
    return {
      id: user.id,
      email: user.email,
      fullName: user.email ?? user.id,
      organisationId: user.orgId,
      role: user.role,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Missing organisationId') {
      return null;
    }
    throw error;
  }
}

export async function getUserOrgOrThrow() {
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
    fullName: user.email ?? user.id,
    organisationId: user.orgId,
    role: user.role,
  };
}

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
