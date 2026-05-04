'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { LoadingOverlay } from '@/components/loading-overlay';
import { OnboardingCheck } from '@/components/common/OnboardingCheck';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuthUser();

  if (!isLoaded) {
    return <LoadingOverlay delayMs={300} />;
  }

  if (!isSignedIn) {
    return <>{children}</>;
  }

  return (
    <OnboardingCheck>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset data-testid="page-ready">{children}</SidebarInset>
      </SidebarProvider>
    </OnboardingCheck>
  );
}
