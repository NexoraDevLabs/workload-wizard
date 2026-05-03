/**
 * Permission utility functions
 * These are pure functions that don't need to be server actions
 */

import { normalizeRole, type AuthRole } from '@/lib/authz';

type Metadata = {
  role?: unknown;
  roles?: unknown;
};

type PermissionUser = {
  publicMetadata?: Metadata;
};

export type AuthAction =
  | 'audit.read'
  | 'audit.stats'
  | 'organisations.list'
  | 'permissions.seed'
  | 'sync.users'
  | 'users.admin'
  | 'users.deactivate'
  | 'users.delete'
  | 'users.list'
  | 'users.read_org'
  | 'users.reactivate'
  | 'users.reset_password'
  | 'users.update_email'
  | 'users.update_username';

function getUserRoles(user: PermissionUser | null | undefined): AuthRole[] {
  const metadata = user?.publicMetadata;
  const rawRoles = Array.isArray(metadata?.roles) ? metadata.roles : [];
  const roles = rawRoles
    .filter((role): role is string => typeof role === 'string')
    .map((role) => normalizeRole(role));

  if (typeof metadata?.role === 'string') {
    roles.push(normalizeRole(metadata.role));
  }

  return roles.length > 0 ? Array.from(new Set(roles)) : ['member'];
}

export function hasRole(
  user: PermissionUser | null | undefined,
  role: AuthRole
): boolean {
  return getUserRoles(user).includes(role);
}

export function can(
  user: PermissionUser | null | undefined,
  action: AuthAction
): boolean {
  switch (action) {
    case 'audit.stats':
    case 'organisations.list':
    case 'permissions.seed':
    case 'users.delete':
    case 'users.list':
      return hasRole(user, 'sysadmin');
    case 'audit.read':
    case 'sync.users':
    case 'users.admin':
    case 'users.deactivate':
    case 'users.read_org':
    case 'users.reactivate':
    case 'users.reset_password':
    case 'users.update_email':
    case 'users.update_username':
      return hasRole(user, 'sysadmin') || hasRole(user, 'org_admin');
  }
}

export function hasOrgAdminAccess(userRole?: string): boolean {
  return normalizeRole(userRole) === 'org_admin';
}

export function hasSystemAdminAccess(userRole?: string): boolean {
  return normalizeRole(userRole) === 'sysadmin';
}

export function hasAdminAccess(userRole?: string): boolean {
  return hasSystemAdminAccess(userRole) || hasOrgAdminAccess(userRole);
}
