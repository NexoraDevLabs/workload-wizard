import type {
  PermissionContext,
  UserRole,
  SystemPermission,
  PermissionId,
  Resource,
  Action,
  Role,
  OrganisationId,
} from './types';
import { PERMISSION_ERRORS } from './constants';
import { hasPermission } from './rules';

/**
 * Permission guards - throwing wrappers for permission checks
 * These functions throw errors when permissions are denied
 */

/**
 * Assert that a user has a specific permission
 */
export function assertHasPermission(
  context: PermissionContext,
  permissionId: PermissionId,
  roles: UserRole[],
  systemPermission?: SystemPermission
): asserts context is PermissionContext {
  const result = hasPermission(context, permissionId, roles, systemPermission);

  if (!result.hasPermission) {
    throw new Error(`${PERMISSION_ERRORS.PERMISSION_DENIED}: ${permissionId}`);
  }
}

/**
 * Assert that a user can perform an action on a resource
 */
export function assertCanPerformAction(
  context: PermissionContext,
  resource: Resource,
  action: Action
): asserts context is PermissionContext {
  // System users can perform any action
  if (
    context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    return;
  }

  // Check if user has the required capability
  const userRole = context.actor.role;
  const capabilities: Record<
    Role,
    Partial<Record<Resource, readonly Action[]>>
  > = {
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
  };

  const roleCapabilities = capabilities[userRole];
  if (!roleCapabilities || !roleCapabilities[resource]) {
    throw new Error(
      `${PERMISSION_ERRORS.PERMISSION_DENIED}: ${action} on ${resource}`
    );
  }

  if (!roleCapabilities[resource].includes(action)) {
    throw new Error(
      `${PERMISSION_ERRORS.PERMISSION_DENIED}: ${action} on ${resource}`
    );
  }
}

/**
 * Assert that a user can read a resource
 */
export function assertCanRead(
  context: PermissionContext,
  resource: Resource
): asserts context is PermissionContext {
  assertCanPerformAction(context, resource, 'READ');
}

/**
 * Assert that a user can create a resource
 */
export function assertCanCreate(
  context: PermissionContext,
  resource: Resource
): asserts context is PermissionContext {
  assertCanPerformAction(context, resource, 'CREATE');
}

/**
 * Assert that a user can update a resource
 */
export function assertCanUpdate(
  context: PermissionContext,
  resource: Resource
): asserts context is PermissionContext {
  assertCanPerformAction(context, resource, 'UPDATE');
}

/**
 * Assert that a user can delete a resource
 */
export function assertCanDelete(
  context: PermissionContext,
  resource: Resource
): asserts context is PermissionContext {
  assertCanPerformAction(context, resource, 'DELETE');
}

/**
 * Assert that a user can manage a resource
 */
export function assertCanManage(
  context: PermissionContext,
  resource: Resource
): asserts context is PermissionContext {
  assertCanPerformAction(context, resource, 'MANAGE');
}

/**
 * Assert that a user can view users
 */
export function assertCanViewUsers(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'User');
}

/**
 * Assert that a user can create users
 */
export function assertCanCreateUsers(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'User');
}

/**
 * Assert that a user can edit users
 */
export function assertCanEditUsers(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'User');
}

/**
 * Assert that a user can delete users
 */
export function assertCanDeleteUsers(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'User');
}

/**
 * Assert that a user can manage permissions
 */
export function assertCanManagePermissions(
  context: PermissionContext
): asserts context is PermissionContext {
  if (
    !context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    throw new Error(
      `${PERMISSION_ERRORS.PERMISSION_DENIED}: manage permissions`
    );
  }
}

/**
 * Assert that a user can view modules
 */
export function assertCanViewModules(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'Module');
}

/**
 * Assert that a user can create modules
 */
export function assertCanCreateModules(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'Module');
}

/**
 * Assert that a user can edit modules
 */
export function assertCanEditModules(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'Module');
}

/**
 * Assert that a user can delete modules
 */
export function assertCanDeleteModules(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'Module');
}

/**
 * Assert that a user can view courses
 */
export function assertCanViewCourses(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'Course');
}

/**
 * Assert that a user can create courses
 */
export function assertCanCreateCourses(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'Course');
}

/**
 * Assert that a user can edit courses
 */
export function assertCanEditCourses(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'Course');
}

/**
 * Assert that a user can delete courses
 */
export function assertCanDeleteCourses(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'Course');
}

/**
 * Assert that a user can view groups
 */
export function assertCanViewGroups(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'Group');
}

/**
 * Assert that a user can create groups
 */
export function assertCanCreateGroups(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'Group');
}

/**
 * Assert that a user can edit groups
 */
export function assertCanEditGroups(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'Group');
}

/**
 * Assert that a user can delete groups
 */
export function assertCanDeleteGroups(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'Group');
}

/**
 * Assert that a user can view allocations
 */
export function assertCanViewAllocations(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'Allocation');
}

/**
 * Assert that a user can create allocations
 */
export function assertCanCreateAllocations(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'Allocation');
}

/**
 * Assert that a user can edit allocations
 */
export function assertCanEditAllocations(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'Allocation');
}

/**
 * Assert that a user can delete allocations
 */
export function assertCanDeleteAllocations(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'Allocation');
}

/**
 * Assert that a user can view reports
 */
export function assertCanViewReports(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'Report');
}

/**
 * Assert that a user can create reports
 */
export function assertCanCreateReports(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'Report');
}

/**
 * Assert that a user can edit reports
 */
export function assertCanEditReports(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'Report');
}

/**
 * Assert that a user can delete reports
 */
export function assertCanDeleteReports(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'Report');
}

/**
 * Assert that a user can view academic years
 */
export function assertCanViewAcademicYears(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'AcademicYear');
}

/**
 * Assert that a user can create academic years
 */
export function assertCanCreateAcademicYears(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'AcademicYear');
}

/**
 * Assert that a user can edit academic years
 */
export function assertCanEditAcademicYears(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'AcademicYear');
}

/**
 * Assert that a user can delete academic years
 */
export function assertCanDeleteAcademicYears(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'AcademicYear');
}

/**
 * Assert that a user can manage an organisation
 */
export function assertCanManageOrganisation(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanManage(context, 'Organisation');
}

/**
 * Assert that a user can view an organisation
 */
export function assertCanViewOrganisation(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanRead(context, 'Organisation');
}

/**
 * Assert that a user can create an organisation
 */
export function assertCanCreateOrganisation(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanCreate(context, 'Organisation');
}

/**
 * Assert that a user can edit an organisation
 */
export function assertCanEditOrganisation(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanUpdate(context, 'Organisation');
}

/**
 * Assert that a user can delete an organisation
 */
export function assertCanDeleteOrganisation(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanDelete(context, 'Organisation');
}

/**
 * Assert that a user can manage roles in an organisation
 */
export function assertCanManageRolesInOrganisation(
  context: PermissionContext,
  targetOrgId: OrganisationId
): asserts context is PermissionContext {
  // System users can manage any organisation's roles
  if (
    context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    return;
  }

  // Regular users can only manage roles in their own organisation
  if (String(context.actor.orgId) !== String(targetOrgId)) {
    throw new Error(PERMISSION_ERRORS.UNAUTHORISED_ROLE_MODIFICATION);
  }
}

/**
 * Assert that a user can create roles in an organisation
 */
export function assertCanCreateRolesInOrganisation(
  context: PermissionContext,
  targetOrgId: OrganisationId
): asserts context is PermissionContext {
  assertCanManageRolesInOrganisation(context, targetOrgId);
}

/**
 * Assert that a user can delete a role
 */
export function assertCanDeleteRole(
  context: PermissionContext,
  role: UserRole
): asserts context is PermissionContext {
  // Cannot delete default roles
  if (role.isDefault) {
    throw new Error(PERMISSION_ERRORS.CANNOT_DELETE_DEFAULT_ROLES);
  }

  // System users can delete any non-default role
  if (
    context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    return;
  }

  // Regular users can only delete roles in their own organisation
  if (String(context.actor.orgId) !== String(role.organisationId)) {
    throw new Error(PERMISSION_ERRORS.UNAUTHORISED_ROLE_DELETION);
  }
}

/**
 * Assert that a user can view permissions for an organisation
 */
export function assertCanViewOrganisationPermissions(
  context: PermissionContext,
  targetOrgId: OrganisationId
): asserts context is PermissionContext {
  // System users can view any organisation's permissions
  if (
    context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    return;
  }

  // Regular users can only view permissions in their own organisation
  if (String(context.actor.orgId) !== String(targetOrgId)) {
    throw new Error(PERMISSION_ERRORS.PERMISSION_DENIED);
  }
}

/**
 * Assert that a user can push permissions to organisations
 */
export function assertCanPushPermissionsToOrganisations(
  context: PermissionContext
): asserts context is PermissionContext {
  if (
    !context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    throw new Error(
      `${PERMISSION_ERRORS.PERMISSION_DENIED}: push permissions to organisations`
    );
  }
}

/**
 * Assert that a user can import system permissions
 */
export function assertCanImportSystemPermissions(
  context: PermissionContext
): asserts context is PermissionContext {
  if (
    !context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    throw new Error(
      `${PERMISSION_ERRORS.PERMISSION_DENIED}: import system permissions`
    );
  }
}

/**
 * Assert that a user can manage system role templates
 */
export function assertCanManageSystemRoleTemplates(
  context: PermissionContext
): asserts context is PermissionContext {
  if (
    !context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    throw new Error(
      `${PERMISSION_ERRORS.PERMISSION_DENIED}: manage system role templates`
    );
  }
}

/**
 * Assert that a user can manage system permissions
 */
export function assertCanManageSystemPermissions(
  context: PermissionContext
): asserts context is PermissionContext {
  if (
    !context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    throw new Error(
      `${PERMISSION_ERRORS.PERMISSION_DENIED}: manage system permissions`
    );
  }
}

/**
 * Assert that a user can access a specific resource
 */
export function assertCanAccessResource(
  context: PermissionContext
): asserts context is PermissionContext {
  // System users can access any resource
  if (
    context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    return;
  }

  // Check if user is within their own organisation
  if (
    context.actor.orgId &&
    context.organisationId &&
    String(context.actor.orgId) !== String(context.organisationId)
  ) {
    throw new Error(PERMISSION_ERRORS.CROSS_ORG_ACCESS_DENIED);
  }

  // Check if resource is within the same organisation
  if (
    context.resource?.orgId &&
    context.actor.orgId &&
    String(context.resource.orgId) !== String(context.actor.orgId)
  ) {
    throw new Error(PERMISSION_ERRORS.CROSS_ORG_ACCESS_DENIED);
  }
}

/**
 * Assert that a user can modify a specific resource
 */
export function assertCanModifyResource(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanAccessResource(context);
  // Additional modification-specific checks would go here
}

/**
 * Assert that a user can delete a specific resource
 */
export function assertCanDeleteResource(
  context: PermissionContext
): asserts context is PermissionContext {
  assertCanAccessResource(context);
  // Additional deletion-specific checks would go here
}

/**
 * Assert that a user can create resources in an organisation
 */
export function assertCanCreateResourcesInOrganisation(
  context: PermissionContext,
  targetOrgId: OrganisationId
): asserts context is PermissionContext {
  // System users can create resources in any organisation
  if (
    context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    return;
  }

  // Regular users can only create resources in their own organisation
  if (String(context.actor.orgId) !== String(targetOrgId)) {
    throw new Error(PERMISSION_ERRORS.CROSS_ORG_ACCESS_DENIED);
  }
}

/**
 * Assert that a user can view resources in an organisation
 */
export function assertCanViewResourcesInOrganisation(
  context: PermissionContext,
  targetOrgId: OrganisationId
): asserts context is PermissionContext {
  // System users can view resources in any organisation
  if (
    context.actor.systemRoles?.some((role) =>
      ['admin', 'sysadmin', 'developer'].includes(role)
    )
  ) {
    return;
  }

  // Regular users can only view resources in their own organisation
  if (String(context.actor.orgId) !== String(targetOrgId)) {
    throw new Error(PERMISSION_ERRORS.CROSS_ORG_ACCESS_DENIED);
  }
}

/**
 * Legacy compatibility functions
 */

/**
 * @deprecated Use assertHasPermission instead
 */
export function requirePermission(
  context: PermissionContext,
  permissionId: PermissionId,
  roles: UserRole[],
  systemPermission?: SystemPermission
): asserts context is PermissionContext {
  assertHasPermission(context, permissionId, roles, systemPermission);
}

/**
 * @deprecated Use assertCanAccessResource instead
 */
export function requireOrgPermission(
  context: PermissionContext,
  _permissionId: PermissionId,
  _organisationId: OrganisationId
): asserts context is PermissionContext {
  assertCanAccessResource(context);
  // Additional org-specific permission checks would go here
}
