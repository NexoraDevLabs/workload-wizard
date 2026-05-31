import { WorkOSWrapper } from '@/components/providers/WorkOSWrapper';
import { ConvexClientProvider } from '@/components/providers/ConvexProvider';
import { AuthUserProvider } from '@/components/providers/AuthUserProvider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkOSWrapper>
      <ConvexClientProvider>
        <AuthUserProvider>{children}</AuthUserProvider>
      </ConvexClientProvider>
    </WorkOSWrapper>
  );
}
