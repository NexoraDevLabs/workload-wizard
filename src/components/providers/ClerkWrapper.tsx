'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { getEnv } from '@/lib/env';

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
  const env = getEnv();

  // Check if we're in build time to avoid Clerk initialization
  const isBuildTime =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_build_time_only';

  if (isBuildTime) {
    // During build time, render children without Clerk to avoid validation errors
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
