import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import '@/styles/index.css';
import { ConvexClientProvider } from '@/components/providers/ConvexProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/toast';
import { AcademicYearProvider } from '@/components/providers/AcademicYearProvider';
import { BreadcrumbProvider } from '@/hooks/useBreadcrumbs';
import FeaturebaseMessenger from '@/components/domain/FeatureBaseWidget';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { DynamicStatsigProvider } from './dynamic-statsig-provider';
import { ClerkWrapper } from '@/components/providers/ClerkWrapper';
import { headers } from 'next/headers';
// Import flags dynamically only when needed to avoid initialising on special routes
import { ClerkStatsigSync } from '@/lib/statsig/ClerkStatsigSync';
// import { LoadingOverlay } from "@/components/loading-overlay";
import { LoadingOverlayServer } from '@/components/loading-overlay-server';
import { Suspense } from 'react';
import { RouteLoadingOverlay } from '@/components/RouteLoadingOverlay';

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'WorkloadWizard',
    template: '%s | WorkloadWizard',
  },
  description: 'Academic workload planning and allocations',
  icons: { icon: '/favicon.ico' },
};

// Statsig bootstrap is done client-side via DynamicStatsigProvider

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Bootstrap client with the same user/config used on the server for flag evals
  const headersStore = await headers();
  const pathname =
    headersStore.get('next-url') ||
    headersStore.get('x-invoke-path') ||
    headersStore.get('x-matched-path') ||
    '';

  // Sanity Studio should render without our app providers/auth/flags
  if (pathname.startsWith('/studio')) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${dmSans.variable} ${jetBrainsMono.variable} app-shell antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }

  const { statsigAdapter, identify } = await import('@/flags');
  const user = await identify({ headers: headersStore });
  const Statsig = await statsigAdapter.initialize();
  const datafile = Statsig.getClientInitializeResponse(user, {
    hash: 'djb2',
  });

  return (
    <ClerkWrapper>
      <ConvexClientProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${dmSans.variable} ${jetBrainsMono.variable} app-shell antialiased`}
          >
            <DynamicStatsigProvider datafile={datafile}>
              <ClerkStatsigSync />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <AcademicYearProvider>
                  <BreadcrumbProvider>
                    <Suspense fallback={<LoadingOverlayServer />}>
                      {children}
                      <RouteLoadingOverlay />
                    </Suspense>
                    <FeaturebaseMessenger />
                    <Toaster />
                    <Analytics />
                    <SpeedInsights />
                  </BreadcrumbProvider>
                </AcademicYearProvider>
              </ThemeProvider>
            </DynamicStatsigProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkWrapper>
  );
}
