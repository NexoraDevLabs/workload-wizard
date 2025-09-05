/**
 * Permissions module compatibility layer
 * Re-exports all functions from the modular permissions system
 * to maintain backward compatibility
 */

// Re-export all types
export * from './types';

// Re-export all constants
export * from './constants';

// Re-export predicates (excluding duplicates)
export {
  isSystemUser,
  hasRoleAtLeast,
  isSameOrganisation,
  isResourceOwner,
  isWithinOwnOrganisation,
  isResourceWithinOrganisation,
  hasExplicitPermission,
  hasSystemDefaultPermission,
  isValidPermissionId,
  canPerformCrossOrgOperations,
  canModifyRolesInOrganisation,
  canDeleteRole,
  canCreateRolesInOrganisation,
  canViewOrganisationPermissions,
  canManageSystemPermissions,
  canPushPermissionsToOrganisations,
  canImportSystemPermissions,
  canManageSystemRoleTemplates,
  canPerformActionPredicate,
  hasAnyRole,
  hasAllRoles,
  isDefaultRole,
  isActiveRole,
  isActivePermission,
} from './predicates';

// Re-export all rules
export * from './rules';

// Re-export all guards
export * from './guards';

// Re-export utility functions (excluding duplicates)
export { requirePermission, requireOrgPermission } from './utils';

// Re-export all queries
export * from './queries';

// Re-export all mutations
export * from './mutations';
