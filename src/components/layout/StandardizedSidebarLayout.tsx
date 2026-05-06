'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuthUser } from '@/hooks/useAuthUser';
import { LoadingOverlay } from '@/components/loading-overlay';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface StandardizedSidebarLayoutProps {
  breadcrumbs?: BreadcrumbItemType[];
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

/**
 * Primary authenticated layout used by all app pages.
 * Handles auth guards, sidebar, sticky header, breadcrumbs, and page content.
 */
export function StandardizedSidebarLayout({
  breadcrumbs = [],
  children,
  title,
  subtitle,
  headerActions,
}: StandardizedSidebarLayoutProps) {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const pathname = usePathname();

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
  }, [isLoaded, isSignedIn, user, needsOnboarding, isOnboardingRoute, router]);

  if (!isLoaded) return <LoadingOverlay delayMs={300} />;
  if (!isSignedIn || !user) return <LoadingOverlay delayMs={300} />;
  if (needsOnboarding && !isOnboardingRoute) return <LoadingOverlay delayMs={300} />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset data-testid="page-ready">
        {/* Sticky top header: trigger + separator + breadcrumbs + actions */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem
                      className={index === 0 ? 'hidden md:block' : ''}
                    >
                      {crumb.href && index < breadcrumbs.length - 1 ? (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator
                        className={index === 0 ? 'hidden md:block' : ''}
                      />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {headerActions && (
            <div className="ml-auto flex items-center gap-2">{headerActions}</div>
          )}
        </header>

        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Optional page title / subtitle block */}
          {(title || subtitle) && (
            <div className="pt-4">
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}

          {/* Page content */}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
