import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { QueryCtx, MutationCtx } from './_generated/server';
import { writeAudit } from './audit';
import { getAuthContext } from './lib/auth';

function isSystemUser(systemRoles?: string[] | null) {
  const roles = systemRoles || [];
  return roles.some((r) => r === 'sysadmin' || r === 'developer');
}

function isOrgAdmin(systemRoles?: string[] | null) {
  const roles = systemRoles || [];
  return roles.includes('orgadmin');
}

async function getActorAndOrgFromQuery(ctx: QueryCtx, subject: string) {
  const actor = await ctx.db
    .query('users')
    .withIndex('by_subject', (q) => q.eq('subject', subject))
    .first();
  if (!actor) throw new Error('User not found');
  const membership = await ctx.db
    .query('user_organisations')
    .withIndex('by_user', (q) => q.eq('userId', subject))
    .first();
  if (!membership) throw new Error('Organisation context required');
  return {
    actor,
    orgId: membership.organisationId,
  };
}

async function getActorAndOrgFromMutation(ctx: MutationCtx, subject: string) {
  const actor = await ctx.db
    .query('users')
    .withIndex('by_subject', (q) => q.eq('subject', subject))
    .first();
  if (!actor) throw new Error('User not found');
  const membership = await ctx.db
    .query('user_organisations')
    .withIndex('by_user', (q) => q.eq('userId', subject))
    .first();
  if (!membership) throw new Error('Organisation context required');
  return {
    actor,
    orgId: membership.organisationId,
  };
}

export const getOrganisationSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { orgId } = await getActorAndOrgFromQuery(ctx, args.userId);

    // Read current settings
    const row = await ctx.db
      .query('organisation_settings')
      .withIndex('by_organisation', (q) => q.eq('organisationId', orgId))
      .first();

    // Provide sane defaults if missing
    return (
      row || {
        organisationId: orgId,
        staffRoleOptions: [
          'Lecturer',
          'Senior Lecturer',
          'Teaching Fellow',
          'Associate Lecturer',
          'Professor',
        ],
        teamOptions: ['Computing', 'Engineering', 'Business', 'Design'],
        campusOptions: ['Main Campus', 'City Centre'],
        maxClassSizePerGroup: 25,
        baseMaxTeachingAtFTE1: 400,
        baseTotalContractAtFTE1: 550,
        moduleHoursByCredits: [
          { credits: 10, teaching: 24, marking: 24 },
          { credits: 15, teaching: 36, marking: 36 },
          { credits: 20, teaching: 48, marking: 48 },
          { credits: 30, teaching: 72, marking: 72 },
          { credits: 40, teaching: 96, marking: 96 },
        ],
      }
    );
  },
});

// Convenience: get settings for the current actor (no args)
export const getForActor = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const { orgId } = await getActorAndOrgFromQuery(ctx, authContext.userId);
    const row = await ctx.db
      .query('organisation_settings')
      .withIndex('by_organisation', (q) => q.eq('organisationId', orgId))
      .first();
    return (
      row || {
        organisationId: orgId,
        staffRoleOptions: [
          'Lecturer',
          'Senior Lecturer',
          'Teaching Fellow',
          'Associate Lecturer',
          'Professor',
        ],
        teamOptions: ['Computing', 'Engineering', 'Business', 'Design'],
        campusOptions: ['Main Campus', 'City Centre'],
        maxClassSizePerGroup: 25,
        baseMaxTeachingAtFTE1: 400,
        baseTotalContractAtFTE1: 550,
        moduleHoursByCredits: [
          { credits: 10, teaching: 24, marking: 24 },
          { credits: 15, teaching: 36, marking: 36 },
          { credits: 20, teaching: 48, marking: 48 },
          { credits: 30, teaching: 72, marking: 72 },
          { credits: 40, teaching: 96, marking: 96 },
        ],
      }
    );
  },
});

export const upsertOrganisationSettings = mutation({
  args: {
    userId: v.string(),
    staffRoleOptions: v.array(v.string()),
    teamOptions: v.array(v.string()),
    campusOptions: v.optional(v.array(v.string())),
    maxClassSizePerGroup: v.optional(v.float64()),
    baseMaxTeachingAtFTE1: v.float64(),
    baseTotalContractAtFTE1: v.float64(),
    moduleHoursByCredits: v.optional(
      v.array(
        v.object({
          credits: v.number(),
          teaching: v.number(),
          marking: v.number(),
        })
      )
    ),
    roleMaxTeachingRules: v.optional(
      v.array(
        v.object({
          role: v.string(),
          mode: v.union(v.literal('percent'), v.literal('fixed')),
          value: v.float64(),
        })
      )
    ),
    contractFamilyOptions: v.optional(v.array(v.string())),
    familyMaxTeachingRules: v.optional(
      v.array(
        v.object({
          family: v.string(),
          mode: v.union(v.literal('percent'), v.literal('fixed')),
          value: v.float64(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { actor, orgId } = await getActorAndOrgFromMutation(ctx, args.userId);
    const now = Date.now();

    // Authorise: sysadmin/developer override, or orgadmin allowed
    if (!isSystemUser(actor.systemRoles) && !isOrgAdmin(actor.systemRoles)) {
      throw new Error('Permission denied: organisation settings');
    }

    const existing = await ctx.db
      .query('organisation_settings')
      .withIndex('by_organisation', (q) => q.eq('organisationId', orgId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        staffRoleOptions: args.staffRoleOptions,
        teamOptions: args.teamOptions,
        ...(args.campusOptions ? { campusOptions: args.campusOptions } : {}),
        ...(args.maxClassSizePerGroup !== undefined
          ? { maxClassSizePerGroup: args.maxClassSizePerGroup }
          : {}),
        baseMaxTeachingAtFTE1: args.baseMaxTeachingAtFTE1,
        baseTotalContractAtFTE1: args.baseTotalContractAtFTE1,
        ...(args.moduleHoursByCredits
          ? { moduleHoursByCredits: args.moduleHoursByCredits }
          : {}),
        ...(args.roleMaxTeachingRules
          ? { roleMaxTeachingRules: args.roleMaxTeachingRules }
          : {}),
        ...(args.contractFamilyOptions
          ? { contractFamilyOptions: args.contractFamilyOptions }
          : {}),
        ...(args.familyMaxTeachingRules
          ? { familyMaxTeachingRules: args.familyMaxTeachingRules }
          : {}),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('organisation_settings', {
        organisationId: orgId,
        staffRoleOptions: args.staffRoleOptions,
        teamOptions: args.teamOptions,
        ...(args.campusOptions ? { campusOptions: args.campusOptions } : {}),
        ...(args.maxClassSizePerGroup !== undefined
          ? { maxClassSizePerGroup: args.maxClassSizePerGroup }
          : {}),
        baseMaxTeachingAtFTE1: args.baseMaxTeachingAtFTE1,
        baseTotalContractAtFTE1: args.baseTotalContractAtFTE1,
        ...(args.moduleHoursByCredits
          ? { moduleHoursByCredits: args.moduleHoursByCredits }
          : {}),
        ...(args.roleMaxTeachingRules
          ? { roleMaxTeachingRules: args.roleMaxTeachingRules }
          : {}),
        ...(args.contractFamilyOptions
          ? { contractFamilyOptions: args.contractFamilyOptions }
          : {}),
        ...(args.familyMaxTeachingRules
          ? { familyMaxTeachingRules: args.familyMaxTeachingRules }
          : {}),
        createdAt: now,
        updatedAt: now,
      });
    }

    try {
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'organisation_settings',
        entityId: String(orgId),
        performedBy: args.userId,
        organisationId: orgId,
        details: 'Organisation settings updated',
        severity: 'info',
      });
    } catch {
      // Ignore audit write errors silently
    }

    return { updatedAt: now };
  },
});
