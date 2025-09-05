import {
  mutation,
  type MutationCtx,
} from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { writeAudit } from '../audit';
import { PLANNING_MVP_PERMISSIONS, ACADEMIC_YEAR_PERMISSIONS } from './constants';

/**
 * Seed default roles and permissions for a new organisation
 */
export const seedDefaultOrgRolesAndPermissions = mutation({
  args: {
    organisationId: v.id('organisations'),
  },
  handler: async (ctx, { organisationId }) => {
    const now = Date.now();

    // Create default roles
    const defaultRoles = [
      {
        name: 'Admin',
        description: 'Full administrative access',
        isDefault: true,
      },
      {
        name: 'Manager',
        description: 'Management level access',
        isDefault: true,
      },
      {
        name: 'Lecturer',
        description: 'Standard lecturer access',
        isDefault: true,
      },
      {
        name: 'Viewer',
        description: 'Read-only access',
        isDefault: true,
      },
    ];

    const createdRoles = [];
    for (const roleData of defaultRoles) {
      const roleId = await ctx.db.insert('organisation_roles', {
        ...roleData,
        organisationId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      createdRoles.push({ ...roleData, id: roleId });
    }

    // Get all active system permissions
    const systemPermissions = await ctx.db
      .query('system_permissions')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Assign permissions based on role defaults
    for (const role of createdRoles) {
      for (const perm of systemPermissions) {
        if (perm.defaultRoles.includes(role.name)) {
          await ctx.db.insert('organisation_role_permissions', {
            organisationId,
            roleId: role.id as unknown as Id<'user_roles'>,
            permissionId: perm.id,
            isGranted: true,
            isOverride: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return {
      rolesCreated: createdRoles.length,
      permissionsAssigned: systemPermissions.length,
    };
  },
});

/**
 * Upsert system role template
 */
export const upsertSystemRoleTemplate = mutation({
  args: {
    id: v.optional(v.id('system_role_templates')),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name,
        description: args.description || '',
        isActive: args.isActive ?? true,
        updatedAt: now,
      });
      if (args.performedBy) {
        await writeAudit(ctx as MutationCtx, {
          action: 'update',
          entityType: 'system_role_template',
          entityId: String(args.id),
          entityName: args.name,
          performedBy: args.performedBy,
          ...(args.performedByName
            ? { performedByName: args.performedByName }
            : {}),
          details: `System role template updated: ${args.name}`,
          severity: 'info',
        });
      }
      return args.id;
    }

    // Ensure name uniqueness (case-sensitive)
    const existing = await ctx.db
      .query('system_role_templates')
      .filter((q) => q.eq(q.field('name'), args.name))
      .first();
    if (existing) {
      // If an inactive template exists with same name, revive it; else update description
      await ctx.db.patch(existing._id, {
        description: args.description || existing.description || '',
        isActive: true,
        updatedAt: now,
      });
      if (args.performedBy) {
        await writeAudit(ctx as MutationCtx, {
          action: 'update',
          entityType: 'system_role_template',
          entityId: String(existing._id),
          entityName: args.name,
          performedBy: args.performedBy,
          ...(args.performedByName
            ? { performedByName: args.performedByName }
            : {}),
          details: `System role template revived/updated: ${args.name}`,
          severity: 'info',
        });
      }
      return existing._id as Id<'system_role_templates'>;
    }

    const newId = await ctx.db.insert('system_role_templates', {
      name: args.name,
      description: args.description || '',
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
    if (args.performedBy) {
      await writeAudit(ctx as MutationCtx, {
        action: 'create',
        entityType: 'system_role_template',
        entityId: String(newId),
        entityName: args.name,
        performedBy: args.performedBy,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        details: `System role template created: ${args.name}`,
        severity: 'info',
      });
    }
    return newId as Id<'system_role_templates'>;
  },
});

/**
 * Delete system role template
 */
export const deleteSystemRoleTemplate = mutation({
  args: {
    id: v.id('system_role_templates'),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tpl = await ctx.db.get(args.id);
    if (!tpl) throw new Error('Template not found');
    const now = Date.now();
    await ctx.db.patch(args.id, { isActive: false, updatedAt: now });
    if (args.performedBy) {
      await writeAudit(ctx as MutationCtx, {
        action: 'delete',
        entityType: 'system_role_template',
        entityId: String(args.id),
        entityName: tpl.name,
        performedBy: args.performedBy,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        details: `System role template deleted: ${tpl.name}`,
        severity: 'warning',
      });
    }
    return args.id;
  },
});

/**
 * Import or upsert system permissions from a JSON payload
 */
export const importSystemPermissions = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.string(),
        group: v.string(),
        description: v.string(),
        defaultRoles: v.array(v.string()),
      })
    ),
    upsert: v.optional(v.boolean()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Deduplicate by id (last wins)
    const map = new Map<
      string,
      { id: string; group: string; description: string; defaultRoles: string[] }
    >();
    for (const item of args.items) {
      map.set(item.id, item);
    }

    for (const item of map.values()) {
      // Validate pattern: at least two segments separated by dots (e.g. group.action or group.subgroup.action)
      // Each segment must start with a letter and then any word chars
      const validId = /^[A-Za-z]\w*(?:\.[A-Za-z]\w*)+$/.test(item.id);
      if (!validId) {
        skipped++;
        continue;
      }

      const existing = await ctx.db
        .query('system_permissions')
        .withIndex('by_permission_id', (q) => q.eq('id', item.id))
        .first();

      if (!existing) {
        await ctx.db.insert('system_permissions', {
          id: item.id,
          group: item.group,
          description: item.description,
          defaultRoles: item.defaultRoles,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created++;
        if (args.performedBy) {
          await writeAudit(ctx as MutationCtx, {
            action: 'create',
            entityType: 'permission',
            entityId: item.id,
            entityName: item.id,
            performedBy: args.performedBy,
            ...(args.performedByName
              ? { performedByName: args.performedByName }
              : {}),
            details: `Permission imported: ${item.id}`,
            metadata: JSON.stringify(item),
            severity: 'info',
          });
        }
        continue;
      }

      if (args.upsert) {
        const oldValues = {
          group: existing.group,
          description: existing.description,
          defaultRoles: existing.defaultRoles,
        };
        await ctx.db.patch(existing._id, {
          group: item.group,
          description: item.description,
          defaultRoles: item.defaultRoles,
          isActive: true,
          updatedAt: now,
        });
        updated++;
        if (args.performedBy) {
          await writeAudit(ctx as MutationCtx, {
            action: 'update',
            entityType: 'permission',
            entityId: existing.id,
            entityName: existing.id,
            performedBy: args.performedBy,
            ...(args.performedByName
              ? { performedByName: args.performedByName }
              : {}),
            details: `Permission upserted via import: ${existing.id}`,
            metadata: JSON.stringify({ oldValues, newValues: item }),
            severity: 'info',
          });
        }
      } else {
        skipped++;
      }
    }

    return { total: args.items.length, created, updated, skipped };
  },
});

/**
 * Seed planning MVP permissions for courses/modules/iterations/groups/allocations.
 */
export const seedPlanningMvpPermissions = mutation({
  args: {
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Call the import function directly
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Deduplicate by id (last wins)
    const map = new Map<
      string,
      { id: string; group: string; description: string; defaultRoles: string[] }
    >();
    for (const item of PLANNING_MVP_PERMISSIONS) {
      map.set(item.id, {
        id: item.id,
        group: item.group,
        description: item.description,
        defaultRoles: [...item.defaultRoles], // Convert readonly array to mutable
      });
    }

    for (const item of map.values()) {
      // Validate pattern: at least two segments separated by dots (e.g. group.action or group.subgroup.action)
      // Each segment must start with a letter and then any word chars
      const validId = /^[A-Za-z]\w*(?:\.[A-Za-z]\w*)+$/.test(item.id);
      if (!validId) {
        skipped++;
        continue;
      }

      const existing = await ctx.db
        .query('system_permissions')
        .withIndex('by_permission_id', (q) => q.eq('id', item.id))
        .first();

      if (!existing) {
        await ctx.db.insert('system_permissions', {
          id: item.id,
          group: item.group,
          description: item.description,
          defaultRoles: item.defaultRoles,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created++;
        if (args.performedBy) {
          await writeAudit(ctx as MutationCtx, {
            action: 'create',
            entityType: 'permission',
            entityId: item.id,
            entityName: item.id,
            performedBy: args.performedBy,
            ...(args.performedByName
              ? { performedByName: args.performedByName }
              : {}),
            details: `Permission imported: ${item.id}`,
            metadata: JSON.stringify(item),
            severity: 'info',
          });
        }
        continue;
      }

      // Always upsert for planning MVP permissions
      const oldValues = {
        group: existing.group,
        description: existing.description,
        defaultRoles: existing.defaultRoles,
      };
      await ctx.db.patch(existing._id, {
        group: item.group,
        description: item.description,
        defaultRoles: item.defaultRoles,
        isActive: true,
        updatedAt: now,
      });
      updated++;
      if (args.performedBy) {
        await writeAudit(ctx as MutationCtx, {
          action: 'update',
          entityType: 'permission',
          entityId: existing.id,
          entityName: existing.id,
          performedBy: args.performedBy,
          ...(args.performedByName
            ? { performedByName: args.performedByName }
            : {}),
          details: `Permission upserted via import: ${existing.id}`,
          metadata: JSON.stringify({ oldValues, newValues: item }),
          severity: 'info',
        });
      }
    }

    return { total: PLANNING_MVP_PERMISSIONS.length, created, updated, skipped };
  },
});

/**
 * Create a new system permission
 */
export const createSystemPermission = mutation({
  args: {
    id: v.string(),
    group: v.string(),
    description: v.string(),
    defaultRoles: v.array(v.string()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if permission already exists
    const existing = await ctx.db
      .query('system_permissions')
      .withIndex('by_permission_id', (q) => q.eq('id', args.id))
      .first();

    if (existing) {
      throw new Error('Permission with this ID already exists');
    }

    const permissionId = await ctx.db.insert('system_permissions', {
      id: args.id,
      group: args.group,
      description: args.description,
      defaultRoles: args.defaultRoles,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Log audit event
    if (args.performedBy) {
      await writeAudit(ctx as MutationCtx, {
        action: 'create',
        entityType: 'permission',
        entityId: args.id,
        entityName: args.id,
        performedBy: args.performedBy,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        details: `System permission "${args.id}" created with default roles: ${args.defaultRoles.join(', ')}`,
        metadata: JSON.stringify({
          group: args.group,
          description: args.description,
          defaultRoles: args.defaultRoles,
        }),
        severity: 'info',
      });
    }

    return permissionId;
  },
});

/**
 * Update a system permission
 */
export const updateSystemPermission = mutation({
  args: {
    permissionId: v.id('system_permissions'),
    group: v.string(),
    description: v.string(),
    defaultRoles: v.array(v.string()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    const now = Date.now();
    const oldValues = {
      group: permission.group,
      description: permission.description,
      defaultRoles: permission.defaultRoles,
    };

    await ctx.db.patch(args.permissionId, {
      group: args.group,
      description: args.description,
      defaultRoles: args.defaultRoles,
      updatedAt: now,
    });

    // Log audit event
    if (args.performedBy) {
      const changes = [];
      if (oldValues.group !== args.group)
        changes.push(`group: ${oldValues.group} → ${args.group}`);
      if (oldValues.description !== args.description)
        changes.push(
          `description: ${oldValues.description} → ${args.description}`
        );
      if (
        JSON.stringify(oldValues.defaultRoles) !==
        JSON.stringify(args.defaultRoles)
      ) {
        changes.push(
          `defaultRoles: [${oldValues.defaultRoles.join(', ')}] → [${args.defaultRoles.join(', ')}]`
        );
      }

      await writeAudit(ctx as MutationCtx, {
        action: 'update',
        entityType: 'permission',
        entityId: permission.id,
        entityName: permission.id,
        performedBy: args.performedBy,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        details: `System permission "${permission.id}" updated: ${changes.join(', ')}`,
        metadata: JSON.stringify({
          oldValues,
          newValues: {
            group: args.group,
            description: args.description,
            defaultRoles: args.defaultRoles,
          },
        }),
        severity: 'info',
      });
    }

    return args.permissionId;
  },
});

/**
 * Delete a system permission
 */
export const deleteSystemPermission = mutation({
  args: {
    permissionId: v.id('system_permissions'),
    forceDelete: v.optional(v.boolean()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    const now = Date.now();
    let removedFromRoles = 0;
    let removedFromOrgRoles = 0;

    if (args.forceDelete) {
      // Force delete: Remove permission from all roles first

      // Remove from user_roles
      const userRoles = await ctx.db.query('user_roles').collect();
      const rolesWithPermission = userRoles.filter((role) =>
        role.permissions.includes(permission.id)
      );

      for (const role of rolesWithPermission) {
        const updatedPermissions = role.permissions.filter(
          (p) => p !== permission.id
        );
        await ctx.db.patch(role._id, {
          permissions: updatedPermissions,
          updatedAt: now,
        });
        removedFromRoles++;

        // Log permission revocation
        if (args.performedBy) {
          await writeAudit(ctx, {
            action: 'permission.revoked',
            entityType: 'permission',
            entityId: permission.id,
            entityName: permission.id,
            performedBy: args.performedBy,
            ...(args.performedByName
              ? { performedByName: args.performedByName }
              : {}),
            organisationId: role.organisationId,
            details: `Permission "${permission.id}" revoked from role "${role.name}" during force delete`,
            metadata: JSON.stringify({
              roleId: role._id,
              roleName: role.name,
              organisationId: role.organisationId,
              viaForceDelete: true,
            }),
            severity: 'warning',
          });
        }
      }

      // Remove from organisation_role_permissions
      const orgRolePermissions = await ctx.db
        .query('organisation_role_permissions')
        .filter((q) => q.eq(q.field('permissionId'), permission.id))
        .collect();

      for (const orgRolePerm of orgRolePermissions) {
        await ctx.db.delete(orgRolePerm._id);
        removedFromOrgRoles++;

        // Log permission revocation
        if (args.performedBy) {
          await writeAudit(ctx, {
            action: 'permission.revoked',
            entityType: 'permission',
            entityId: permission.id,
            entityName: permission.id,
            performedBy: args.performedBy,
            ...(args.performedByName
              ? { performedByName: args.performedByName }
              : {}),
            organisationId: orgRolePerm.organisationId,
            details: `Permission "${permission.id}" revoked from organisation role assignment during force delete`,
            metadata: JSON.stringify({
              orgRolePermissionId: orgRolePerm._id,
              organisationId: orgRolePerm.organisationId,
              viaForceDelete: true,
            }),
            severity: 'warning',
          });
        }
      }
    } else {
      // Normal delete: Check for usage and block if found

      // Check if permission is used in any user roles
      const userRoles = await ctx.db.query('user_roles').collect();
      const usedInUserRoles = userRoles.filter((role) =>
        role.permissions.includes(permission.id)
      );

      if (usedInUserRoles.length > 0) {
        const roleNames = usedInUserRoles
          .map((role) => `${role.name}`)
          .join(', ');
        throw new Error(
          `Cannot delete permission "${permission.id}". It is currently assigned to ${usedInUserRoles.length} role(s): ${roleNames}. Use Force Delete to automatically remove it from all roles.`
        );
      }

      // Check if permission is used in organisation role permissions
      const orgRolePermissions = await ctx.db
        .query('organisation_role_permissions')
        .filter((q) => q.eq(q.field('permissionId'), permission.id))
        .collect();

      if (orgRolePermissions.length > 0) {
        throw new Error(
          `Cannot delete permission "${permission.id}". It is currently assigned to ${orgRolePermissions.length} organisation role(s). Use Force Delete to automatically remove it from all roles.`
        );
      }
    }

    // Safe to delete - mark as inactive
    await ctx.db.patch(args.permissionId, {
      isActive: false,
      updatedAt: now,
    });

    // Log audit event
    if (args.performedBy) {
      await writeAudit(ctx as MutationCtx, {
        action: 'delete',
        entityType: 'permission',
        entityId: permission.id,
        entityName: permission.id,
        performedBy: args.performedBy,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        details: args.forceDelete
          ? `System permission "${permission.id}" force deleted. Removed from ${removedFromRoles} user role(s) and ${removedFromOrgRoles} organisation role assignment(s).`
          : `System permission "${permission.id}" deleted.`,
        metadata: JSON.stringify({
          forceDelete: !!args.forceDelete,
          removedFromRoles,
          removedFromOrgRoles,
          group: permission.group,
          description: permission.description,
        }),
        severity: 'warning',
      });
    }

    return {
      permissionId: args.permissionId,
      deletedPermission: permission.id,
      message: args.forceDelete
        ? `Permission "${permission.id}" has been force deleted. Removed from ${removedFromRoles} user role(s) and ${removedFromOrgRoles} organisation role assignment(s).`
        : `Permission "${permission.id}" has been successfully deleted.`,
      removedFromRoles,
      removedFromOrgRoles,
      wasForceDeleted: !!args.forceDelete,
    };
  },
});

/**
 * Seed core academic year permissions
 */
export const seedAcademicYearPermissions = mutation({
  args: {
    upsert: v.optional(v.boolean()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Call the import function directly
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Deduplicate by id (last wins)
    const map = new Map<
      string,
      { id: string; group: string; description: string; defaultRoles: string[] }
    >();
    for (const item of ACADEMIC_YEAR_PERMISSIONS) {
      map.set(item.id, {
        id: item.id,
        group: item.group,
        description: item.description,
        defaultRoles: [...item.defaultRoles], // Convert readonly array to mutable
      });
    }

    for (const item of map.values()) {
      // Validate pattern: at least two segments separated by dots (e.g. group.action or group.subgroup.action)
      // Each segment must start with a letter and then any word chars
      const validId = /^[A-Za-z]\w*(?:\.[A-Za-z]\w*)+$/.test(item.id);
      if (!validId) {
        skipped++;
        continue;
      }

      const existing = await ctx.db
        .query('system_permissions')
        .withIndex('by_permission_id', (q) => q.eq('id', item.id))
        .first();

      if (!existing) {
        await ctx.db.insert('system_permissions', {
          id: item.id,
          group: item.group,
          description: item.description,
          defaultRoles: item.defaultRoles,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created++;
        if (args.performedBy) {
          await writeAudit(ctx as MutationCtx, {
            action: 'create',
            entityType: 'permission',
            entityId: item.id,
            entityName: item.id,
            performedBy: args.performedBy,
            ...(args.performedByName
              ? { performedByName: args.performedByName }
              : {}),
            details: `Permission imported: ${item.id}`,
            metadata: JSON.stringify(item),
            severity: 'info',
          });
        }
        continue;
      }

      if (args.upsert ?? true) {
        const oldValues = {
          group: existing.group,
          description: existing.description,
          defaultRoles: existing.defaultRoles,
        };
        await ctx.db.patch(existing._id, {
          group: item.group,
          description: item.description,
          defaultRoles: item.defaultRoles,
          isActive: true,
          updatedAt: now,
        });
        updated++;
        if (args.performedBy) {
          await writeAudit(ctx as MutationCtx, {
            action: 'update',
            entityType: 'permission',
            entityId: existing.id,
            entityName: existing.id,
            performedBy: args.performedBy,
            ...(args.performedByName
              ? { performedByName: args.performedByName }
              : {}),
            details: `Permission upserted via import: ${existing.id}`,
            metadata: JSON.stringify({ oldValues, newValues: item }),
            severity: 'info',
          });
        }
      } else {
        skipped++;
      }
    }

    return { total: ACADEMIC_YEAR_PERMISSIONS.length, created, updated, skipped };
  },
});

/**
 * Push new permissions to all organisations
 * This creates default role assignments for newly added permissions
 */
export const pushPermissionsToOrganisations = mutation({
  args: {
    permissionId: v.string(),
    forceApply: v.optional(v.boolean()), // if true, apply immediately; else stage
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the permission
    const permission = await ctx.db
      .query('system_permissions')
      .withIndex('by_permission_id', (q) => q.eq('id', args.permissionId))
      .first();

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Get all active organisations
    const organisations = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    let assignmentsCreated = 0;
    let totalRolesChecked = 0;
    let matchingRoles = 0;

    for (const org of organisations) {
      // Get user_roles for this organisation
      const roles = await ctx.db
        .query('user_roles')
        .filter((q) =>
          q.and(
            q.eq(q.field('organisationId'), org._id),
            q.eq(q.field('isActive'), true)
          )
        )
        .collect();

      totalRolesChecked += roles.length;

      // Add permission to roles that match defaultRoles
      for (const role of roles) {
        if (permission.defaultRoles.includes(role.name)) {
          matchingRoles++;
          // If forceApply, write to user_roles immediately; else stage into organisation_role_permissions
          if (args.forceApply) {
            if (!role.permissions.includes(permission.id)) {
              const updatedPermissions = [...role.permissions, permission.id];
              await ctx.db.patch(role._id, {
                permissions: updatedPermissions,
                updatedAt: now,
              });
              assignmentsCreated++;
            }
          } else {
            // Stage if not already present in role and not already staged
            if (!role.permissions.includes(permission.id)) {
              const existingStage = await ctx.db
                .query('organisation_role_permissions')
                .filter((q) =>
                  q.and(
                    q.eq(q.field('organisationId'), org._id),
                    q.eq(q.field('roleId'), role._id),
                    q.eq(q.field('permissionId'), permission.id)
                  )
                )
                .first();
              if (!existingStage) {
                await ctx.db.insert('organisation_role_permissions', {
                  organisationId: org._id,
                  roleId: role._id,
                  permissionId: permission.id,
                  isGranted: true,
                  isOverride: true,
                  staged: true,
                  createdAt: now,
                  updatedAt: now,
                });
                assignmentsCreated++;
              }
            }
          }
        }
      }
    }

    // Log audit event
    if (args.performedBy) {
      await writeAudit(ctx as MutationCtx, {
        action: 'permission.pushed',
        entityType: 'permission',
        entityId: permission.id,
        entityName: permission.id,
        performedBy: args.performedBy,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        details: `Permission "${permission.id}" pushed to ${organisations.length} organisation(s), creating ${assignmentsCreated} new assignment(s)`,
        metadata: JSON.stringify({
          organisationsUpdated: organisations.length,
          assignmentsCreated,
          totalRolesChecked,
          matchingRoles,
          alreadyAssigned: matchingRoles - assignmentsCreated,
          defaultRoles: permission.defaultRoles,
        }),
        severity: 'info',
      });
    }

    return {
      organisationsUpdated: organisations.length,
      assignmentsCreated,
      permissionId: permission.id,
      defaultRoles: permission.defaultRoles,
      totalRolesChecked,
      matchingRoles,
      alreadyAssigned: matchingRoles - assignmentsCreated,
    };
  },
});

/**
 * Create a new organisation role
 */
export const createOrganisationRole = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine organisation from actor (performedBy or authenticated identity)
    const identity = await ctx.auth.getUserIdentity();
    const subject = args.performedBy ?? identity?.subject;
    if (!subject) throw new Error('Unauthenticated');
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', subject))
      .first();
    if (!actor) throw new Error('User not found');

    const roleId = await ctx.db.insert('user_roles', {
      name: args.name,
      description: args.description || '',
      isDefault: false,
      isSystem: false,
      permissions: args.permissions,
      organisationId: actor.organisationId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Log audit event
    if (subject) {
      await writeAudit(ctx as MutationCtx, {
        action: 'role.created',
        entityType: 'role',
        entityId: String(roleId),
        entityName: args.name,
        performedBy: subject,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        organisationId: actor.organisationId,
        details: `Role "${args.name}" created with ${args.permissions.length} permission(s)`,
        metadata: JSON.stringify({
          description: args.description,
          permissions: args.permissions,
          organisationId: actor.organisationId,
        }),
        severity: 'info',
      });
    }

    return roleId;
  },
});

/**
 * Update an organisation role
 */
export const updateOrganisationRole = mutation({
  args: {
    roleId: v.id('user_roles'),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Authorisation: only system admins or members of the same organisation can modify
    const identity = await ctx.auth.getUserIdentity();
    const subject = args.performedBy ?? identity?.subject;
    if (!subject) throw new Error('Unauthenticated');
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', subject))
      .first();
    if (actor) {
      const isSystem =
        Array.isArray(actor.systemRoles) &&
        actor.systemRoles.some((r: string) =>
          ['admin', 'sysadmin', 'developer'].includes(r)
        );
      if (
        !isSystem &&
        String(actor.organisationId) !== String(role.organisationId)
      ) {
        throw new Error(
          'Unauthorised: Cannot modify roles outside your organisation'
        );
      }
    }

    const updates = {
      updatedAt: Date.now(),
      name: args.name,
      description: args.description || '',
      permissions: args.permissions,
    };

    await ctx.db.patch(args.roleId, updates);

    // Audit
    if (subject) {
      await writeAudit(ctx as MutationCtx, {
        action: 'role.updated',
        entityType: 'role',
        entityId: String(args.roleId),
        entityName: args.name,
        performedBy: subject,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        organisationId: role.organisationId,
        details: `Role updated: ${args.name}`,
        metadata: JSON.stringify({
          previous: {
            name: role.name,
            description: role.description,
            permissions: role.permissions,
          },
          updates: {
            name: args.name,
            description: args.description,
            permissions: args.permissions,
          },
        }),
        severity: 'info',
      });
    }

    return args.roleId;
  },
});

/**
 * Delete an organisation role
 */
export const deleteOrganisationRole = mutation({
  args: {
    roleId: v.id('user_roles'),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isDefault) {
      throw new Error('Cannot delete default roles');
    }

    // Check if any users are assigned to this role
    const roleAssignments = await ctx.db
      .query('user_role_assignments')
      .filter((q) =>
        q.and(
          q.eq(q.field('roleId'), args.roleId),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect();

    if (roleAssignments.length > 0) {
      throw new Error('Cannot delete role that has assigned users');
    }

    // Authorisation: only system admins or members of the same organisation can delete
    const identity = await ctx.auth.getUserIdentity();
    const subject = args.performedBy ?? identity?.subject;
    if (!subject) throw new Error('Unauthenticated');
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', subject))
      .first();
    if (actor) {
      const isSystem =
        Array.isArray(actor.systemRoles) &&
        actor.systemRoles.some((r: string) =>
          ['admin', 'sysadmin', 'developer'].includes(r)
        );
      if (
        !isSystem &&
        String(actor.organisationId) !== String(role.organisationId)
      ) {
        throw new Error(
          'Unauthorised: Cannot delete roles outside your organisation'
        );
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.roleId, {
      isActive: false,
      updatedAt: now,
    });

    // Log audit event
    if (subject) {
      await writeAudit(ctx as MutationCtx, {
        action: 'role.deleted',
        entityType: 'role',
        entityId: String(args.roleId),
        entityName: role.name,
        performedBy: subject,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        organisationId: role.organisationId,
        details: `Role "${role.name}" deleted`,
        metadata: JSON.stringify({
          description: role.description,
          permissions: role.permissions,
          organisationId: role.organisationId,
          wasDefault: role.isDefault,
        }),
        severity: 'warning',
      });
    }

    return args.roleId;
  },
});

/**
 * Update role permissions
 */
export const updateRolePermissions = mutation({
  args: {
    roleId: v.id('user_roles'),
    permissionId: v.string(),
    isGranted: v.boolean(),
    acceptStaged: v.optional(v.boolean()), // if true and staged exists, apply it
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Authorisation: only system admins or members of the same organisation
    const identity = await ctx.auth.getUserIdentity();
    const subject = args.performedBy ?? identity?.subject;
    if (!subject) throw new Error('Unauthenticated');
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', subject))
      .first();
    if (actor) {
      const isSystem =
        Array.isArray(actor.systemRoles) &&
        actor.systemRoles.some((r: string) =>
          ['admin', 'sysadmin', 'developer'].includes(r)
        );
      if (
        !isSystem &&
        String(actor.organisationId) !== String(role.organisationId)
      ) {
        throw new Error(
          'Unauthorised: Cannot modify roles outside your organisation'
        );
      }
    }

    let permissions = [...role.permissions];

    if (args.isGranted) {
      // If there is a staged permission for this role, accept it (remove staged) when acceptStaged=true
      if (args.acceptStaged) {
        const staged = await ctx.db
          .query('organisation_role_permissions')
          .filter((q) =>
            q.and(
              q.eq(q.field('organisationId'), role.organisationId),
              q.eq(q.field('roleId'), role._id),
              q.eq(q.field('permissionId'), args.permissionId),
              q.eq(q.field('staged'), true)
            )
          )
          .first();
        if (staged) {
          await ctx.db.delete(staged._id);
        }
      }
      if (!permissions.includes(args.permissionId)) {
        permissions.push(args.permissionId);
      }
    } else {
      permissions = permissions.filter((p) => p !== args.permissionId);
    }

    await ctx.db.patch(args.roleId, {
      permissions,
      updatedAt: Date.now(),
    });

    // Audit
    if (subject) {
      const systemPerm = await ctx.db
        .query('system_permissions')
        .withIndex('by_permission_id', (q) => q.eq('id', args.permissionId))
        .first();

      await writeAudit(ctx as MutationCtx, {
        action: args.isGranted
          ? args.acceptStaged
            ? 'permission.assigned'
            : 'permission.assigned'
          : 'permission.revoked',
        entityType: 'permission',
        entityId: args.permissionId,
        entityName: systemPerm?.id || args.permissionId,
        performedBy: subject,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        organisationId: role.organisationId,
        details: `${args.isGranted ? 'Assigned' : 'Revoked'} permission ${args.permissionId} ${args.isGranted ? 'to' : 'from'} role ${role.name}`,
        metadata: JSON.stringify({
          roleId: role._id,
          roleName: role.name,
          permissionId: args.permissionId,
          acceptedFromStaged: !!args.acceptStaged,
        }),
        severity: args.isGranted ? 'info' : 'warning',
      });
    }

    return args.roleId;
  },
});

/**
 * Ensure default roles exist for an organisation.
 * Creates missing roles in `user_roles` and assigns permissions based on
 * `system_permissions.defaultRoles` membership.
 */
export async function ensureDefaultsForOrg(
  ctx: MutationCtx,
  organisationId: Id<'organisations'>,
  options?: {
    performedBy?: string;
    performedByName?: string;
    roleNames?: string[];
  }
) {
  const now = Date.now();

  // Fetch existing roles for org
  const existingRoles = await ctx.db
    .query('user_roles')
    .filter((q) =>
      q.and(
        q.eq(q.field('organisationId'), organisationId),
        q.eq(q.field('isActive'), true)
      )
    )
    .collect();

  const existingRoleNames = new Set(existingRoles.map((r) => r.name));

  let defaultRoleNames = options?.roleNames;
  if (!defaultRoleNames) {
    const templates = await ctx.db
      .query('system_role_templates')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
    defaultRoleNames =
      templates.length > 0
        ? templates.map((t) => t.name)
        : ['Admin', 'Manager', 'Lecturer', 'Viewer'];
  }

  // Load active system permissions once
  const systemPermissions = await ctx.db
    .query('system_permissions')
    .filter((q) => q.eq(q.field('isActive'), true))
    .collect();

  const ensureRole = async (roleName: string) => {
    if (!existingRoleNames.has(roleName)) {
      const permissionsForRole = systemPermissions
        .filter(
          (p) =>
            Array.isArray(p.defaultRoles) && p.defaultRoles.includes(roleName)
        )
        .map((p) => p.id);

      const newRoleId = await ctx.db.insert('user_roles', {
        name: roleName,
        description: `${roleName} role (default)`,
        isDefault: true,
        isSystem: false,
        permissions: permissionsForRole,
        organisationId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      if (options?.performedBy) {
        await ctx.db.insert('audit_logs', {
          action: 'role.created',
          entityType: 'role',
          entityId: String(newRoleId),
          entityName: roleName,
          performedBy: options.performedBy,
          ...(options.performedByName
            ? { performedByName: options.performedByName }
            : {}),
          organisationId,
          details: `Default role "${roleName}" created with ${permissionsForRole.length} permission(s)`,
          metadata: JSON.stringify({ permissions: permissionsForRole }),
          timestamp: now,
          severity: 'info',
        });
      }
      return { created: true };
    }
    return { created: false };
  };

  let createdCount = 0;
  for (const rn of defaultRoleNames ?? []) {
    const r = await ensureRole(rn);
    if (r.created) createdCount += 1;
  }

  return { created: createdCount };
}

export const ensureDefaultRolesForOrganisation = mutation({
  args: {
    organisationId: v.id('organisations'),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
    roleNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return ensureDefaultsForOrg(ctx, args.organisationId, {
      ...(args.performedBy ? { performedBy: args.performedBy } : {}),
      ...(args.performedByName
        ? { performedByName: args.performedByName }
        : {}),
      ...(args.roleNames ? { roleNames: args.roleNames } : {}),
    });
  },
});

/**
 * Ensure default roles exist for all active organisations.
 */
export const ensureDefaultRolesAcrossOrganisations = mutation({
  args: {
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
    roleNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const orgs = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    let totalCreated = 0;
    for (const org of orgs) {
      const result = await ensureDefaultsForOrg(
        ctx as MutationCtx,
        org._id as Id<'organisations'>,
        {
          ...(args.performedBy ? { performedBy: args.performedBy } : {}),
          ...(args.performedByName
            ? { performedByName: args.performedByName }
            : {}),
          ...(args.roleNames ? { roleNames: args.roleNames } : {}),
        }
      );
      totalCreated += result.created;
    }

    return { organisationsProcessed: orgs.length, rolesCreated: totalCreated };
  },
});
