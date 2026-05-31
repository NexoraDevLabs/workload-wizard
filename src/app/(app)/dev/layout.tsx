'use client';

import { OrganisationsManageGate } from '@/components/common/PermissionGate';
import { useSelectedLayoutSegments } from 'next/navigation';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const segments = useSelectedLayoutSegments();
  // Allow explicitly dev-only utility pages to render without org permission gating.
  if (
    segments.length === 0 ||
    segments.includes('features') ||
    segments.includes('tools')
  ) {
    return <>{children}</>;
  }
  return (
    <OrganisationsManageGate redirectOnDeny>{children}</OrganisationsManageGate>
  );
}
