'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Users } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';

export const dynamic = 'force-dynamic';

type TeamAssignmentData = {
  teamOptions: string[];
  users: Array<{
    subject: string;
    fullName: string;
    email: string;
    roleNames: string[];
    systemRoles: string[];
  }>;
  profiles: Array<{
    _id: string;
    fullName: string;
    email: string;
    userSubject?: string;
    teamName?: string;
    role?: string;
  }>;
  assignments: Array<{
    managerUserId: string;
    teamName: string;
    isActive: boolean;
  }>;
};

type TeamProfile = TeamAssignmentData['profiles'][number];

export default function TeamManagementPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const { toast } = useToast();
  const canManageTeams = useQuery(
    api.permissions.hasPermission,
    user?.id
      ? { userId: user.id, permissionId: 'permissions.manage' }
      : 'skip'
  );
  const data = useQuery(
    api.staff.listTeamAssignmentData,
    user?.id && canManageTeams === true ? { userId: user.id } : 'skip'
  ) as TeamAssignmentData | undefined;
  const setTeams = useMutation(api.staff.setManagerTeamAssignments);
  const setStaffTeam = useMutation(api.staff.setStaffTeamAssignment);
  const [savingManagerId, setSavingManagerId] = useState<string | null>(null);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [memberDrafts, setMemberDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (canManageTeams === false) {
      router.replace('/unauthorised');
    }
  }, [canManageTeams, isLoaded, isSignedIn, router, user]);

  const managers = useMemo(() => {
    const users = data?.users ?? [];
    return users.filter((candidate) => {
      const names = candidate.roleNames.map((name) => name.toLowerCase());
      const systemRoles = candidate.systemRoles.map((name) =>
        name.toLowerCase()
      );
      return (
        names.includes('team manager') ||
        names.includes('manager') ||
        systemRoles.includes('orgadmin')
      );
    });
  }, [data]);

  const teamMembersByTeam = useMemo(() => {
    const map = new Map<string, TeamProfile[]>();
    for (const profile of data?.profiles ?? []) {
      if (!profile.teamName) continue;
      map.set(profile.teamName, [...(map.get(profile.teamName) ?? []), profile]);
    }
    return map;
  }, [data]);

  const getSelectedTeams = (managerUserId: string) => {
    if (drafts[managerUserId]) return drafts[managerUserId];
    return (
      data?.assignments
        .filter(
          (assignment) =>
            assignment.managerUserId === managerUserId && assignment.isActive
        )
        .map((assignment) => assignment.teamName) ?? []
    );
  };

  const toggleTeam = (managerUserId: string, teamName: string) => {
    const selected = getSelectedTeams(managerUserId);
    const next = selected.includes(teamName)
      ? selected.filter((name) => name !== teamName)
      : [...selected, teamName];
    setDrafts((current) => ({ ...current, [managerUserId]: next }));
  };

  const save = async (managerUserId: string) => {
    if (!user?.id) return;
    setSavingManagerId(managerUserId);
    try {
      await setTeams({
        userId: user.id,
        managerUserId,
        teamNames: getSelectedTeams(managerUserId),
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[managerUserId];
        return next;
      });
      toast({ title: 'Team assignments updated' });
    } catch (error) {
      toast({
        title: 'Could not save assignments',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingManagerId(null);
    }
  };

  const saveMemberTeam = async (profileId: string, teamName: string) => {
    if (!user?.id) return;
    setSavingProfileId(profileId);
    try {
      await setStaffTeam({
        userId: user.id,
        profileId: profileId as Id<'lecturer_profiles'>,
        ...(teamName === '__none' ? {} : { teamName }),
      });
      setMemberDrafts((current) => {
        const next = { ...current };
        delete next[profileId];
        return next;
      });
      toast({ title: 'Team member updated' });
    } catch (error) {
      toast({
        title: 'Could not update team member',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfileId(null);
    }
  };

  if (!isLoaded || !isSignedIn || !user) return null;

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[
        { label: 'Organisation', href: '/organisation' },
        { label: 'Team Management' },
      ]}
      title="Team Management"
      subtitle="Assign managers to teams and review team membership"
    >
      {canManageTeams === true ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Manager assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead className="w-28 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager.subject}>
                      <TableCell>
                        <div className="font-medium">{manager.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {manager.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-3">
                          {(data?.teamOptions ?? []).map((teamName) => {
                            const checked = getSelectedTeams(
                              manager.subject
                            ).includes(teamName);
                            return (
                              <label
                                key={teamName}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() =>
                                    toggleTeam(manager.subject, teamName)
                                  }
                                />
                                {teamName}
                              </label>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => save(manager.subject)}
                          disabled={savingManagerId === manager.subject}
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Staff team allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {(data?.profiles ?? []).map((member) => {
                  const value =
                    memberDrafts[member._id] ?? member.teamName ?? '__none';
                  const hasDraft = value !== (member.teamName ?? '__none');
                  return (
                    <div
                      key={member._id}
                      className="grid gap-2 rounded-md border p-2"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {member.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.role || member.email}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={value}
                          onValueChange={(nextValue) =>
                            setMemberDrafts((current) => ({
                              ...current,
                              [member._id]: nextValue,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">No team</SelectItem>
                            {(data?.teamOptions ?? []).map((teamName) => (
                              <SelectItem key={teamName} value={teamName}>
                                {teamName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!hasDraft || savingProfileId === member._id}
                          onClick={() => saveMemberTeam(member._id, value)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t pt-4">
                {(data?.teamOptions ?? []).map((teamName) => {
                  const members = teamMembersByTeam.get(teamName) ?? [];
                  return (
                    <div key={teamName} className="flex items-center justify-between text-sm">
                      <span>{teamName}</span>
                      <Badge variant="secondary">{members.length}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </StandardizedSidebarLayout>
  );
}
