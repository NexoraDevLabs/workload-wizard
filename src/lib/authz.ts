import { hasPermission, type PermissionId } from './permissions';
import { redirect } from 'next/navigation';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getAuthContext } from './auth';

export type SessionUser = {
  userId: string;
  organisationId: string;
  role: AuthRole;
};

export type AuthRole = 'sysadmin' | 'org_admin' | 'member';

export type AuthUser = {
  id: string;
  email: string | undefined;
  orgId: string | null;
  role: AuthRole;
  systemRoles: string[];
  organisationRoles: string[];
  memberships: Array<{
    userId: string;
    orgId: string;
    role: AuthRole;
    isPrimary: boolean;
  }>;
};

// Define proper error type with status code
export interface AuthError extends Error {
  statusCode: number;
}

export function normalizeRole(role: string | undefined): AuthRole {
  switch (role) {
    case 'sysadmin':
    case 'developer':
    case 'dev':
    case 'systemadmin':
    case 'admin':
      return 'sysadmin';
    case 'org_admin':
    case 'orgadmin':
      return 'org_admin';
    default:
      return 'member';
  }
}

function toLegacyPermissionRole(role: AuthRole): string {
  if (role === 'org_admin') return 'orgadmin';
  return role;
}

let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

function normalizeOrgRole(role: string | undefined): AuthRole {
  const normalized = role
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (
    normalized === 'org_admin' ||
    normalized === 'orgadmin' ||
    normalized === 'organisation_admin' ||
    normalized === 'admin'
  ) {
    return 'org_admin';
  }
  return 'member';
}

function getHighestRole(
  systemRoles: string[],
  organisationRoles: string[],
  membershipRole: AuthRole
): AuthRole {
  if (systemRoles.some((role) => normalizeRole(role) === 'sysadmin')) {
    return 'sysadmin';
  }
  if (
    systemRoles.some((role) => normalizeRole(role) === 'org_admin') ||
    organisationRoles.some((role) => normalizeOrgRole(role) === 'org_admin') ||
    membershipRole === 'org_admin'
  ) {
    return 'org_admin';
  }
  return 'member';
}

export async function getSessionUser(): Promise<SessionUser> {
  const user = await getAuthUser();
  if (!user.orgId) throw new Error('Missing organisationId');
  return {
    userId: user.id,
    organisationId: user.orgId,
    role: user.role,
  };
}

export async function getAuthUser(): Promise<AuthUser> {
  const session = await getAuthContext();
  if (!session) throw new Error('Unauthenticated');

  let dbUser = await getConvexClient().query(api.users.getAuthContext, {
    subject: session.userId,
  });

  if (!dbUser) {
    try {
      await getConvexClient().mutation(api.users.syncUser, {
        userId: session.userId,
        email: session.email,
      });
      dbUser = await getConvexClient().query(api.users.getAuthContext, {
        subject: session.userId,
      });
    } catch {
      dbUser = null;
    }
  }

  const systemRoles = dbUser?.systemRoles ?? [];
  const organisationRoles = dbUser?.organisationRoles ?? [];
  const memberships = (dbUser?.memberships ?? []).map((membership) => ({
    userId: membership.userId,
    orgId: String(membership.orgId),
    role: normalizeOrgRole(membership.role),
    isPrimary: membership.isPrimary,
  }));
  const primaryMembership =
    memberships.find((membership) => membership.isPrimary) ??
    memberships[0] ??
    null;
  const orgId =
    primaryMembership?.orgId ??
    (dbUser?.organisationId ? String(dbUser.organisationId) : undefined) ??
    session.organisationId ??
    null;
  const role = getHighestRole(
    systemRoles,
    organisationRoles,
    primaryMembership?.role ?? normalizeOrgRole(dbUser?.role)
  );

  return {
    id: session.userId,
    email: dbUser?.email ?? session.email,
    orgId,
    role,
    systemRoles,
    organisationRoles,
    memberships,
  };
}

export async function getOrganisationIdFromSession(): Promise<string> {
  return (await getSessionUser()).organisationId;
}

export async function requireSystemPermission(permissionId: PermissionId) {
  const { role } = await getSessionUser();
  if (
    !hasPermission(toLegacyPermissionRole(role), permissionId, undefined, true)
  ) {
    const error = new Error('Forbidden') as AuthError;
    error.statusCode = 403;
    throw error;
  }
  return true as const;
}

export async function requireOrgPermission(
  permissionId: PermissionId,
  organisationId?: string
) {
  const { role, organisationId: userOrgId } = await getSessionUser();
  const targetOrgId = organisationId || userOrgId;

  if (
    !hasPermission(
      toLegacyPermissionRole(role),
      permissionId,
      targetOrgId,
      false
    )
  ) {
    const error = new Error('Forbidden') as AuthError;
    error.statusCode = 403;
    throw error;
  }
  return true as const;
}

// Helper to check if user has permission without throwing
export async function checkPermission(
  permissionId: PermissionId,
  organisationId?: string,
  isSystemAction = false
): Promise<boolean> {
  try {
    const { role, organisationId: userOrgId } = await getSessionUser();
    const targetOrgId = organisationId || userOrgId;
    return hasPermission(
      toLegacyPermissionRole(role),
      permissionId,
      targetOrgId,
      isSystemAction
    );
  } catch {
    return false;
  }
}

// Enhanced permission checking with automatic redirects
export async function requirePermissionWithRedirect(
  permissionId: PermissionId,
  options: {
    organisationId?: string;
    isSystemAction?: boolean;
    redirectTo?: string;
  } = {}
) {
  const {
    organisationId,
    isSystemAction = false,
    redirectTo = '/unauthorised',
  } = options;

  try {
    if (isSystemAction) {
      return await requireSystemPermission(permissionId);
    } else {
      return await requireOrgPermission(permissionId, organisationId);
    }
  } catch (error) {
    // If it's a 403 error, redirect to unauthorized page
    if ((error as AuthError).statusCode === 403) {
      redirect(redirectTo);
    }
    // Re-throw other errors
    throw error;
  }
}

// Client-side permission checking utility
export function createClientPermissionChecker(
  userRole: string | undefined,
  organisationId?: string
) {
  return {
    hasPermission: (permissionId: PermissionId, isSystemAction = false) =>
      hasPermission(userRole, permissionId, organisationId, isSystemAction),

    requirePermission: (permissionId: PermissionId, isSystemAction = false) => {
      if (
        !hasPermission(userRole, permissionId, organisationId, isSystemAction)
      ) {
        throw new Error('Insufficient permissions');
      }
      return true;
    },
  };
}
