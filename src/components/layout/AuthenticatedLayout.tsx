'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthUser } from '@/hooks/useAuthUser';
import { LoadingOverlay } from '@/components/loading-overlay';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  const pathname = usePathname();
  const router = useRouter();

  const isOnboardingRoute =
    pathname === '/onboarding' || pathname === '/onboarding-success';

  const needsOnboarding = Boolean(
    user && (user.needsOrganisation || !user.onboardingCompleted)
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) return;

    if (needsOnboarding && !isOnboardingRoute) {
      router.replace('/onboarding');
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    needsOnboarding,
    isOnboardingRoute,
    router,
  ]);

  if (!isLoaded) {
    return <LoadingOverlay delayMs={300} />;
  }

  if (!isSignedIn || !user) {
    return <LoadingOverlay delayMs={300} />;
  }

  if (needsOnboarding && !isOnboardingRoute) {
    return <LoadingOverlay delayMs={300} />;
  }

  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset data-testid="page-ready">{children}</SidebarInset>
    </SidebarProvider>
  );
}