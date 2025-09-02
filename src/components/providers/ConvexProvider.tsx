'use client';

import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/nextjs';
import { getEnv } from '@/lib/env';

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || 'https://fallback.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

function ConvexClientProviderInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const env = getEnv();

  // Check if we're in build time or have invalid environment variables
  const isBuildTime =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_build_time_only' ||
    convexUrl === 'https://example.invalid' ||
    convexUrl === 'https://fallback.convex.cloud';

  // If in build time or invalid env, render children without Convex context
  if (isBuildTime) {
    return <>{children}</>;
  }

  return (
    <ConvexClientProviderInternal>{children}</ConvexClientProviderInternal>
  );
}
