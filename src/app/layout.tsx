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
import { WorkOSWrapper } from '@/components/providers/WorkOSWrapper';
import { headers } from 'next/headers';
// import { LoadingOverlay } from "@/components/loading-overlay";
import { LoadingOverlayServer } from '@/components/loading-overlay-server';
import { Suspense } from 'react';
import { RouteLoadingOverlay } from '@/components/RouteLoadingOverlay';
import { AuthUserProvider } from '@/components/providers/AuthUserProvider';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersStore = await headers();
  const pathname =
    headersStore.get('next-url') ||
    headersStore.get('x-invoke-path') ||
    headersStore.get('x-matched-path') ||
    '';

  // Sanity Studio should render without our app providers/auth.
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

  return (
    <html lang="en" suppressHydrationWarning>
    <body
      className={`${dmSans.variable} ${jetBrainsMono.variable} app-shell antialiased`}
    >
    <WorkOSWrapper>
      <ConvexClientProvider>
        <AuthUserProvider>
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
        </AuthUserProvider>
      </ConvexClientProvider>
    </WorkOSWrapper>
    </body>
    </html>
  );
}
