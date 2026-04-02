import { describe, it, expect } from 'vitest';
import {
  assertHasPermission,
  assertCanPerformAction,
  requirePermission,
  requireOrgPermission,
} from '../guards';
import type { PermissionContext, UserRole, SystemPermission } from '../types';
import {
  mockOrganisationId,
  mockRoleId,
} from '../../../src/test/utils/convexPermissionTestUtils';

describe('guards', () => {
  describe('assertHasPermission', () => {
    it('should not throw for valid permission', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
      };
      const role: UserRole = {
        _id: mockRoleId('role1'),
        name: 'Test Role',
        description: 'Test',
        isDefault: false,
        isSystem: false,
        permissions: ['module.view'],
        organisationId: mockOrganisationId('org1'),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const systemPermission: SystemPermission = {
        id: 'module.view',
        group: 'modules',
        description: 'View modules',
        defaultRoles: ['Admin'],
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(() =>
        assertHasPermission(context, 'module.view', [role], systemPermission)
      ).not.toThrow();
    });

    it('should throw for invalid permission', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STUDENT' },
      };
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
      const systemPermission: SystemPermission = {
        id: 'module.view',
        group: 'modules',
        description: 'View modules',
        defaultRoles: ['Admin'],
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(() =>
        assertHasPermission(context, 'module.view', [role], systemPermission)
      ).toThrow();
    });
  });

  describe('assertCanPerformAction', () => {
    it('should not throw for system users', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(() =>
        assertCanPerformAction(context, 'Module', 'READ')
      ).not.toThrow();
    });

    it('should throw for insufficient permissions', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STUDENT' },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(() =>
        assertCanPerformAction(context, 'Module', 'DELETE')
      ).toThrow();
    });
  });

  describe('requirePermission', () => {
    it('should be a function', () => {
      expect(typeof requirePermission).toBe('function');
    });
  });

  describe('requireOrgPermission', () => {
    it('should be a function', () => {
      expect(typeof requireOrgPermission).toBe('function');
    });
  });
});
