import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ensureDefaultsForOrg } from './permissions';
import { writeAudit } from './audit';
import type { Id, MutationCtx } from './_generated/dataModel';

// Get all organisations
export const list = query({
  args: {},
  handler: async (ctx) => {
    const organisations = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .order('desc')
      .collect();

    return organisations;
  },
});

// Reseed defaults for a specific organisation
export const reseedDefaultsForOrg = mutation({
  args: { organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject ?? 'system';

    // Roles & permissions
    await ensureDefaultsForOrg(
      ctx,
      args.organisationId
    );

    // Admin allocation categories from system defaults
    await ctx.runMutation(
      { path: 'allocations/seedOrgAdminCategories' },
      { organisationId: args.organisationId }
    );

    // Ensure organisation settings exist
    const existingSettings = await ctx.db
      .query('organisation_settings')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', args.organisationId)
      )
      .first();
    if (!existingSettings) {
      await ctx.db.insert('organisation_settings', {
        organisationId: args.organisationId,
        staffRoleOptions: [
          'Lecturer',
          'Senior Lecturer',
          'Teaching Fellow',
          'Associate Lecturer',
          'Professor',
        ],
        teamOptions: ['Computing', 'Engineering', 'Business', 'Design'],
        baseMaxTeachingAtFTE1: 400,
        baseTotalContractAtFTE1: 550,
        createdAt: now,
        updatedAt: now,
      });
    }

    try {
      await writeAudit(ctx, {
        action: 'reseed.defaults',
        entityType: 'organisation',
        entityId: String(args.organisationId),
        performedBy: subject,
        organisationId: args.organisationId,
        details: 'Reseeded defaults (roles, categories, settings)',
        severity: 'info',
        type: 'sys',
      });
    } catch {}

    return { ok: true };
  },
});

// Reseed defaults for all active organisations
export const reseedDefaultsAcrossOrganisations = mutation({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
    let processed = 0;
    for (const org of orgs) {
      await ctx.runMutation(
        { path: 'organisations/reseedDefaultsForOrg' },
        { organisationId: org._id }
      );
      processed++;
    }
    return { organisationsProcessed: processed };
  },
});

// Get organisation by ID
export const getById = query({
  args: { id: v.id('organisations') },
  handler: async (ctx, args) => {
    const organisation = await ctx.db.get(args.id);
    return organisation;
  },
});

// Create new organisation
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject;

    const organisationId = await ctx.db.insert('organisations', {
      name: args.name,
      code: args.code,
      ...(args.contactEmail ? { contactEmail: args.contactEmail } : {}),
      ...(args.contactPhone ? { contactPhone: args.contactPhone } : {}),
      ...(args.domain ? { domain: args.domain } : {}),
      ...(args.website ? { website: args.website } : {}),
      isActive: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // Seed default roles and permissions for the organisation
    try {
      await ensureDefaultsForOrg(ctx, organisationId);
    } catch (err) {
      // Do not block org creation if seeding fails; it can be re-run
    }

    // Seed organisation admin allocation categories from system defaults
    try {
      await ctx.runMutation(
        { path: 'allocations/seedOrgAdminCategories' },
        { organisationId }
      );
    } catch (err) {
      // Failed to seed org admin allocation categories
    }

    // Seed default organisation settings
    try {
      const now2 = Date.now();
      await ctx.db.insert('organisation_settings', {
        organisationId,
        staffRoleOptions: [
          'Lecturer',
          'Senior Lecturer',
          'Teaching Fellow',
          'Associate Lecturer',
          'Professor',
        ],
        teamOptions: ['Computing', 'Engineering', 'Business', 'Design'],
        baseMaxTeachingAtFTE1: 400,
        baseTotalContractAtFTE1: 550,
        createdAt: now2,
        updatedAt: now2,
      });
    } catch (err) {
      // Failed to seed organisation settings
    }

    // Audit create
    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'organisation',
        entityId: String(organisationId),
        entityName: args.name,
        performedBy: subject ?? 'system',
        organisationId: organisationId,
        details: `Organisation created (${args.code})`,
        severity: 'info',
        type: 'sys',
      });
    } catch {}

    return organisationId;
  },
});

// Update organisation
export const update = mutation({
  args: {
    id: v.id('organisations'),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject ?? 'system';

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    // Audit update
    try {
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'organisation',
        entityId: String(id),
        performedBy: subject,
        organisationId: id,
        details: 'Organisation updated',
        metadata: JSON.stringify(updates),
        severity: 'info',
        type: 'sys',
      });
    } catch {}

    return id;
  },
});

// Delete organisation (soft delete)
export const remove = mutation({
  args: { id: v.id('organisations') },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      isActive: false,
      status: 'inactive',
      updatedAt: now,
    });

    // Audit delete
    try {
      const identity = await ctx.auth.getUserIdentity();
      const subject = identity?.subject ?? 'system';
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'organisation',
        entityId: String(args.id),
        performedBy: subject,
        organisationId: args.id,
        details: 'Organisation deactivated',
        severity: 'warning',
        type: 'sys',
      });
    } catch {}

    return args.id;
  },
});

// Get organisation by code
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const organisation = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('code'), args.code))
      .filter((q) => q.eq(q.field('isActive'), true))
      .first();

    return organisation;
  },
});

// Get a single organisation by ID
export const get = query({
  args: { organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organisationId);
  },
});
