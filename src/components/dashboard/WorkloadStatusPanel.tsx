'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

type WorkloadStatus = 'optimal' | 'warning' | 'over' | 'unset';

function getStatusMeta(
  pct: number,
  hasMax: boolean
): {
  status: WorkloadStatus;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  badgeClass: string;
  Icon: React.ComponentType<{ className?: string }>;
  barClass: string;
} {
  if (!hasMax) {
    return {
      status: 'unset',
      label: 'No limit set',
      badgeVariant: 'outline',
      badgeClass: '',
      Icon: Info,
      barClass: 'bg-muted-foreground/30',
    };
  }
  if (pct > 100) {
    return {
      status: 'over',
      label: 'Over capacity',
      badgeVariant: 'destructive',
      badgeClass: '',
      Icon: AlertCircle,
      barClass: 'bg-destructive',
    };
  }
  if (pct >= 85) {
    return {
      status: 'warning',
      label: 'Near capacity',
      badgeVariant: 'outline',
      badgeClass:
        'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      Icon: AlertTriangle,
      barClass: 'bg-amber-500',
    };
  }
  return {
    status: 'optimal',
    label: 'On track',
    badgeVariant: 'outline',
    badgeClass:
      'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Icon: CheckCircle2,
    barClass: 'bg-emerald-500',
  };
}

interface CapacityBarProps {
  label: string;
  used: number;
  max: number;
  colorClass: string;
  tooltip?: string;
}

function CapacityBar({
  label,
  used,
  max,
  colorClass,
  tooltip,
}: CapacityBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1.5 cursor-default">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">{label}</span>
              <span className="font-semibold text-foreground tabular-nums">
                {used}h{max > 0 ? ` / ${max}h` : ''}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{pct}% used</span>
              {max > 0 && <span>{Math.max(0, max - used)}h remaining</span>}
            </div>
          </div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function WorkloadStatusPanel() {
  const { user } = useUser();
  const { currentYear } = useAcademicYear();

  const staffList = useQuery(
    api.staff.list,
    user?.id ? { userId: user.id } : 'skip'
  ) as
    | Array<{
        _id: string;
        fullName: string;
        userSubject?: string;
        maxTeachingHours?: number;
        totalContract?: number;
        contract?: string;
        fte?: number;
      }>
    | undefined;

  const linkedProfile = staffList?.find((s) => s.userSubject === user?.id);

  const totals = useQuery(
    api.allocations.computeLecturerTotals,
    linkedProfile?._id && currentYear?._id
      ? {
          lecturerId: linkedProfile._id as Id<'lecturer_profiles'>,
          academicYearId: currentYear._id as Id<'academic_years'>,
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
    linkedProfile?._id && currentYear?._id
      ? {
          lecturerId: linkedProfile._id as Id<'lecturer_profiles'>,
          academicYearId: currentYear._id as Id<'academic_years'>,
        }
      : 'skip'
  ) as Array<{ allocation?: { hours?: number } }> | undefined;

  const detailedAllocations = useQuery(
    api.allocations.listForLecturerDetailed,
    linkedProfile?._id && currentYear?._id
      ? {
          lecturerId: linkedProfile._id as Id<'lecturer_profiles'>,
          academicYearId: currentYear._id as Id<'academic_years'>,
        }
      : 'skip'
  ) as
    | Array<{
        allocation: {
          type: string;
          hoursOverride?: number;
          hoursComputed?: number;
        };
        module: { code?: string; name?: string } | null;
        group: { name?: string } | null;
      }>
    | undefined;

  const isLoadingProfile = staffList === undefined;
  const isLoadingTotals = linkedProfile && totals === undefined;
  const isLoading = isLoadingProfile || !!isLoadingTotals;

  const teaching = totals?.allocatedTeaching ?? 0;
  const adminStandalone = (adminAllocations || []).reduce(
    (acc, r) => acc + (Number(r?.allocation?.hours) || 0),
    0
  );
  const admin = (totals?.allocatedAdmin ?? 0) + adminStandalone;
  const total = teaching + admin;
  const maxTeaching = Number(linkedProfile?.maxTeachingHours) || 0;
  const maxTotal = Number(linkedProfile?.totalContract) || 0;

  const teachingPct =
    maxTeaching > 0 ? Math.round((teaching / maxTeaching) * 100) : 0;
  const totalPct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  const teachingStatus = getStatusMeta(teachingPct, maxTeaching > 0);
  const totalStatus = getStatusMeta(totalPct, maxTotal > 0);

  const recentModules = (detailedAllocations || []).slice(0, 5);

  if (!linkedProfile && !isLoadingProfile) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Capacity overview */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Workload Capacity
            </CardTitle>
            {currentYear && (
              <Badge variant="outline" className="text-xs font-normal">
                {currentYear.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              {/* Teaching bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Teaching
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <teachingStatus.Icon
                      className={`h-4 w-4 ${
                        teachingStatus.status === 'over'
                          ? 'text-destructive'
                          : teachingStatus.status === 'warning'
                            ? 'text-amber-500'
                            : teachingStatus.status === 'optimal'
                              ? 'text-emerald-500'
                              : 'text-muted-foreground'
                      }`}
                    />
                    <Badge
                      variant={teachingStatus.badgeVariant}
                      className={`text-xs ${teachingStatus.badgeClass}`}
                    >
                      {teachingStatus.label}
                    </Badge>
                  </div>
                </div>
                <CapacityBar
                  label="Teaching hours"
                  used={teaching}
                  max={maxTeaching}
                  colorClass={
                    teachingStatus.status === 'over'
                      ? 'bg-destructive'
                      : teachingStatus.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-primary'
                  }
                  tooltip="Hours allocated to teaching modules and groups"
                />
              </div>

              <div className="border-t border-border/60" />

              {/* Total bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-foreground">
                      Total (Teaching + Admin)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <totalStatus.Icon
                      className={`h-4 w-4 ${
                        totalStatus.status === 'over'
                          ? 'text-destructive'
                          : totalStatus.status === 'warning'
                            ? 'text-amber-500'
                            : totalStatus.status === 'optimal'
                              ? 'text-emerald-500'
                              : 'text-muted-foreground'
                      }`}
                    />
                    <Badge
                      variant={totalStatus.badgeVariant}
                      className={`text-xs ${totalStatus.badgeClass}`}
                    >
                      {totalStatus.label}
                    </Badge>
                  </div>
                </div>
                {/* Stacked bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Total contract
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {total}h{maxTotal > 0 ? ` / ${maxTotal}h` : ''}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted flex">
                    {maxTotal > 0 ? (
                      <>
                        <div
                          className="h-full bg-primary transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(100, Math.round((teaching / maxTotal) * 100))}%`,
                          }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(
                              100 -
                                Math.min(
                                  100,
                                  Math.round((teaching / maxTotal) * 100)
                                ),
                              Math.round((admin / maxTotal) * 100)
                            )}%`,
                          }}
                        />
                      </>
                    ) : (
                      <div className="h-full w-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-primary" />
                      Teaching: {teaching}h
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-amber-400" />
                      Admin: {admin}h
                    </span>
                    {maxTotal > 0 && (
                      <span className="ml-auto">
                        {Math.max(0, maxTotal - total)}h remaining
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile meta */}
              {linkedProfile && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <span>
                    Contract:{' '}
                    <span className="font-medium text-foreground">
                      {linkedProfile.contract ?? '—'}
                    </span>
                  </span>
                  <span>
                    FTE:{' '}
                    <span className="font-medium text-foreground">
                      {linkedProfile.fte ?? '—'}
                    </span>
                  </span>
                  <span>
                    Max teaching:{' '}
                    <span className="font-medium text-foreground">
                      {maxTeaching ? `${maxTeaching}h` : '—'}
                    </span>
                  </span>
                  <span>
                    Total contract:{' '}
                    <span className="font-medium text-foreground">
                      {maxTotal ? `${maxTotal}h` : '—'}
                    </span>
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent module allocations */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Recent Allocations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : recentModules.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No allocations yet
            </div>
          ) : (
            <ul className="space-y-2">
              {recentModules.map(({ allocation, module, group }, i) => {
                const hours =
                  typeof allocation.hoursOverride === 'number'
                    ? allocation.hoursOverride
                    : allocation.hoursComputed || 0;
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {module?.code ?? '—'}{' '}
                        <span className="font-normal text-muted-foreground">
                          {module?.name ?? ''}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Group: {group?.name ?? '—'}
                      </p>
                    </div>
                    <div className="ml-3 flex-shrink-0 text-right">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                          allocation.type === 'teaching'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {hours}h
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
