'use client';

import { useUser } from '@clerk/nextjs';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { WorkloadSummaryCards } from '@/components/dashboard/WorkloadSummaryCards';
import { WorkloadStatusPanel } from '@/components/dashboard/WorkloadStatusPanel';
import { QuickLinksSection } from '@/components/dashboard/QuickLinksSection';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

export function DashboardContent() {
  const { user } = useUser();
  const { currentYear } = useAcademicYear();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.firstName ?? user?.username ?? 'there';

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[{ label: 'Dashboard' }]}
      headerActions={
        currentYear ? (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 text-xs font-normal"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {currentYear.name}
          </Badge>
        ) : undefined
      }
    >
      <div data-testid="page-ready" />

      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentYear
            ? `Here's an overview of your workload for ${currentYear.name}.`
            : "Here's an overview of your current workload."}
        </p>
      </div>

      {/* Summary stat cards */}
      <section aria-label="Workload summary">
        <WorkloadSummaryCards />
      </section>

      {/* Capacity bars + recent allocations */}
      <section aria-label="Workload status">
        <WorkloadStatusPanel />
      </section>

      {/* Quick links */}
      <section aria-label="Quick links">
        <QuickLinksSection />
      </section>
    </StandardizedSidebarLayout>
  );
}
