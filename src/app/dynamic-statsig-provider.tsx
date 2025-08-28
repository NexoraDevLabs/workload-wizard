"use client";

import {
  StatsigProvider,
  useClientBootstrapInit,
} from "@statsig/react-bindings";

type StatsigBootstrap = {
  user: Record<string, unknown>;
  [key: string]: unknown;
};

function BootstrappedStatsigProvider({
  sdkKey,
  user,
  datafileJson,
  children,
}: {
  sdkKey: string;
  user: Record<string, unknown>;
  datafileJson: string;
  children: React.ReactNode;
}) {
  const client = useClientBootstrapInit(sdkKey, user, datafileJson);
  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}

export function DynamicStatsigProvider({
  children,
  datafile,
}: {
  children: React.ReactNode;
  datafile?: StatsigBootstrap | null;
}) {
  const sdkKey =
    (process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY as string | undefined) ||
    (process.env.FEATFLAG_STATSIG_CLIENT_KEY as string | undefined) ||
    "";

  if (!sdkKey) {
    // Graceful no-op: render without Statsig to avoid client errors
    return <>{children}</>;
  }

  // Use bootstrap when provided; otherwise fall back to sdkKey mode
  if (datafile && datafile.user) {
    return (
      <BootstrappedStatsigProvider
        sdkKey={sdkKey}
        user={datafile.user}
        datafileJson={JSON.stringify(datafile)}
      >
        {children}
      </BootstrappedStatsigProvider>
    );
  }

  // Fallback: initialize on client without bootstrap
  return (
    <StatsigProvider sdkKey={sdkKey} user={{ userID: "anonymous" }}>
      {children}
    </StatsigProvider>
  );
}
