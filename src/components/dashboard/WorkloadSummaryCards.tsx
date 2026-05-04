'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Briefcase, Clock, TrendingUp } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}

function SummaryCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconBg,
  iconColor,
  isLoading,
}: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
            )}
            {sublabel && !isLoading && (
              <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
            )}
            {sublabel && isLoading && <Skeleton className="mt-1 h-3 w-24" />}
          </div>
          <div className={`flex-shrink-0 rounded-xl p-2.5 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkloadSummaryCards() {
  const { user, isLoaded, isSignedIn } = useAuthUser();
  const { currentYear } = useAcademicYear();

  const hasOrganisation = Boolean(user?.organisationId);

  const staffList = useQuery(
    api.staff.list,
    user?.id && hasOrganisation ? { userId: user.id } : 'skip'
  ) as
    | Array<{
        _id: string;
        fullName: string;
        userSubject?: string;
        maxTeachingHours?: number;
        totalContract?: number;
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

  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Teaching Hours', 'Admin Hours', 'Total Allocated', 'Teaching Remaining'].map(
          (label) => (
            <SummaryCard
              key={label}
              label={label}
              value="—"
              icon={Clock}
              iconBg="bg-secondary"
              iconColor="text-secondary-foreground"
              isLoading
            />
          )
        )}
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return null;
  }

  if (!hasOrganisation) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Your account is signed in but has not been assigned to an organisation
        yet. Ask an admin to assign your account before using the dashboard.
      </div>
    );
  }

  const isLoadingProfile = hasOrganisation && staffList === undefined;
  const isLoadingTotals = Boolean(linkedProfile && totals === undefined);
  const isLoading = isLoadingProfile || isLoadingTotals;

  const teaching = totals?.allocatedTeaching ?? 0;
  const adminStandalone = (adminAllocations || []).reduce(
    (acc, r) => acc + (Number(r?.allocation?.hours) || 0),
    0
  );
  const admin = (totals?.allocatedAdmin ?? 0) + adminStandalone;
  const total = teaching + admin;
  const maxTeaching = Number(linkedProfile?.maxTeachingHours) || 0;
  const maxTotal = Number(linkedProfile?.totalContract) || 0;
  const remaining = Math.max(0, maxTeaching - teaching);

  const teachingPct =
    maxTeaching > 0 ? Math.round((teaching / maxTeaching) * 100) : 0;

  const cards: SummaryCardProps[] = [
    {
      label: 'Teaching Hours',
      value: `${teaching}h`,
      sublabel: maxTeaching
        ? `of ${maxTeaching}h max (${teachingPct}% used)`
        : 'No limit set',
      icon: BookOpen,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      isLoading,
    },
    {
      label: 'Admin Hours',
      value: `${admin}h`,
      sublabel: 'Administrative allocations',
      icon: Briefcase,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      isLoading,
    },
    {
      label: 'Total Allocated',
      value: `${total}h`,
      sublabel: maxTotal
        ? `of ${maxTotal}h contract (${maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0}% used)`
        : 'No contract limit set',
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      isLoading,
    },
    {
      label: 'Teaching Remaining',
      value: maxTeaching ? `${remaining}h` : '—',
      sublabel: maxTeaching
        ? `${remaining}h available to allocate`
        : 'Set a contract to see remaining hours',
      icon: Clock,
      iconBg:
        remaining === 0 && maxTeaching > 0
          ? 'bg-destructive/10'
          : 'bg-secondary',
      iconColor:
        remaining === 0 && maxTeaching > 0
          ? 'text-destructive'
          : 'text-secondary-foreground',
      isLoading,
    },
  ];

  if (!linkedProfile && !isLoadingProfile) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        No linked staff profile found. Ask an admin to link your account to a
        lecturer profile to see your workload summary.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}