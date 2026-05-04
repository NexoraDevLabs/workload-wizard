'use client';

import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function PermissionTestsPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const debugData = useQuery(api.permissions.debugOrganisationsAndRoles);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: 'Permissions', href: '/admin/permissions' },
    { label: 'Tests' },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground">
        Test functionality has been removed from this version
      </div>
    </div>
  );
  if (!isLoaded) {
    return null;
  }
  
  if (!isSignedIn || !user) {
    return null;
  }

  if (!user.organisationId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Your account has not been assigned to an organisation yet.
      </div>
    );
  }
  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Permission System Tests"
      subtitle="Test the permission system with different user roles and permissions"
      headerActions={headerActions}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Permission Validation</CardTitle>
          </div>
          <CardDescription>
            Test functionality has been removed from this version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>Test functionality has been removed from this version.</p>
            <p className="text-sm mt-2">
              The permission system is still fully functional, but the testing
              utilities have been cleaned up.
            </p>
          </div>

          {debugData && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold mb-2">
                Current Organizations & Roles:
              </h4>
              {debugData.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No organizations found. Create test data first.
                </p>
              ) : (
                <div className="space-y-3">
                  {debugData.map(
                    (
                      orgData: {
                        org: { name: string; code: string };
                        roles: { name: string; permissions: string[] }[];
                      },
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="border-l-2 border-yellow-300 pl-3"
                      >
                        <div className="font-medium">
                          {orgData.org.name} ({orgData.org.code})
                        </div>
                        <div className="text-sm text-gray-600">
                          {orgData.roles.length === 0 ? (
                            <p>No roles found</p>
                          ) : (
                            <ul className="ml-4">
                              {orgData.roles.map(
                                (
                                  role: { name: string; permissions: string[] },
                                  roleIndex: number
                                ) => (
                                  <li key={roleIndex}>
                                    <strong>{role.name}</strong> -{' '}
                                    {role.permissions.length} permissions
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </StandardizedSidebarLayout>
  );
}
