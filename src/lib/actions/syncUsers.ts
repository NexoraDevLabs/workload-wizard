'use server';

import { can } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/authz';

export async function syncUsersFromAuthProvider() {
  const authUser = await getAuthUser();

  if (!can(authUser, 'sync.users')) {
    throw new Error('Unauthorized: Admin access required');
  }

  return {
    totalUsers: 0,
    message:
      'WorkOS sync has been removed. Users are managed from the application database.',
    results: [],
  };
}

export async function getSyncStatus() {
  await getAuthUser();

  return {
    workosUserCount: 0,
    convexUserCount: 0,
    missingInConvex: 0,
    extraInConvex: 0,
    isSynced: true,
  };
}
