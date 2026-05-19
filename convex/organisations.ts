import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ensureDefaultsForOrg } from './permissions';
import { writeAudit } from './audit';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getAuthContext } from './lib/auth';

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

export const listForOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const organisations = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    return organisations
      .map((organisation) => ({
        _id: organisation._id,
        name: organisation.name,
        code: organisation.code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Reseed defaults for a specific organisation
export const reseedDefaultsForOrg = mutation({
  args: { userId: v.string(), organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    const now = Date.now();
    const authContext = await getAuthContext(ctx, args);
    const subject = authContext.userId ?? 'system';

    // Roles & permissions
    await ensureDefaultsForOrg(ctx, args.organisationId);

    // Admin allocation categories from system defaults
    await ctx.runMutation(api.allocations.seedOrgAdminCategories, {
      organisationId: args.organisationId,
    });

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
    } catch {
      // Ignore audit write errors silently
    }

    return { ok: true };
  },
});

// Reseed defaults for all active organisations
export const reseedDefaultsAcrossOrganisations = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const orgs = await ctx.db
      .query('organisations')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
    let processed = 0;
    for (const org of orgs) {
      await ctx.runMutation(api.organisations.reseedDefaultsForOrg, {
        userId: args.userId,
        organisationId: org._id,
      });
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
    userId: v.string(),
    name: v.string(),
    code: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const authContext = await getAuthContext(ctx, args);
    const subject = authContext.userId;

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
    } catch {
      // Do not block org creation if seeding fails; it can be re-run
    }

    // Seed organisation admin allocation categories from system defaults
    try {
      const systemCategories = await ctx.db
        .query('admin_allocation_categories')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .collect();

      for (const cat of systemCategories) {
        const insertData: {
          organisationId: Id<'organisations'>;
          name: string;
          description?: string;
          minHours?: number;
          maxHours?: number;
          createdAt: number;
          updatedAt: number;
        } = {
          organisationId,
          name: cat.name,
          createdAt: now,
          updatedAt: now,
        };

        if (cat.description !== undefined) {
          insertData.description = cat.description;
        }
        if (cat.minHours !== undefined) {
          insertData.minHours = cat.minHours;
        }
        if (cat.maxHours !== undefined) {
          insertData.maxHours = cat.maxHours;
        }

        await ctx.db.insert(
          'organisation_admin_allocation_categories',
          insertData
        );
      }
    } catch {
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
    } catch {
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
    } catch {
      // Ignore audit write errors silently
    }

    return organisationId;
  },
});

// Update organisation
export const update = mutation({
  args: {
    userId: v.string(),
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
    const authContext = await getAuthContext(ctx, args);
    const subject = authContext.userId ?? 'system';

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
    } catch {
      // Ignore audit write errors silently
    }

    return id;
  },
});

// Delete organisation (soft delete)
export const remove = mutation({
  args: { userId: v.string(), id: v.id('organisations') },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      isActive: false,
      status: 'inactive',
      updatedAt: now,
    });

    // Audit delete
    try {
      const authContext = await getAuthContext(ctx, args);
      const subject = authContext.userId ?? 'system';
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
    } catch {
      // Ignore audit write errors silently
    }

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
  args: { userId: v.string(), organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organisationId);
  },
});

export const getUserOrganisation = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const membership = await ctx.db
      .query('user_organisations')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const primary =
      membership.find((item) => item.isPrimary) ?? membership[0] ?? null;

    return primary?.organisationId ?? null;
  },
});
