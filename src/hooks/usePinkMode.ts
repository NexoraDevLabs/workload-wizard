'use client';

export function usePinkMode() {
  return {
    isPinkModeEnabled: false,
    isLoading: false,
    refreshPinkMode: () => Promise.resolve(),
  };
}
