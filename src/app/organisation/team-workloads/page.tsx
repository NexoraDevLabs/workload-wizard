'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, UserRoundSearch } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';

export const dynamic = 'force-dynamic';

type TeamWorkload = {
  teamNames: string[];
  members: Array<{
    _id: Id<'lecturer_profiles'>;
    fullName: string;
    email: string;
    teamName?: string;
    role?: string;
    contract: string;
    fte: number;
    maxTeachingHours: number;
    totalContract: number;
    teaching: number;
    admin: number;
    total: number;
    teachingPct: number;
    totalPct: number;
    allocationCount: number;
    isCurrentUser: boolean;
  }>;
};

export default function TeamWorkloadsPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const { currentYear } = useAcademicYear();
  const canViewManagerDashboard = useQuery(
    api.permissions.hasPermission,
    user?.id
      ? { userId: user.id, permissionId: 'manager.dashboard.view' }
      : 'skip'
  );
  const canViewWorkloadDashboard = useQuery(
    api.permissions.hasPermission,
    user?.id
      ? { userId: user.id, permissionId: 'workload.admin.dashboard.view' }
      : 'skip'
  );
  const canManagePermissions = useQuery(
    api.permissions.hasPermission,
    user?.id
      ? { userId: user.id, permissionId: 'permissions.manage' }
      : 'skip'
  );
  const permissionChecksLoaded =
    canViewManagerDashboard !== undefined &&
    canViewWorkloadDashboard !== undefined &&
    canManagePermissions !== undefined;
  const canViewTeamWorkloads = Boolean(
    canViewManagerDashboard ||
      canViewWorkloadDashboard ||
      canManagePermissions
  );
  const dashboard = useQuery(
    api.staff.getTeamWorkloadDashboard,
    user?.id && currentYear?._id && canViewTeamWorkloads
      ? { userId: user.id, academicYearId: currentYear._id }
      : 'skip'
  ) as TeamWorkload | undefined;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !permissionChecksLoaded) return;
    if (!canViewTeamWorkloads) {
      router.replace('/unauthorised');
    }
  }, [
    canViewTeamWorkloads,
    isLoaded,
    isSignedIn,
    permissionChecksLoaded,
    router,
    user,
  ]);

  const summary = useMemo(() => {
    const members = dashboard?.members ?? [];
    const total = members.reduce((sum, member) => sum + member.total, 0);
    const average = members.length > 0 ? Math.round(total / members.length) : 0;
    const over = members.filter((member) => member.totalPct > 100).length;
    return { total, average, over };
  }, [dashboard]);

  if (!isLoaded || !isSignedIn || !user) return null;

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[
        { label: 'Organisation', href: '/organisation' },
        { label: 'Team Workloads' },
      ]}
      title="Team Workloads"
      subtitle={
        currentYear
          ? `Compare workload balance for ${currentYear.name}`
          : 'Select an academic year'
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Team members</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {dashboard?.members.length ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average workload</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary.average}h
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Over capacity</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary.over}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Workload balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Teaching</TableHead>
                <TableHead className="text-right">Admin</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-44">Balance</TableHead>
                <TableHead className="w-24 text-right">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboard?.members ?? []).map((member) => (
                <TableRow key={String(member._id)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.fullName}</span>
                      {member.isCurrentUser && (
                        <Badge variant="outline">You</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.role || member.contract} · FTE {member.fte}
                    </div>
                  </TableCell>
                  <TableCell>{member.teamName || 'Unassigned'}</TableCell>
                  <TableCell className="text-right">
                    {member.teaching}h
                  </TableCell>
                  <TableCell className="text-right">{member.admin}h</TableCell>
                  <TableCell className="text-right font-medium">
                    {member.total}h
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={
                            member.totalPct > 100
                              ? 'h-full bg-destructive'
                              : member.totalPct >= 85
                                ? 'h-full bg-amber-500'
                                : 'h-full bg-emerald-500'
                          }
                          style={{ width: `${Math.min(100, member.totalPct)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.totalPct}% of {member.totalContract || '–'}h
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/staff/${member._id}`}>
                        <UserRoundSearch className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </StandardizedSidebarLayout>
  );
}
