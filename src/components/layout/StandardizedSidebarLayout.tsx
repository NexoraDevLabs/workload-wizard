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

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StandardizedSidebarLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export function StandardizedSidebarLayout({
  breadcrumbs = [],
  children,
  title,
  subtitle,
  headerActions,
}: StandardizedSidebarLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset data-testid="page-ready">
        <header className="sticky top-0 z-20 flex min-h-18 shrink-0 items-center gap-3 border-b border-border/70 bg-white/82 px-4 py-3 backdrop-blur-xl transition-[width,height] ease-linear md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {breadcrumbs.length > 0 && (
              <Breadcrumb className="min-w-0">
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
          </div>
          <div className="flex items-center gap-3 justify-end">
            {headerActions}
          </div>
        </header>

        {(title || subtitle) && (
          <div className="section-wrap border-b border-border/60 py-6">
            <div className="app-surface rounded-[1.75rem] px-5 py-5 sm:px-7">
              {title && (
                <h1 className="text-3xl font-semibold tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="section-wrap flex flex-1 flex-col gap-6 py-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
