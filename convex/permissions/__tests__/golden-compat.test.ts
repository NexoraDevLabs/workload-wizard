import { describe, it, expect } from 'vitest';
import type {
  // Types
  Role,
  Action,
  Resource,
  PermissionContext,
  SystemRole,
  PermissionId,
  OrganisationId,
  UserId,
  AuditAction,
  PermissionGroup,
} from '../index';
import {
  // Constants
  SYSTEM_ROLES,
  DEFAULT_ROLE_NAMES,
  PERMISSION_ERRORS,
  PERMISSION_ID_PATTERN,
  PERMISSION_GROUPS,
  ROLE_HIERARCHY,
  ROLE_CAPABILITIES,
  PLANNING_MVP_PERMISSIONS,
  ACADEMIC_YEAR_PERMISSIONS,
  // Predicates
  isSystemUser,
  hasRoleAtLeast,
  isSameOrganisation,
  isResourceOwner,
  isWithinOwnOrganisation,
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
  hasAnyRole,
  hasAllRoles,
  isDefaultRole,
  isActiveRole,
  isActivePermission,
  // Rules
  canPerformAction,
  canAccessResource,
  canModifyResource,
  canDeleteResource,
  canCreateResourcesInOrganisation,
  canViewResourcesInOrganisation,
  policies,
  // Guards
  assertHasPermission,
  assertCanPerformAction,
  requirePermission,
  requireOrgPermission,
} from '../index';

describe('golden compatibility test', () => {
  describe('types', () => {
    it('should export all required types', () => {
      // Test that types are properly exported and can be used
      const role: Role = 'SYSTEM';
      const action: Action = 'READ';
      const resource: Resource = 'Module';
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF' },
        resource: { id: 'res1', type: 'Module' },
      };
      const systemRole: SystemRole = 'admin';
      const permissionId: PermissionId = 'module.view';
      const orgId: OrganisationId = 'org123' as OrganisationId;
      const userId: UserId = 'user123' as UserId;
      const permissionGroup: PermissionGroup = 'modules';
      const auditAction: AuditAction = 'create';

      expect(role).toBe('SYSTEM');
      expect(action).toBe('READ');
      expect(resource).toBe('Module');
      expect(context.actor.id).toBe('user1');
      expect(systemRole).toBe('admin');
      expect(permissionId).toBe('module.view');
      expect(orgId).toBe('org123');
      expect(userId).toBe('user123');
      expect(permissionGroup).toBe('modules');
      expect(auditAction).toBe('create');
    });
  });

  describe('constants', () => {
    it('should export all required constants', () => {
      expect(SYSTEM_ROLES).toBeDefined();
      expect(DEFAULT_ROLE_NAMES).toBeDefined();
      expect(PERMISSION_ERRORS).toBeDefined();
      expect(PERMISSION_ID_PATTERN).toBeDefined();
      expect(PERMISSION_GROUPS).toBeDefined();
      expect(ROLE_HIERARCHY).toBeDefined();
      expect(ROLE_CAPABILITIES).toBeDefined();
      expect(PLANNING_MVP_PERMISSIONS).toBeDefined();
      expect(ACADEMIC_YEAR_PERMISSIONS).toBeDefined();
    });

    it('should have correct structure for SYSTEM_ROLES', () => {
      expect(Array.isArray(SYSTEM_ROLES)).toBe(true);
      expect(SYSTEM_ROLES).toContain('admin');
      expect(SYSTEM_ROLES).toContain('sysadmin');
      expect(SYSTEM_ROLES).toContain('developer');
    });

    it('should have correct structure for DEFAULT_ROLE_NAMES', () => {
      expect(Array.isArray(DEFAULT_ROLE_NAMES)).toBe(true);
      expect(DEFAULT_ROLE_NAMES).toContain('Admin');
      expect(DEFAULT_ROLE_NAMES).toContain('Manager');
      expect(DEFAULT_ROLE_NAMES).toContain('Lecturer');
      expect(DEFAULT_ROLE_NAMES).toContain('Viewer');
    });

    it('should have correct structure for PERMISSION_GROUPS', () => {
      expect(Array.isArray(PERMISSION_GROUPS)).toBe(true);
      expect(PERMISSION_GROUPS).toContain('modules');
      expect(PERMISSION_GROUPS).toContain('courses');
      expect(PERMISSION_GROUPS).toContain('users');
    });
  });

  describe('predicates', () => {
    it('should export all required predicate functions', () => {
      expect(typeof isSystemUser).toBe('function');
      expect(typeof hasRoleAtLeast).toBe('function');
      expect(typeof isSameOrganisation).toBe('function');
      expect(typeof isResourceOwner).toBe('function');
      expect(typeof isWithinOwnOrganisation).toBe('function');
      expect(typeof hasExplicitPermission).toBe('function');
      expect(typeof hasSystemDefaultPermission).toBe('function');
      expect(typeof isValidPermissionId).toBe('function');
      expect(typeof canPerformCrossOrgOperations).toBe('function');
      expect(typeof canModifyRolesInOrganisation).toBe('function');
      expect(typeof canDeleteRole).toBe('function');
      expect(typeof canCreateRolesInOrganisation).toBe('function');
      expect(typeof canViewOrganisationPermissions).toBe('function');
      expect(typeof canManageSystemPermissions).toBe('function');
      expect(typeof canPushPermissionsToOrganisations).toBe('function');
      expect(typeof canImportSystemPermissions).toBe('function');
      expect(typeof canManageSystemRoleTemplates).toBe('function');
      expect(typeof hasAnyRole).toBe('function');
      expect(typeof hasAllRoles).toBe('function');
      expect(typeof isDefaultRole).toBe('function');
      expect(typeof isActiveRole).toBe('function');
      expect(typeof isActivePermission).toBe('function');
    });

    it('should work with basic predicate functions', () => {
      expect(isSystemUser(['admin'])).toBe(true);
      expect(hasRoleAtLeast('ORG_ADMIN', 'STAFF')).toBe(true);
      expect(
        isSameOrganisation('org1' as OrganisationId, 'org1' as OrganisationId)
      ).toBe(true);
      expect(isValidPermissionId('module.view')).toBe(true);
      expect(hasAnyRole(['admin', 'user'], ['admin'])).toBe(true);
      expect(hasAllRoles(['admin', 'user'], ['admin', 'user'])).toBe(true);
      expect(isDefaultRole('Admin')).toBe(true);
    });
  });

  describe('rules', () => {
    it('should export all required rule functions', () => {
      expect(typeof canPerformAction).toBe('function');
      expect(typeof canAccessResource).toBe('function');
      expect(typeof canModifyResource).toBe('function');
      expect(typeof canDeleteResource).toBe('function');
      expect(typeof canCreateResourcesInOrganisation).toBe('function');
      expect(typeof canViewResourcesInOrganisation).toBe('function');
      expect(typeof policies).toBe('object');
    });

    it('should work with basic rule functions', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(canPerformAction(context, 'Module', 'READ')).toBe(true);
      expect(canAccessResource(context)).toBe(true);
      expect(canModifyResource(context)).toBe(true);
      expect(canDeleteResource(context, 'Module')).toBe(true);
    });
  });

  describe('guards', () => {
    it('should export all required guard functions', () => {
      expect(typeof assertHasPermission).toBe('function');
      expect(typeof assertCanPerformAction).toBe('function');
      expect(typeof requirePermission).toBe('function');
      expect(typeof requireOrgPermission).toBe('function');
    });

    it('should work with basic guard functions', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(() =>
        assertCanPerformAction(context, 'Module', 'READ')
      ).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should work with complete permission flow', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'ORG_ADMIN',
          orgId: 'org1' as OrganisationId,
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: 'org1' as OrganisationId,
        },
        organisationId: 'org1' as OrganisationId,
      };

      // Test predicates
      expect(isWithinOwnOrganisation(context)).toBe(true);
      expect(hasRoleAtLeast('ORG_ADMIN', 'STAFF')).toBe(true);

      // Test rules
      expect(canPerformAction(context, 'Module', 'READ')).toBe(true);
      expect(canAccessResource(context)).toBe(true);
      expect(canModifyResource(context)).toBe(true);

      // Test guards
      expect(() =>
        assertCanPerformAction(context, 'Module', 'READ')
      ).not.toThrow();
    });

    it('should work with system user flow', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
        resource: { id: 'res1', type: 'Module' },
      };

      // Test predicates
      expect(isSystemUser(['admin'])).toBe(true);
      expect(canPerformCrossOrgOperations(context)).toBe(true);

      // Test rules
      expect(canPerformAction(context, 'Module', 'READ')).toBe(true);
      expect(canPerformAction(context, 'Module', 'CREATE')).toBe(true);
      expect(canPerformAction(context, 'Module', 'UPDATE')).toBe(true);
      expect(canPerformAction(context, 'Module', 'DELETE')).toBe(true);

      // Test guards
      expect(() =>
        assertCanPerformAction(context, 'Module', 'READ')
      ).not.toThrow();
      expect(() =>
        assertCanPerformAction(context, 'Module', 'CREATE')
      ).not.toThrow();
      expect(() =>
        assertCanPerformAction(context, 'Module', 'UPDATE')
      ).not.toThrow();
      expect(() =>
        assertCanPerformAction(context, 'Module', 'DELETE')
      ).not.toThrow();
    });
  });
});
