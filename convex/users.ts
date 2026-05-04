import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';

import { requirePermission } from './permissions';
import { writeAudit } from './audit';
import type { Id, Doc } from './_generated/dataModel';
import { requireOrgPermission } from './permissions';
import { makeLoaders } from '../src/lib/convex/loaders';

type DbAuthRole = 'sysadmin' | 'org_admin' | 'member';

function normalizeDbSystemRole(role: string | undefined): DbAuthRole {
  const normalized = role
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'sysadmin':
    case 'developer':
    case 'dev':
    case 'systemadmin':
    case 'admin':
      return 'sysadmin';
    case 'org_admin':
    case 'orgadmin':
    case 'organisation_admin':
      return 'org_admin';
    default:
      return 'member';
  }
}

function normalizeDbOrgRole(role: string | undefined): DbAuthRole {
  const normalized = role
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    normalized === 'org_admin' ||
    normalized === 'orgadmin' ||
    normalized === 'organisation_admin' ||
    normalized === 'admin'
  ) {
    return 'org_admin';
  }

  return 'member';
}

function resolveDbAuthRole(
  systemRoles: string[] | undefined,
  organisationRoles: string[]
): DbAuthRole {
  if (systemRoles?.some((role) => normalizeDbSystemRole(role) === 'sysadmin')) {
    return 'sysadmin';
  }
  if (
    systemRoles?.some((role) => normalizeDbSystemRole(role) === 'org_admin') ||
    organisationRoles.some((role) => normalizeDbOrgRole(role) === 'org_admin')
  ) {
    return 'org_admin';
  }
  return 'member';
}

async function ensureMembershipDocument(
  ctx: MutationCtx,
  userId: string,
  organisationId: Id<'organisations'>,
  isPrimary?: boolean
) {
  const existing = await ctx.db
    .query('user_organisations')
    .withIndex('by_user_org', (q) =>
      q.eq('userId', userId).eq('organisationId', organisationId)
    )
    .first();

  const now = Date.now();
  if (!existing) {
    await ctx.db.insert('user_organisations', {
      userId,
      organisationId,
      isPrimary: isPrimary ?? true,
      createdAt: now,
      updatedAt: now,
    });
  } else if (isPrimary !== undefined && existing.isPrimary !== isPrimary) {
    await ctx.db.patch(existing._id, {
      isPrimary,
      updatedAt: now,
    });
  }

  if (isPrimary) {
    const memberships = await ctx.db
      .query('user_organisations')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    for (const membership of memberships) {
      if (
        String(membership.organisationId) !== String(organisationId) &&
        membership.isPrimary
      ) {
        await ctx.db.patch(membership._id, {
          isPrimary: false,
          updatedAt: now,
        });
      }
    }
  }
}

async function getPrimaryUserOrganisationId(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<Id<'organisations'> | null> {
  const memberships = await ctx.db
    .query('user_organisations')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  return (
    memberships.find((membership) => membership.isPrimary)?.organisationId ??
    memberships[0]?.organisationId ??
    null
  );
}

function splitEmailName(email: string) {
  const localPart = email.split('@')[0] || 'User';
  const normalised = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  const name = normalised || 'User';

  return {
    givenName: name.split(' ')[0] || 'User',
    familyName: name.split(' ').slice(1).join(' '),
    fullName: name,
  };
}

export const syncUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error('userId is required');
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.userId))
      .first();

    // Build names (WorkOS first, fallback to email)
    const fallback = splitEmailName(args.email);

    const givenName = args.givenName || fallback.givenName;
    const familyName = args.familyName || fallback.familyName;

    const fullName =
      [givenName, familyName].filter(Boolean).join(' ') ||
      fallback.fullName;

    let userDoc;

    if (existing) {
      const updates: Partial<Doc<'users'>> = {
        updatedAt: Date.now(),
      };

      if (existing.email !== args.email) {
        updates.email = args.email;
      }

      // ✅ update names if changed (important)
      if (
        existing.givenName !== givenName ||
        existing.familyName !== familyName
      ) {
        updates.givenName = givenName;
        updates.familyName = familyName;
        updates.fullName = fullName;
      }

      if (!existing.isActive) {
        updates.isActive = true;
      }

      await ctx.db.patch(existing._id, updates);
      userDoc = await ctx.db.get(existing._id);
    } else {
      const now = Date.now();

      const insertedId = await ctx.db.insert('users', {
        email: args.email,
        givenName,
        familyName,
        fullName,
        systemRoles: ['user'],
        subject: args.userId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      userDoc = await ctx.db.get(insertedId);
    }

    const membership = await ctx.db
      .query('user_organisations')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    return { user: userDoc, needsOrganisation: !membership };
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    username: v.optional(v.string()),
    givenName: v.string(),
    familyName: v.string(),
    fullName: v.optional(v.string()),
    systemRoles: v.array(v.string()),
    // Do not trust client org; derive from actor when userId is present.
    // Keep optional to allow webhook/system calls to provide it explicitly.
    organisationId: v.optional(v.id('organisations')),
    pictureUrl: v.optional(v.string()),
    subject: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    password: v.optional(v.string()),
    sendEmailInvitation: v.optional(v.boolean()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If an authenticated actor is performing this (userId present), derive org from the actor
    // and enforce scope. For webhook calls (no userId), fall back to provided organisationId.
    let derivedOrganisationId: Id<'organisations'> | undefined =
      args.organisationId;

    if (args.userId) {
      await requirePermission(ctx, args.userId, 'users.invite');
      // Enforce org scope for non-system actors
      const actor = await ctx.db
        .query('users')
        .withIndex('by_subject', (q) => q.eq('subject', args.userId as string))
        .first();
      if (actor) {
        // If explicit organisationId provided, allow assigning user to a different org
        if (args.organisationId) {
          derivedOrganisationId = args.organisationId as Id<'organisations'>;
        } else {
          // Otherwise default to actor's org
          derivedOrganisationId = actor.organisationId as Id<'organisations'>;
        }
      }
    }

    // For non-actor/system contexts (e.g., webhook), require organisationId to be present
    if (!derivedOrganisationId) {
      if (!args.organisationId) {
        throw new Error('organisationId is required for system/webhook calls');
      }
      derivedOrganisationId = args.organisationId as Id<'organisations'>;
    }

    const base = {
      email: args.email,
      givenName: args.givenName,
      familyName: args.familyName,
      fullName: args.fullName || `${args.givenName} ${args.familyName}`,
      systemRoles: args.systemRoles,
      organisationId: derivedOrganisationId,
      subject: args.subject || '',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as const;
    const optional: {
      username?: string;
      pictureUrl?: string;
      tokenIdentifier?: string;
    } = {
      ...(args.username ? { username: args.username } : {}),
      ...(args.pictureUrl ? { pictureUrl: args.pictureUrl } : {}),
      ...(args.tokenIdentifier
        ? { tokenIdentifier: args.tokenIdentifier }
        : {}),
    };
    const userId = await ctx.db.insert('users', { ...base, ...optional });
    if (base.subject) {
      await ensureMembershipDocument(
        ctx,
        base.subject,
        base.organisationId,
        true
      );
    }

    // Audit invite/create when initiated by an authenticated actor
    if (args.userId) {
      try {
        await writeAudit(ctx, {
          action: 'user.invited',
          entityType: 'user',
          entityId: String(userId),
          entityName: base.email,
          performedBy: args.userId,
          organisationId: base.organisationId,
          details: `User invited: ${base.email}`,
          metadata: JSON.stringify({
            username: optional.username,
            systemRoles: base.systemRoles,
          }),
          severity: 'info',
          type: 'sys',
        });
      } catch {
        // Ignore audit write errors silently
      }
    }

    return userId;
  },
});

export const update = mutation({
  args: {
    id: v.id('users'),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    systemRoles: v.optional(v.array(v.string())),
    organisationId: v.optional(v.id('organisations')),
    isActive: v.optional(v.boolean()),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.currentUserId))
      .first();

    const targetUser = await ctx.db.get(args.id);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Enforce granular permission within target user's organisation
    await requireOrgPermission(
      ctx,
      args.currentUserId,
      'users.edit',
      String(targetUser.organisationId)
    );

    const { id, ...updates } = args;

    // Guardrails: Only system admins (sysadmin/developer/admin) may modify systemRoles
    if (updates.systemRoles) {
      const isSystemActor =
        !!actor &&
        Array.isArray(actor.systemRoles) &&
        actor.systemRoles.some((r: string) =>
          ['admin', 'sysadmin', 'developer'].includes(r)
        );
      if (!isSystemActor) {
        throw new Error(
          'Unauthorized: Only system administrators may change system roles'
        );
      }
      // Prevent assigning protected roles unless actor is sysadmin
      const assigningProtected = updates.systemRoles.some(
        (r: string) => r === 'sysadmin' || r === 'developer'
      );
      const actorIsSysadmin =
        !!actor &&
        Array.isArray(actor.systemRoles) &&
        actor.systemRoles.includes('sysadmin');
      if (assigningProtected && !actorIsSysadmin) {
        throw new Error(
          'Unauthorized: Only sysadmin may assign developer/sysadmin roles'
        );
      }
    }

    // If email is being updated, ensure it's unique
    if (updates.email) {
      const existingUser = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('email'), updates.email))
        .filter((q) => q.neq(q.field('_id'), id))
        .first();

      if (existingUser) {
        throw new Error('Email address is already in use');
      }
    }

    // Update fullName if givenName or familyName is being updated
    if (updates.givenName || updates.familyName) {
      const currentUser = targetUser;
      if (currentUser) {
        const givenName = updates.givenName ?? currentUser.givenName;
        const familyName = updates.familyName ?? currentUser.familyName;
        updates.fullName = `${givenName} ${familyName}`;
      }
    }

    await ctx.db.patch(id, updates);
    if (updates.organisationId && targetUser.subject) {
      await ensureMembershipDocument(
        ctx,
        targetUser.subject,
        updates.organisationId,
        true
      );
    }

    // Audit update
    try {
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'user',
        entityId: String(id),
        performedBy: args.currentUserId,
        details: 'User updated',
        metadata: JSON.stringify(updates),
        severity: 'info',
        type: 'sys',
      });
    } catch {
      // Ignore audit write errors silently
    }
  },
});

// Ensure a user has a membership row for an organisation (optionally set as primary)
export const ensureMembership = mutation({
  args: {
    userId: v.string(), // WorkOS subject
    organisationId: v.id('organisations'),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.userId))
      .first();
    if (!user) throw new Error('User not found');

    await ensureMembershipDocument(
      ctx,
      args.userId,
      args.organisationId,
      args.isPrimary
    );

    return { ensured: true };
  },
});

export const updateEmail = mutation({
  args: {
    userId: v.id('users'),
    newEmail: v.string(),
    currentUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get the current user to check their subject for permissions
    const currentUser = await ctx.db.get(args.currentUserId);
    if (!currentUser) {
      throw new Error('Current user not found');
    }

    await requirePermission(ctx, currentUser.subject, 'users.edit');

    // Check if the new email is already in use by another user
    const existingUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), args.newEmail))
      .filter((q) => q.neq(q.field('_id'), args.userId))
      .first();

    if (existingUser) {
      throw new Error('Email address is already in use by another user');
    }

    // Update the email
    await ctx.db.patch(args.userId, {
      email: args.newEmail,
    });

    // Audit email change
    try {
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'user',
        entityId: String(args.userId),
        performedBy: currentUser.subject,
        details: 'User email updated',
        metadata: JSON.stringify({ newEmail: args.newEmail }),
        severity: 'info',
        type: 'sys',
      });
    } catch {
      // Ignore audit write errors silently
    }
  },
});

export const list = query({
  args: {
    organisationId: v.optional(v.id('organisations')),
  },
  handler: async (ctx, args) => {
    const loaders = makeLoaders();
    let users: Doc<'users'>[] = [];
    if (args.organisationId) {
      // Prefer memberships table when present; fall back to legacy field for now
      const memberships = await ctx.db
        .query('user_organisations')
        .withIndex('by_org', (q) =>
          q.eq('organisationId', args.organisationId as Id<'organisations'>)
        )
        .collect()
        .catch(() => [] as Array<{ userId: string }>);

      if (Array.isArray(memberships) && memberships.length > 0) {
        const userIds = memberships.map((m) => m.userId);
        // Use OR conditions instead of 'in' operator
        const userQueries = userIds.map((userId) =>
          ctx.db
            .query('users')
            .withIndex('by_subject', (q) => q.eq('subject', userId))
            .first()
        );
        const userResults = await Promise.all(userQueries);
        users = userResults.filter(
          (u): u is NonNullable<typeof u> => u !== null
        );
      } else {
        users = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('organisationId'), args.organisationId))
          .collect();
      }
    } else {
      users = await ctx.db.query('users').collect();
    }

    // Get organisation details for each user using bulk batching
    const usersWithOrganisations = await Promise.all(
      users.map(async (user) => {
        const organisationId =
          user.organisationId ??
          (await getPrimaryUserOrganisationId(ctx, user.subject));
        const organisation = organisationId
          ? await loaders.orgsById.load(ctx, organisationId)
          : null;

        // Get all current organisational role assignments for this user in their org (support multiple)
        const assignments = organisationId
          ? await ctx.db
              .query('user_role_assignments')
              .withIndex('by_user_org', (q) =>
                q.eq('userId', user.subject).eq('organisationId', organisationId)
              )
              .filter((q) => q.eq(q.field('isActive'), true))
              .collect()
          : [];

        // Use bulk batching for role lookups instead of N+1 queries
        const organisationalRoles: Array<{
          id: Id<'user_roles'>;
          name: string;
          description: string;
        } | null> = [];

        if (assignments.length > 0) {
          const roleIds = assignments.map((a) => a.roleId);
          const roles = await loaders.rolesById.loadMany(ctx, roleIds);

          for (const a of assignments) {
            const role = roles.get(a.roleId as unknown as string);
            if (role && role.isActive) {
              organisationalRoles.push({
                id: role._id,
                name: role.name,
                description: role.description,
              });
            }
          }
        }

        // Back-compat: primary role as first, if any
        const organisationalRole = organisationalRoles[0] || null;

        return {
          ...user,
          organisation: organisation
            ? {
                id: organisation._id,
                name: organisation.name,
                code: organisation.code,
              }
            : undefined,
          organisationalRoles,
          organisationalRole,
        };
      })
    );

    return usersWithOrganisations;
  },
});

export const get = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.subject))
      .first();
  },
});

export const getAuthContext = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.subject))
      .first();

    if (!user || !user.isActive) return null;

    const memberships = await ctx.db
      .query('user_organisations')
      .withIndex('by_user', (q) => q.eq('userId', args.subject))
      .collect();
    const membershipsWithOrganisations = await Promise.all(
      memberships.map(async (membership) => ({
        membership,
        organisation: await ctx.db.get(membership.organisationId),
      }))
    );
    const activeMemberships = membershipsWithOrganisations.filter(
      ({ organisation }) => organisation?.isActive
    );
    const primaryMembership =
      activeMemberships.find(({ membership }) => membership.isPrimary) ??
      activeMemberships[0] ??
      null;

    if (!primaryMembership) {
      return {
        id: user._id,
        subject: user.subject,
        email: user.email,
        fullName: user.fullName,
        organisationId: null,
        systemRoles: user.systemRoles,
        organisationRoles: [] as string[],
        role: resolveDbAuthRole(user.systemRoles, []),
        memberships: [],
        isActive: user.isActive,
      };
    }

    const organisationId = primaryMembership.membership.organisationId;

    async function getOrganisationRoles(orgId: Id<'organisations'>) {
      const assignments = await ctx.db
        .query('user_role_assignments')
        .withIndex('by_user_org', (q) =>
          q.eq('userId', args.subject).eq('organisationId', orgId)
        )
        .filter((q) => q.eq(q.field('isActive'), true))
        .collect();

      const roles = await Promise.all(
        assignments.map((assignment) => ctx.db.get(assignment.roleId))
      );

      return roles
        .filter((role): role is NonNullable<typeof role> => role !== null)
        .filter((role) => role.isActive)
        .map((role) => role.name);
    }

    const organisationRoles = await getOrganisationRoles(organisationId);
    const membershipContexts = await Promise.all(
      activeMemberships.map(async ({ membership }) => {
        const roles = await getOrganisationRoles(membership.organisationId);
        return {
          userId: args.subject,
          orgId: membership.organisationId,
          role: resolveDbAuthRole(user.systemRoles, roles),
          isPrimary: membership.isPrimary,
        };
      })
    );

    return {
      id: user._id,
      subject: user.subject,
      email: user.email,
      fullName: user.fullName,
      organisationId,
      systemRoles: user.systemRoles,
      organisationRoles,
      role: resolveDbAuthRole(user.systemRoles, organisationRoles),
      memberships: membershipContexts,
      isActive: user.isActive,
    };
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

// Mutation to delete a user (soft delete by setting isActive to false)
export const remove = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('subject'), args.userId))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(user._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Audit
    try {
      await writeAudit(ctx, {
        action: 'deactivate',
        entityType: 'user',
        entityId: user.subject,
        entityName: user.fullName,
        performedBy: user.subject,
        ...(user.organisationId ? { organisationId: user.organisationId } : {}),
        details: 'User deactivated',
        severity: 'warning',
        type: 'sys',
      });
    } catch {
      // Ignore audit write errors silently
    }

    return user._id;
  },
});

// Mutation to hard delete a user (completely remove from database)
export const hardDelete = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('subject'), args.userId))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Hard delete by removing the user from the database
    await ctx.db.delete(user._id);

    // Audit
    try {
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'user',
        entityId: user.subject,
        entityName: user.fullName,
        performedBy: user.subject,
        ...(user.organisationId ? { organisationId: user.organisationId } : {}),
        details: 'User hard deleted',
        severity: 'critical',
        type: 'sys',
      });
    } catch {
      // Ignore audit write errors silently
    }

    return user._id;
  },
});

// Query to get users by organisation
export const listByOrganisation = query({
  args: { organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('organisationId'), args.organisationId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    return users;
  },
});

// Query to get all users by organisation (including inactive)
export const listAllByOrganisation = query({
  args: { organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('organisationId'), args.organisationId))
      .collect();

    return users;
  },
});

// Mutation to update last sign in time
export const updateLastSignIn = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('subject'), args.userId))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      lastSignInAt: Date.now(),
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Webhook-specific mutation to update user data (no permission check)
export const updateByWebhook = mutation({
  args: {
    userId: v.string(), // WorkOS user ID (subject)
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    systemRoles: v.optional(v.array(v.string())),
    organisationId: v.optional(v.string()), // Can be empty string for webhook calls
    pictureUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('subject'), args.userId))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const { ...updates } = args;

    // Build a safe update object with correct types
    const processedUpdates: Partial<Doc<'users'>> & Record<string, unknown> =
      {};

    if (updates.email !== undefined) processedUpdates.email = updates.email;
    if (updates.username !== undefined)
      processedUpdates.username = updates.username;
    if (updates.givenName !== undefined)
      processedUpdates.givenName = updates.givenName;
    if (updates.familyName !== undefined)
      processedUpdates.familyName = updates.familyName;
    if (updates.fullName !== undefined)
      processedUpdates.fullName = updates.fullName;
    if (updates.systemRoles !== undefined)
      processedUpdates.systemRoles = updates.systemRoles;
    if (updates.pictureUrl !== undefined)
      processedUpdates.pictureUrl = updates.pictureUrl;

    // Handle organisation ID conversion
    if (updates.organisationId && updates.organisationId !== '') {
      try {
        const org = await ctx.db
          .query('organisations')
          .filter((q) =>
            q.eq(
              q.field('_id'),
              updates.organisationId as unknown as Id<'organisations'>
            )
          )
          .first();
        if (org) {
          processedUpdates.organisationId = org._id;
        }
      } catch {
        // ignore invalid org id
      }
    }

    // Update fullName if givenName or familyName is being updated
    if (updates.givenName || updates.familyName) {
      const givenName = updates.givenName ?? user.givenName;
      const familyName = updates.familyName ?? user.familyName;
      processedUpdates.fullName = `${givenName} ${familyName}`;
    }

    processedUpdates.updatedAt = Date.now();

    await ctx.db.patch(user._id, processedUpdates);
    if (processedUpdates.organisationId) {
      await ensureMembershipDocument(
        ctx,
        args.userId,
        processedUpdates.organisationId as Id<'organisations'>,
        true
      );
    }

    // Audit webhook update (system)
    try {
      const auditOrganisationId =
        processedUpdates.organisationId || user.organisationId;
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'user',
        entityId: String(user._id),
        entityName: user.fullName || user.email,
        performedBy: 'system',
        ...(auditOrganisationId
          ? { organisationId: auditOrganisationId as Id<'organisations'> }
          : {}),
        details: 'User updated via webhook',
        metadata: JSON.stringify(processedUpdates),
        severity: 'info',
        type: 'sys',
      });
    } catch {
      // Ignore audit write errors silently
    }

    return user._id;
  },
});

export const completeOnboarding = mutation({
  args: {
    subject: v.string(), // WorkOS user ID
    onboardingData: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      department: v.optional(v.string()),
      role: v.optional(v.string()),
      customRole: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.subject))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const data = args.onboardingData;

    // Prepare updates object with onboarding completion
    const updates: Partial<Doc<'users'>> & Record<string, unknown> = {
      onboardingCompleted: true,
      onboardingData: args.onboardingData,
      onboardingCompletedAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Update profile fields from onboarding data if provided
    if (data.firstName && data.firstName !== user.givenName) {
      updates.givenName = data.firstName;
    }

    if (data.lastName && data.lastName !== user.familyName) {
      updates.familyName = data.lastName;
    }

    // Update full name if first or last name changed
    if (updates.givenName || updates.familyName) {
      const firstName = updates.givenName || user.givenName;
      const lastName = updates.familyName || user.familyName;
      updates.fullName = `${firstName} ${lastName}`;
    }

    if (data.email && data.email !== user.email) {
      updates.email = data.email;
    }

    if (data.phone) {
      updates.phone = data.phone;
    }

    if (data.department) {
      updates.department = data.department;
    }

    // Handle job role (use customRole if role is "other", otherwise use role)
    if (data.role) {
      if (data.role === 'other' && data.customRole) {
        updates.jobRole = data.customRole;
      } else if (data.role !== 'other') {
        updates.jobRole = data.role;
      }
    }

    await ctx.db.patch(user._id, updates);

    // Audit onboarding completion
    try {
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'user',
        entityId: String(user._id),
        entityName: updates.fullName || user.fullName || user.email,
        performedBy: user.subject,
        ...(user.organisationId ? { organisationId: user.organisationId } : {}),
        details: 'Onboarding completed',
        metadata: JSON.stringify(updates),
        severity: 'info',
        type: 'org',
      });
    } catch {
      // Ignore audit write errors silently
    }

    return user._id;
  },
});

export const updateUserAvatar = mutation({
  args: {
    subject: v.string(), // WorkOS user ID
    pictureUrl: v.string(), // New avatar URL from WorkOS
  },
  handler: async (ctx, args) => {
    const { subject, pictureUrl } = args;

    // Find the user by WorkOS subject ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', subject))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Update the user's picture URL
    const updatedUser = await ctx.db.patch(user._id, {
      pictureUrl,
      updatedAt: Date.now(),
    });

    // Log the avatar update
    await writeAudit(ctx, {
      action: 'update',
      entityType: 'user',
      entityId: String(user._id),
      entityName: user.fullName,
      performedBy: subject,
      performedByName: user.fullName,
      ...(user.organisationId ? { organisationId: user.organisationId } : {}),
      details: 'Updated profile picture',
      metadata: JSON.stringify({
        previousPictureUrl: user.pictureUrl,
        newPictureUrl: pictureUrl,
      }),
      severity: 'info',
      type: 'sys',
    });

    return updatedUser;
  },
});

export const getUserAvatar = query({
  args: {
    subject: v.string(), // WorkOS user ID
  },
  handler: async (ctx, args) => {
    const { subject } = args;

    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', subject))
      .first();

    return user?.pictureUrl || null;
  },
});
