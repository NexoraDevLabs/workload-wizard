'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getEnv } from '@/lib/env';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { DefaultErrorFallback } from '@/components/ui/ErrorFallback';

declare global {
  interface Window {
    Featurebase?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

type BootPayload = {
  appId: string;
  email?: string | undefined;
  userId?: string | undefined;
  createdAt?: string | undefined;
  theme?: 'light' | 'dark';
  language?: string | undefined;
  userHash?: string | undefined;
  organisationId?: string | undefined;
  organisationName?: string | undefined;
  role?: string | undefined;
  name?: string | undefined; // Preferred by Featurebase for display name
  fullName?: string | undefined;
  systemRoles?: string | undefined; // CSV
  orgRoles?: string | undefined; // CSV
};

interface ConvexUser {
  systemRoles?: string[];
  organisationId?: Id<'organisations'>;
}

interface OrganisationDoc {
  name?: string;
}

interface RoleAssignment {
  role?: {
    name?: string;
  };
}

function FeaturebaseMessengerInternal() {
  const { user, isLoaded } = useAuthUser();
  const convexUser = useQuery(
    api.users.getBySubject,
    user?.id ? { subject: user.id } : 'skip'
  ) as ConvexUser | undefined;
  const orgDoc = useQuery(
    api.organisations.get,
    user?.id && convexUser?.organisationId
      ? { userId: user.id, organisationId: convexUser.organisationId }
      : 'skip'
  ) as OrganisationDoc | undefined;
  const roleAssignments = useQuery(
    api.organisationalRoles.getUserRoles,
    user?.id ? { userId: user.id } : 'skip'
  ) as RoleAssignment[] | undefined;

  const context = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress || undefined;
    const fullName = user
      ? user.fullName?.trim() ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        undefined
      : undefined;
    const organisationId =
      (user?.publicMetadata?.organisationId as string) ||
      convexUser?.organisationId ||
      undefined;
    const role = (user?.publicMetadata?.role as string) || undefined;
    const systemRolesArr =
      (user?.publicMetadata?.roles as string[]) ||
      convexUser?.systemRoles ||
      [];
    const organisationName = orgDoc?.name || undefined;
    const orgAssignedRolesArr = (roleAssignments || [])
      .map((r) => r.role?.name)
      .filter(Boolean) as string[];
    const systemRoles = systemRolesArr.length
      ? systemRolesArr.join(',')
      : undefined;
    const orgRoles = orgAssignedRolesArr.length
      ? orgAssignedRolesArr.join(',')
      : undefined;
    return {
      email,
      fullName,
      organisationId,
      role,
      systemRoles,
      orgRoles,
      organisationName,
    };
  }, [user, convexUser, orgDoc, roleAssignments]);

  const hasBootedRef = useRef<string | null>(null);
  const [userHash, setUserHash] = useState<string | undefined>(undefined);
  const identityField =
    process.env.NEXT_PUBLIC_FEATUREBASE_IDENTITY_FIELD || 'userId'; // 'email' | 'userId'

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/featurebase/user-hash');
        if (res.ok) {
          const data = (await res.json()) as { userHash?: string };
          if (!cancelled) setUserHash(data.userHash);
        }
      } catch {
        // Handle fetch error silently
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  useEffect(() => {
    const win = window;
    if (typeof win.Featurebase !== 'function') {
      const q: unknown[] = [];
      const fb: Window['Featurebase'] = function (...args: unknown[]) {
        q.push(args);
      };
      fb.q = q;
      win.Featurebase = fb;
    }

    const appId = process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID || '';
    const enableInDev =
      process.env.NEXT_PUBLIC_FEATUREBASE_ENABLE_DEV === 'true';
    const isProd = process.env.NODE_ENV === 'production';
    // Avoid noisy websocket errors in local dev unless explicitly enabled
    if (!appId || (!isProd && !enableInDev)) return;
    if (!isLoaded) return;
    // If we have an orgId but orgName hasn't resolved yet, wait to include it in first boot payload
    if (context.organisationId && !context.organisationName) return;
    // Enforce identifier presence according to configured identity field to avoid Featurebase preferring the wrong field
    const identifier = identityField === 'email' ? context.email : user?.id;
    // If no identifier yet (e.g., on sign-in page), allow anonymous boot (no userHash, no identity fields)

    async function boot() {
      let latestHash: string | undefined = userHash;
      if (!latestHash && identifier) {
        try {
          const res = await fetch('/api/featurebase/user-hash');
          if (res.ok) {
            const data = (await res.json()) as { userHash?: string };
            latestHash = data.userHash;
          }
        } catch {
          // Handle fetch error silently
        }
      }

      const createdAtIso = user?.createdAt
        ? new Date(user.createdAt as unknown as number).toISOString()
        : undefined;
      const payload: BootPayload = {
        appId,
        // Only include identity if we have it; otherwise boot anonymously
        ...(identifier
          ? identityField === 'email'
            ? { email: context.email }
            : { userId: user?.id }
          : {}),
        createdAt: createdAtIso,
        theme: 'light',
        language: 'en',
        ...(identifier && latestHash ? { userHash: latestHash } : {}),
        organisationId: context.organisationId,
        organisationName: context.organisationName,
        role: context.role,
        name: context.fullName, // Pass display name explicitly for Featurebase UI
        fullName: context.fullName,
        systemRoles: context.systemRoles,
        orgRoles: context.orgRoles,
      };

      // Remove undefined keys to avoid sending junk
      Object.keys(payload).forEach((k) => {
        const v = payload[k as keyof BootPayload];
        if (v === undefined) delete payload[k as keyof BootPayload];
      });
      const bootKey = `${identifier || 'anon'}:${latestHash || 'nohash'}:${
        context.organisationName || 'noname'
      }:${context.systemRoles || ''}:${context.orgRoles || ''}`;
      if (hasBootedRef.current === bootKey) return;
      hasBootedRef.current = bootKey;
      // Handle the promise properly
      win.Featurebase!('boot', payload);
    }

    void boot();
  }, [isLoaded, user, context, userHash, identityField]);

  const enableInDev = process.env.NEXT_PUBLIC_FEATUREBASE_ENABLE_DEV === 'true';
  const isProd = process.env.NODE_ENV === 'production';
  const shouldLoadScript =
    Boolean(process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID) &&
    (isProd || enableInDev);
  return shouldLoadScript ? (
    <Script
      src="https://do.featurebase.app/js/sdk.js"
      id="featurebase-sdk"
      strategy="afterInteractive"
      onError={() => {
        /* suppress console error noise in dev */
      }}
    />
  ) : null;
}

export default function FeaturebaseMessenger() {
  // Avoid client hooks during SSR/prerender
  if (typeof window === 'undefined') {
    return null;
  }

  const env = getEnv();

  // Check if we're in build time to avoid WorkOS initialization
  const isBuildTime =
    !env.NEXT_PUBLIC_CONVEX_URL;

  // If in build time, don't render anything
  if (isBuildTime) {
    return null;
  }

  return (
    <ErrorBoundary
      contextTag="FeaturebaseMessenger"
      fallback={({ error, reset }) => (
        <DefaultErrorFallback error={error} reset={reset} />
      )}
    >
      <FeaturebaseMessengerInternal />
    </ErrorBoundary>
  );
}
