'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type AuthUserResponse = {
  userId?: string;
  email?: string;
  organisationId?: string | null;
  needsOrganisation?: boolean;
};

type CompatUser = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string;
  createdAt: Date;
  isActive: boolean;
  organisationId: string | null;
  organizationMemberships: Array<{ organization?: { id?: string } }>;
  publicMetadata: Record<string, unknown>;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddress: { emailAddress: string } | null;
  reload: () => Promise<void>;
  update: (_data: Record<string, unknown>) => Promise<CompatUser>;
  updatePassword: (_data: Record<string, unknown>) => Promise<void>;
  setProfileImage: (_data: Record<string, unknown>) => Promise<void>;
};

type ConvexAuthContext = {
  organisationId?: string;
  role?: string;
  systemRoles?: string[];
  organisationRoles?: string[];
} | null;

function toCompatUser(
  user: AuthUserResponse | undefined,
  dbUser?: ConvexAuthContext
): CompatUser | null {
  if (!user?.userId) return null;

  const organisationId = dbUser?.organisationId
    ? String(dbUser.organisationId)
    : (user.organisationId ?? null);
  const role = dbUser?.role;

  return {
    id: user.userId,
    username: user.email ?? null,
    firstName: null,
    lastName: null,
    fullName: user.email ?? user.userId,
    imageUrl: '',
    createdAt: new Date(),
    isActive: true,
    organisationId,
    organizationMemberships: organisationId
      ? [{ organization: { id: organisationId } }]
      : [],
    publicMetadata: {
      organisationId,
      role,
      systemRoles: dbUser?.systemRoles ?? [],
      organisationRoles: dbUser?.organisationRoles ?? [],
    },
    emailAddresses: user.email ? [{ emailAddress: user.email }] : [],
    primaryEmailAddress: user.email ? { emailAddress: user.email } : null,
    reload: async () => {},
    update: async () => toCompatUser(user)!,
    updatePassword: async () => {},
    setProfileImage: async () => {},
  };
}

export function useAuthUser() {
  const [sessionUser, setSessionUser] = useState<AuthUserResponse>();
  const [isLoaded, setIsLoaded] = useState(false);
  const dbUser = useQuery(
    api.users.getAuthContext,
    sessionUser?.userId ? { subject: sessionUser.userId } : 'skip'
  ) as ConvexAuthContext | undefined;

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch('/api/user', { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setSessionUser(undefined);
          return;
        }

        const data = (await response.json()) as AuthUserResponse;
        if (!cancelled) setSessionUser(data);
      } catch {
        if (!cancelled) setSessionUser(undefined);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async (callback?: () => void) => {
    if (callback) {
      callback();
      return;
    }
    window.location.assign('/api/auth/logout');
  }, []);

  const user = useMemo(
    () => toCompatUser(sessionUser, dbUser),
    [dbUser, sessionUser]
  );

  return useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn: Boolean(user),
      signOut,
      session: {
        reload: async () => {},
      },
      signIn: {
        firstFactorVerification: null as {
          strategy?: string;
          status?: string;
        } | null,
        create: async (_data?: Record<string, unknown>) => {
          window.location.assign('/api/auth/login?returnTo=/dashboard');
          return {
            status: 'redirect',
            createdSessionId: null,
          };
        },
        attemptFirstFactor: async (_data?: Record<string, unknown>) => ({
          status: 'needs_first_factor',
          createdSessionId: null,
        }),
      },
      setActive: async (_data?: Record<string, unknown>) => {},
    }),
    [isLoaded, signOut, user]
  );
}
