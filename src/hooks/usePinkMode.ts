'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFeatureFlag } from '@/lib/feature-flags/client';
import { FeatureFlags } from '@/lib/feature-flags/types';

// Key for local storage overrides
const LOCAL_FLAG_OVERRIDES_KEY = 'feature-flag-overrides';

export function usePinkMode() {
  const [isPinkModeEnabled, setIsPinkModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to check pink mode status
  const checkPinkMode = useCallback(async () => {
    // For SSR safety, check if we're in browser environment
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      // Check if the pink-mode feature is enabled for the user
      const pinkModeResult = await getFeatureFlag(FeatureFlags.PINK_MODE);
      const enabled = pinkModeResult.enabled;

      setIsPinkModeEnabled(enabled);

      // Apply or remove the pink-mode class from the document
      if (enabled) {
        document.documentElement.classList.add('pink-mode');
      } else {
        document.documentElement.classList.remove('pink-mode');
      }
    } catch {
      console.error('Failed to set pink mode');
    }
  }, []);

  // Function to check local storage directly (for immediate updates)
  const checkLocalStorage = useCallback(() => {
    // For SSR safety, check if we're in browser environment
    if (typeof window === 'undefined') return;

    try {
      const overridesStr = localStorage.getItem(LOCAL_FLAG_OVERRIDES_KEY);
      if (overridesStr) {
        const overrides: Record<string, boolean> = JSON.parse(overridesStr);
        const pinkModeOverride = overrides[FeatureFlags.PINK_MODE];

        if (pinkModeOverride !== undefined) {
          const enabled = pinkModeOverride;
          setIsPinkModeEnabled(enabled);

          if (enabled) {
            document.documentElement.classList.add('pink-mode');
          } else {
            document.documentElement.classList.remove('pink-mode');
          }
        }
      }
    } catch {
      // Failed to check local storage for pink mode
    }
  }, []);

  useEffect(() => {
    void checkPinkMode();
  }, [checkPinkMode]);

  // Listen for storage changes (when localStorage is updated from other tabs/windows)
  useEffect(() => {
    // For SSR safety, check if we're in browser environment
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_FLAG_OVERRIDES_KEY) {
        checkLocalStorage();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      checkLocalStorage();
    };

    window.addEventListener('featureFlagChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'featureFlagChanged',
        handleCustomStorageChange
      );
    };
  }, [checkLocalStorage]);

  // Function to manually refresh the pink mode status
  const refreshPinkMode = async () => {
    // For SSR safety, check if we're in browser environment
    if (typeof window === 'undefined') return;

    setIsLoading(true);
    try {
      const pinkModeResult = await getFeatureFlag(FeatureFlags.PINK_MODE);
      const enabled = pinkModeResult.enabled;

      setIsPinkModeEnabled(enabled);

      if (enabled) {
        document.documentElement.classList.add('pink-mode');
      } else {
        document.documentElement.classList.remove('pink-mode');
      }
    } catch {
      // Failed to refresh pink mode status
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isPinkModeEnabled,
    isLoading,
    refreshPinkMode,
  };
}
