import type { Id } from '../../convex/_generated/dataModel';

export type PermissionScope = 'system' | 'org' | 'team' | 'self' | 'ui' | 'both';

/**
 * App role model:
 *
 * user:
 * - default for all new users
 * - basic dashboard/profile access only
 *
 * lecturer:
 * - linked to an organisation/staff profile/academic year
 * - can view own workload allocation
 *
 * manager:
 * - manages workloading for their own team
 * - server-side checks must restrict this to team scope
 *
 * workloadadmin:
 * - manages workloading for all staff in their organisation
 *
 * orgadmin:
 * - manages organisation settings, users, roles and permissions
 */

export type PermissionId =
  // Navigation visibility - UI only
  | 'nav.dashboard'
  | 'nav.profile'
  | 'nav.staff'
  | 'nav.courses'
  | 'nav.modules'
  | 'nav.organisation'
  | 'nav.admin'
  | 'nav.dev'
  | 'nav.notifications'
  | 'nav.support'
  | 'nav.settings'

  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'

  // Staff / lecturer profiles
  | 'staff.view.self'
  | 'staff.view.team'
  | 'staff.view.org'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.delete'

  // Workload allocations
  | 'allocations.view.self'
  | 'allocations.view.team'
  | 'allocations.view.org'
  | 'allocations.manage.team'
  | 'allocations.manage.org'
  | 'allocations.assign'
  | 'allocations.bulk'

  // Permissions / admin
  | 'permissions.manage'
  | 'organisations.manage'
  | 'audit.view'

  // Courses
  | 'courses.view'
  | 'courses.create'
  | 'courses.edit'
  | 'courses.delete'
  | 'courses.years.add'

  // Modules
  | 'modules.view'
  | 'modules.create'
  | 'modules.edit'
  | 'modules.delete'
  | 'modules.link'
  | 'modules.unlink'

  // Iterations / groups
  | 'iterations.view'
  | 'iterations.create'
  | 'groups.view'
  | 'groups.create'
  | 'groups.delete';

export type PermissionMeta = {
  label: string;
  group: string;
  description: string;
  scope: PermissionScope;
};

export const PERMISSION_GROUPS = {
  NAVIGATION: 'navigation',
  USERS: 'users',
  STAFF: 'staff',
  ADMIN: 'admin',
  AUDIT: 'audit',
  ORGANISATIONS: 'organisations',
  COURSES: 'courses',
  MODULES: 'modules',
  ITERATIONS: 'iterations',
  GROUPS: 'groups',
  ALLOCATIONS: 'allocations',
} as const;

export const PERMISSION_SCOPES = {
  SYSTEM: 'system',
  ORG: 'org',
  TEAM: 'team',
  SELF: 'self',
  UI: 'ui',
  BOTH: 'both',
} as const;

export const USER_ROLES = {
  SYSTEM_ADMIN: 'systemadmin',
  SYS_ADMIN: 'sysadmin',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  DEV: 'dev',
  ORG_ADMIN: 'orgadmin',
  WORKLOAD_ADMIN: 'workloadadmin',
  MANAGER: 'manager',
  LECTURER: 'lecturer',
  USER: 'user',
} as const;

export const SYSTEM_ADMIN_ROLES = [
  USER_ROLES.SYSTEM_ADMIN,
  USER_ROLES.SYS_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.DEVELOPER,
  USER_ROLES.DEV,
] as const;

export const PERMISSIONS: Record<PermissionId, PermissionMeta> = {
  // Navigation
  'nav.dashboard': {
    label: 'Dashboard navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Dashboard in the sidebar',
    scope: 'ui',
  },
  'nav.profile': {
    label: 'Profile navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show My Profile in the sidebar',
    scope: 'ui',
  },
  'nav.staff': {
    label: 'Staff navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Staff in the sidebar',
    scope: 'ui',
  },
  'nav.courses': {
    label: 'Courses navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Courses in the sidebar',
    scope: 'ui',
  },
  'nav.modules': {
    label: 'Modules navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Modules in the sidebar',
    scope: 'ui',
  },
  'nav.organisation': {
    label: 'Organisation navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Organisation in the sidebar',
    scope: 'ui',
  },
  'nav.admin': {
    label: 'Admin navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Admin in the sidebar',
    scope: 'ui',
  },
  'nav.dev': {
    label: 'Developer navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Dev Tools in the sidebar',
    scope: 'ui',
  },
  'nav.notifications': {
    label: 'Notifications navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Notifications in secondary navigation',
    scope: 'ui',
  },
  'nav.support': {
    label: 'Support navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Support in secondary navigation',
    scope: 'ui',
  },
  'nav.settings': {
    label: 'Settings navigation',
    group: PERMISSION_GROUPS.NAVIGATION,
    description: 'Show Settings in secondary navigation',
    scope: 'ui',
  },

  // Users
  'users.view': {
    label: 'View users',
    group: PERMISSION_GROUPS.USERS,
    description: 'View users in your organisation',
    scope: 'org',
  },
  'users.create': {
    label: 'Create users',
    group: PERMISSION_GROUPS.USERS,
    description: 'Create users in your organisation',
    scope: 'org',
  },
  'users.edit': {
    label: 'Edit users',
    group: PERMISSION_GROUPS.USERS,
    description: 'Edit users in your organisation',
    scope: 'org',
  },
  'users.delete': {
    label: 'Delete users',
    group: PERMISSION_GROUPS.USERS,
    description: 'Delete users in your organisation',
    scope: 'org',
  },

  // Staff
  'staff.view.self': {
    label: 'View own staff profile',
    group: PERMISSION_GROUPS.STAFF,
    description: 'View your own staff profile and workload data',
    scope: 'self',
  },
  'staff.view.team': {
    label: 'View team staff',
    group: PERMISSION_GROUPS.STAFF,
    description: 'View staff profiles and workload data for your managed team',
    scope: 'team',
  },
  'staff.view.org': {
    label: 'View organisation staff',
    group: PERMISSION_GROUPS.STAFF,
    description: 'View staff profiles and workload data across your organisation',
    scope: 'org',
  },
  'staff.create': {
    label: 'Create staff',
    group: PERMISSION_GROUPS.STAFF,
    description: 'Create lecturer or staff profiles',
    scope: 'org',
  },
  'staff.edit': {
    label: 'Edit staff',
    group: PERMISSION_GROUPS.STAFF,
    description: 'Edit lecturer or staff profiles',
    scope: 'org',
  },
  'staff.delete': {
    label: 'Delete staff',
    group: PERMISSION_GROUPS.STAFF,
    description: 'Delete lecturer or staff profiles',
    scope: 'org',
  },

  // Allocations
  'allocations.view.self': {
    label: 'View own allocations',
    group: PERMISSION_GROUPS.ALLOCATIONS,
    description: 'View your own workload allocations',
    scope: 'self',
  },
  'allocations.view.team': {
    label: 'View team allocations',
    group: PERMISSION_GROUPS.ALLOCATIONS,
    description: 'View workload allocations for your managed team',
    scope: 'team',
  },
  'allocations.view.org': {
    label: 'View organisation allocations',
    group: PERMISSION_GROUPS.ALLOCATIONS,
    description: 'View workload allocations across your organisation',
    scope: 'org',
  },
  'allocations.manage.team': {
    label: 'Manage team allocations',
    group: PERMISSION_GROUPS.ALLOCATIONS,
    description: 'Manage workload allocations for your managed team',
    scope: 'team',
  },
  'allocations.manage.org': {
    label: 'Manage organisation allocations',
    group: PERMISSION_GROUPS.ALLOCATIONS,
    description: 'Manage workload allocations across your organisation',
    scope: 'org',
  },
  'allocations.assign': {
    label: 'Assign allocations',
    group: PERMISSION_GROUPS.ALLOCATIONS,
    description: 'Assign workload to staff',
    scope: 'org',
  },
  'allocations.bulk': {
    label: 'Bulk manage allocations',
    group: PERMISSION_GROUPS.ALLOCATIONS,
    description: 'Bulk manage workload allocations',
    scope: 'org',
  },

  // Admin / audit / organisations
  'permissions.manage': {
    label: 'Manage permissions',
    group: PERMISSION_GROUPS.ADMIN,
    description: 'Manage roles and permissions',
    scope: 'both',
  },
  'organisations.manage': {
    label: 'Manage organisations',
    group: PERMISSION_GROUPS.ORGANISATIONS,
    description: 'Manage organisations',
    scope: 'system',
  },
  'audit.view': {
    label: 'View audit logs',
    group: PERMISSION_GROUPS.AUDIT,
    description: 'View audit logs',
    scope: 'both',
  },

  // Courses
  'courses.view': {
    label: 'View courses',
    group: PERMISSION_GROUPS.COURSES,
    description: 'View courses',
    scope: 'org',
  },
  'courses.create': {
    label: 'Create courses',
    group: PERMISSION_GROUPS.COURSES,
    description: 'Create courses',
    scope: 'org',
  },
  'courses.edit': {
    label: 'Edit courses',
    group: PERMISSION_GROUPS.COURSES,
    description: 'Edit courses',
    scope: 'org',
  },
  'courses.delete': {
    label: 'Delete courses',
    group: PERMISSION_GROUPS.COURSES,
    description: 'Delete courses',
    scope: 'org',
  },
  'courses.years.add': {
    label: 'Add course years',
    group: PERMISSION_GROUPS.COURSES,
    description: 'Add course years',
    scope: 'org',
  },

  // Modules
  'modules.view': {
    label: 'View modules',
    group: PERMISSION_GROUPS.MODULES,
    description: 'View modules',
    scope: 'org',
  },
  'modules.create': {
    label: 'Create modules',
    group: PERMISSION_GROUPS.MODULES,
    description: 'Create modules',
    scope: 'org',
  },
  'modules.edit': {
    label: 'Edit modules',
    group: PERMISSION_GROUPS.MODULES,
    description: 'Edit modules',
    scope: 'org',
  },
  'modules.delete': {
    label: 'Delete modules',
    group: PERMISSION_GROUPS.MODULES,
    description: 'Delete modules',
    scope: 'org',
  },
  'modules.link': {
    label: 'Link modules',
    group: PERMISSION_GROUPS.MODULES,
    description: 'Attach module to course year',
    scope: 'org',
  },
  'modules.unlink': {
    label: 'Unlink modules',
    group: PERMISSION_GROUPS.MODULES,
    description: 'Detach module from course year',
    scope: 'org',
  },

  // Iterations / groups
  'iterations.view': {
    label: 'View iterations',
    group: PERMISSION_GROUPS.ITERATIONS,
    description: 'View module iterations',
    scope: 'org',
  },
  'iterations.create': {
    label: 'Create iterations',
    group: PERMISSION_GROUPS.ITERATIONS,
    description: 'Create module iterations for an academic year',
    scope: 'org',
  },
  'groups.view': {
    label: 'View groups',
    group: PERMISSION_GROUPS.GROUPS,
    description: 'View groups',
    scope: 'org',
  },
  'groups.create': {
    label: 'Create groups',
    group: PERMISSION_GROUPS.GROUPS,
    description: 'Create groups',
    scope: 'org',
  },
  'groups.delete': {
    label: 'Delete groups',
    group: PERMISSION_GROUPS.GROUPS,
    description: 'Delete groups',
    scope: 'org',
  },
};

export function isPermissionId(value: string): value is PermissionId {
  return value in PERMISSIONS;
}

const BASIC_USER_PERMISSIONS: PermissionId[] = [
  'nav.dashboard',
  'nav.profile',
  'staff.view.self',
];

const SECONDARY_NAVIGATION_PERMISSIONS: PermissionId[] = [
  'nav.support',
  'nav.settings',
];

const LECTURER_PERMISSIONS: PermissionId[] = [
  ...BASIC_USER_PERMISSIONS,
  ...SECONDARY_NAVIGATION_PERMISSIONS,
  'allocations.view.self',
];

const MANAGER_PERMISSIONS: PermissionId[] = [
  ...LECTURER_PERMISSIONS,
  'nav.staff',
  'nav.courses',
  'nav.modules',
  'staff.view.team',
  'allocations.view.team',
  'allocations.manage.team',
  'courses.view',
  'modules.view',
  'iterations.view',
  'groups.view',
];

const WORKLOAD_ADMIN_PERMISSIONS: PermissionId[] = [
  ...MANAGER_PERMISSIONS,
  'nav.organisation',
  'staff.view.org',
  'staff.create',
  'staff.edit',
  'users.view',
  'courses.create',
  'courses.edit',
  'courses.years.add',
  'modules.create',
  'modules.edit',
  'modules.link',
  'modules.unlink',
  'iterations.create',
  'groups.create',
  'groups.delete',
  'allocations.view.org',
  'allocations.manage.org',
  'allocations.assign',
  'allocations.bulk',
];

const ORG_ADMIN_PERMISSIONS: PermissionId[] = [
  ...WORKLOAD_ADMIN_PERMISSIONS,
  'users.create',
  'users.edit',
  'users.delete',
  'staff.delete',
  'courses.delete',
  'modules.delete',
  'permissions.manage',
  'audit.view',
];

export const DEFAULT_ROLES: Record<string, PermissionId[]> = {
  user: BASIC_USER_PERMISSIONS,

  lecturer: LECTURER_PERMISSIONS,

  manager: MANAGER_PERMISSIONS,

  workloadadmin: WORKLOAD_ADMIN_PERMISSIONS,

  orgadmin: ORG_ADMIN_PERMISSIONS,

  systemadmin: Object.keys(PERMISSIONS) as PermissionId[],
  sysadmin: Object.keys(PERMISSIONS) as PermissionId[],
  admin: Object.keys(PERMISSIONS) as PermissionId[],
  developer: Object.keys(PERMISSIONS) as PermissionId[],
  dev: Object.keys(PERMISSIONS) as PermissionId[],
};

export function isSystemAdminRole(userRole: string | undefined): boolean {
  if (!userRole) return false;

  return SYSTEM_ADMIN_ROLES.includes(
    userRole as (typeof SYSTEM_ADMIN_ROLES)[number]
  );
}

export function getPermissionsForRole(
  userRole: string | undefined
): PermissionId[] {
  if (!userRole) return [];

  return DEFAULT_ROLES[userRole] ?? [];
}

export function getPermissionsForRoles(userRoles: string[]): PermissionId[] {
  const permissions = new Set<PermissionId>();

  for (const role of userRoles) {
    for (const permission of getPermissionsForRole(role)) {
      permissions.add(permission);
    }
  }

  return [...permissions].sort();
}

export function hasPermission(
  userRole: string | undefined,
  permissionId: PermissionId,
  organisationId?: string,
  isSystemAction: boolean = false
): boolean {
  if (!userRole) return false;

  const permission = PERMISSIONS[permissionId];

  if (!permission) return false;

  if (isSystemAction || permission.scope === 'system') {
    return isSystemAdminRole(userRole);
  }

  if (isSystemAdminRole(userRole)) {
    return true;
  }

  if (permission.scope === 'ui' || permission.scope === 'self') {
    return getPermissionsForRole(userRole).includes(permissionId);
  }

  if (permission.scope === 'team') {
    return getPermissionsForRole(userRole).includes(permissionId);
  }

  if (permission.scope === 'org') {
    if (!organisationId) return false;

    return getPermissionsForRole(userRole).includes(permissionId);
  }

  if (permission.scope === 'both') {
    return getPermissionsForRole(userRole).includes(permissionId);
  }

  return false;
}

export function hasAnyPermission(
  userRole: string | undefined,
  permissionIds: PermissionId[],
  organisationId?: string,
  isSystemAction: boolean = false
): boolean {
  return permissionIds.some((permissionId) =>
    hasPermission(userRole, permissionId, organisationId, isSystemAction)
  );
}

export function hasAllPermissions(
  userRole: string | undefined,
  permissionIds: PermissionId[],
  organisationId?: string,
  isSystemAction: boolean = false
): boolean {
  return permissionIds.every((permissionId) =>
    hasPermission(userRole, permissionId, organisationId, isSystemAction)
  );
}

export function explainPermissionsForRole(userRole: string | undefined) {
  return getPermissionsForRole(userRole).map((permissionId) => ({
    id: permissionId,
    ...PERMISSIONS[permissionId],
  }));
}

export function explainPermissionsForRoles(userRoles: string[]) {
  return getPermissionsForRoles(userRoles).map((permissionId) => ({
    id: permissionId,
    ...PERMISSIONS[permissionId],
  }));
}

export interface UIGateOptions {
  organisationId?: string | undefined;
  isSystemAction?: boolean | undefined;
  fallbackValue?: unknown | undefined;
  hideForbidden?: boolean | undefined;
  disabledText?: string | undefined;
  actionName?: string | undefined;
  showToast?: boolean | undefined;
  redirectOnDeny?: boolean | undefined;
}

export interface UIGateResult {
  hasAccess: boolean;
  shouldHide: boolean;
  fallbackValue: unknown;
  disabled: boolean;
  disabledText?: string;
  errorMessage?: string;
  scope: PermissionScope;
  requiresOrgContext: boolean;
}

export function gateUIState(
  userRole: string | undefined,
  permissionId: PermissionId,
  options: UIGateOptions = {}
): UIGateResult {
  const {
    organisationId,
    isSystemAction = false,
    fallbackValue = null,
    hideForbidden = false,
    disabledText = 'Insufficient permissions',
    actionName = 'this action',
  } = options;

  const permission = PERMISSIONS[permissionId];
  const scope = permission?.scope ?? 'org';

  const hasAccess = hasPermission(
    userRole,
    permissionId,
    organisationId,
    isSystemAction
  );

  const requiresOrgContext = scope === 'org' && !isSystemAction;

  const result: UIGateResult = {
    hasAccess,
    shouldHide: !hasAccess && hideForbidden,
    fallbackValue: hasAccess ? undefined : fallbackValue,
    disabled: !hasAccess,
    scope,
    requiresOrgContext,
  };

  if (!hasAccess) {
    result.disabledText = disabledText;
    result.errorMessage = `You don't have permission to perform ${actionName}`;
  }

  return result;
}

export function gateButtonState(
  userRole: string | undefined,
  permissionId: PermissionId,
  options: UIGateOptions = {}
): {
  disabled: boolean;
  disabledText?: string;
  tooltip?: string;
  scope: PermissionScope;
} {
  const {
    organisationId,
    isSystemAction = false,
    disabledText = 'Insufficient permissions',
  } = options;

  const permission = PERMISSIONS[permissionId];
  const scope = permission?.scope ?? 'org';

  const hasAccess = hasPermission(
    userRole,
    permissionId,
    organisationId,
    isSystemAction
  );

  const result: {
    disabled: boolean;
    disabledText?: string;
    tooltip?: string;
    scope: PermissionScope;
  } = {
    disabled: !hasAccess,
    scope,
  };

  if (!hasAccess) {
    result.disabledText = disabledText;
    result.tooltip = disabledText;
  }

  return result;
}

export function gateActionState(
  userRole: string | undefined,
  permissionId: PermissionId,
  options: UIGateOptions = {}
): {
  canPerform: boolean;
  errorMessage?: string | undefined;
  shouldShowError?: boolean | undefined;
  scope: PermissionScope;
} {
  const {
    organisationId,
    isSystemAction = false,
    actionName = 'this action',
  } = options;

  const permission = PERMISSIONS[permissionId];
  const scope = permission?.scope ?? 'org';

  const hasAccess = hasPermission(
    userRole,
    permissionId,
    organisationId,
    isSystemAction
  );

  return {
    canPerform: hasAccess,
    errorMessage: hasAccess
      ? undefined
      : `You don't have permission to perform ${actionName}`,
    shouldShowError: !hasAccess,
    scope,
  };
}

export function gateFormField(
  userRole: string | undefined,
  permissionId: PermissionId,
  options: UIGateOptions = {}
): {
  readonly: boolean;
  disabled: boolean;
  helperText?: string | undefined;
  errorMessage?: string | undefined;
  scope: PermissionScope;
} {
  const {
    organisationId,
    isSystemAction = false,
    disabledText = 'Insufficient permissions',
  } = options;

  const permission = PERMISSIONS[permissionId];
  const scope = permission?.scope ?? 'org';

  const hasAccess = hasPermission(
    userRole,
    permissionId,
    organisationId,
    isSystemAction
  );

  return {
    readonly: !hasAccess,
    disabled: !hasAccess,
    helperText: hasAccess ? undefined : disabledText,
    errorMessage: hasAccess ? undefined : disabledText,
    scope,
  };
}

export function gateTableRow(
  userRole: string | undefined,
  permissionId: PermissionId,
  options: UIGateOptions = {}
): {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  rowClassName?: string | undefined;
  scope: PermissionScope;
} {
  const { organisationId, isSystemAction = false } = options;

  const permission = PERMISSIONS[permissionId];
  const scope = permission?.scope ?? 'org';

  const hasAccess = hasPermission(
    userRole,
    permissionId,
    organisationId,
    isSystemAction
  );

  return {
    canView: hasAccess,
    canEdit: hasAccess,
    canDelete: hasAccess,
    rowClassName: hasAccess ? undefined : 'opacity-50',
    scope,
  };
}

export function getPermissionContext(
  userRole: string | undefined,
  permissionId: PermissionId,
  organisationId?: string
): {
  isSystemAction: boolean;
  hasOrgContext: boolean;
  scope: PermissionScope;
  canAccess: boolean;
} {
  const permission = PERMISSIONS[permissionId];
  const scope = permission?.scope ?? 'org';

  const isSystemAction = scope === 'system';
  const hasOrgContext = Boolean(organisationId);

  const canAccess = hasPermission(
    userRole,
    permissionId,
    organisationId,
    isSystemAction
  );

  return {
    isSystemAction,
    hasOrgContext,
    scope,
    canAccess,
  };
}

export function canViewUsers(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'users.view', organisationId);
}

export function canCreateUsers(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'users.create', organisationId);
}

export function canEditUsers(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'users.edit', organisationId);
}

export function canDeleteUsers(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'users.delete', organisationId);
}

export function canViewOwnStaff(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'staff.view.self', organisationId);
}

export function canViewTeamStaff(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'staff.view.team', organisationId);
}

export function canViewOrgStaff(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'staff.view.org', organisationId);
}

export function canManageTeamAllocations(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'allocations.manage.team', organisationId);
}

export function canManageOrgAllocations(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'allocations.manage.org', organisationId);
}

export function canManagePermissions(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'permissions.manage', organisationId);
}

export function canManageOrganisations(userRole?: string): boolean {
  return hasPermission(userRole, 'organisations.manage', undefined, true);
}

export function canViewAudit(
  userRole?: string,
  organisationId?: string
): boolean {
  return hasPermission(userRole, 'audit.view', organisationId);
}

export async function seedDefaultOrgRoles(organisationId: string) {
  const { ConvexHttpClient } = await import('convex/browser');
  const { api } = await import('../../convex/_generated/api');

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }

  const client = new ConvexHttpClient(convexUrl);
  const res = await client.mutation(
    api.permissions.ensureDefaultRolesForOrganisation,
    {
      organisationId: organisationId as unknown as Id<'organisations'>,
    }
  );

  return { organisationId, created: res.created };
}

export function listPermissionsByGroup(): Record<
  string,
  Array<{
    id: PermissionId;
    label: string;
    description: string;
    scope: PermissionScope;
  }>
> {
  const entries = Object.entries(PERMISSIONS) as Array<
    [PermissionId, PermissionMeta]
  >;

  return entries.reduce<
    Record<
      string,
      Array<{
        id: PermissionId;
        label: string;
        description: string;
        scope: PermissionScope;
      }>
    >
  >((acc, [id, meta]) => {
    const list = acc[meta.group] ?? [];

    list.push({
      id,
      label: meta.label,
      description: meta.description,
      scope: meta.scope,
    });

    acc[meta.group] = list;

    return acc;
  }, {});
}

export function rolesForPermission(permissionId: PermissionId): string[] {
  const roles: string[] = [];

  for (const [role, perms] of Object.entries(DEFAULT_ROLES)) {
    if (perms.includes(permissionId)) {
      roles.push(role);
    }
  }

  return roles;
}

export class PermissionUIStateManager {
  private userRole: string | undefined;
  private organisationId: string | undefined;
  private toastHandler:
    | ((message: string, variant: 'error' | 'warning' | 'info') => void)
    | undefined;

  constructor(
    userRoleParam?: string,
    organisationIdParam?: string,
    toastHandlerParam?: (
      message: string,
      variant: 'error' | 'warning' | 'info'
    ) => void
  ) {
    this.userRole = userRoleParam;
    this.organisationId = organisationIdParam;
    this.toastHandler = toastHandlerParam;
  }

  gateElement(
    permissionId: PermissionId,
    options: UIGateOptions = {}
  ): UIGateResult {
    const result = gateUIState(this.userRole, permissionId, {
      organisationId: this.organisationId,
      ...options,
    });

    if (options.showToast && !result.hasAccess && this.toastHandler) {
      this.toastHandler(result.errorMessage || 'Access denied', 'error');
    }

    return result;
  }

  gateButton(
    permissionId: PermissionId,
    options: UIGateOptions = {}
  ): ReturnType<typeof gateButtonState> {
    return gateButtonState(this.userRole, permissionId, {
      organisationId: this.organisationId,
      ...options,
    });
  }

  gateAction(
    permissionId: PermissionId,
    options: UIGateOptions = {}
  ): ReturnType<typeof gateActionState> {
    return gateActionState(this.userRole, permissionId, {
      organisationId: this.organisationId,
      ...options,
    });
  }

  gateField(
    permissionId: PermissionId,
    options: UIGateOptions = {}
  ): ReturnType<typeof gateFormField> {
    return gateFormField(this.userRole, permissionId, {
      organisationId: this.organisationId,
      ...options,
    });
  }

  gateRow(
    permissionId: PermissionId,
    options: UIGateOptions = {}
  ): ReturnType<typeof gateTableRow> {
    return gateTableRow(this.userRole, permissionId, {
      organisationId: this.organisationId,
      ...options,
    });
  }

  canPerformAction(
    permissionId: PermissionId,
    actionName: string,
    options: UIGateOptions = {}
  ): boolean {
    const result = this.gateElement(permissionId, {
      actionName,
      showToast: true,
      ...options,
    });

    if (!result.hasAccess && options.redirectOnDeny) {
      if (typeof window !== 'undefined') {
        window.location.href = '/unauthorised';
      }
    }

    return result.hasAccess;
  }

  getContext(permissionId: PermissionId) {
    return getPermissionContext(
      this.userRole,
      permissionId,
      this.organisationId
    );
  }

  hasAnyAdminAccess(): boolean {
    return (
      isSystemAdminRole(this.userRole) ||
      this.userRole === USER_ROLES.ORG_ADMIN ||
      this.userRole === USER_ROLES.WORKLOAD_ADMIN
    );
  }

  isSystemAdmin(): boolean {
    return isSystemAdminRole(this.userRole);
  }

  isOrgAdmin(): boolean {
    return this.userRole === USER_ROLES.ORG_ADMIN;
  }
}

export function createPermissionManager(
  userRole: string | undefined,
  organisationId?: string,
  toastHandler?: (
    message: string,
    variant: 'error' | 'warning' | 'info'
  ) => void
): PermissionUIStateManager {
  return new PermissionUIStateManager(userRole, organisationId, toastHandler);
}