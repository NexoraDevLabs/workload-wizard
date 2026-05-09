// src/app/dev/permissions/page.tsx

'use client';

import { useMemo } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { getUserRoles } from '@/lib/utils';
import { explainUserPermissions } from '@/lib/permission-resolver';

export default function DevPermissionsPage() {
  const { user, isLoaded } = useAuthUser();

  const roles = useMemo(() => getUserRoles(user), [user]);

  const permissions = useMemo(
    () => explainUserPermissions(roles),
    [roles]
  );

  if (!isLoaded) {
    return <div className="p-6">Loading permissions...</div>;
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Permission Debug</h1>
        <p className="text-sm text-muted-foreground">
          Shows the roles and resolved permissions for the current user.
        </p>
      </div>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Current roles</h2>
        {roles.length > 0 ? (
          <ul className="list-disc pl-5">
            {roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No roles found.</p>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Resolved permissions</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">Permission</th>
                <th className="py-2 pr-4">Group</th>
                <th className="py-2 pr-4">Scope</th>
                <th className="py-2 pr-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.id} className="border-b">
                  <td className="py-2 pr-4 font-mono">{permission.id}</td>
                  <td className="py-2 pr-4">{permission.group}</td>
                  <td className="py-2 pr-4">{permission.scope}</td>
                  <td className="py-2 pr-4">{permission.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}