"use client";

import { OrganisationsManageGate } from "@/components/common/PermissionGate";
import { useSelectedLayoutSegments } from "next/navigation";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const segments = useSelectedLayoutSegments();
  // Allow the Statsig test page to render without permission gating
  if (
    segments.length === 0 ||
    segments.includes("statsig-test") ||
    segments.includes("posthog-test") ||
    segments.includes("features") ||
    segments.includes("tools")
  ) {
    return <>{children}</>;
  }
  return (
    <OrganisationsManageGate redirectOnDeny>{children}</OrganisationsManageGate>
  );
}
