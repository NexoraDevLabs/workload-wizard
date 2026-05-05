'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type AuthUserResponse = {
  userId?: string;
  email?: string;
  fullName?: string;
  givenName?: string;
  familyName?: string;
  organisationId?: string | null;
  needsOrganisation?: boolean;
  onboardingCompleted?: boolean;
};

type ConvexAuthContext = {
  organisationId?: string;
  role?: string;
  systemRoles?: string[];
  organisationRoles?: string[];
} | null;

type CompatUser = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string;
  createdAt: Date;
  isActive: boolean;
  needsOrganisation: boolean;
  onboardingCompleted: boolean;
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

type AuthUserContextValue = {
  user: CompatUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: (callback?: () => void) => Promise<void>;
  session: {
    reload: () => Promise<void>;
  };
  signIn: {
    firstFactorVerification: {
      strategy?: string;
      status?: string;
    } | null;
    create: (_data?: Record<string, unknown>) => Promise<{
      status: string;
      createdSessionId: null;
    }>;
    attemptFirstFactor: (_data?: Record<string, unknown>) => Promise<{
      status: string;
      createdSessionId: null;
    }>;
  };
  setActive: (_data?: Record<string, unknown>) => Promise<void>;
};

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

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
    firstName: user.givenName ?? null,
    lastName: user.familyName ?? null,
    fullName: user.fullName ?? user.email ?? user.userId,
    imageUrl: '',
    createdAt: new Date(),
    isActive: true,
    needsOrganisation: Boolean(user.needsOrganisation),
    onboardingCompleted: Boolean(user.onboardingCompleted),
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

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<AuthUserResponse>();
  const [isLoaded, setIsLoaded] = useState(false);

  const dbUser = useQuery(
    api.users.getAuthContext,
    sessionUser?.userId ? { subject: sessionUser.userId } : 'skip'
  ) as ConvexAuthContext | undefined;

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch('/api/user', { cache: 'no-store' });

      if (!response.ok) {
        setSessionUser(undefined);
        return;
      }

      const data = (await response.json()) as AuthUserResponse;
      setSessionUser(data);
    } catch {
      setSessionUser(undefined);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const signOut = useCallback(async (callback?: () => void) => {
    setSessionUser(undefined);

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

  const value = useMemo<AuthUserContextValue>(
    () => ({
      user,
      isLoaded,
      isSignedIn: Boolean(user),
      signOut,
      session: {
        reload: loadUser,
      },
      signIn: {
        firstFactorVerification: null,
        create: async (_data?: Record<string, unknown>) => {
          const returnTo = window.location.pathname + window.location.search;

          window.location.assign(
            `/api/auth/login?returnTo=${encodeURIComponent(returnTo || '/dashboard')}`
          );

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
    [isLoaded, loadUser, signOut, user]
  );

  return (
    <AuthUserContext.Provider value={value}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUserContext() {
  const context = useContext(AuthUserContext);

  if (!context) {
    throw new Error('useAuthUser must be used inside AuthUserProvider');
  }

  return context;
}
