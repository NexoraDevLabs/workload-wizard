'use client';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function DashboardPage() {
  return <DashboardContent />;
}
