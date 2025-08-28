"use client";

import { useEffect, useMemo } from "react";
import { useStatsigClient } from "@statsig/react-bindings";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ClerkStatsigSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { client } = useStatsigClient();
  const enrollments = useQuery(api.featureEnrollments.listForCurrentUser, {});

  const statsigUser = useMemo(() => {
    if (!isLoaded) return null;
    if (!isSignedIn || !user) return { userID: "anonymous" as const };
    const enrolled: Record<string, boolean> = {};
    for (const e of enrollments || []) {
      enrolled[e.featureKey as string] = !!e.enabled;
    }
    // Also flatten each enrollment into a top-level custom boolean so Statsig rules can target it directly
    const flattened: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(enrolled)) {
      const safe = `enrolled_${k.replace(/[^A-Za-z0-9_]/g, "_")}`;
      flattened[safe] = v;
    }
    return {
      userID: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      custom: {
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        organisationId:
          (user.publicMetadata?.organisationId as string) ?? undefined,
        role: (user.publicMetadata?.role as string) ?? undefined,
        enrolled,
        ...flattened,
      },
    };
  }, [isLoaded, isSignedIn, user, enrollments]);

  useEffect(() => {
    if (!statsigUser) return;
    // In bootstrap mode, the client type is PrecomputedEvaluationsInterface (no updateUser in typings).
    // Guard + cast to call updateUser when available at runtime.
    const anyClient = client as unknown as {
      updateUser?: (u: unknown) => Promise<unknown>;
    };
    anyClient.updateUser?.(statsigUser).catch(() => {});
    // Emit a heartbeat event so you can verify traffic in Statsig
    try {
      client.logEvent("user_sync", "clerk");
    } catch {}
  }, [client, statsigUser]);

  return null;
}
