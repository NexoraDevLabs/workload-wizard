"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { getEnv } from "@/lib/env";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

  // Check if we're in build time to avoid Clerk initialization
  const isBuildTime =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_build_time_only";

  // If in build time, render children without Convex context
  if (isBuildTime) {
    return <>{children}</>;
  }

  return (
    <ConvexClientProviderInternal>{children}</ConvexClientProviderInternal>
  );
}
