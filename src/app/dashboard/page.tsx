"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = "force-dynamic";

import { DashboardPlaceholder } from "@/components/common/PlaceholderPage";

export default function DashboardPage() {
  return <DashboardPlaceholder />;
}
