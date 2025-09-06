import { describe, it, expect } from 'vitest';
import {
  canPerformAction,
  canAccessResource,
  canModifyResource,
  canDeleteResource,
  canCreateResourcesInOrganisation,
  canViewResourcesInOrganisation,
  policies,
} from '../rules';
import type { PermissionContext } from '../types';
import { mockOrganisationId } from './testUtils';

describe('rules', () => {
  describe('canPerformAction', () => {
    it('should allow system users to perform any action', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(canPerformAction(context, 'Module', 'READ')).toBe(true);
      expect(canPerformAction(context, 'Module', 'CREATE')).toBe(true);
      expect(canPerformAction(context, 'Module', 'UPDATE')).toBe(true);
      expect(canPerformAction(context, 'Module', 'DELETE')).toBe(true);
    });

    it('should allow org admins to perform actions within their organisation', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'ORG_ADMIN',
          orgId: mockOrganisationId('org1'),
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canPerformAction(context, 'Module', 'READ')).toBe(true);
      expect(canPerformAction(context, 'Module', 'CREATE')).toBe(true);
      expect(canPerformAction(context, 'Module', 'UPDATE')).toBe(true);
      expect(canPerformAction(context, 'Module', 'DELETE')).toBe(true);
    });

    it('should allow org admins to perform actions on any resource', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'ORG_ADMIN',
          orgId: mockOrganisationId('org1'),
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: mockOrganisationId('org2'),
        },
      };
      expect(canPerformAction(context, 'Module', 'READ')).toBe(true);
    });
  });

  describe('canAccessResource', () => {
    it('should allow access to resources within organisation', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'STAFF',
          orgId: mockOrganisationId('org1'),
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canAccessResource(context)).toBe(true);
    });

    it('should deny access to resources outside organisation', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'STAFF',
          orgId: mockOrganisationId('org1'),
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: mockOrganisationId('org2'),
        },
      };
      expect(canAccessResource(context)).toBe(false);
    });
  });

  describe('canModifyResource', () => {
    it('should allow modification by resource owner', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF' },
        resource: { id: 'res1', type: 'Module', ownerId: 'user1' },
      };
      expect(canModifyResource(context)).toBe(true);
    });

    it('should allow modification by org admin', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'ORG_ADMIN',
          orgId: mockOrganisationId('org1'),
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canModifyResource(context)).toBe(true);
    });

    it('should deny modification by non-owner in different org', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'STAFF',
          orgId: mockOrganisationId('org1'),
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: mockOrganisationId('org2'),
        },
      };
      expect(canModifyResource(context)).toBe(false);
    });
  });

  describe('canDeleteResource', () => {
    it('should allow deletion by system users', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'SYSTEM', systemRoles: ['admin'] },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(canDeleteResource(context, 'Module')).toBe(true);
    });

    it('should allow deletion by org admin', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'ORG_ADMIN',
          orgId: mockOrganisationId('org1'),
        },
        resource: {
          id: 'res1',
          type: 'Module',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canDeleteResource(context, 'Module')).toBe(true);
    });

    it('should deny deletion by staff', () => {
      const context: PermissionContext = {
        actor: { id: 'user1', role: 'STAFF' },
        resource: { id: 'res1', type: 'Module' },
      };
      expect(canDeleteResource(context, 'Module')).toBe(false);
    });
  });

  describe('canCreateResourcesInOrganisation', () => {
    it('should allow creation by org admin', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'ORG_ADMIN',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canCreateResourcesInOrganisation(context, 'org1')).toBe(true);
    });

    it('should deny creation in different organisation', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'ORG_ADMIN',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canCreateResourcesInOrganisation(context, 'org2')).toBe(false);
    });
  });

  describe('canViewResourcesInOrganisation', () => {
    it('should allow viewing by org members', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'STAFF',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canViewResourcesInOrganisation(context, 'org1')).toBe(true);
    });

    it('should deny viewing in different organisation', () => {
      const context: PermissionContext = {
        actor: {
          id: 'user1',
          role: 'STAFF',
          orgId: mockOrganisationId('org1'),
        },
      };
      expect(canViewResourcesInOrganisation(context, 'org2')).toBe(false);
    });
  });

  describe('policies', () => {
    it('should have all required policy functions', () => {
      expect(policies.user).toBeDefined();
      expect(policies.module).toBeDefined();
      expect(policies.course).toBeDefined();
      expect(policies.group).toBeDefined();
      expect(policies.allocation).toBeDefined();
      expect(policies.report).toBeDefined();
      expect(policies.academicYear).toBeDefined();
      expect(policies.organisation).toBeDefined();
    });
  });
});
