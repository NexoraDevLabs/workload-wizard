'use server';

import { can } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/authz';

export async function syncUsernamesFromClerk() {
  const authUser = await getAuthUser();

  if (!can(authUser, 'sync.users')) {
    throw new Error('Unauthorized: Admin access required');
  }

  return {
    success: true,
    message: 'Clerk username sync has been removed. Usernames are managed in the database.',
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    results: [],
  };
}
