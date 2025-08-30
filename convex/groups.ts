import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { writeAudit } from './audit';
import { requireOrgPermission } from './permissions';
import type { Doc, Id } from './_generated/dataModel';

// List groups under a module iteration
export const listByIteration = query({
  args: { moduleIterationId: v.id('module_iterations') },
  handler: async (ctx, args) => {
    // Enforce view via module org
    const iteration = await ctx.db.get(args.moduleIterationId);
    if (!iteration) return [];
    const moduleDoc = iteration
      ? await ctx.db.get(iteration.moduleId)
      : null;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    if (moduleDoc) {
      await requireOrgPermission(
        ctx,
        identity.subject,
        'groups.view',
        moduleDoc.organisationId
      );
    }
    const groups = await ctx.db
      .query('module_groups')
      .withIndex('by_iteration', (q) =>
        q.eq('moduleIterationId', args.moduleIterationId)
      )
      .order('asc')
      .collect();
    return groups;
  },
});

// Create a group under an iteration
export const create = mutation({
  args: {
    moduleIterationId: v.id('module_iterations'),
    name: v.string(),
    sizePlanned: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error('Unauthenticated');

    const iteration = await ctx.db.get(args.moduleIterationId);
    if (!iteration) throw new Error('Module iteration not found');
    const moduleDoc = await ctx.db.get(iteration.moduleId);
    if (!moduleDoc) throw new Error('Module not found');
    await requireOrgPermission(
      ctx,
      identity.subject,
      'groups.create',
      moduleDoc.organisationId
    );

    const now = Date.now();
    const id = await ctx.db.insert('module_groups', {
      moduleIterationId: args.moduleIterationId,
      name: args.name,
      ...(typeof args.sizePlanned === 'number'
        ? { sizePlanned: args.sizePlanned }
        : {}),
      createdAt: now,
      updatedAt: now,
    });

    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'module_group',
        entityId: String(id),
        performedBy: identity.subject,
        details: `Created group ${args.name}`,
        severity: 'info',
        type: 'org',
      });
    } catch (e) {
      console.error('Error writing audit for group creation:', e);
    }

    return id;
  },
});

// Auto-create groups for an iteration given per-campus group counts.
export const createAutoForIteration = mutation({
  args: {
    moduleIterationId: v.id('module_iterations'),
    campusGroups: v.array(
      v.object({ campus: v.optional(v.string()), groups: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error('Unauthenticated');

    const iteration = await ctx.db.get(args.moduleIterationId);
    if (!iteration) throw new Error('Module iteration not found');
    const moduleDoc = await ctx.db.get(iteration.moduleId);
    if (!moduleDoc) throw new Error('Module not found');
    await requireOrgPermission(
      ctx,
      identity.subject,
      'groups.create',
      moduleDoc.organisationId
    );

    const now = Date.now();
    let created = 0;
    for (const entry of args.campusGroups) {
      const campus = (entry.campus || '').trim();
      const total = Math.max(0, Math.floor(entry.groups || 0));
      for (let i = 1; i <= total; i++) {
        const name = campus ? `${campus} ${i}` : `Group ${i}`;
        await ctx.db.insert('module_groups', {
          moduleIterationId: args.moduleIterationId,
          name,
          ...(campus ? { campusId: campus } : {}),
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
      }
    }

    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'module_groups_auto',
        entityId: String(args.moduleIterationId),
        performedBy: identity.subject,
        details: `Auto-created ${created} groups`,
        severity: 'info',
        type: 'org',
      });
    } catch (e) {
      console.error('Error writing audit for auto group creation:', e);
    }

    return { created };
  },
});

// Delete a group
export const remove = mutation({
  args: { id: v.id('module_groups') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error('Unauthenticated');
    const existing = await ctx.db.get(args.id);
    if (!existing) return args.id;
    const iteration = await ctx.db.get(existing.moduleIterationId);
    const moduleDoc = iteration
      ? await ctx.db.get(iteration.moduleId)
      : null;
    if (!moduleDoc) return args.id;
    await requireOrgPermission(
      ctx,
      identity.subject,
      'groups.delete',
      moduleDoc.organisationId
    );
    await ctx.db.delete(args.id);
    try {
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'module_group',
        entityId: String(args.id),
        performedBy: identity.subject,
        details: `Deleted group ${existing.name}`,
        severity: 'warning',
        type: 'org',
      });
    } catch (e) {
      console.error('Error writing audit for group deletion:', e);
    }
    return args.id;
  },
});
