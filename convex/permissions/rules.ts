import type {
  PermissionContext,
  UserRole,
  SystemPermission,
  PermissionCheckResult,
  PermissionId,
  Resource,
  Action,
  OrganisationId,
} from './types';
import { ROLE_CAPABILITIES } from './constants';
import {
  isSystemUser,
  hasExplicitPermission,
  hasSystemDefaultPermission,
  canModifyRolesInOrganisation,
  canDeleteRole,
  canCreateRolesInOrganisation as canCreateRolesInOrganisationPredicate,
  canViewOrganisationPermissions as canViewOrganisationPermissionsPredicate,
  canManageSystemPermissions as canManageSystemPermissionsPredicate,
  canPushPermissionsToOrganisations as canPushPermissionsToOrganisationsPredicate,
  canImportSystemPermissions as canImportSystemPermissionsPredicate,
  canManageSystemRoleTemplates as canManageSystemRoleTemplatesPredicate,
} from './predicates';

/**
 * Permission rules and policies
 * These functions implement the business logic for permission evaluation
 */

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  context: PermissionContext,
  permissionId: PermissionId,
  roles: UserRole[],
  systemPermission?: SystemPermission
): PermissionCheckResult {
  // System users bypass all permission checks
  if (isSystemUser(context.actor.systemRoles)) {
    return {
      hasPermission: true,
      source: 'system_role',
      roleName: 'system',
      permissionId,
    };
  }

  // Check explicit permissions across all roles
  for (const role of roles) {
    if (hasExplicitPermission(role, permissionId)) {
      return {
        hasPermission: true,
        source: 'explicit_role',
        roleName: role.name,
        permissionId,
      };
    }
  }

  // Check system defaults if permission is provided
  if (systemPermission) {
    for (const role of roles) {
      if (hasSystemDefaultPermission(role, systemPermission)) {
        return {
          hasPermission: true,
          source: 'system_default',
          roleName: role.name,
          permissionId,
        };
      }
    }
  }

  return {
    hasPermission: false,
    source: 'denied',
    permissionId,
  };
}

/**
 * Check if a user can perform an action on a resource
 */
export function canPerformAction(
  context: PermissionContext,
  resource: Resource,
  action: Action
): boolean {
  // System users can perform any action
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Check if user has the required capability
  const userRole = context.actor.role;
  const capabilities = ROLE_CAPABILITIES[userRole];

  if (!capabilities || !capabilities[resource]) {
    return false;
  }

  return capabilities[resource].includes(action);
}

/**
 * Check if a user can read a resource
 */
export function canReadResource(
  context: PermissionContext,
  resource: Resource
): boolean {
  return canPerformAction(context, resource, 'READ');
}

/**
 * Check if a user can create a resource
 */
export function canCreateResource(
  context: PermissionContext,
  resource: Resource
): boolean {
  return canPerformAction(context, resource, 'CREATE');
}

/**
 * Check if a user can update a resource
 */
export function canUpdateResource(
  context: PermissionContext,
  resource: Resource
): boolean {
  return canPerformAction(context, resource, 'UPDATE');
}

/**
 * Check if a user can delete a resource
 */
export function canDeleteResource(
  context: PermissionContext,
  resource: Resource
): boolean {
  return canPerformAction(context, resource, 'DELETE');
}

/**
 * Check if a user can manage a resource
 */
export function canManageResource(
  context: PermissionContext,
  resource: Resource
): boolean {
  return canPerformAction(context, resource, 'MANAGE');
}

/**
 * Check if a user can view users
 */
export function canViewUsers(context: PermissionContext): boolean {
  return canReadResource(context, 'User');
}

/**
 * Check if a user can create users
 */
export function canCreateUsers(context: PermissionContext): boolean {
  return canCreateResource(context, 'User');
}

/**
 * Check if a user can edit users
 */
export function canEditUsers(context: PermissionContext): boolean {
  return canUpdateResource(context, 'User');
}

/**
 * Check if a user can delete users
 */
export function canDeleteUsers(context: PermissionContext): boolean {
  return canDeleteResource(context, 'User');
}

/**
 * Check if a user can manage permissions
 */
export function canManagePermissions(context: PermissionContext): boolean {
  return canManageSystemPermissions(context);
}

/**
 * Check if a user can view modules
 */
export function canViewModules(context: PermissionContext): boolean {
  return canReadResource(context, 'Module');
}

/**
 * Check if a user can create modules
 */
export function canCreateModules(context: PermissionContext): boolean {
  return canCreateResource(context, 'Module');
}

/**
 * Check if a user can edit modules
 */
export function canEditModules(context: PermissionContext): boolean {
  return canUpdateResource(context, 'Module');
}

/**
 * Check if a user can delete modules
 */
export function canDeleteModules(context: PermissionContext): boolean {
  return canDeleteResource(context, 'Module');
}

/**
 * Check if a user can view courses
 */
export function canViewCourses(context: PermissionContext): boolean {
  return canReadResource(context, 'Course');
}

/**
 * Check if a user can create courses
 */
export function canCreateCourses(context: PermissionContext): boolean {
  return canCreateResource(context, 'Course');
}

/**
 * Check if a user can edit courses
 */
export function canEditCourses(context: PermissionContext): boolean {
  return canUpdateResource(context, 'Course');
}

/**
 * Check if a user can delete courses
 */
export function canDeleteCourses(context: PermissionContext): boolean {
  return canDeleteResource(context, 'Course');
}

/**
 * Check if a user can view groups
 */
export function canViewGroups(context: PermissionContext): boolean {
  return canReadResource(context, 'Group');
}

/**
 * Check if a user can create groups
 */
export function canCreateGroups(context: PermissionContext): boolean {
  return canCreateResource(context, 'Group');
}

/**
 * Check if a user can edit groups
 */
export function canEditGroups(context: PermissionContext): boolean {
  return canUpdateResource(context, 'Group');
}

/**
 * Check if a user can delete groups
 */
export function canDeleteGroups(context: PermissionContext): boolean {
  return canDeleteResource(context, 'Group');
}

/**
 * Check if a user can view allocations
 */
export function canViewAllocations(context: PermissionContext): boolean {
  return canReadResource(context, 'Allocation');
}

/**
 * Check if a user can create allocations
 */
export function canCreateAllocations(context: PermissionContext): boolean {
  return canCreateResource(context, 'Allocation');
}

/**
 * Check if a user can edit allocations
 */
export function canEditAllocations(context: PermissionContext): boolean {
  return canUpdateResource(context, 'Allocation');
}

/**
 * Check if a user can delete allocations
 */
export function canDeleteAllocations(context: PermissionContext): boolean {
  return canDeleteResource(context, 'Allocation');
}

/**
 * Check if a user can view reports
 */
export function canViewReports(context: PermissionContext): boolean {
  return canReadResource(context, 'Report');
}

/**
 * Check if a user can create reports
 */
export function canCreateReports(context: PermissionContext): boolean {
  return canCreateResource(context, 'Report');
}

/**
 * Check if a user can edit reports
 */
export function canEditReports(context: PermissionContext): boolean {
  return canUpdateResource(context, 'Report');
}

/**
 * Check if a user can delete reports
 */
export function canDeleteReports(context: PermissionContext): boolean {
  return canDeleteResource(context, 'Report');
}

/**
 * Check if a user can view academic years
 */
export function canViewAcademicYears(context: PermissionContext): boolean {
  return canReadResource(context, 'AcademicYear');
}

/**
 * Check if a user can create academic years
 */
export function canCreateAcademicYears(context: PermissionContext): boolean {
  return canCreateResource(context, 'AcademicYear');
}

/**
 * Check if a user can edit academic years
 */
export function canEditAcademicYears(context: PermissionContext): boolean {
  return canUpdateResource(context, 'AcademicYear');
}

/**
 * Check if a user can delete academic years
 */
export function canDeleteAcademicYears(context: PermissionContext): boolean {
  return canDeleteResource(context, 'AcademicYear');
}

/**
 * Check if a user can manage an organisation
 */
export function canManageOrganisation(context: PermissionContext): boolean {
  return canManageResource(context, 'Organisation');
}

/**
 * Check if a user can view an organisation
 */
export function canViewOrganisation(context: PermissionContext): boolean {
  return canReadResource(context, 'Organisation');
}

/**
 * Check if a user can create an organisation
 */
export function canCreateOrganisation(context: PermissionContext): boolean {
  return canCreateResource(context, 'Organisation');
}

/**
 * Check if a user can edit an organisation
 */
export function canEditOrganisation(context: PermissionContext): boolean {
  return canUpdateResource(context, 'Organisation');
}

/**
 * Check if a user can delete an organisation
 */
export function canDeleteOrganisation(context: PermissionContext): boolean {
  return canDeleteResource(context, 'Organisation');
}

/**
 * Check if a user can manage roles in an organisation
 */
export function canManageRolesInOrganisation(
  context: PermissionContext,
  targetOrgId: string
): boolean {
  return canModifyRolesInOrganisation(context, targetOrgId as OrganisationId);
}

/**
 * Check if a user can create roles in an organisation
 */
export function canCreateRolesInOrganisation(
  context: PermissionContext,
  targetOrgId: string
): boolean {
  return canCreateRolesInOrganisationPredicate(
    context,
    targetOrgId as OrganisationId
  );
}

/**
 * Check if a user can delete a role
 */
export function canDeleteRoleInOrganisation(
  context: PermissionContext,
  role: UserRole
): boolean {
  return canDeleteRole(role, context);
}

/**
 * Check if a user can view permissions for an organisation
 */
export function canViewOrganisationPermissions(
  context: PermissionContext,
  targetOrgId: string
): boolean {
  return canViewOrganisationPermissionsPredicate(
    context,
    targetOrgId as OrganisationId
  );
}

/**
 * Check if a user can push permissions to organisations
 */
export function canPushPermissionsToOrganisations(
  context: PermissionContext
): boolean {
  return canPushPermissionsToOrganisationsPredicate(context);
}

/**
 * Check if a user can import system permissions
 */
export function canImportSystemPermissions(
  context: PermissionContext
): boolean {
  return canImportSystemPermissionsPredicate(context);
}

/**
 * Check if a user can manage system role templates
 */
export function canManageSystemRoleTemplates(
  context: PermissionContext
): boolean {
  return canManageSystemRoleTemplatesPredicate(context);
}

/**
 * Check if a user can manage system permissions
 */
export function canManageSystemPermissions(
  context: PermissionContext
): boolean {
  return canManageSystemPermissionsPredicate(context);
}

/**
 * Check if a user can access a specific resource
 */
export function canAccessResource(context: PermissionContext): boolean {
  // System users can access any resource
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Check if user is within their own organisation
  if (
    context.actor.orgId &&
    context.organisationId &&
    String(context.actor.orgId) !== String(context.organisationId)
  ) {
    return false;
  }

  // Check if resource is within the same organisation
  if (
    context.resource?.orgId &&
    context.actor.orgId &&
    String(context.resource.orgId) !== String(context.actor.orgId)
  ) {
    return false;
  }

  return true;
}

/**
 * Check if a user can modify a specific resource
 */
export function canModifyResource(context: PermissionContext): boolean {
  // System users can modify any resource
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Check basic access first
  if (!canAccessResource(context)) {
    return false;
  }

  // Additional modification-specific checks would go here
  return true;
}

// This function is already defined above with the resource parameter

/**
 * Check if a user can create resources in an organisation
 */
export function canCreateResourcesInOrganisation(
  context: PermissionContext,
  targetOrgId: string
): boolean {
  // System users can create resources in any organisation
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Regular users can only create resources in their own organisation
  return String(context.actor.orgId) === String(targetOrgId);
}

/**
 * Check if a user can view resources in an organisation
 */
export function canViewResourcesInOrganisation(
  context: PermissionContext,
  targetOrgId: string
): boolean {
  // System users can view resources in any organisation
  if (isSystemUser(context.actor.systemRoles)) {
    return true;
  }

  // Regular users can only view resources in their own organisation
  return String(context.actor.orgId) === String(targetOrgId);
}

/**
 * Policy definitions for different resource types
 */
export const policies = {
  user: {
    read: canViewUsers,
    create: canCreateUsers,
    update: canEditUsers,
    delete: canDeleteUsers,
  },
  module: {
    read: canViewModules,
    create: canCreateModules,
    update: canEditModules,
    delete: canDeleteModules,
  },
  course: {
    read: canViewCourses,
    create: canCreateCourses,
    update: canEditCourses,
    delete: canDeleteCourses,
  },
  group: {
    read: canViewGroups,
    create: canCreateGroups,
    update: canEditGroups,
    delete: canDeleteGroups,
  },
  allocation: {
    read: canViewAllocations,
    create: canCreateAllocations,
    update: canEditAllocations,
    delete: canDeleteAllocations,
  },
  report: {
    read: canViewReports,
    create: canCreateReports,
    update: canEditReports,
    delete: canDeleteReports,
  },
  academicYear: {
    read: canViewAcademicYears,
    create: canCreateAcademicYears,
    update: canEditAcademicYears,
    delete: canDeleteAcademicYears,
  },
  organisation: {
    read: canViewOrganisation,
    create: canCreateOrganisation,
    update: canEditOrganisation,
    delete: canDeleteOrganisation,
    manage: canManageOrganisation,
  },
} as const;
