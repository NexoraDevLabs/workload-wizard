import { getAuthUserFromWorkOS } from './auth/workos';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export type AuthContext = {
  userId: string;
  email: string;
  organisationId: string | null;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getAuthUserFromWorkOS();

  if (!user) {
    return null; // do NOT throw - required for middleware + /api/user flow
  }

  let organisationId: string | null = null;

  try {
    organisationId = await fetchQuery(
      api.organisations.getUserOrganisation,
      { userId: user.id }
    );
  } catch {
    organisationId = null;
  }

  return {
    userId: user.id,
    email: user.email,
    organisationId,
  };
}