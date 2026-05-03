'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getEnv } from '@/lib/env';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexClientProviderInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const env = getEnv();
  const isBuildTime =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_build_time_only';

  if (isBuildTime) {
    return <>{children}</>;
  }

  return (
    <ConvexClientProviderInternal>{children}</ConvexClientProviderInternal>
  );
}
