import type { Role, SystemRole, PermissionGroup, Resource, Action } from './types';

/**
 * Permission system constants
 */

/**
 * Role hierarchy from lowest to highest privilege
 */
export const ROLE_HIERARCHY: readonly Role[] = ['STUDENT', 'STAFF', 'ORG_ADMIN', 'SYSTEM'] as const;

/**
 * System roles that bypass all permission checks
 */
export const SYSTEM_ROLES: readonly SystemRole[] = ['admin', 'sysadmin', 'developer'] as const;

/**
 * Default role names for new organisations
 */
export const DEFAULT_ROLE_NAMES = ['Admin', 'Manager', 'Lecturer', 'Viewer'] as const;

/**
 * Permission groups
 */
export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  'courses',
  'modules', 
  'iterations',
  'groups',
  'allocations',
  'academic_years',
  'users',
  'permissions',
  'roles',
  'organisations'
] as const;

/**
 * Permission ID validation pattern
 * Must have at least two segments separated by dots (e.g. group.action or group.subgroup.action)
 * Each segment must start with a letter and then any word chars
 */
export const PERMISSION_ID_PATTERN = /^[A-Za-z]\w*(?:\.[A-Za-z]\w*)+$/;

/**
 * Role capability matrix - defines what actions each role can perform on each resource
 * This is a declarative way to define permissions without hardcoding logic
 */
export const ROLE_CAPABILITIES: Readonly<Record<Role, Partial<Record<Resource, readonly Action[]>>>> = {
  SYSTEM: {
    Organisation: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Module: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Allocation: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    User: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Report: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Course: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Group: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    AcademicYear: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
  },
  ORG_ADMIN: {
    Organisation: ['READ', 'UPDATE', 'MANAGE'],
    Module: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Allocation: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    User: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Report: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Course: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    Group: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
    AcademicYear: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'],
  },
  STAFF: {
    Module: ['READ', 'UPDATE'],
    Allocation: ['READ', 'CREATE', 'UPDATE'],
    User: ['READ'],
    Report: ['READ'],
    Course: ['READ'],
    Group: ['READ', 'CREATE', 'UPDATE'],
    AcademicYear: ['READ'],
  },
  STUDENT: {
    Module: ['READ'],
    Allocation: ['READ'],
    User: ['READ'],
    Report: ['READ'],
    Course: ['READ'],
    Group: ['READ'],
    AcademicYear: ['READ'],
  },
} as const;

/**
 * Default permissions for each role (by role name)
 * These map to the actual role names used in the database
 */
export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  'Admin': [
    'courses.view',
    'courses.create',
    'courses.edit',
    'courses.delete',
    'courses.years.add',
    'modules.view',
    'modules.create',
    'modules.edit',
    'modules.delete',
    'modules.link',
    'modules.unlink',
    'iterations.create',
    'groups.view',
    'groups.create',
    'groups.delete',
    'allocations.view',
    'allocations.assign',
    'year.view.live',
    'year.view.staging',
    'year.view.archived',
    'year.edit.live',
    'year.edit.staging',
    'year.edit.archived',
  ],
  'Manager': [
    'courses.view',
    'courses.create',
    'courses.edit',
    'courses.years.add',
    'modules.view',
    'modules.create',
    'modules.edit',
    'modules.link',
    'modules.unlink',
    'iterations.create',
    'groups.view',
    'groups.create',
    'groups.delete',
    'allocations.view',
    'allocations.assign',
    'year.view.live',
    'year.view.staging',
    'year.edit.staging',
  ],
  'Lecturer': [
    'courses.view',
    'modules.view',
    'groups.view',
    'allocations.view',
    'year.view.live',
  ],
  'Viewer': [
    'courses.view',
    'modules.view',
    'groups.view',
    'year.view.live',
  ],
} as const;

/**
 * System role templates for seeding new organisations
 */
export const SYSTEM_ROLE_TEMPLATES = [
  {
    name: 'Admin',
    description: 'Full administrative access',
    isDefault: true,
  },
  {
    name: 'Manager',
    description: 'Management level access',
    isDefault: true,
  },
  {
    name: 'Lecturer',
    description: 'Standard lecturer access',
    isDefault: true,
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    isDefault: true,
  },
] as const;

/**
 * Planning MVP permissions for seeding
 */
export const PLANNING_MVP_PERMISSIONS = [
  {
    id: 'courses.view',
    group: 'courses',
    description: 'View courses',
    defaultRoles: ['Admin', 'Manager', 'Lecturer', 'Viewer'],
  },
  {
    id: 'courses.create',
    group: 'courses',
    description: 'Create courses',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'courses.edit',
    group: 'courses',
    description: 'Edit courses',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'courses.delete',
    group: 'courses',
    description: 'Delete courses',
    defaultRoles: ['Admin'],
  },
  {
    id: 'courses.years.add',
    group: 'courses',
    description: 'Add course years',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'modules.view',
    group: 'modules',
    description: 'View modules',
    defaultRoles: ['Admin', 'Manager', 'Lecturer', 'Viewer'],
  },
  {
    id: 'modules.create',
    group: 'modules',
    description: 'Create modules',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'modules.edit',
    group: 'modules',
    description: 'Edit modules',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'modules.delete',
    group: 'modules',
    description: 'Delete modules',
    defaultRoles: ['Admin'],
  },
  {
    id: 'modules.link',
    group: 'modules',
    description: 'Attach module to course year',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'modules.unlink',
    group: 'modules',
    description: 'Detach module from course year',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'iterations.create',
    group: 'iterations',
    description: 'Create module iterations for an academic year',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'groups.view',
    group: 'groups',
    description: 'View groups',
    defaultRoles: ['Admin', 'Manager', 'Lecturer', 'Viewer'],
  },
  {
    id: 'groups.create',
    group: 'groups',
    description: 'Create groups',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'groups.delete',
    group: 'groups',
    description: 'Delete groups',
    defaultRoles: ['Admin', 'Manager'],
  },
  {
    id: 'allocations.view',
    group: 'allocations',
    description: 'View allocations totals',
    defaultRoles: ['Admin', 'Manager', 'Lecturer'],
  },
  {
    id: 'allocations.assign',
    group: 'allocations',
    description: 'Assign lecturer to group',
    defaultRoles: ['Admin', 'Manager'],
  },
] as const;

/**
 * Academic year permissions for seeding
 */
export const ACADEMIC_YEAR_PERMISSIONS = [
  {
    id: 'year.view.live',
    group: 'academic_years',
    description: 'View live (published) academic years',
    defaultRoles: ['Admin', 'Organisation Admin', 'Manager', 'Lecturer', 'Viewer'],
  },
  {
    id: 'year.view.staging',
    group: 'academic_years',
    description: 'View staged/draft academic years',
    defaultRoles: ['Admin', 'Organisation Admin', 'Manager'],
  },
  {
    id: 'year.view.archived',
    group: 'academic_years',
    description: 'View archived academic years',
    defaultRoles: ['Admin', 'Organisation Admin'],
  },
  {
    id: 'year.edit.live',
    group: 'academic_years',
    description: 'Edit live (published) academic years (e.g. set default, rename, dates)',
    defaultRoles: ['Admin', 'Organisation Admin'],
  },
  {
    id: 'year.edit.staging',
    group: 'academic_years',
    description: 'Edit staged/draft academic years (create, modify before publish)',
    defaultRoles: ['Admin', 'Organisation Admin', 'Manager'],
  },
  {
    id: 'year.edit.archived',
    group: 'academic_years',
    description: 'Edit archived academic years (e.g. rename, notes)',
    defaultRoles: ['Admin', 'Organisation Admin', 'orgadmin'],
  },
] as const;

/**
 * Error messages for permission system
 */
export const PERMISSION_ERRORS = {
  UNAUTHENTICATED: 'Unauthenticated',
  USER_NOT_FOUND: 'User not found',
  PERMISSION_DENIED: 'Permission denied',
  CROSS_ORG_ACCESS_DENIED: 'Permission denied: cross-organisation access not allowed',
  ROLE_NOT_FOUND: 'Role not found',
  PERMISSION_NOT_FOUND: 'Permission not found',
  CANNOT_DELETE_DEFAULT_ROLES: 'Cannot delete default roles',
  CANNOT_DELETE_ROLE_WITH_USERS: 'Cannot delete role that has assigned users',
  UNAUTHORISED_ROLE_MODIFICATION: 'Unauthorised: Cannot modify roles outside your organisation',
  UNAUTHORISED_ROLE_DELETION: 'Unauthorised: Cannot delete roles outside your organisation',
  PERMISSION_ALREADY_EXISTS: 'Permission with this ID already exists',
  PERMISSION_IN_USE: 'Cannot delete permission. It is currently assigned to role(s)',
} as const;

/**
 * Audit action types
 */
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PERMISSION_ASSIGNED: 'permission.assigned',
  PERMISSION_REVOKED: 'permission.revoked',
  PERMISSION_PUSHED: 'permission.pushed',
  PERMISSION_STAGED: 'permission.staged',
  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_DELETED: 'role.deleted',
} as const;

/**
 * Audit severity levels
 */
export const AUDIT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
} as const;
