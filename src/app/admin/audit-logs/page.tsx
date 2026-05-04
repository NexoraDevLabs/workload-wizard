'use client';

import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { AuditLogsViewer } from '@/components/domain/AuditLogsViewer';
import { AuditViewGate } from '@/components/common/PermissionGate';
import { useAuthUser } from '@/hooks/useAuthUser';


// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: 'Audit Logs' },
  ];

  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  const headerActions = <div className="flex items-center gap-2"></div>;

  if (!isLoaded) {
    return null;
  }
  
  if (!isSignedIn || !user) {
    return null;
  }

  return (
    <AuditViewGate
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          You don&apos;t have permission to view audit logs.
        </div>
      }
      redirectOnDeny={false}
    >
      <StandardizedSidebarLayout
        breadcrumbs={breadcrumbs}
        title="Audit Logs"
        subtitle="Monitor system activity and user actions"
        headerActions={headerActions}
      >
        <p className="text-sm text-muted-foreground">
          View and search audit logs for all user actions and system events. Use
          the filters above to narrow down results by date range, user, action
          type, or search terms.
        </p>
        <AuditLogsViewer />
      </StandardizedSidebarLayout>
    </AuditViewGate>
  );
}
