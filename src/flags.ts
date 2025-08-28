// Feature Flags - Single source of truth using Statsig
import { createStatsigAdapter, type StatsigUser } from "@flags-sdk/statsig";
import { getCurrentUserDetails } from "@/lib/auth/currentUser";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const serverKey = process.env.FEATFLAG_STATSIG_SERVER_API_KEY;
if (!serverKey) {
  throw new Error(
    "Missing FEATFLAG_STATSIG_SERVER_API_KEY in env; required for server-side Statsig.",
  );
}

export const statsigAdapter = createStatsigAdapter({
  statsigServerApiKey: serverKey,
});

export const identify = async ({ headers }: { headers?: Headers } = {}) => {
  // Be resilient on special routes (e.g. Sanity Studio) and environments
  const pathname =
    headers?.get?.("next-url") ||
    headers?.get?.("x-invoke-path") ||
    headers?.get?.("x-matched-path") ||
    "";

  if (pathname.startsWith("/studio")) {
    const anon: StatsigUser = { userID: "anonymous", customIDs: {} };
    const userAgent = headers?.get?.("user-agent") || undefined;
    const ip =
      headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
    if (userAgent) anon.userAgent = userAgent;
    if (ip) anon.ip = ip;
    return anon;
  }

  let user: Awaited<ReturnType<typeof getCurrentUserDetails>> = null;
  try {
    user = await getCurrentUserDetails();
  } catch {
    // If Clerk isn't initialised or throws in this context, fall back to anonymous
    user = null;
  }
  const userAgent = headers?.get?.("user-agent") || undefined;
  const ip =
    headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  if (!user) {
    const anon: StatsigUser = { userID: "anonymous", customIDs: {} };
    if (userAgent) anon.userAgent = userAgent;
    if (ip) anon.ip = ip;
    return anon;
  }

  const identified: StatsigUser = {
    userID: user.id,
    customIDs: {},
    custom: {
      fullName: user.fullName,
      organisationId: user.organisationId ?? undefined,
      role: user.role ?? undefined,
    },
  };
  try {
    // Enrich SSR bootstrap with enrolments so first paint matches client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const rows = await convex.query(api.featureEnrollments.listForUser, {
      userId: user.id,
    });
    const enrolled: Record<string, boolean> = {};
    const flattened: Record<string, boolean> = {};
    for (const r of rows as Array<{ featureKey: string; enabled: boolean }>) {
      enrolled[r.featureKey] = !!r.enabled;
      const safe = `enrolled_${r.featureKey.replace(/[^A-Za-z0-9_]/g, "_")}`;
      flattened[safe] = !!r.enabled;
    }
    (identified.custom as any).enrolled = enrolled;
    Object.assign(identified.custom as any, flattened);
  } catch {}
  if (user.email) identified.email = user.email;
  if (userAgent) identified.userAgent = userAgent;
  if (ip) identified.ip = ip;
  return identified;
};

export const createFeatureFlag = (key: string) => {
  return async () => {
    const user = await identify();
    const Statsig = await statsigAdapter.initialize();
    return await Statsig.checkGate(user, key);
  };
};

// Centralised flag keys - Single source of truth
export enum FeatureFlagKey {
  QUICK_ACCESS_BETA = "quick_access_beta",
  PINK_MODE = "pink_mode",
  ADVANCED_ANALYTICS = "advanced_analytics",
  BULK_OPERATIONS = "bulk_operations",
  REAL_TIME_COLLABORATION = "real_time_collaboration",
}

// Helper function to check if a feature is enabled
export async function isFeatureEnabled(
  flagKey: FeatureFlagKey,
): Promise<boolean> {
  try {
    const user = await identify();
    const Statsig = await statsigAdapter.initialize();
    return await Statsig.checkGate(user, flagKey);
  } catch {
    // Default to disabled if there's an error
    return false;
  }
}

// Client should import keys from this file to avoid bundling server adapters
