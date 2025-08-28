'use client';

import { usePinkMode } from '@/hooks/usePinkMode';

interface PinkModeProviderProps {
  children: React.ReactNode;
}

export function PinkModeProvider({ children }: PinkModeProviderProps) {
  // Call hook unconditionally to satisfy hooks rules; the hook itself is SSR-safe
  usePinkMode();

  return <>{children}</>;
}
