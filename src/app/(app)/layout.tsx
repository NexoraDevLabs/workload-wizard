import { Suspense } from 'react';
import { WorkOSWrapper } from '@/components/providers/WorkOSWrapper';
import { ConvexClientProvider } from '@/components/providers/ConvexProvider';
import { AuthUserProvider } from '@/components/providers/AuthUserProvider';
import { AcademicYearProvider } from '@/components/providers/AcademicYearProvider';
import { BreadcrumbProvider } from '@/hooks/useBreadcrumbs';
import FeaturebaseMessenger from '@/components/domain/FeatureBaseWidget';
import { LoadingOverlayServer } from '@/components/loading-overlay-server';
import { RouteLoadingOverlay } from '@/components/RouteLoadingOverlay';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkOSWrapper>
      <ConvexClientProvider>
        <AuthUserProvider>
          <AcademicYearProvider>
            <BreadcrumbProvider>
              <Suspense fallback={<LoadingOverlayServer />}>
                {children}
                <RouteLoadingOverlay />
              </Suspense>
              <FeaturebaseMessenger />
            </BreadcrumbProvider>
          </AcademicYearProvider>
        </AuthUserProvider>
      </ConvexClientProvider>
    </WorkOSWrapper>
  );
}
