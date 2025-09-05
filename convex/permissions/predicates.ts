import type {
  Role,
  SystemRole,
  PermissionContext,
  UserRole,
  SystemPermission,
  OrganisationId,
  PermissionId,
} from './types';
import { ROLE_HIERARCHY, SYSTEM_ROLES } from './constants';

/**
 * Pure predicate functions for permission evaluation
 * These functions are side-effect free and return boolean values
 */

/**
 * Check if a user has system-level privileges
 */
export function isSystemUser(systemRoles?: SystemRole[]): boolean {
  if (!systemRoles || systemRoles.length === 0) {
    return false;
  }
  return systemRoles.some((role) => SYSTEM_ROLES.includes(role));
}

/**
 * Check if a role has at least the specified privilege level
 */
export function hasRoleAtLeast(role: Role, minimumRole: Role): boolean {
  const roleIndex = ROLE_HIERARCHY.indexOf(role);
  const minimumIndex = ROLE_HIERARCHY.indexOf(minimumRole);

  if (roleIndex === -1 || minimumIndex === -1) {
    return false;
  }

  return roleIndex >= minimumIndex;
}

/**
 * Check if two organisation IDs are the same
 */
export function isSameOrganisation(
  orgId1?: OrganisationId,
  orgId2?: OrganisationId
): boolean {
  if (!orgId1 || !orgId2) {
    return false;
  }
  return String(orgId1) === String(orgId2);
}

/**
 * Check if a user owns a resource
 */
export function isResourceOwner(context: PermissionContext): boolean {
  if (!context.resource?.ownerId || !context.actor.id) {
    return false;
  }
  return context.actor.id === context.resource.ownerId;
}

/**
 * Check if a user is operating within their own organisation
 */
export function isWithinOwnOrganisation(context: PermissionContext): boolean {
  if (!context.actor.orgId || !context.organisationId) {
    return false;
  }
  return isSameOrganisation(context.actor.orgId, context.organisationId);
}

/**
 * Check if a user is operating on a resource within their organisation
 */
export function isResourceWithinOrganisation(
  context: PermissionContext
): boolean {
  if (!context.resource?.orgId || !context.actor.orgId) {
    return false;
  }
  return isSameOrganisation(context.actor.orgId, context.resource.orgId);
}

/**
 * Check if a role has explicit permission
 */
export function hasExplicitPermission(
  role: UserRole,
  permissionId: PermissionId
): boolean {
  if (!role.isActive || !Array.isArray(role.permissions)) {
    return false;
  }
  return role.permissions.includes(permissionId);
}

/**
 * Check if a role has permission via system defaults
 */
export function hasSystemDefaultPermission(
  role: UserRole,
  systemPermission: SystemPermission
): boolean {
  if (!role.isActive || !systemPermission.isActive) {
    return false;
  }
  return systemPermission.defaultRoles.includes(role.name);
}

/**
 * Check if a permission ID is valid according to the pattern
 */
export function isValidPermissionId(permissionId: string): boolean {
  return /^[A-Za-z]\w*(?:\.[A-Za-z]\w*)+$/.test(permissionId);
}

/**
 * Check if a user can perform cross-organisation operations
 */
export function canPerformCrossOrgOperations(
  context: PermissionContext
): boolean {
  return isSystemUser(context.actor.systemRoles);
}

/**
 * Check if a user can modify roles in an organisation
 */
export function canModifyRolesInOrganisation(
  context: PermissionContext,
  targetOrgId: OrganisationId
): boolean {
  // System users can modify any organisation's roles
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Regular users can only modify roles in their own organisation
  return isSameOrganisation(context.actor.orgId, targetOrgId);
}

/**
 * Check if a user can delete a role
 */
export function canDeleteRole(
  role: UserRole,
  context: PermissionContext
): boolean {
  // Cannot delete default roles
  if (role.isDefault) {
    return false;
  }

  // System users can delete any non-default role
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Regular users can only delete roles in their own organisation
  return isSameOrganisation(context.actor.orgId, role.organisationId);
}

/**
 * Check if a user can create roles in an organisation
 */
export function canCreateRolesInOrganisation(
  context: PermissionContext,
  targetOrgId: OrganisationId
): boolean {
  // System users can create roles in any organisation
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Regular users can only create roles in their own organisation
  return isSameOrganisation(context.actor.orgId, targetOrgId);
}

/**
 * Check if a user can view permissions for an organisation
 */
export function canViewOrganisationPermissions(
  context: PermissionContext,
  targetOrgId: OrganisationId
): boolean {
  // System users can view any organisation's permissions
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Regular users can only view permissions in their own organisation
  return isSameOrganisation(context.actor.orgId, targetOrgId);
}

/**
 * Check if a user can manage system permissions
 */
export function canManageSystemPermissions(
  context: PermissionContext
): boolean {
  return isSystemUser(context.actor.systemRoles);
}

/**
 * Check if a user can push permissions to organisations
 */
export function canPushPermissionsToOrganisations(
  context: PermissionContext
): boolean {
  return isSystemUser(context.actor.systemRoles);
}

/**
 * Check if a user can import system permissions
 */
export function canImportSystemPermissions(
  context: PermissionContext
): boolean {
  return isSystemUser(context.actor.systemRoles);
}

/**
 * Check if a user can manage system role templates
 */
export function canManageSystemRoleTemplates(
  context: PermissionContext
): boolean {
  return isSystemUser(context.actor.systemRoles);
}

/**
 * Check if a user can perform a specific action on a resource
 * This is a high-level check that combines multiple predicates
 */
export function canPerformActionPredicate(
  context: PermissionContext,
  _action: string,
  _resource: string
): boolean {
  // System users can perform any action
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Check if user is within their own organisation
  if (!isWithinOwnOrganisation(context)) {
    return false;
  }

  // Check if resource is within the same organisation
  if (context.resource && !isResourceWithinOrganisation(context)) {
    return false;
  }

  // Additional checks would be implemented based on specific business rules
  return true;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(
  userRoles: string[],
  targetRoles: string[]
): boolean {
  return userRoles.some((role) => targetRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 */
export function hasAllRoles(
  userRoles: string[],
  targetRoles: string[]
): boolean {
  return targetRoles.every((role) => userRoles.includes(role));
}

/**
 * Check if a role name is a default role
 */
export function isDefaultRole(roleName: string): boolean {
  const defaultRoles = ['Admin', 'Manager', 'Lecturer', 'Viewer'];
  return defaultRoles.includes(roleName);
}

/**
 * Check if a role is active and valid
 */
export function isActiveRole(role: UserRole): boolean {
  return role.isActive;
}

/**
 * Check if a permission is active and valid
 */
export function isActivePermission(permission: SystemPermission): boolean {
  return permission.isActive;
}

// These functions are now defined in rules.ts to avoid duplication
