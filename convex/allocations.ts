import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { v } from 'convex/values';
import type { Id, Doc } from './_generated/dataModel';
import { writeAudit } from './audit';
import { computeHoursFromCredits, computeTotals } from './allocationsMath';
import {
  assertCanManageOrganisationWorkload,
  assertCanManageTeamMember,
  hasOrgPermission,
  requirePermission,
  requireOrgPermission,
} from './permissions/index';
import { makeLoaders } from '../src/lib/convex/loaders';
import { getAuthContext } from './lib/auth';

// Assign a lecturer to a group
export const assignLecturer = mutation({
  args: {
    userId: v.string(),
    groupId: v.id('module_groups'),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
    organisationId: v.optional(v.id('organisations')),
    type: v.union(v.literal('teaching'), v.literal('admin')),
    hoursOverride: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);

    // Compute baseline hours from module credits via linked iteration->module
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error('Group not found');
    const iteration = await ctx.db.get(group.moduleIterationId);
    if (!iteration) throw new Error('Module iteration not found');
    const moduleDoc = await ctx.db.get(iteration.moduleId);
    const baseHours = computeHoursFromCredits(moduleDoc?.credits);

    // Validate hours override if provided
    if (typeof args.hoursOverride === 'number') {
      if (args.hoursOverride < 0) {
        throw new Error('Hours override cannot be negative');
      }
      if (args.hoursOverride > 1000) {
        throw new Error('Hours override cannot exceed 1000 hours');
      }
    }

    // Derive organisationId via module
    const derivedOrgId = moduleDoc?.organisationId as Id<'organisations'>;
    // Permission: workload adjustment within module's org
    await assertCanManageOrganisationWorkload(
      ctx,
      authContext.userId,
      derivedOrgId,
      'adjust'
    );

    const now = Date.now();
    const id = await ctx.db.insert('group_allocations', {
      groupId: args.groupId,
      lecturerId: args.lecturerId,
      academicYearId: args.academicYearId,
      organisationId: derivedOrgId,
      type: args.type,
      hoursComputed: baseHours,
      ...(typeof args.hoursOverride === 'number'
        ? { hoursOverride: args.hoursOverride }
        : {}),
      createdAt: now,
      updatedAt: now,
    });

    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'group_allocation',
        entityId: String(id),
        performedBy: authContext.userId,
        details: `Allocated lecturer ${String(args.lecturerId)} to group ${String(args.groupId)} with ${typeof args.hoursOverride === 'number' ? `${args.hoursOverride} override hours` : `${baseHours} computed hours`}`,
        severity: 'info',
        type: 'org',
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }

    return id;
  },
});

// Update an existing allocation (type and/or hoursOverride)
export const update = mutation({
  args: {
    userId: v.string(),
    allocationId: v.id('group_allocations'),
    type: v.optional(v.union(v.literal('teaching'), v.literal('admin'))),
    hoursOverride: v.optional(v.union(v.float64(), v.null())), // null clears override
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);

    const existing = await ctx.db.get(args.allocationId);
    if (!existing) throw new Error('Allocation not found');

    // Authorise within org workload scope
    await assertCanManageOrganisationWorkload(
      ctx,
      authContext.userId,
      existing.organisationId,
      'adjust'
    );

    const updatePayload: Partial<Doc<'group_allocations'>> = {
      updatedAt: Date.now(),
    };

    if (args.type !== undefined) {
      updatePayload.type = args.type;
    }

    if (args.hoursOverride !== undefined) {
      if (args.hoursOverride === null) {
        // Don't set the field at all when clearing override
        // This respects exactOptionalPropertyTypes
      } else {
        updatePayload.hoursOverride = args.hoursOverride;
      }
    }

    await ctx.db.patch(args.allocationId, updatePayload);

    try {
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'group_allocation',
        entityId: String(args.allocationId),
        performedBy: authContext.userId,
        details: `Updated allocation ${String(args.allocationId)}`,
        severity: 'info',
        type: 'org',
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }

    return args.allocationId;
  },
});

// List allocations for a lecturer in a year
export const listForLecturer = query({
  args: {
    userId: v.string(),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
  },
  handler: async (ctx, args) => {
    const lecturer = await ctx.db.get(args.lecturerId);
    if (!lecturer) return [];
    await assertCanViewLecturerWorkload(ctx, args.userId, lecturer);

    const rows = await ctx.db
      .query('group_allocations')
      .withIndex('by_lecturer', (q) => q.eq('lecturerId', args.lecturerId))
      .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
      .collect();
    return rows;
  },
});

// Compute basic totals for a lecturer in a year (MVP)
export const computeLecturerTotals = query({
  args: {
    userId: v.string(),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);

    // Permission: allocations.view within lecturer's org (derive via lecturer profile)
    const lecturer = await ctx.db.get(args.lecturerId);
    if (!lecturer) {
      return computeTotals([]);
    }

    await assertCanViewLecturerWorkload(ctx, authContext.userId, lecturer);

    const allocations = await ctx.db
      .query('group_allocations')
      .withIndex('by_lecturer', (q) => q.eq('lecturerId', args.lecturerId))
      .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
      .collect();

    return computeTotals(allocations);
  },
});

// List allocations for a group (with lecturer basic info)
export const listForGroup = query({
  args: { userId: v.optional(v.string()), groupId: v.id('module_groups') },
  handler: async (ctx, args) => {
    const loaders = makeLoaders();
    const rows = await ctx.db
      .query('group_allocations')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect();

    // Use bulk batching instead of N+1 queries
    const enriched = (
      await Promise.all(
        rows.map(async (r) => {
          const lecturer = await loaders.lecturersById.load(ctx, r.lecturerId);
          if (!lecturer) return null;
          if (!args.userId) return { allocation: r, lecturer };
          try {
            await assertCanViewLecturerWorkload(ctx, args.userId, lecturer);
            return { allocation: r, lecturer };
          } catch {
            return null;
          }
        })
      )
    ).filter(
      (
        row
      ): row is {
        allocation: Doc<'group_allocations'>;
        lecturer: Doc<'lecturer_profiles'>;
      } => row !== null
    );
    return enriched;
  },
});

// List allocations for a lecturer with group and module details
export const listForLecturerDetailed = query({
  args: {
    userId: v.optional(v.string()),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
  },
  handler: async (ctx, args) => {
    const lecturer = await ctx.db.get(args.lecturerId);
    if (!lecturer) return [];
    if (args.userId) {
      await assertCanViewLecturerWorkload(ctx, args.userId, lecturer);
    }

    const loaders = makeLoaders();
    const rows = await ctx.db
      .query('group_allocations')
      .withIndex('by_lecturer', (q) => q.eq('lecturerId', args.lecturerId))
      .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
      .collect();

    // Use bulk batching instead of N+1 queries
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const group = await loaders.groupsById.load(ctx, r.groupId);
        const iteration = group
          ? await loaders.iterationsById.load(ctx, group.moduleIterationId)
          : null;
        const module = iteration
          ? await loaders.modulesById.load(ctx, iteration.moduleId)
          : null;

        return {
          allocation: r,
          group,
          iteration,
          module,
        };
      })
    );
    return enriched;
  },
});

// Bulk remove allocations for a list of groups (optionally filtered by lecturer)
export const removeAllocationsForGroups = mutation({
  args: {
    userId: v.string(),
    groupIds: v.array(v.id('module_groups')),
    lecturerId: v.optional(v.id('lecturer_profiles')),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    // Fetch allocations matching groups (and optional lecturer)
    const all: Doc<'group_allocations'>[] = [];
    for (const gid of args.groupIds) {
      const rows = await ctx.db
        .query('group_allocations')
        .withIndex('by_group', (q) => q.eq('groupId', gid))
        .collect();
      all.push(...rows);
    }
    const filtered = args.lecturerId
      ? all.filter((a) => String(a.lecturerId) === String(args.lecturerId))
      : all;
    for (const a of filtered) {
      // Authorize per allocation org
      await assertCanManageOrganisationWorkload(
        ctx,
        authContext.userId,
        a.organisationId,
        'adjust'
      );
      await ctx.db.delete(a._id);
      try {
        await writeAudit(ctx, {
          action: 'delete',
          entityType: 'group_allocation',
          entityId: String(a._id),
          performedBy: authContext.userId,
          details: `Bulk removed allocation ${String(a._id)} from group ${String(a.groupId)}`,
          severity: 'warning',
          type: 'org',
        });
      } catch (error) {
        // Audit logging failed, but don't fail the operation
        // Note: Using console.error here as this is server-side Convex code
        // eslint-disable-next-line no-console
        console.error('Audit logging failed:', error);
      }
    }
    return filtered.map((a) => a._id);
  },
});

// Iteration allocations summary
export const iterationSummary = query({
  args: {
    userId: v.optional(v.string()),
    moduleIterationId: v.id('module_iterations'),
  },
  handler: async (ctx, args) => {
    const iteration = await ctx.db.get(args.moduleIterationId);
    if (!iteration) throw new Error('Module iteration not found');
    const moduleDoc = await ctx.db.get(iteration.moduleId);
    if (!moduleDoc) throw new Error('Module not found');

    if (args.userId) {
      await assertCanManageOrganisationWorkload(
        ctx,
        args.userId,
        moduleDoc.organisationId,
        'view'
      );
    }

    const groups = await ctx.db
      .query('module_groups')
      .withIndex('by_iteration', (q) =>
        q.eq('moduleIterationId', args.moduleIterationId)
      )
      .collect();
    const allocations: Doc<'group_allocations'>[] = [];
    for (const g of groups) {
      const rows = await ctx.db
        .query('group_allocations')
        .withIndex('by_group', (q) => q.eq('groupId', g._id))
        .collect();
      allocations.push(...rows);
    }
    const totals = computeTotals(allocations);
    return {
      groupCount: groups.length,
      allocationCount: allocations.length,
      ...totals,
    };
  },
});

// Remove an allocation
export const remove = mutation({
  args: { userId: v.string(), allocationId: v.id('group_allocations') },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const existing = await ctx.db.get(args.allocationId);
    if (!existing) return args.allocationId;

    // Get lecturer details for audit
    const lecturer = await ctx.db.get(existing.lecturerId);
    const group = await ctx.db.get(existing.groupId);

    // Authorise within org workload scope
    await assertCanManageOrganisationWorkload(
      ctx,
      authContext.userId,
      existing.organisationId,
      'adjust'
    );

    await ctx.db.delete(args.allocationId);

    try {
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'group_allocation',
        entityId: String(args.allocationId),
        performedBy: authContext.userId,
        details: `Removed lecturer ${lecturer?.fullName || String(existing.lecturerId)} from group ${group?.name || String(existing.groupId)} (${existing.type} allocation)`,
        severity: 'warning',
        type: 'org',
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }

    return args.allocationId;
  },
});

// Get lecturer totals for a specific lecturer in a specific academic year
export const getLecturerTotals = query({
  args: {
    userId: v.string(),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);

    // Permission: allocations.view within lecturer's org
    const lecturer = await ctx.db.get(args.lecturerId);
    if (!lecturer) return null;

    await assertCanViewLecturerWorkload(ctx, authContext.userId, lecturer);

    const allocations = await ctx.db
      .query('group_allocations')
      .withIndex('by_lecturer', (q) => q.eq('lecturerId', args.lecturerId))
      .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
      .collect();

    const totals = computeTotals(allocations);

    return {
      lecturerId: args.lecturerId,
      academicYearId: args.academicYearId,
      ...totals,
      allocationCount: allocations.length,
    };
  },
});

// Get module teaching hours for preview
export const getModuleTeachingHours = query({
  args: {
    groupId: v.id('module_groups'),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const iteration = await ctx.db.get(group.moduleIterationId);
    if (!iteration) return null;

    const moduleDoc = await ctx.db.get(iteration.moduleId);
    if (!moduleDoc) return null;

    const baseHours = computeHoursFromCredits(moduleDoc?.credits);

    return {
      moduleName: moduleDoc?.name || 'Unknown Module',
      moduleCode: moduleDoc?.code || 'Unknown',
      credits: moduleDoc?.credits || 0,
      computedHours: baseHours,
      totalHours: iteration?.totalHours || 0,
    };
  },
});

// ===== Admin allocations (per-lecturer, per AY) =====

export const listAdminAllocations = query({
  args: {
    userId: v.optional(v.string()),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
  },
  handler: async (ctx, args) => {
    // derive org via lecturer profile
    const lecturer = await ctx.db.get(args.lecturerId);
    if (!lecturer) return [];
    if (args.userId) {
      await assertCanViewLecturerWorkload(ctx, args.userId, lecturer);
    }
    const rows = await ctx.db
      .query('admin_allocations')
      .withIndex('by_year', (q) => q.eq('academicYearId', args.academicYearId))
      .filter((q) => q.eq(q.field('staffId'), String(args.lecturerId)))
      .collect();
    // join category names (skip invalid/custom ids)
    const categories = await Promise.all(
      rows.map(async (r) => {
        try {
          if (!r.categoryId || r.isCustom) return null;
          if (typeof r.categoryId !== 'string' || r.categoryId.length < 16)
            return null;
          // Try to get the category from either table
          try {
            const orgCategory = await ctx.db.get(
              r.categoryId as Id<'organisation_admin_allocation_categories'>
            );
            if (orgCategory) return orgCategory;
          } catch {
            // Not an org category, try system category
          }
          try {
            const sysCategory = await ctx.db.get(
              r.categoryId as Id<'admin_allocation_categories'>
            );
            if (sysCategory) return sysCategory;
          } catch {
            // Not a system category either
          }
          return null;
        } catch {
          return null;
        }
      })
    );
    return rows.map((r, i) => ({
      allocation: r,
      category: categories[i],
    }));
  },
});

export const listAdminCategories = query({
  args: {},
  handler: async (ctx) => {
    const cats = await ctx.db
      .query('admin_allocation_categories')
      .order('asc')
      .collect();
    return cats;
  },
});

export const upsertAdminCategory = mutation({
  args: {
    userId: v.string(),
    id: v.optional(v.id('admin_allocation_categories')),
    name: v.string(),
    description: v.optional(v.string()),
    minHours: v.optional(v.float64()),
    maxHours: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    await requirePermission(ctx, authContext.userId, 'permissions.manage');
    if (
      args.minHours !== undefined &&
      args.maxHours !== undefined &&
      args.minHours > args.maxHours
    ) {
      throw new Error('minHours cannot be greater than maxHours');
    }
    const now = Date.now();
    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name,
        ...(args.description !== undefined
          ? { description: args.description }
          : {}),
        ...(args.minHours !== undefined ? { minHours: args.minHours } : {}),
        ...(args.maxHours !== undefined ? { maxHours: args.maxHours } : {}),
        updatedAt: now,
      });
      try {
        await writeAudit(ctx, {
          action: 'update',
          entityType: 'admin_allocation_category',
          entityId: String(args.id),
          performedBy: authContext.userId,
          details: `Updated admin allocation category ${args.name}`,
          severity: 'info',
          type: 'sys',
        });
      } catch (error) {
        // Audit logging failed, but don't fail the operation
        // Note: Using console.error here as this is server-side Convex code
        // eslint-disable-next-line no-console
        console.error('Audit logging failed:', error);
      }
      return args.id;
    }
    const id = await ctx.db.insert('admin_allocation_categories', {
      name: args.name,
      ...(args.description ? { description: args.description } : {}),
      isDefault: false,
      ...(args.minHours !== undefined ? { minHours: args.minHours } : {}),
      ...(args.maxHours !== undefined ? { maxHours: args.maxHours } : {}),
      createdAt: now,
      updatedAt: now,
    });
    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'admin_allocation_category',
        entityId: String(id),
        performedBy: authContext.userId,
        details: `Created admin allocation category ${args.name}`,
        severity: 'info',
        type: 'sys',
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }
    return id;
  },
});

export const removeAdminCategory = mutation({
  args: { userId: v.string(), id: v.id('admin_allocation_categories') },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    await requirePermission(ctx, authContext.userId, 'permissions.manage');
    await ctx.db.delete(args.id);
    try {
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'admin_allocation_category',
        entityId: String(args.id),
        performedBy: authContext.userId,
        details: `Removed admin allocation category ${String(args.id)}`,
        severity: 'warning',
        type: 'sys',
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }
    return args.id;
  },
});

export const upsertAdminAllocation = mutation({
  args: {
    userId: v.string(),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
    categoryId: v.optional(v.string()),
    hours: v.number(),
    isCustom: v.optional(v.boolean()),
    customLabel: v.optional(v.string()),
    comment: v.optional(v.string()),
    allocationId: v.optional(v.id('admin_allocations')),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    // Check org scope via lecturer
    const lecturer = await ctx.db.get(args.lecturerId);
    if (!lecturer) throw new Error('Lecturer not found');
    await assertCanManageOrganisationWorkload(
      ctx,
      authContext.userId,
      lecturer.organisationId,
      'adjust'
    );

    // Validate against category min/max unless custom
    let minH: number | undefined = undefined;
    let maxH: number | undefined = undefined;
    if (!args.isCustom && args.categoryId) {
      try {
        // Try org-scoped category first
        const orgCategory = await ctx.db.get(
          args.categoryId as Id<'organisation_admin_allocation_categories'>
        );
        if (
          orgCategory &&
          String(orgCategory.organisationId) === String(lecturer.organisationId)
        ) {
          minH = orgCategory.minHours;
          maxH = orgCategory.maxHours;
        } else {
          const sysCategory = await ctx.db.get(
            args.categoryId as Id<'admin_allocation_categories'>
          );
          if (sysCategory) {
            minH = sysCategory.minHours;
            maxH = sysCategory.maxHours;
          }
        }
      } catch {
        // Category not found, continue without validation
      }
    }
    if (minH !== undefined && args.hours < minH)
      throw new Error(`Hours must be at least ${minH}`);
    if (maxH !== undefined && args.hours > maxH)
      throw new Error(`Hours must be at most ${maxH}`);
    if (args.hours < 0 || args.hours > 1000)
      throw new Error('Hours must be between 0 and 1000');

    const now = Date.now();
    if (args.allocationId) {
      const updatePayload: Partial<Doc<'admin_allocations'>> = {
        hours: args.hours,
        updatedAt: now,
      };
      if (args.isCustom) {
        updatePayload.isCustom = true;
        updatePayload.categoryId = args.categoryId || 'custom';
        if (args.customLabel !== undefined)
          updatePayload.customLabel = args.customLabel;
        if (args.comment !== undefined) updatePayload.comment = args.comment;
      } else {
        if (args.categoryId) updatePayload.categoryId = args.categoryId;
        updatePayload.isCustom = false;
        // Don't set customLabel to undefined - leave it unset
        // keep comment undefined for standard
      }
      await ctx.db.patch(args.allocationId, updatePayload);
      try {
        await writeAudit(ctx, {
          action: 'update',
          entityType: 'admin_allocation',
          entityId: String(args.allocationId),
          performedBy: authContext.userId,
          details: `Updated admin allocation ${String(args.allocationId)} hours=${args.hours}`,
          severity: 'info',
          type: 'org',
        });
      } catch (error) {
        // Audit logging failed, but don't fail the operation
        // Note: Using console.error here as this is server-side Convex code
        // eslint-disable-next-line no-console
        console.error('Audit logging failed:', error);
      }
      return args.allocationId;
    }
    const id = await ctx.db.insert('admin_allocations', {
      staffId: String(args.lecturerId),
      categoryId: args.categoryId || 'custom',
      hours: args.hours,
      academicYearId: args.academicYearId,
      isCustom: Boolean(args.isCustom),
      ...(args.customLabel ? { customLabel: args.customLabel } : {}),
      ...(args.comment ? { comment: args.comment } : {}),
      createdAt: now,
      updatedAt: now,
    });
    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'admin_allocation',
        entityId: String(id),
        performedBy: authContext.userId,
        details: `Created admin allocation for lecturer ${String(args.lecturerId)} hours=${args.hours}`,
        severity: 'info',
        type: 'org',
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }
    return id;
  },
});

export const removeAdminAllocation = mutation({
  args: { userId: v.string(), allocationId: v.id('admin_allocations') },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const existing = await ctx.db.get(args.allocationId);
    if (!existing) return args.allocationId;
    // Authorise via org from user's subject ID stored as staffId (string)
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', existing.staffId))
      .first();
    if (user) {
      await assertCanManageOrganisationWorkload(
        ctx,
        authContext.userId,
        authContext.organisationId,
        'adjust'
      );
    }
    await ctx.db.delete(args.allocationId);
    try {
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'admin_allocation',
        entityId: String(args.allocationId),
        performedBy: authContext.userId,
        details: `Removed admin allocation ${String(args.allocationId)}`,
        severity: 'warning',
        type: 'sys',
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }
    return args.allocationId;
  },
});

// ===== Organisation-scoped Admin Allocation Categories =====

export const listOrganisationAdminCategories = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) throw new Error('User not found');
    const cats = await ctx.db
      .query('organisation_admin_allocation_categories')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .order('asc')
      .collect();
    return cats;
  },
});

export const upsertOrganisationAdminCategory = mutation({
  args: {
    userId: v.string(),
    id: v.optional(v.id('organisation_admin_allocation_categories')),
    name: v.string(),
    description: v.optional(v.string()),
    minHours: v.optional(v.float64()),
    maxHours: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) throw new Error('User not found');
    await requireOrgPermission(
      ctx,
      authContext.userId,
      'organisations.manage',
      authContext.organisationId
    );
    if (
      args.minHours !== undefined &&
      args.maxHours !== undefined &&
      args.minHours > args.maxHours
    ) {
      throw new Error('minHours cannot be greater than maxHours');
    }
    const now = Date.now();
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error('Category not found');
      if (
        String(existing.organisationId) !== String(authContext.organisationId)
      )
        throw new Error('Cannot modify other organisation categories');
      await ctx.db.patch(args.id, {
        name: args.name,
        ...(args.description !== undefined
          ? { description: args.description }
          : {}),
        ...(args.minHours !== undefined ? { minHours: args.minHours } : {}),
        ...(args.maxHours !== undefined ? { maxHours: args.maxHours } : {}),
        updatedAt: now,
      });
      try {
        await writeAudit(ctx, {
          action: 'update',
          entityType: 'org_admin_allocation_category',
          entityId: String(args.id),
          performedBy: authContext.userId,
          details: `Updated org admin allocation category ${args.name}`,
          severity: 'info',
          type: 'org',
          organisationId: authContext.organisationId,
        });
      } catch (error) {
        // Audit logging failed, but don't fail the operation
        // Note: Using console.error here as this is server-side Convex code
        // eslint-disable-next-line no-console
        console.error('Audit logging failed:', error);
      }
      return args.id;
    }
    const id = await ctx.db.insert('organisation_admin_allocation_categories', {
      organisationId: authContext.organisationId,
      name: args.name,
      ...(args.description ? { description: args.description } : {}),
      ...(args.minHours !== undefined ? { minHours: args.minHours } : {}),
      ...(args.maxHours !== undefined ? { maxHours: args.maxHours } : {}),
      createdAt: now,
      updatedAt: now,
    });
    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'org_admin_allocation_category',
        entityId: String(id),
        performedBy: authContext.userId,
        details: `Created org admin allocation category ${args.name}`,
        severity: 'info',
        type: 'org',
        organisationId: authContext.organisationId,
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }
    return id;
  },
});

export const removeOrganisationAdminCategory = mutation({
  args: {
    userId: v.string(),
    id: v.id('organisation_admin_allocation_categories'),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) throw new Error('User not found');
    await requireOrgPermission(
      ctx,
      authContext.userId,
      'organisations.manage',
      authContext.organisationId
    );
    const existing = await ctx.db.get(args.id);
    if (!existing) return args.id;
    if (String(existing.organisationId) !== String(authContext.organisationId))
      throw new Error('Cannot delete other organisation categories');
    await ctx.db.delete(args.id);
    try {
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'org_admin_allocation_category',
        entityId: String(args.id),
        performedBy: authContext.userId,
        details: `Removed org admin allocation category ${String(args.id)}`,
        severity: 'warning',
        type: 'org',
        organisationId: authContext.organisationId,
      });
    } catch (error) {
      // Audit logging failed, but don't fail the operation
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Audit logging failed:', error);
    }
    return args.id;
  },
});

// Seed org categories from system defaults (call during org creation)
export const seedOrgAdminCategories = mutation({
  args: { organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    const now = Date.now();
    const defaults = await ctx.db
      .query('admin_allocation_categories')
      .collect();
    for (const d of defaults) {
      const insertData: {
        organisationId: Id<'organisations'>;
        name: string;
        description?: string;
        minHours?: number;
        maxHours?: number;
        createdAt: number;
        updatedAt: number;
      } = {
        organisationId: args.organisationId,
        name: d.name,
        createdAt: now,
        updatedAt: now,
      };

      if (d.description !== undefined) {
        insertData.description = d.description;
      }
      if (d.minHours !== undefined) {
        insertData.minHours = d.minHours;
      }
      if (d.maxHours !== undefined) {
        insertData.maxHours = d.maxHours;
      }

      await ctx.db.insert(
        'organisation_admin_allocation_categories',
        insertData
      );
    }
    return { created: defaults.length };
  },
});

// Push system admin categories to all active organisations
export const pushAdminCategoriesToOrganisations = mutation({
  args: { userId: v.string(), forceApply: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    await requirePermission(ctx, authContext.userId, 'permissions.manage');

    const now = Date.now();
    const sysCats = await ctx.db.query('admin_allocation_categories').collect();
    const orgs = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    let created = 0;
    let updated = 0;

    for (const org of orgs) {
      const orgCats = await ctx.db
        .query('organisation_admin_allocation_categories')
        .withIndex('by_organisation', (q) => q.eq('organisationId', org._id))
        .collect();
      for (const sc of sysCats) {
        const existing = orgCats.find(
          (oc) => String(oc.name).trim() === String(sc.name).trim()
        );
        if (!existing) {
          const insertData: {
            organisationId: Id<'organisations'>;
            name: string;
            description?: string;
            minHours?: number;
            maxHours?: number;
            createdAt: number;
            updatedAt: number;
          } = {
            organisationId: org._id,
            name: sc.name,
            createdAt: now,
            updatedAt: now,
          };

          if (sc.description !== undefined) {
            insertData.description = sc.description;
          }
          if (sc.minHours !== undefined) {
            insertData.minHours = sc.minHours;
          }
          if (sc.maxHours !== undefined) {
            insertData.maxHours = sc.maxHours;
          }

          await ctx.db.insert(
            'organisation_admin_allocation_categories',
            insertData
          );
          created++;
        } else if (args.forceApply) {
          const patchData: {
            description?: string;
            minHours?: number;
            maxHours?: number;
            updatedAt: number;
          } = {
            updatedAt: now,
          };

          if (sc.description !== undefined) {
            patchData.description = sc.description;
          }
          if (sc.minHours !== undefined) {
            patchData.minHours = sc.minHours;
          }
          if (sc.maxHours !== undefined) {
            patchData.maxHours = sc.maxHours;
          }

          await ctx.db.patch(existing._id, patchData);
          updated++;
        }
      }
      try {
        await writeAudit(ctx, {
          action: args.forceApply
            ? 'admin_categories.synced'
            : 'admin_categories.pushed',
          entityType: 'organisation',
          entityId: String(org._id),
          performedBy: authContext.userId,
          details: `${args.forceApply ? 'Synced' : 'Pushed'} admin categories to org ${String(org.name)}`,
          severity: args.forceApply ? 'warning' : 'info',
          type: 'org',
          organisationId: org._id,
        });
      } catch (error) {
        // Audit logging failed, but don't fail the operation
        // Note: Using console.error here as this is server-side Convex code
        // eslint-disable-next-line no-console
        console.error('Audit logging failed:', error);
      }
    }

    return { organisationsProcessed: orgs.length, created, updated };
  },
});

export const createAllocationChangeRequest = mutation({
  args: {
    userId: v.string(),
    type: v.union(v.literal('assign'), v.literal('update'), v.literal('remove')),
    targetLecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
    allocationId: v.optional(v.id('group_allocations')),
    groupId: v.optional(v.id('module_groups')),
    allocationType: v.optional(v.union(v.literal('teaching'), v.literal('admin'))),
    hoursOverride: v.optional(v.union(v.float64(), v.null())),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const lecturer = await ctx.db.get(args.targetLecturerId);
    if (!lecturer) throw new Error('Lecturer not found');
    await assertCanManageTeamMember(ctx, authContext.userId, lecturer);

    if (args.type === 'assign' && (!args.groupId || !args.allocationType)) {
      throw new Error('Group and allocation type are required');
    }

    if ((args.type === 'update' || args.type === 'remove') && !args.allocationId) {
      throw new Error('Allocation is required');
    }

    const now = Date.now();
    const id = await ctx.db.insert('allocation_change_requests', {
      type: args.type,
      status: 'pending',
      organisationId: lecturer.organisationId,
      targetLecturerId: args.targetLecturerId,
      academicYearId: args.academicYearId,
      requestedBy: authContext.userId,
      requestedAt: now,
      ...(args.allocationId ? { allocationId: args.allocationId } : {}),
      ...(args.groupId ? { groupId: args.groupId } : {}),
      payload: JSON.stringify({
        allocationType: args.allocationType,
        hoursOverride: args.hoursOverride,
      }),
      ...(args.reason ? { reason: args.reason } : {}),
      createdAt: now,
      updatedAt: now,
    });

    await writeAudit(ctx, {
      action: 'allocation_change.requested',
      entityType: 'allocation_change_request',
      entityId: String(id),
      entityName: `${args.type} allocation change`,
      performedBy: authContext.userId,
      organisationId: lecturer.organisationId,
      details: `Requested ${args.type} allocation change for ${lecturer.fullName}`,
      severity: 'info',
      type: 'org',
    });

    return id;
  },
});

export const listAllocationChangeRequests = query({
  args: {
    userId: v.string(),
    status: v.optional(
      v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))
    ),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const canViewOrg =
      (await hasOrgPermission(
        ctx,
        authContext.userId,
        'permissions.manage',
        authContext.organisationId
      )) ||
      (await hasOrgPermission(
        ctx,
        authContext.userId,
        'workload.admin.allocations.view',
        authContext.organisationId
      ));

    if (!canViewOrg) {
      await requireOrgPermission(
        ctx,
        authContext.userId,
        'manager.changes.review',
        authContext.organisationId
      );
    }

    const rows = args.status
      ? await ctx.db
          .query('allocation_change_requests')
          .withIndex('by_org_status', (q) =>
            q.eq('organisationId', authContext.organisationId).eq('status', args.status!)
          )
          .collect()
      : await ctx.db
          .query('allocation_change_requests')
          .filter((q) =>
            q.eq(q.field('organisationId'), authContext.organisationId)
          )
          .collect();

    const visibleRows = [];
    for (const row of rows) {
      const lecturer = await ctx.db.get(row.targetLecturerId);
      if (!lecturer) continue;
      if (!canViewOrg) {
        try {
          await assertCanManageTeamMember(ctx, authContext.userId, lecturer);
        } catch {
          continue;
        }
      }
      const requester = await ctx.db
        .query('users')
        .withIndex('by_subject', (q) => q.eq('subject', row.requestedBy))
        .first();
      const allocation = row.allocationId
        ? await ctx.db.get(row.allocationId)
        : null;
      const group = row.groupId ? await ctx.db.get(row.groupId) : null;
      visibleRows.push({ request: row, lecturer, requester, allocation, group });
    }

    return visibleRows.sort(
      (a, b) => b.request.requestedAt - a.request.requestedAt
    );
  },
});

export const reviewAllocationChangeRequest = mutation({
  args: {
    userId: v.string(),
    requestId: v.id('allocation_change_requests'),
    decision: v.union(v.literal('approved'), v.literal('rejected')),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request already reviewed');

    const lecturer = await ctx.db.get(request.targetLecturerId);
    if (!lecturer) throw new Error('Lecturer not found');

    await requireOrgPermission(
      ctx,
      authContext.userId,
      'manager.changes.approve',
      request.organisationId
    );
    await assertCanManageTeamMember(ctx, authContext.userId, lecturer);

    const now = Date.now();
    if (args.decision === 'approved') {
      await applyAllocationChangeRequest(ctx, request);
    }

    await ctx.db.patch(args.requestId, {
      status: args.decision,
      reviewedBy: authContext.userId,
      reviewedAt: now,
      ...(args.note ? { decisionNote: args.note } : {}),
      updatedAt: now,
    });

    await writeAudit(ctx, {
      action: `allocation_change.${args.decision}`,
      entityType: 'allocation_change_request',
      entityId: String(args.requestId),
      entityName: `${request.type} allocation change`,
      performedBy: authContext.userId,
      organisationId: request.organisationId,
      details: `${args.decision === 'approved' ? 'Approved' : 'Rejected'} ${request.type} allocation change for ${lecturer.fullName}`,
      severity: args.decision === 'approved' ? 'info' : 'warning',
      type: 'org',
    });

    return { success: true };
  },
});

async function assertCanViewLecturerWorkload(
  ctx: QueryCtx,
  userId: string,
  lecturer: Doc<'lecturer_profiles'>
) {
  if (lecturer.userSubject === userId) return true;

  const canViewOrg =
    (await hasOrgPermission(
      ctx,
      userId,
      'workload.admin.allocations.view',
      lecturer.organisationId
    )) ||
    (await hasOrgPermission(
      ctx,
      userId,
      'allocations.view',
      lecturer.organisationId
    )) ||
    (await hasOrgPermission(
      ctx,
      userId,
      'allocations.view.org',
      lecturer.organisationId
    ));

  if (canViewOrg) return true;

  const canViewTeam =
    (await hasOrgPermission(
      ctx,
      userId,
      'manager.team.view',
      lecturer.organisationId
    )) ||
    (await hasOrgPermission(
      ctx,
      userId,
      'allocations.view.team',
      lecturer.organisationId
    ));

  if (canViewTeam) {
    await assertCanManageTeamMember(ctx, userId, lecturer);
    return true;
  }

  throw new Error('Permission denied: workload view');
}

async function applyAllocationChangeRequest(
  ctx: MutationCtx,
  request: Doc<'allocation_change_requests'>
) {
  const payload = JSON.parse(request.payload) as {
    allocationType?: 'teaching' | 'admin';
    hoursOverride?: number | null;
  };
  const now = Date.now();

  if (request.type === 'assign') {
    if (!request.groupId || !payload.allocationType) {
      throw new Error('Incomplete assignment request');
    }
    const group = await ctx.db.get(request.groupId);
    if (!group) throw new Error('Group not found');
    const iteration = await ctx.db.get(group.moduleIterationId);
    if (!iteration) throw new Error('Module iteration not found');
    const moduleDoc = await ctx.db.get(iteration.moduleId);
    const baseHours = computeHoursFromCredits(moduleDoc?.credits);

    await ctx.db.insert('group_allocations', {
      groupId: request.groupId,
      lecturerId: request.targetLecturerId,
      academicYearId: request.academicYearId,
      organisationId: request.organisationId,
      type: payload.allocationType,
      hoursComputed: baseHours,
      ...(typeof payload.hoursOverride === 'number'
        ? { hoursOverride: payload.hoursOverride }
        : {}),
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  if (!request.allocationId) {
    throw new Error('Allocation request is missing allocation');
  }

  if (request.type === 'remove') {
    await ctx.db.delete(request.allocationId);
    return;
  }

  const updates: Partial<Doc<'group_allocations'>> = { updatedAt: now };
  if (payload.allocationType) {
    updates.type = payload.allocationType;
  }
  if (payload.hoursOverride !== undefined && payload.hoursOverride !== null) {
    updates.hoursOverride = payload.hoursOverride;
  }
  await ctx.db.patch(request.allocationId, updates);
}
