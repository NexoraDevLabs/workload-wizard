'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  identifyUserForFeatureFlags,
  bootstrapFeatureFlags,
} from '@/lib/feature-flags/auth-integration';
import { getEnv } from '@/lib/env';

interface FeatureFlagProviderProps {
  children: React.ReactNode;
}

/**
 * Internal provider that handles feature flag authentication integration
 */
function FeatureFlagProviderInternal({ children }: FeatureFlagProviderProps) {
  const { user, isLoaded } = useUser();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // Only identify user if they've changed or haven't been identified yet
    const currentUserId = user?.id || null;
    if (currentUserId !== lastUserId.current) {
      if (process.env.NODE_ENV !== 'production') {
        // Reduce noisy logs in prod
        // User changed, identifying in PostHog
      }

      // Identify user in PostHog for feature flags
      identifyUserForFeatureFlags(user);

      // Bootstrap feature flags for the user
      if (user) {
        bootstrapFeatureFlags(user);
      }

      lastUserId.current = currentUserId;
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}

/**
 * Provider that handles feature flag authentication integration
 * This ensures feature flags persist across authentication steps
 */
export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  // Global kill-switch (set in CI for main deploys)
  if (process.env.NEXT_PUBLIC_DISABLE_FEATURE_FLAGS === '1') {
    return <>{children}</>;
  }

  const env = getEnv();

  // Check if we're in build time to avoid Clerk initialization
  const isBuildTime =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_build_time_only';

  // Avoid running Clerk-dependent hooks during SSR/prerender
  // We only bootstrap flags and call useUser on the client
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  // If in build time, render children without feature flag context
  if (isBuildTime) {
    return <>{children}</>;
  }

  return <FeatureFlagProviderInternal>{children}</FeatureFlagProviderInternal>;
}
