import { query } from '../_generated/server';
import { v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import { getAuthContext } from '../lib/auth';

/**
 * Check if a user has a specific permission
 */
export const hasPermissionQuery = query({
  args: {
    userId: v.string(),
    permissionId: v.string(),
  },
  handler: async (ctx, { userId, permissionId }) => {
    // Get user details
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', userId))
      .first();

    if (!user) {
      return false;
    }

    // System roles bypass all permission checks
    if (user.systemRoles && user.systemRoles.length > 0) {
      const systemRoles = ['admin', 'sysadmin', 'developer'];
      if (user.systemRoles.some((role) => systemRoles.includes(role))) {
        return true;
      }
    }

    // Get user's active role assignments (support multiple)
    const roleAssignments = await ctx.db
      .query('user_role_assignments')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', userId).eq('organisationId', user.organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    if (!roleAssignments || roleAssignments.length === 0) return false;

    const roles = (
      await Promise.all(roleAssignments.map((a) => ctx.db.get(a.roleId)))
    ).filter((r): r is Doc<'user_roles'> => Boolean(r));
    if (roles.length === 0) return false;

    // Check explicit permission across any role
    if (
      roles.some(
        (r) =>
          r.isActive &&
          Array.isArray(r.permissions) &&
          r.permissions.includes(permissionId)
      )
    )
      return true;

    // Check system defaults for this permission
    const systemPermission = await ctx.db
      .query('system_permissions')
      .withIndex('by_permission_id', (q) => q.eq('id', permissionId))
      .first();

    if (!systemPermission || !systemPermission.isActive) {
      return false;
    }

    // Check defaults across any role
    return roles.some((r) => systemPermission.defaultRoles.includes(r.name));
  },
});

/**
 * Get the current user's organisation role
 */
export const getCurrentUserOrgRole = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', userId))
      .first();

    if (!user) {
      return null;
    }

    const roleAssignment = await ctx.db
      .query('user_role_assignments')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', userId).eq('organisationId', user.organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .first();

    if (!roleAssignment) {
      return null;
    }

    return await ctx.db.get(roleAssignment.roleId);
  },
});

/**
 * Get all permissions for a specific role
 */
export const getOrganisationPermissions = query({
  args: {
    roleId: v.id('user_roles'), // Using existing user_roles table for now
  },
  handler: async (ctx, { roleId }) => {
    const role = await ctx.db.get(roleId);
    if (!role) {
      return [];
    }

    // Get all system permissions
    const systemPermissions = await ctx.db
      .query('system_permissions')
      .collect();

    // Build permission map
    interface PermissionMapEntry {
      id: string;
      description: string;
      group: string;
      isActive: boolean;
      defaultRoles: string[];
      isGranted: boolean;
      isOverride: boolean;
      source: string;
    }
    const permissionMap = new Map<string, PermissionMapEntry>();

    // Start with system defaults
    for (const perm of systemPermissions) {
      if (perm.isActive && perm.defaultRoles.includes(role.name)) {
        permissionMap.set(perm.id, {
          ...perm,
          isGranted: true,
          isOverride: false,
          source: 'system_default',
        });
      }
    }

    // Add explicit role permissions
    for (const permissionId of role.permissions) {
      const systemPerm = systemPermissions.find((p) => p.id === permissionId);
      if (systemPerm) {
        permissionMap.set(permissionId, {
          ...systemPerm,
          isGranted: true,
          isOverride: true,
          source: 'custom',
        });
      }
    }

    return Array.from(permissionMap.values());
  },
});

/**
 * Compute effective permissions for a user within an organisation.
 * Combines system defaults for their roles and role-specific overrides.
 */
export const getUserEffectivePermissions = query({
  args: {
    userId: v.string(),
    organisationId: v.id('organisations'),
  },
  handler: async (ctx, { userId, organisationId }) => {
    const assignments = await ctx.db
      .query('user_role_assignments')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', userId).eq('organisationId', organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
    if (assignments.length === 0)
      return [] as Array<{
        id: string;
        source: string;
        description: string;
        group: string;
      }>;

    const roles = (
      await Promise.all(assignments.map((a) => ctx.db.get(a.roleId)))
    ).filter((r): r is Doc<'user_roles'> => Boolean(r && r.isActive));

    const systemPermissions = await ctx.db
      .query('system_permissions')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const map = new Map<
      string,
      { id: string; source: string; description: string; group: string }
    >();

    for (const role of roles) {
      // defaults
      for (const sp of systemPermissions) {
        if (sp.defaultRoles.includes(role.name)) {
          map.set(sp.id, {
            id: sp.id,
            source: 'system_default',
            description: sp.description,
            group: sp.group,
          });
        }
      }
      // explicit
      for (const pid of role.permissions) {
        const sp = systemPermissions.find((p) => p.id === pid);
        if (sp) {
          map.set(pid, {
            id: pid,
            source: 'custom',
            description: sp.description,
            group: sp.group,
          });
        }
      }
    }

    return Array.from(map.values());
  },
});

/**
 * Get all roles for an organisation
 */
export const getOrganisationRoles = query({
  args: { userId: v.string(), organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);

    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) throw new Error('User not found');

    return await ctx.db
      .query('user_roles')
      .filter((q) =>
        q.and(
          q.eq(q.field('organisationId'), actor.organisationId),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect();
  },
});

/**
 * Get all system permissions (for admin UI)
 */
export const getSystemPermissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('system_permissions')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});

/**
 * Get all system permissions grouped by group
 */
export const getSystemPermissionsGrouped = query({
  args: {},
  handler: async (ctx) => {
    const permissions = await ctx.db
      .query('system_permissions')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Group by permission group
    const grouped = permissions.reduce(
      (acc, permission) => {
        const key = permission.group;
        if (!acc[key]) {
          acc[key] = [] as typeof permissions;
        }
        acc[key].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>
    );

    return grouped;
  },
});

/**
 * System Role Templates
 * Used to define default role names used when seeding new organisations
 */
export const listSystemRoleTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query('system_role_templates')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
    return templates;
  },
});

/**
 * List staged organisation role permission changes for an organisation
 */
export const getStagedForOrganisation = query({
  args: { organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('organisation_role_permissions')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', args.organisationId)
      )
      .filter((q) => q.eq(q.field('staged'), true))
      .collect();
    return rows;
  },
});

/**
 * Check permission usage before deletion
 */
export const checkPermissionUsage = query({
  args: {
    permissionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if permission is used in any user roles
    const userRoles = await ctx.db.query('user_roles').collect();
    const usedInUserRoles = userRoles.filter((role) =>
      role.permissions.includes(args.permissionId)
    );

    // Check if permission is used in organisation role permissions
    const orgRolePermissions = await ctx.db
      .query('organisation_role_permissions')
      .filter((q) => q.eq(q.field('permissionId'), args.permissionId))
      .collect();

    return {
      canDelete:
        usedInUserRoles.length === 0 && orgRolePermissions.length === 0,
      userRolesCount: usedInUserRoles.length,
      userRoleNames: usedInUserRoles.map((role) => role.name),
      orgRolePermissionsCount: orgRolePermissions.length,
      usageDetails: {
        userRoles: usedInUserRoles.map((role) => ({
          id: role._id,
          name: role.name,
          organisationId: role.organisationId,
        })),
        orgRolePermissions: orgRolePermissions.length,
      },
    };
  },
});

/**
 * Debug function to check what organizations and roles exist
 */
export const debugOrganisationsAndRoles = query({
  args: {},
  handler: async (ctx) => {
    const organisations = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const result = [];
    for (const org of organisations) {
      const roles = await ctx.db
        .query('user_roles')
        .filter((q) =>
          q.and(
            q.eq(q.field('organisationId'), org._id),
            q.eq(q.field('isActive'), true)
          )
        )
        .collect();

      result.push({
        org: {
          name: org.name,
          code: org.code,
          id: org._id,
        },
        roles: roles.map((role) => ({
          name: role.name,
          id: role._id,
          permissions: role.permissions,
        })),
      });
    }

    return result;
  },
});
