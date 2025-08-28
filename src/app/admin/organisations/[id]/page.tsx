'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
  const organisationId = params?.id as string;
  const { user, isLoaded } = useUser();
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
    id: organisationId as any,
  });
  const users = useQuery(api.users.listByOrganisation, {
    organisationId: organisationId as any,
  });
  const courses = useQuery(api.courses.listByOrganisation, {
    organisationId: organisationId as any,
  });
  const modules = useQuery(api.modules.listForOrganisation, {
    organisationId: organisationId as any,
  } as any);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: 'Organisations', href: '/admin/organisations' },
    { label: organisation?.name || 'Overview' },
  ];

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
                  {(courses || []).map((c: any) => (
                    <TableRow key={String(c._id)}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                    </TableRow>
                  ))}
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
                  {(modules || []).map((m: any) => (
                    <TableRow key={String(m._id)}>
                      <TableCell className="font-medium">{m.code}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.credits ?? '-'}</TableCell>
                    </TableRow>
                  ))}
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
                  {(users || []).slice(0, 10).map((u: any) => (
                    <TableRow key={String(u._id)}>
                      <TableCell className="font-medium">
                        {u.fullName || `${u.givenName} ${u.familyName}`}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                    </TableRow>
                  ))}
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
