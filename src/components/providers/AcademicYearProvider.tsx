'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { getEnv } from '@/lib/env';

export type AcademicYearStatus = 'draft' | 'published' | 'archived';

export interface AcademicYear {
  _id: Id<'academic_years'>;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  staging?: boolean;
  isDefaultForOrg?: boolean;
  organisationId: Id<'organisations'>;
}

type AcademicYearContextValue = {
  years: AcademicYear[];
  currentYearId: string | null;
  currentYear: AcademicYear | null;
  setCurrentYearId: (id: string) => void;
  includeDrafts: boolean;
  setIncludeDrafts: (v: boolean) => void;
  isManagement: boolean;
  setAsDefaultForOrg: (id: string) => Promise<void>;
  refresh: () => void;
};

const AcademicYearContext = createContext<AcademicYearContextValue | undefined>(
  undefined
);

function AcademicYearProviderInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { toast } = useToast();

  // Management detection from convex user.systemRoles
  const convexUser = useQuery(
    api.users.getBySubject,
    user?.id ? { subject: user.id } : 'skip'
  ) as
    | { systemRoles?: string[]; organisationId?: Id<'organisations'> }
    | undefined;

  const isManagement = useMemo(() => {
    const roles = convexUser?.systemRoles || [];
    return (
      roles.includes('orgadmin') ||
      roles.includes('sysadmin') ||
      roles.includes('developer')
    );
  }, [convexUser]);

  const orgIdStr = useMemo(
    () =>
      convexUser?.organisationId ? String(convexUser.organisationId) : null,
    [convexUser]
  );

  // Fetch academic years for organisation, server decides visibility based on permissions
  const allYears = useQuery(
    api.academicYears.listForOrganisation,
    convexUser ? { userId: user!.id } : 'skip'
  ) as AcademicYear[] | undefined;

  // Load server preferences (selected year + includeDrafts)
  const preferences = useQuery(
    api.academicYears.getPreferences,
    convexUser ? { userId: user!.id } : 'skip'
  ) as
    | {
        _id: string;
        selectedAcademicYearId?: string;
        includeDrafts?: boolean;
      }
    | null
    | undefined;

  // UI toggle: include drafts (only meaningful for management)
  const [includeDrafts, setIncludeDraftsState] = useState<boolean>(false);

  // Load persisted includeDrafts per org
  React.useEffect(() => {
    if (!orgIdStr) return;
    // Prefer server preference; fall back to localStorage once
    if (typeof preferences?.includeDrafts !== 'undefined') {
      setIncludeDraftsState(!!preferences.includeDrafts);
      return;
    }
    try {
      const raw = localStorage.getItem(`ay_drafts:${orgIdStr}`);
      if (raw !== null) setIncludeDraftsState(raw === '1');
    } catch {
      // Ignore localStorage errors silently
    }
  }, [orgIdStr, preferences?.includeDrafts]);

  const setPrefsMutation = useMutation(api.academicYears.setPreferences);

  const setIncludeDrafts = useCallback(
    (v: boolean) => {
      setIncludeDraftsState(v);
      // Persist to server, and also localStorage for fast restore
      if (user?.id) {
        setPrefsMutation({ userId: user.id, includeDrafts: v }).catch(
          (err: unknown) => {
            const message =
              err instanceof Error ? err.message : 'Failed to save preferences';
            toast({
              title: 'Preferences not saved',
              description: `${message}. Kept locally for now.`,
              variant: 'destructive',
            });
          }
        );
      }
      try {
        if (orgIdStr)
          localStorage.setItem(`ay_drafts:${orgIdStr}`, v ? '1' : '0');
      } catch {
        // Ignore localStorage errors silently
      }
    },
    [orgIdStr, setPrefsMutation, user?.id, toast]
  );

  const years = useMemo(() => {
    // Trust server-side permission filtering:
    // - Management (sysadmin/developer/org roles with permission) will receive staging/drafts
    // - Regular users will receive only published/live
    return allYears || [];
  }, [allYears]);

  // Select current year: default to org default if present, else first published
  const defaultYearId = useMemo(() => {
    const defaultYear = years.find((y) => y.isDefaultForOrg);
    if (defaultYear) return String(defaultYear._id);
    const published = years.find((y) => y.status === 'published' && !y.staging);
    return published ? String(published._id) : null;
  }, [years]);

  const [currentYearId, setCurrentYearIdState] = useState<string | null>(null);
  const currentYear = useMemo(
    () => (years || []).find((y) => String(y._id) === currentYearId) || null,
    [years, currentYearId]
  );

  // Ensure we always have a selection when years change
  React.useEffect(() => {
    if (!orgIdStr) return;
    // Try server preference first
    const preferred = preferences?.selectedAcademicYearId
      ? String(preferences.selectedAcademicYearId)
      : null;
    if (preferred && years.some((y) => String(y._id) === preferred)) {
      if (currentYearId !== preferred) setCurrentYearIdState(preferred);
      return;
    }
    // Try to restore from storage
    try {
      const stored = localStorage.getItem(`ay_current:${orgIdStr}`);
      if (stored && years.some((y) => String(y._id) === stored)) {
        if (currentYearId !== stored) setCurrentYearIdState(stored);
        return;
      }
    } catch {
      // Ignore localStorage errors silently
    }
    // Otherwise ensure a sensible default
    if (!currentYearId && defaultYearId) {
      setCurrentYearIdState(defaultYearId);
    } else if (
      currentYearId &&
      years.every((y) => String(y._id) !== currentYearId)
    ) {
      setCurrentYearIdState(defaultYearId);
    }
  }, [
    years,
    currentYearId,
    defaultYearId,
    orgIdStr,
    preferences?.selectedAcademicYearId,
  ]);

  const setCurrentYearId = useCallback(
    (id: string) => {
      setCurrentYearIdState(id);
      if (user?.id) {
        setPrefsMutation({
          userId: user.id,
          selectedAcademicYearId: id as unknown as Id<'academic_years'>,
        }).catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to save preferences';
          toast({
            title: 'Preferences not saved',
            description: `${message}. Kept locally for now.`,
            variant: 'destructive',
          });
        });
      }
      try {
        if (orgIdStr) localStorage.setItem(`ay_current:${orgIdStr}`, id);
      } catch {
        // Ignore localStorage errors silently
      }
    },
    [orgIdStr, setPrefsMutation, user?.id, toast]
  );

  // Mutations
  const updateYear = useMutation(api.academicYears.update);

  const setAsDefaultForOrg = useCallback(
    async (id: string) => {
      if (!user?.id) return;
      try {
        await updateYear({
          userId: user.id,
          id: id as unknown as Id<'academic_years'>,
          isDefaultForOrg: true,
        });
        toast({
          title: 'Default year updated',
          description:
            "This organisation's default academic year has been set.",
          variant: 'success',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to set default year';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    },
    [updateYear, user?.id, toast]
  );

  const refreshNonce = useState<number>(0)[1];
  const refresh = useCallback(() => {
    // Convex useQuery will refetch when args object identity changes; bump a local nonce
    refreshNonce((n) => n + 1);
  }, [refreshNonce]);

  const value: AcademicYearContextValue = useMemo(
    () => ({
      years,
      currentYearId,
      currentYear,
      setCurrentYearId,
      includeDrafts,
      setIncludeDrafts,
      isManagement,
      setAsDefaultForOrg,
      refresh,
    }),
    [
      years,
      currentYearId,
      currentYear,
      setCurrentYearId,
      includeDrafts,
      setIncludeDrafts,
      isManagement,
      setAsDefaultForOrg,
      refresh,
    ]
  );

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function AcademicYearProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Avoid running Clerk-dependent hooks during SSR/prerender
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  const env = getEnv();

  // Check if we're in build time to avoid Clerk initialization
  const isBuildTime =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_build_time_only';

  // If in build time, render children without context
  if (isBuildTime) {
    return <>{children}</>;
  }

  return (
    <AcademicYearProviderInternal>{children}</AcademicYearProviderInternal>
  );
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx)
    throw new Error('useAcademicYear must be used within AcademicYearProvider');
  return ctx;
}
