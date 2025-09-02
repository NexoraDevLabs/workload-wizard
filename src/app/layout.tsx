import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }

  // During build time or when environment variables are invalid, provide safe defaults
  let datafile: {
    user: Record<string, unknown>;
    [key: string]: unknown;
  } | null = null;

  try {
    const { statsigAdapter, identify } = await import('@/flags');
    const user = await identify({ headers: headersStore });
    const Statsig = await statsigAdapter.initialize();
    const response = Statsig.getClientInitializeResponse(user, {
      hash: 'djb2',
    });
    datafile = response || null;
  } catch (error) {
    // During build time or with invalid env vars, use null datafile
    console.warn('Failed to initialize Statsig, using null datafile:', error);
    datafile = null;
  }

  return (
    <ClerkWrapper>
      <ConvexClientProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
