'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users,
  Building2,
  FileText,
  Shield,
  Calendar,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { hasAnyRole } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Badge } from '@/components/ui/badge';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

export default function OrganisationAdminPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();

  const convexUser = useQuery(
    api.users.getBySubject,
    user?.id ? { subject: user.id } : 'skip'
  );

  useEffect(() => {
    if (!isLoaded) return;
    const hasByWorkOS =
      hasAnyRole(user, ['orgadmin', 'sysadmin', 'developer']) ||
      (user?.publicMetadata as Record<string, unknown> | undefined)?.[
        'devLoginSession'
      ] === true;
    const hasByConvex =
      !!convexUser &&
      Array.isArray(convexUser.systemRoles) &&
      convexUser.systemRoles.some((r: string) =>
        ['sysadmin', 'developer'].includes(r)
      );
    if (!(hasByWorkOS || hasByConvex)) {
      router.replace('/unauthorised');
    }
  }, [isLoaded, user, convexUser, router]);

  if (!isLoaded) return <p>Loading...</p>;

  const hasByWorkOS =
    hasAnyRole(user, ['orgadmin', 'sysadmin', 'developer']) ||
    (user?.publicMetadata as Record<string, unknown> | undefined)?.[
      'devLoginSession'
    ] === true;
  const hasByConvex =
    !!convexUser &&
    Array.isArray(convexUser.systemRoles) &&
    convexUser.systemRoles.some((r: string) =>
      ['sysadmin', 'developer'].includes(r)
    );
  if (!(hasByWorkOS || hasByConvex)) return null; // redirect in effect

  const organisationId = (user?.publicMetadata?.organisationId as string) || '';

  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'Organisation' }];

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
      title="Organisation Admin Panel"
      subtitle="Manage your organisation's users, roles, and settings"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organisation Users
            </CardTitle>
            <CardDescription>
              Manage users within your organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/organisation/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>
              Manage roles and permissions for your organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/organisation/roles">Manage Roles</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Academic Years
            </CardTitle>
            <CardDescription>Publish and manage years</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/organisation/academic-years">
                Open Academic Years
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisation Settings
            </CardTitle>
            <CardDescription>
              Configure organisation details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/organisation/settings">View Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Admin Allocations
            </CardTitle>
            <CardDescription>Categories and hours</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/organisation/settings/admin-allocations">
                Manage Admin Allocations
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Organisation Reports
              <Badge variant="secondary" className="ml-2">
                Coming soon
              </Badge>
            </CardTitle>
            <CardDescription>
              View reports and analytics for your organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              View Reports (disabled)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Courses & Modules
            </CardTitle>
            <CardDescription>Plan teaching structures</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button asChild variant="secondary">
              <Link href="/courses">Courses</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/modules">Modules</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Organisation Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Organisation ID:</strong>{' '}
                {organisationId || 'Not assigned'}
              </p>
              <p>
                <strong>Your Role:</strong>{' '}
                {hasAnyRole(user, ['orgadmin'])
                  ? 'Organisation Admin'
                  : 'System Admin'}
              </p>
              <p>
                <strong>Email:</strong>{' '}
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardizedSidebarLayout>
  );
}
