// Client-side feature flag functions using Statsig
import { statsigAdapter, type StatsigUser } from '@flags-sdk/statsig';
import type { FeatureFlags } from './types';

export interface FeatureFlagResult {
  enabled: boolean;
  value?: any;
}

// Get current user details for Statsig identification
async function getCurrentUser(): Promise<StatsigUser> {
  // For client-side, we'll use a simplified approach
  // In a real implementation, you'd get user details from your auth system
  return {
    userID: 'anonymous',
    customIDs: {},
  };
}

// Check if a feature flag is enabled
export async function getFeatureFlag(
  flagKey: FeatureFlags
): Promise<FeatureFlagResult> {
  try {
    const user = await getCurrentUser();
    const Statsig = await statsigAdapter.initialize();
    const enabled = await Statsig.checkGate(user, flagKey);

    return {
      enabled,
      value: undefined,
    };
  } catch (error) {
    // Default to disabled if there's an error
    return {
      enabled: false,
      value: undefined,
    };
  }
}

// Check if a feature flag is enabled (boolean only)
export async function isFeatureEnabled(
  flagKey: FeatureFlags
): Promise<boolean> {
  const result = await getFeatureFlag(flagKey);
  return result.enabled;
}
