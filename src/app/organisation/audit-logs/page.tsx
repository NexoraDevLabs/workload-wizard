import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { AuditLogsViewer } from '@/components/domain/AuditLogsViewer';
import { AuditViewGate } from '@/components/common/PermissionGate';
import { getUserOrgOrThrow } from '@/lib/auth/currentUser';

export default async function OrganisationAuditLogsPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Organisation', href: '/organisation' },
    { label: 'Audit Logs' },
  ];
  const user = await getUserOrgOrThrow();
  const orgId = user.organisationId;
  if (!orgId) {
    throw new Error('Unauthorised: User must be assigned to an organisation');
  }
  // Hard block non-orgadmins here to avoid rendering the viewer

  return (
    <AuditViewGate
      organisationId={orgId}
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
      >
        <AuditLogsViewer
          forcedFilters={{ type: 'org', organisationId: orgId }}
        />
      </StandardizedSidebarLayout>
    </AuditViewGate>
  );
}
