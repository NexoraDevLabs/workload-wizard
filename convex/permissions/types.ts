import type { Id } from '../_generated/dataModel';

/**
 * Core permission system types
 */

export type Role = 'SYSTEM' | 'ORG_ADMIN' | 'STAFF' | 'STUDENT';

export type Action = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'MANAGE';

export type Resource = 'Organisation' | 'Module' | 'Allocation' | 'User' | 'Report' | 'Course' | 'Group' | 'AcademicYear';

export type SystemRole = 'admin' | 'sysadmin' | 'developer';

export type PermissionId = string;

export type OrganisationId = Id<'organisations'>;

export type UserId = string;

export type RoleId = Id<'user_roles'>;

/**
 * Permission context for evaluating permissions
 */
export interface PermissionContext {
  actor: {
    id: UserId;
    role: Role;
    orgId?: OrganisationId;
    systemRoles?: SystemRole[];
  };
  resource?: {
    id: string;
    orgId?: OrganisationId;
    ownerId?: UserId;
    type: Resource;
  };
  organisationId?: OrganisationId;
}

/**
 * System permission definition
 */
export interface SystemPermission {
  id: PermissionId;
  group: string;
  description: string;
  defaultRoles: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * User role definition
 */
export interface UserRole {
  _id: RoleId;
  name: string;
  description: string;
  isDefault: boolean;
  isSystem: boolean;
  permissions: PermissionId[];
  organisationId: OrganisationId;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Role assignment for a user
 */
export interface UserRoleAssignment {
  _id: Id<'user_role_assignments'>;
  userId: UserId;
  organisationId: OrganisationId;
  roleId: RoleId;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Organisation role permission assignment
 */
export interface OrganisationRolePermission {
  _id: Id<'organisation_role_permissions'>;
  organisationId: OrganisationId;
  roleId: RoleId;
  permissionId: PermissionId;
  isGranted: boolean;
  isOverride: boolean;
  staged: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * System role template
 */
export interface SystemRoleTemplate {
  _id: Id<'system_role_templates'>;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  source: 'system_role' | 'explicit_role' | 'system_default' | 'denied';
  roleName?: string;
  permissionId: PermissionId;
}

/**
 * Effective permissions for a user
 */
export interface EffectivePermission {
  id: PermissionId;
  source: 'system_default' | 'custom';
  description: string;
  group: string;
}

/**
 * Permission map entry for role management
 */
export interface PermissionMapEntry {
  id: PermissionId;
  description: string;
  group: string;
  isActive: boolean;
  defaultRoles: string[];
  isGranted: boolean;
  isOverride: boolean;
  source: 'system_default' | 'custom';
}

// These constants are now defined in constants.ts to avoid duplication

export type PermissionGroup = 'courses' | 'modules' | 'iterations' | 'groups' | 'allocations' | 'academic_years' | 'users' | 'permissions' | 'roles' | 'organisations';

/**
 * Audit action types
 */
export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'permission.assigned' 
  | 'permission.revoked' 
  | 'permission.pushed' 
  | 'permission.staged'
  | 'role.created'
  | 'role.updated' 
  | 'role.deleted';

/**
 * Audit severity levels
 */
export type AuditSeverity = 'info' | 'warning' | 'error';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  _id: Id<'audit_logs'>;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName: string;
  performedBy: UserId;
  performedByName?: string;
  organisationId?: OrganisationId;
  details: string;
  metadata?: string;
  timestamp: number;
  severity: AuditSeverity;
}
