import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireOrgPermission } from './permissions';
import { writeAudit } from './audit';
import { getAuthContext } from './lib/auth';

// Create a new lecturer profile
export const create = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    contract: v.string(), // 'FT', 'PT'
    fte: v.float64(),
    maxTeachingHours: v.float64(),
    totalContract: v.float64(),
    role: v.optional(v.string()),
    teamName: v.optional(v.string()),
    contractFamily: v.optional(v.string()),
    prefWorkingLocation: v.optional(v.string()),
    prefWorkingTime: v.optional(
      v.union(v.literal('am'), v.literal('pm'), v.literal('all_day'))
    ),
    prefSpecialism: v.optional(v.string()),
    prefNotes: v.optional(v.string()),
    userId: v.string(), // Current user ID for permission check
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    // Derive organisationId from the actor's user record
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.userId))
      .first();
    if (!actor) throw new Error('Actor not found');

    // Check permission within org context using derived organisationId
    await requireOrgPermission(
      ctx,
      args.userId,
      'staff.create',
      authContext.organisationId
    );

    const now = Date.now();

    const profileId = await ctx.db.insert('lecturer_profiles', {
      fullName: args.fullName,
      email: args.email,
      contract: args.contract,
      fte: args.fte,
      maxTeachingHours: args.maxTeachingHours,
      totalContract: args.totalContract,
      ...(args.role ? { role: args.role } : {}),
      ...(args.teamName ? { teamName: args.teamName } : {}),
      ...(args.contractFamily ? { contractFamily: args.contractFamily } : {}),
      ...(args.prefWorkingLocation
        ? { prefWorkingLocation: args.prefWorkingLocation }
        : {}),
      ...(args.prefWorkingTime
        ? { prefWorkingTime: args.prefWorkingTime }
        : {}),
      ...(args.prefSpecialism ? { prefSpecialism: args.prefSpecialism } : {}),
      ...(args.prefNotes ? { prefNotes: args.prefNotes } : {}),
      organisationId: authContext.organisationId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Audit create
    await writeAudit(ctx, {
      action: 'create',
      entityType: 'lecturer_profile',
      entityId: String(profileId),
      entityName: args.fullName,
      performedBy: args.userId,
      organisationId: authContext.organisationId,
      details: `Created lecturer profile (${args.contract})`,
      metadata: JSON.stringify({
        email: args.email,
        fte: args.fte,
        maxTeachingHours: args.maxTeachingHours,
        totalContract: args.totalContract,
      }),
      severity: 'info',
      type: 'org',
    });

    return profileId;
  },
});

export const updateOwnPreferences = mutation({
  args: {
    userId: v.string(),
    profileId: v.id('lecturer_profiles'),
    prefWorkingLocation: v.optional(v.string()),
    prefWorkingTime: v.optional(
      v.union(v.literal('am'), v.literal('pm'), v.literal('all_day'))
    ),
    prefSpecialism: v.optional(v.string()),
    prefNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.userSubject !== args.userId) {
      throw new Error('You can only update your own profile preferences');
    }

    await ctx.db.patch(args.profileId, {
      ...(args.prefWorkingLocation !== undefined
        ? { prefWorkingLocation: args.prefWorkingLocation.trim() || undefined }
        : {}),
      ...(args.prefWorkingTime !== undefined
        ? { prefWorkingTime: args.prefWorkingTime }
        : {}),
      ...(args.prefSpecialism !== undefined
        ? { prefSpecialism: args.prefSpecialism.trim() || undefined }
        : {}),
      ...(args.prefNotes !== undefined
        ? { prefNotes: args.prefNotes.trim() || undefined }
        : {}),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update lecturer profile
export const edit = mutation({
  args: {
    profileId: v.id('lecturer_profiles'),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    contract: v.optional(v.string()),
    fte: v.optional(v.float64()),
    maxTeachingHours: v.optional(v.float64()),
    totalContract: v.optional(v.float64()),
    isActive: v.optional(v.boolean()),
    userSubject: v.optional(v.string()), // link to users.subject
    role: v.optional(v.string()),
    teamName: v.optional(v.string()),
    contractFamily: v.optional(v.string()),
    prefWorkingLocation: v.optional(v.string()),
    prefWorkingTime: v.optional(
      v.union(v.literal('am'), v.literal('pm'), v.literal('all_day'))
    ),
    prefSpecialism: v.optional(v.string()),
    prefNotes: v.optional(v.string()),
    userId: v.string(), // Current user ID for permission check
  },
  handler: async (ctx, args) => {
    // Check permission within org context
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Lecturer profile not found');
    }
    await requireOrgPermission(
      ctx,
      args.userId,
      'staff.edit',
      profile.organisationId
    );

    const updates: {
      fullName?: string;
      email?: string;
      contract?: string;
      fte?: number;
      maxTeachingHours?: number;
      totalContract?: number;
      isActive?: boolean;
      userSubject?: string;
      role?: string;
      teamName?: string;
      contractFamily?: string;
      prefWorkingLocation?: string;
      prefWorkingTime?: 'am' | 'pm' | 'all_day';
      prefSpecialism?: string;
      prefNotes?: string;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.fullName !== undefined) updates.fullName = args.fullName;
    if (args.email !== undefined) updates.email = args.email;
    if (args.contract !== undefined) updates.contract = args.contract;
    if (args.fte !== undefined) updates.fte = args.fte;
    if (args.maxTeachingHours !== undefined)
      updates.maxTeachingHours = args.maxTeachingHours;
    if (args.totalContract !== undefined)
      updates.totalContract = args.totalContract;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.userSubject !== undefined) updates.userSubject = args.userSubject;
    if (args.role !== undefined) updates.role = args.role;
    if (args.teamName !== undefined) updates.teamName = args.teamName;
    if (args.prefWorkingLocation !== undefined)
      updates.prefWorkingLocation = args.prefWorkingLocation;
    if (args.prefWorkingTime !== undefined)
      updates.prefWorkingTime = args.prefWorkingTime;
    if (args.prefSpecialism !== undefined)
      updates.prefSpecialism = args.prefSpecialism;
    if (args.prefNotes !== undefined) updates.prefNotes = args.prefNotes;

    await ctx.db.patch(args.profileId, updates);

    // Audit update
    await writeAudit(ctx, {
      action: 'update',
      entityType: 'lecturer_profile',
      entityId: String(args.profileId),
      performedBy: args.userId,
      organisationId: profile.organisationId,
      details: 'Updated lecturer profile',
      metadata: JSON.stringify(updates),
      severity: 'info',
      type: 'org',
    });

    return args.profileId;
  },
});

// List lecturer profiles for an organisation
export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.userId))
      .first();

    if (!actor || !actor.isActive) {
      return [];
    }

    const memberships = await ctx.db
      .query('user_organisations')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const primaryMembership =
      memberships.find((membership) => membership.isPrimary) ??
      memberships[0] ??
      null;

    const organisationId =
      actor.organisationId ?? primaryMembership?.organisationId ?? null;

    if (!organisationId) {
      return [];
    }

    return await ctx.db
      .query('lecturer_profiles')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});

// List lecturer profiles for the current actor (derives organisation from auth)
export const listForActor = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) return [];
    return await ctx.db
      .query('lecturer_profiles')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});

// Get the lecturer profile linked to the current user subject
export const getMine = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.userId))
      .first();

    if (!actor || !actor.isActive) {
      return null;
    }

    const memberships = await ctx.db
      .query('user_organisations')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const primaryMembership =
      memberships.find((membership) => membership.isPrimary) ??
      memberships[0] ??
      null;

    const organisationId =
      actor.organisationId ?? primaryMembership?.organisationId ?? null;

    if (!organisationId) {
      return null;
    }

    const profiles = await ctx.db
      .query('lecturer_profiles')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', organisationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('userSubject'), args.userId),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect();

    return profiles[0] ?? null;
  },
});

// Get a single lecturer profile
export const get = query({
  args: {
    profileId: v.id('lecturer_profiles'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});
