import { describe, it, expect } from 'vitest';
import {
  isSystemUser,
  hasRoleAtLeast,
  isSameOrganisation,
  isResourceOwner,
  isWithinOwnOrganisation,
  hasExplicitPermission,
  hasSystemDefaultPermission,
  isValidPermissionId,
  canPerformCrossOrgOperations,
  hasAnyRole,
  hasAllRoles,
  isDefaultRole,
  isActiveRole,
  isActivePermission,
} from '../predicates';
import type { PermissionContext, UserRole, SystemPermission, SystemRole } from '../types';
import { mockOrganisationId, mockRoleId } from './test-utils';

describe('predicates', () => {
  describe('isSystemUser', () => {
    it('should return true for system users', () => {
      const systemRoles: SystemRole[] = ['admin', 'sysadmin', 'developer'];
      expect(isSystemUser(systemRoles)).toBe(true);
    });

    it('should return false for non-system users', () => {
      const systemRoles: SystemRole[] = ['admin', 'sysadmin'];
      expect(isSystemUser(systemRoles)).toBe(false);
    });

    it('should return false for empty roles', () => {
      expect(isSystemUser([])).toBe(false);
      expect(isSystemUser(undefined)).toBe(false);
    });
  });

  describe('hasRoleAtLeast', () => {
    it('should return true for higher privilege roles', () => {
      expect(hasRoleAtLeast('ORG_ADMIN', 'STAFF')).toBe(true);
      expect(hasRoleAtLeast('SYSTEM', 'ORG_ADMIN')).toBe(true);
    });

    it('should return false for lower privilege roles', () => {
      expect(hasRoleAtLeast('STAFF', 'ORG_ADMIN')).toBe(false);
      expect(hasRoleAtLeast('STUDENT', 'STAFF')).toBe(false);
    });

    it('should return true for same role', () => {
      expect(hasRoleAtLeast('STAFF', 'STAFF')).toBe(true);
    });
  });

  describe('isSameOrganisation', () => {
    it('should return true for same organisation IDs', () => {
      expect(isSameOrganisation(mockOrganisationId('org1'), mockOrganisationId('org1'))).toBe(true);
    });

    it('should return false for different organisation IDs', () => {
      expect(isSameOrganisation(mockOrganisationId('org1'), mockOrganisationId('org2'))).toBe(false);
    });

    it('should return false for undefined IDs', () => {
      expect(isSameOrganisation(undefined, mockOrganisationId('org1'))).toBe(false);
      expect(isSameOrganisation(mockOrganisationId('org1'), undefined)).toBe(false);
    });
  });

  describe('isResourceOwner', () => {
    it('should return true when user owns resource', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF' },
        resource: { id: 'res1', ownerId: 'user1', type: 'Module' },
      };
      expect(isResourceOwner(context)).toBe(true);
    });

    it('should return false when user does not own resource', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF' },
        resource: { id: 'res1', ownerId: 'user2', type: 'Module' },
      };
      expect(isResourceOwner(context)).toBe(false);
    });

    it('should return false when resource has no owner', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF' },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(isResourceOwner(context)).toBe(false);
    });
  });

  describe('isWithinOwnOrganisation', () => {
    it('should return true when user is within their own organisation', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF', orgId: mockOrganisationId('org1') },
        organisationId: mockOrganisationId('org1'),
      };
      expect(isWithinOwnOrganisation(context)).toBe(true);
    });

    it('should return false when user is in different organisation', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF', orgId: mockOrganisationId('org1') },
        organisationId: mockOrganisationId('org2'),
      };
      expect(isWithinOwnOrganisation(context)).toBe(false);
    });
  });

  describe('hasExplicitPermission', () => {
    it('should return true when role has explicit permission', () => {
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'Test Role',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: ['permission1', 'permission2'],
        organisationId: mockOrganisationId('org1'),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(hasExplicitPermission(role, 'permission1')).toBe(true);
    });

    it('should return false when role does not have permission', () => {
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'Test Role',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: ['permission1'],
        organisationId: mockOrganisationId('org1'),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(hasExplicitPermission(role, 'permission2')).toBe(false);
    });

    it('should return false for inactive role', () => {
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'Test Role',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: ['permission1'],
        organisationId: mockOrganisationId('org1'),
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(hasExplicitPermission(role, 'permission1')).toBe(false);
    });
  });

  describe('hasSystemDefaultPermission', () => {
    it('should return true when role has system default permission', () => {
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'Admin',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: [],
        organisationId: mockOrganisationId('org1'),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const systemPermission: SystemPermission = {
        id: 'permission1',
        group: 'test',
        description: 'Test permission',
        defaultRoles: ['Admin'],
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(hasSystemDefaultPermission(role, systemPermission)).toBe(true);
    });

    it('should return false when role does not have system default permission', () => {
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'User',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: [],
        organisationId: mockOrganisationId('org1'),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const systemPermission: SystemPermission = {
        id: 'permission1',
        group: 'test',
        description: 'Test permission',
        defaultRoles: ['Admin'],
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(hasSystemDefaultPermission(role, systemPermission)).toBe(false);
    });
  });

  describe('isValidPermissionId', () => {
    it('should return true for valid permission IDs', () => {
      expect(isValidPermissionId('module.view')).toBe(true);
      expect(isValidPermissionId('user.manage.create')).toBe(true);
      expect(isValidPermissionId('org.settings.update')).toBe(true);
    });

    it('should return false for invalid permission IDs', () => {
      expect(isValidPermissionId('invalid')).toBe(false);
      expect(isValidPermissionId('module')).toBe(false);
      expect(isValidPermissionId('123.invalid')).toBe(false);
      expect(isValidPermissionId('module.123')).toBe(false);
    });
  });

  describe('canPerformCrossOrgOperations', () => {
    it('should return true for system users', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
      };
      expect(canPerformCrossOrgOperations(context)).toBe(true);
    });

    it('should return false for non-system users', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF' },
      };
      expect(canPerformCrossOrgOperations(context)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has any of the target roles', () => {
      expect(hasAnyRole(['admin', 'user'], ['admin', 'manager'])).toBe(true);
    });

    it('should return false when user has none of the target roles', () => {
      expect(hasAnyRole(['user'], ['admin', 'manager'])).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true when user has all target roles', () => {
      expect(hasAllRoles(['admin', 'user', 'manager'], ['admin', 'user'])).toBe(true);
    });

    it('should return false when user is missing any target role', () => {
      expect(hasAllRoles(['admin', 'user'], ['admin', 'manager'])).toBe(false);
    });
  });

  describe('isDefaultRole', () => {
    it('should return true for default role names', () => {
      expect(isDefaultRole('Admin')).toBe(true);
      expect(isDefaultRole('Manager')).toBe(true);
      expect(isDefaultRole('Lecturer')).toBe(true);
      expect(isDefaultRole('Viewer')).toBe(true);
    });

    it('should return false for non-default role names', () => {
      expect(isDefaultRole('CustomRole')).toBe(false);
      expect(isDefaultRole('User')).toBe(false);
    });
  });

  describe('isActiveRole', () => {
    it('should return true for active role', () => {
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'Test Role',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: [],
        organisationId: mockOrganisationId('org1'),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(isActiveRole(role)).toBe(true);
    });

    it('should return false for inactive role', () => {
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'Test Role',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: [],
        organisationId: mockOrganisationId('org1'),
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(isActiveRole(role)).toBe(false);
    });
  });

  describe('isActivePermission', () => {
    it('should return true for active permission', () => {
      const permission: SystemPermission = {
        id: 'permission1',
        group: 'test',
        description: 'Test permission',
        defaultRoles: ['Admin'],
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(isActivePermission(permission)).toBe(true);
    });

    it('should return false for inactive permission', () => {
      const permission: SystemPermission = {
        id: 'permission1',
        group: 'test',
        description: 'Test permission',
        defaultRoles: ['Admin'],
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(isActivePermission(permission)).toBe(false);
    });
  });
});
