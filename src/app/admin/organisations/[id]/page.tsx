'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminOrganisationOverviewPage() {
  const params = useParams();
  const organisationId = params?.id as Id<'organisations'>;
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();

  // Authorisation: only sysadmin or developer
  useEffect(() => {
    if (!isLoaded) return;
    const roles = (user?.publicMetadata?.roles as string[]) || [];
    const singleRole = (user?.publicMetadata?.role as string) || '';
    const has = new Set([singleRole, ...roles]);
    if (!(has.has('sysadmin') || has.has('developer'))) {
      router.replace('/unauthorised');
    }
  }, [isLoaded, user, router]);

  const organisation = useQuery(api.organisations.getById, {
    id: organisationId,
  });
  const users = useQuery(api.users.listByOrganisation, {
    organisationId,
  });
  const courses = useQuery(
    api.courses.listByOrganisation,
    user?.id ? { userId: user.id, organisationId } : 'skip'
  );
  const modules = useQuery(
    api.modules.listForOrganisation,
    user?.id ? { userId: user.id, organisationId } : 'skip'
  );

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: 'Organisations', href: '/admin/organisations' },
    { label: organisation?.name || 'Overview' },
  ];

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
      title={organisation?.name || 'Organisation'}
      subtitle="Organisation profile overview"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription key="summary-desc">
              Key stats for this organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Courses</span>
                <span className="font-semibold">{courses?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Modules</span>
                <span className="font-semibold">{modules?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Staff</span>
                <span className="font-semibold">{users?.length ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>All courses in this organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(courses || []).map(
                    (c: { _id: string; code: string; name: string }) => (
                      <TableRow key={String(c._id)}>
                        <TableCell className="font-medium">{c.code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                      </TableRow>
                    )
                  )}
                  {(courses?.length || 0) === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-muted-foreground text-center"
                      >
                        No courses
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>All modules in this organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[80px]">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(modules || []).map(
                    (m: {
                      _id: string;
                      code: string;
                      name: string;
                      credits?: number;
                    }) => (
                      <TableRow key={String(m._id)}>
                        <TableCell className="font-medium">{m.code}</TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>{m.credits ?? '-'}</TableCell>
                      </TableRow>
                    )
                  )}
                  {(modules?.length || 0) === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-muted-foreground text-center"
                      >
                        No modules
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Staff</CardTitle>
            <CardDescription>Active users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users || [])
                    .slice(0, 10)
                    .map(
                      (u: {
                        _id: string;
                        fullName?: string;
                        givenName: string;
                        familyName: string;
                        email: string;
                      }) => (
                        <TableRow key={String(u._id)}>
                          <TableCell className="font-medium">
                            {u.fullName || `${u.givenName} ${u.familyName}`}
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                        </TableRow>
                      )
                    )}
                  {(users?.length || 0) === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-muted-foreground text-center"
                      >
                        No staff
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardizedSidebarLayout>
  );
}
