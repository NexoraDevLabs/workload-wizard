'use server';

import { WorkOS } from '@workos-inc/node';
import { cookies } from 'next/headers';

export type WorkOSAuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organisationId: string | undefined;
  roles: string[];
};

const WORKOS_SESSION_COOKIE_NAMES = ['wos-session', 'workos_session'];

let workosClient: WorkOS | null = null;

function getWorkOSClient() {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;

  if (!apiKey || !clientId) {
    return null;
  }

  if (!workosClient) {
    workosClient = new WorkOS(apiKey, { clientId });
  }

  return workosClient;
}

export async function getAuthUserFromWorkOS(): Promise<WorkOSAuthUser | null> {
  const workos = getWorkOSClient();
  if (!workos) return null;

  const cookieStore = await cookies();
  const sessionData = WORKOS_SESSION_COOKIE_NAMES.map(
    (name) => cookieStore.get(name)?.value
  ).find(Boolean);

  if (!sessionData) return null;

  const session =
    await workos.userManagement.authenticateWithSessionCookie({
      sessionData,
    });

  if (!session.authenticated) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    organisationId:
      session.organizationId ??
      session.user.metadata.organisationId ??
      session.user.metadata.organizationId,
    roles: session.roles ?? [],
  };
}
