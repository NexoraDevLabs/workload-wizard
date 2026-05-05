'use client';

import { useEffect } from 'react';
import { useAuthUserContext } from '@/components/providers/AuthUserProvider';

type UseAuthUserOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectTo?: string;
};

export function useAuthUser(options: UseAuthUserOptions = {}) {
  const { redirectOnUnauthenticated = false, redirectTo = '/api/auth/login' } =
    options;

  const auth = useAuthUserContext();

  useEffect(() => {
    if (!auth.isLoaded) return;

    if (
      redirectOnUnauthenticated &&
      !auth.isSignedIn &&
      window.location.pathname !== '/sign-in'
    ) {
      const returnTo = window.location.pathname + window.location.search;

      window.location.assign(
        `${redirectTo}?returnTo=${encodeURIComponent(returnTo)}`
      );
    }
  }, [auth.isLoaded, auth.isSignedIn, redirectOnUnauthenticated, redirectTo]);

  return auth;
}
