// src/components/dev/PermissionDebugCard.tsx

'use client';

import { useMemo } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { getUserRoles } from '@/lib/utils';
import { explainPermissionsForRoles } from '@/lib/permissions';

export function PermissionDebugCard() {
  const { user } = useAuthUser();

  const roles = useMemo(() => getUserRoles(user), [user]);
  const permissions = useMemo(() => explainPermissionsForRoles(roles), [roles]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <pre className="rounded-lg border bg-muted p-4 text-xs">
      {JSON.stringify(
        {
          roles,
          permissions: permissions.map((permission) => permission.id),
        },
        null,
        2
      )}
    </pre>
  );
}