'use client';

import { OrganisationsManageGate } from '@/components/common/PermissionGate';
import { useSelectedLayoutSegments } from 'next/navigation';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const segments = useSelectedLayoutSegments();
  if (segments.length === 0 || segments.includes('tools')) {
    return <>{children}</>;
  }
  return (
    <OrganisationsManageGate redirectOnDeny>{children}</OrganisationsManageGate>
  );
}
