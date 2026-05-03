'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AuthUserResponse = {
  user?: {
    id: string;
    email?: string;
    orgId?: string;
    role?: string;
  };
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
  organisationId: string | undefined;
  organizationMemberships: Array<{ organization?: { id?: string } }>;
  publicMetadata: Record<string, unknown>;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddress: { emailAddress: string } | null;
  reload: () => Promise<void>;
  update: (_data: Record<string, unknown>) => Promise<CompatUser>;
  updatePassword: (_data: Record<string, unknown>) => Promise<void>;
  setProfileImage: (_data: Record<string, unknown>) => Promise<void>;
};

function toCompatUser(user: AuthUserResponse['user']): CompatUser | null {
  if (!user) return null;

  return {
    id: user.id,
    username: user.email ?? null,
    firstName: null,
    lastName: null,
    fullName: user.email ?? user.id,
    imageUrl: '',
    createdAt: new Date(),
    isActive: true,
    organisationId: user.orgId,
    organizationMemberships: user.orgId
      ? [{ organization: { id: user.orgId } }]
      : [],
    publicMetadata: {
      organisationId: user.orgId,
      role: user.role,
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
  const [user, setUser] = useState<CompatUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch('/api/user', { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = (await response.json()) as AuthUserResponse;
        if (!cancelled) setUser(toCompatUser(data.user));
      } catch {
        if (!cancelled) setUser(null);
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
    window.location.assign('/sign-in');
  }, []);

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
        create: async (_data?: Record<string, unknown>) => ({
          status: 'needs_identifier',
          createdSessionId: null,
        }),
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
