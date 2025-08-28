// Feature flag authentication integration
import { statsigAdapter, type StatsigUser } from "@flags-sdk/statsig";
import { FeatureFlags } from "./types";

// Identify user in Statsig for feature flags
export async function identifyUserForFeatureFlags(user: any): Promise<void> {
  try {
    if (!user) return;

    const statsigUser: StatsigUser = {
      userID: user.id,
      customIDs: {},
      custom: {
        fullName: user.fullName || undefined,
        email: user.emailAddresses?.[0]?.emailAddress,
        // Add other user properties as needed
      },
    };

    // Note: Statsig doesn't have an identify method, we just use the user object
    // The user will be identified when checking gates
  } catch (error) {
    // Log error but don't fail the application
    console.warn("Failed to identify user in Statsig:", error);
  }
}

// Bootstrap feature flags for a user
export async function bootstrapFeatureFlags(user: any): Promise<void> {
  try {
    if (!user) return;

    const statsigUser: StatsigUser = {
      userID: user.id,
      customIDs: {},
      custom: {
        fullName: user.fullName || undefined,
        email: user.emailAddresses?.[0]?.emailAddress,
        // Add other user properties as needed
      },
    };

    const Statsig = await statsigAdapter.initialize();

    // Pre-fetch feature flags for the user
    await Promise.all([
      Statsig.checkGate(statsigUser, FeatureFlags.PINK_MODE),
      Statsig.checkGate(statsigUser, FeatureFlags.QUICK_ACCESS_BETA),
      Statsig.checkGate(statsigUser, FeatureFlags.ADVANCED_ANALYTICS),
      Statsig.checkGate(statsigUser, FeatureFlags.BULK_OPERATIONS),
      Statsig.checkGate(statsigUser, FeatureFlags.REAL_TIME_COLLABORATION),
    ]);
  } catch (error) {
    // Log error but don't fail the application
    console.warn("Failed to bootstrap feature flags:", error);
  }
}
