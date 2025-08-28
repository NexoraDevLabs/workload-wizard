"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/loading-overlay";

const MIN_VISIBLE_MS = 600;

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevKeyRef = useRef<string | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showForMinimum = () => {
    setVisible(true);
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, MIN_VISIBLE_MS);
  };

  // Initial mount: show overlay briefly on refresh
  useEffect(() => {
    showForMinimum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route change: show overlay on any pathname or query change
  useEffect(() => {
    const key = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (prevKeyRef.current !== null && prevKeyRef.current !== key) {
      showForMinimum();
    }
    prevKeyRef.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;
  return <LoadingOverlay delayMs={0} />;
}
