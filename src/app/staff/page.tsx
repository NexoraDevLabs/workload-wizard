'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useMemo, useState } from 'react';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateLecturerForm } from '@/components/domain/CreateLecturerForm';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  teamName?: string;
  contract?: string;
  fte?: number;
  maxTeachingHours?: number;
  totalContract?: number;
  prefWorkingLocation?: string;
  prefWorkingTime?: string;
  prefSpecialism?: string;
  prefNotes?: string;
  allocations?: Array<{
    _id: string;
    hoursOverride?: number;
    hoursComputed?: number;
    type?: string;
    code?: string;
    name?: string;
  }>;
}

interface UserData {
  systemRoles?: string[];
}

export default function StaffCapacityPage() {
  const { currentYear } = useAcademicYear();
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  const convexUser = useQuery(
    api.users.getBySubject,
    user?.id ? { subject: user.id } : 'skip'
  ) as UserData | undefined;

  const isAdminLike = (convexUser?.systemRoles || []).some(
    (role) =>
      role === 'orgadmin' || role === 'sysadmin' || role === 'developer'
  );

  const profiles = useQuery(
    api.staff.list,
    user?.id && isAdminLike ? { userId: user.id } : 'skip'
  ) as StaffMember[] | undefined;

  const [search, setSearch] = useState('');
  const [contract, setContract] = useState<string>('all');
  const [activeOnly, setActiveOnly] = useState<boolean>(false);
  const [overCapacityOnly, setOverCapacityOnly] = useState<boolean>(false);
  const [capacityMode, setCapacityMode] = useState<'teaching' | 'total'>(
    'teaching'
  );
  const [openCreate, setOpenCreate] = useState(false);

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
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Staff' },
      ]}
      title="Staff capacity"
      subtitle={
        currentYear
          ? `Academic Year: ${currentYear.name}`
          : 'Select an academic year'
      }
    >
      <div className="space-y-4">
        <div data-testid="page-ready" />

        {isAdminLike && (
          <div className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                data-testid="staff-search-input"
                placeholder="Name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="w-40 space-y-1">
              <Label>Contract</Label>
              <Select value={contract} onValueChange={setContract}>
                <SelectTrigger data-testid="contract-select-trigger">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="FT">Full Time</SelectItem>
                  <SelectItem value="PT">Part Time</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-44 space-y-1">
              <Label>Capacity Mode</Label>
              <Select
                value={capacityMode}
                onValueChange={(value) =>
                  setCapacityMode(value as 'teaching' | 'total')
                }
              >
                <SelectTrigger data-testid="capacity-mode-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teaching">Teaching</SelectItem>
                  <SelectItem value="total">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-1 flex items-center gap-2 md:mt-0">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  data-testid="active-only-checkbox"
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(event) => setActiveOnly(event.target.checked)}
                />{' '}
                Active only
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  data-testid="over-capacity-checkbox"
                  type="checkbox"
                  checked={overCapacityOnly}
                  onChange={(event) =>
                    setOverCapacityOnly(event.target.checked)
                  }
                />{' '}
                Over capacity
              </label>
            </div>

            <div className="md:ml-auto">
              <Button onClick={() => setOpenCreate(true)}>
                Create lecturer
              </Button>
            </div>
          </div>
        )}

        {isAdminLike && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Lecturer</DialogTitle>
              </DialogHeader>
              <div className="max-h-[80vh] overflow-y-auto px-1">
                <CreateLecturerForm onSuccess={() => setOpenCreate(false)} />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {!isAdminLike && (
          <div className="text-sm text-muted-foreground">
            View your profile from the sidebar (Staff → My Profile).
          </div>
        )}

        {isAdminLike && (!Array.isArray(profiles) || profiles.length === 0) && (
          <div
            className="rounded-md border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground"
            data-testid="empty-staff-list"
          >
            No staff in list
          </div>
        )}

        {isAdminLike &&
          Array.isArray(profiles) &&
          profiles.length > 0 &&
          currentYear?._id && (
            <ul className="divide-y rounded-md border" data-testid="staff-list">
              {profiles.map((profile) => (
                <StaffRow
                  key={String(profile._id)}
                  userId={user.id}
                  profile={profile}
                  yearId={String(currentYear._id)}
                  filters={{
                    search,
                    contract,
                    activeOnly,
                    overCapacityOnly,
                    capacityMode,
                  }}
                />
              ))}
            </ul>
          )}
      </div>
    </StandardizedSidebarLayout>
  );
}

function StaffRow({
  userId,
  profile,
  yearId,
  filters,
}: {
  userId: string;
  profile: StaffMember;
  yearId?: string;
  filters: {
    search: string;
    contract: string;
    activeOnly: boolean;
    overCapacityOnly: boolean;
    capacityMode: 'teaching' | 'total';
  };
}) {
  const totals = useQuery(
    api.allocations.computeLecturerTotals,
    userId && profile._id && yearId
      ? {
          userId,
          lecturerId: profile._id as Id<'lecturer_profiles'>,
          academicYearId: yearId as Id<'academic_years'>,
        }
      : 'skip'
  ) as
    | {
        allocatedTeaching: number;
        allocatedAdmin: number;
        allocatedTotal: number;
      }
    | undefined;

  const adminAllocations = useQuery(
    api.allocations.listAdminAllocations,
    profile._id && yearId
      ? {
          lecturerId: profile._id as Id<'lecturer_profiles'>,
          academicYearId: yearId as Id<'academic_years'>,
        }
      : 'skip'
  ) as Array<{ allocation?: { hours?: number } }> | undefined;

  const matchesFilters = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const searchOk =
      !query ||
      (profile.fullName || '').toLowerCase().includes(query) ||
      (profile.email || '').toLowerCase().includes(query);

    const contractOk =
      filters.contract === 'all' || profile.contract === filters.contract;

    const activeOk = !filters.activeOnly || Boolean(profile.isActive);

    if (!filters.overCapacityOnly) {
      return searchOk && contractOk && activeOk;
    }

    if (!totals) {
      return false;
    }

    const adminExtra = (adminAllocations || []).reduce(
      (acc, row) => acc + (Number(row?.allocation?.hours) || 0),
      0
    );

    const teaching = totals.allocatedTeaching || 0;
    const totalWithAdmin = teaching + (totals.allocatedAdmin || 0) + adminExtra;
    const teachingMax = Number(profile.maxTeachingHours) || 0;
    const totalMax = Number(profile.totalContract) || 0;
    const teachingPct =
      teachingMax > 0 ? (totals.allocatedTeaching / teachingMax) * 100 : 0;
    const totalPct = totalMax > 0 ? (totalWithAdmin / totalMax) * 100 : 0;

    const over =
      filters.capacityMode === 'teaching' ? teachingPct > 100 : totalPct > 100;

    return searchOk && contractOk && activeOk && over;
  }, [filters, profile, totals, adminAllocations]);

  if (!matchesFilters) {
    return null;
  }

  const teachingMax = Number(profile.maxTeachingHours) || 0;
  const totalMax = Number(profile.totalContract) || 0;
  const teaching = totals?.allocatedTeaching ?? 0;

  const adminStandalone = (adminAllocations || []).reduce(
    (acc, row) => acc + (Number(row?.allocation?.hours) || 0),
    0
  );

  const admin = (totals?.allocatedAdmin ?? 0) + adminStandalone;
  const total = teaching + admin;
  const teachingRemaining = Math.max(0, teachingMax - teaching);

  const teachingPct =
    teachingMax > 0
      ? Math.min(100, Math.round((teaching / teachingMax) * 100))
      : 0;

  const totalPct =
    totalMax > 0 ? Math.min(100, Math.round((total / totalMax) * 100)) : 0;

  let teachingPctOfTotal =
    totalMax > 0 ? Math.round((teaching / totalMax) * 100) : 0;

  let adminPctOfTotal = totalMax > 0 ? Math.round((admin / totalMax) * 100) : 0;

  teachingPctOfTotal = Math.max(0, Math.min(100, teachingPctOfTotal));
  adminPctOfTotal = Math.max(0, Math.min(100, adminPctOfTotal));

  if (teachingPctOfTotal + adminPctOfTotal > 100) {
    const excess = teachingPctOfTotal + adminPctOfTotal - 100;
    adminPctOfTotal = Math.max(0, adminPctOfTotal - excess);
  }

  const teachingColor = 'bg-blue-600';

  return (
    <li className="p-3 text-sm hover:bg-accent/50" data-testid="staff-row">
      <a
        href={`/staff/${profile._id}`}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-2 font-medium">
            {profile.fullName}
            {!profile.isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>

          <div className="text-muted-foreground">
            Team: {profile.teamName || '—'}
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            Contract: {profile.contract} • FTE {profile.fte}
          </div>

          <div className="text-xs text-muted-foreground">
            Limits: Max teaching {teachingMax || '–'}h • Contract{' '}
            {totalMax || '–'}h
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Teaching</span>
                <span>
                  {teaching}/{teachingMax || '–'}h (
                  {teachingMax ? teachingPct : 0}%)
                </span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-3 w-full cursor-help overflow-hidden rounded-md bg-blue-100 ring-1 ring-blue-300/50">
                      <div
                        className={`h-full ${teachingColor} transition-[width] duration-500 ease-out`}
                        style={{ width: `${teachingPct}%` }}
                      />
                    </div>
                  </TooltipTrigger>

                  <TooltipContent
                    side="top"
                    align="center"
                    className="rounded-md border bg-popover px-3 py-2 shadow-md"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-100 ring-1 ring-blue-400" />
                        <span className="text-muted-foreground">
                          Max teaching
                        </span>
                        <span className="ml-auto font-medium">
                          {teachingMax || '–'}h
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" />
                        <span className="text-muted-foreground">
                          Teaching allocations
                        </span>
                        <span className="ml-auto font-medium">{teaching}h</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-300" />
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="ml-auto font-medium">
                          {teachingRemaining}h
                        </span>
                      </div>

                      <div className="pt-1 text-[11px] text-muted-foreground">
                        Used:{' '}
                        <span className="font-medium text-foreground">
                          {teachingPct}%
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Total</span>
                <span>
                  {total}/{totalMax || '–'}h ({totalMax ? totalPct : 0}%)
                </span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-3 w-full cursor-help overflow-hidden rounded-md bg-emerald-100 ring-1 ring-emerald-300/60">
                      <div
                        className="h-full bg-blue-600 transition-[width] duration-500 ease-out"
                        style={{ width: `${teachingPctOfTotal}%` }}
                      />
                      <div
                        className="h-full bg-amber-400 transition-[width] duration-500 ease-out"
                        style={{ width: `${adminPctOfTotal}%` }}
                      />
                    </div>
                  </TooltipTrigger>

                  <TooltipContent
                    side="top"
                    align="center"
                    className="rounded-md border bg-popover px-3 py-2 shadow-md"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-400" />
                        <span className="text-muted-foreground">
                          Contract baseline
                        </span>
                        <span className="ml-auto font-medium">
                          {totalMax || '–'}h
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" />
                        <span className="text-muted-foreground">Teaching</span>
                        <span className="ml-auto font-medium">{teaching}h</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
                        <span className="text-muted-foreground">Admin</span>
                        <span className="ml-auto font-medium">{admin}h</span>
                      </div>

                      <div className="pt-1 text-[11px] text-muted-foreground">
                        Used:{' '}
                        <span className="font-medium text-foreground">
                          {total}h
                        </span>{' '}
                        ({totalPct}%)
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="min-w-40 text-right">
          <div data-testid="staff-teaching">Teaching: {teaching}h</div>
          <div data-testid="staff-admin">Admin: {admin}h</div>
          <div data-testid="staff-total" className="font-medium">
            Total: {total}h
          </div>
        </div>
      </a>
    </li>
  );
}