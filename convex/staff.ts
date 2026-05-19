import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { v } from 'convex/values';
import {
  assertCanManageTeamMember,
  getManagedTeamNames,
  hasOrgPermission,
} from './permissions/index';
import { writeAudit } from './audit';
import { getAuthContext } from './lib/auth';
import type { Doc } from './_generated/dataModel';

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

    const canCreateStaff =
      (await hasOrgPermission(
        ctx,
        args.userId,
        'staff.create',
        authContext.organisationId
      )) ||
      (await hasOrgPermission(
        ctx,
        args.userId,
        'workload.admin.staff.adjust',
        authContext.organisationId
      ));
    if (!canCreateStaff) {
      throw new Error('Permission denied: staff.create');
    }

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
    const canEditStaff =
      (await hasOrgPermission(ctx, args.userId, 'staff.edit', profile.organisationId)) ||
      (await hasOrgPermission(
        ctx,
        args.userId,
        'workload.admin.staff.adjust',
        profile.organisationId
      ));
    if (!canEditStaff) {
      throw new Error('Permission denied: staff.edit');
    }

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

    const profiles = await ctx.db
      .query('lecturer_profiles')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    return filterVisibleProfiles(ctx, args.userId, organisationId, profiles);
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
    const profiles = await ctx.db
      .query('lecturer_profiles')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    return filterVisibleProfiles(
      ctx,
      authContext.userId,
      authContext.organisationId,
      profiles
    );
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
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;
    if (!args.userId) return profile;
    await assertCanViewProfile(ctx, args.userId, profile);
    return profile;
  },
});

export const listTeamAssignmentData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    await requireOrgAdminTeamAccess(ctx, authContext.userId, authContext.organisationId);

    const users = await ctx.db
      .query('users')
      .filter((q) =>
        q.and(
          q.eq(q.field('organisationId'), authContext.organisationId),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect();

    const roles = await ctx.db
      .query('user_roles')
      .filter((q) =>
        q.and(
          q.eq(q.field('organisationId'), authContext.organisationId),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect();

    const assignments = await ctx.db
      .query('user_role_assignments')
      .filter((q) =>
        q.and(
          q.eq(q.field('organisationId'), authContext.organisationId),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect();

    const profiles = await ctx.db
      .query('lecturer_profiles')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const allTeamAssignments = await ctx.db
      .query('manager_team_assignments')
      .filter((q) => q.eq(q.field('organisationId'), authContext.organisationId))
      .collect();

    const settings = await ctx.db
      .query('organisation_settings')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .first();

    const userProfiles = await ctx.db
      .query('user_profiles')
      .filter((q) => q.eq(q.field('organisationId'), authContext.organisationId))
      .collect();

    const roleById = new Map(roles.map((role) => [String(role._id), role]));
    const roleNamesByUser = new Map<string, string[]>();
    for (const assignment of assignments) {
      const role = roleById.get(String(assignment.roleId));
      if (!role) continue;
      const existing = roleNamesByUser.get(assignment.userId) ?? [];
      roleNamesByUser.set(assignment.userId, [...existing, role.name]);
    }
    for (const profile of userProfiles) {
      if (!profile.orgRoles || profile.orgRoles.length === 0) continue;
      const existing = roleNamesByUser.get(profile.userId) ?? [];
      roleNamesByUser.set(profile.userId, [
        ...new Set([...existing, ...profile.orgRoles]),
      ]);
    }

    return {
      teamOptions: settings?.teamOptions ?? [],
      users: users.map((user) => ({
        subject: user.subject,
        fullName: user.fullName,
        email: user.email,
        roleNames: roleNamesByUser.get(user.subject) ?? [],
        systemRoles: user.systemRoles,
      })),
      profiles: profiles.map((profile) => ({
        _id: profile._id,
        fullName: profile.fullName,
        email: profile.email,
        userSubject: profile.userSubject,
        teamName: profile.teamName,
        role: profile.role,
      })),
      assignments: allTeamAssignments,
    };
  },
});

export const setManagerTeamAssignments = mutation({
  args: {
    userId: v.string(),
    managerUserId: v.string(),
    teamNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    await requireOrgAdminTeamAccess(ctx, authContext.userId, authContext.organisationId);

    const manager = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', args.managerUserId))
      .first();

    if (
      !manager ||
      String(manager.organisationId) !== String(authContext.organisationId)
    ) {
      throw new Error('Manager must belong to your organisation');
    }

    const now = Date.now();
    const nextTeams = [...new Set(args.teamNames.map((team) => team.trim()).filter(Boolean))];
    const existing = await ctx.db
      .query('manager_team_assignments')
      .withIndex('by_manager_org', (q) =>
        q.eq('managerUserId', args.managerUserId).eq('organisationId', authContext.organisationId)
      )
      .collect();

    for (const assignment of existing) {
      const shouldBeActive = nextTeams.includes(assignment.teamName);
      if (assignment.isActive !== shouldBeActive) {
        await ctx.db.patch(assignment._id, {
          isActive: shouldBeActive,
          updatedAt: now,
        });
      }
    }

    const existingTeamNames = new Set(existing.map((assignment) => assignment.teamName));
    for (const teamName of nextTeams) {
      if (existingTeamNames.has(teamName)) continue;
      await ctx.db.insert('manager_team_assignments', {
        managerUserId: args.managerUserId,
        organisationId: authContext.organisationId,
        teamName,
        isActive: true,
        assignedBy: authContext.userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await writeAudit(ctx, {
      action: 'manager.team_assignments.updated',
      entityType: 'manager_team_assignments',
      entityId: args.managerUserId,
      entityName: manager.fullName,
      performedBy: authContext.userId,
      organisationId: authContext.organisationId,
      details: `Updated manager team assignments: ${nextTeams.join(', ') || 'none'}`,
      severity: 'info',
      type: 'org',
    });

    return { success: true, teamNames: nextTeams };
  },
});

export const setStaffTeamAssignment = mutation({
  args: {
    userId: v.string(),
    profileId: v.id('lecturer_profiles'),
    teamName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    await requireOrgAdminTeamAccess(ctx, authContext.userId, authContext.organisationId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error('Staff profile not found');
    if (String(profile.organisationId) !== String(authContext.organisationId)) {
      throw new Error('Cannot assign staff outside your organisation');
    }

    const teamName = args.teamName?.trim();
    await ctx.db.patch(args.profileId, {
      ...(teamName ? { teamName } : { teamName: undefined }),
      updatedAt: Date.now(),
    });

    await writeAudit(ctx, {
      action: 'staff.team_assignment.updated',
      entityType: 'lecturer_profile',
      entityId: String(args.profileId),
      entityName: profile.fullName,
      performedBy: authContext.userId,
      organisationId: authContext.organisationId,
      details: `Updated staff team assignment to ${teamName || 'none'}`,
      severity: 'info',
      type: 'org',
    });

    return { success: true };
  },
});

export const getTeamWorkloadDashboard = query({
  args: {
    userId: v.string(),
    academicYearId: v.id('academic_years'),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const canViewOrg =
      (await hasOrgPermission(
        ctx,
        authContext.userId,
        'workload.admin.staff.view',
        authContext.organisationId
      )) ||
      (await hasOrgPermission(
        ctx,
        authContext.userId,
        'permissions.manage',
        authContext.organisationId
      ));

    const teamNames = canViewOrg
      ? null
      : await getManagedTeamNames(ctx, authContext.userId, authContext.organisationId);

    const profiles = await ctx.db
      .query('lecturer_profiles')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const visibleProfiles = canViewOrg
      ? profiles
      : profiles.filter(
          (profile) =>
            (profile.teamName && teamNames?.includes(profile.teamName)) ||
            profile.userSubject === authContext.userId
        );

    const members = await Promise.all(
      visibleProfiles.map(async (profile) => {
        const allocations = await ctx.db
          .query('group_allocations')
          .withIndex('by_lecturer', (q) => q.eq('lecturerId', profile._id))
          .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
          .collect();

        const adminAllocations = await ctx.db
          .query('admin_allocations')
          .withIndex('by_year', (q) => q.eq('academicYearId', args.academicYearId))
          .filter((q) => q.eq(q.field('staffId'), String(profile._id)))
          .collect();

        const teaching = allocations
          .filter((allocation) => allocation.type === 'teaching')
          .reduce(
            (sum, allocation) =>
              sum + (allocation.hoursOverride ?? allocation.hoursComputed ?? 0),
            0
          );
        const moduleAdmin = allocations
          .filter((allocation) => allocation.type === 'admin')
          .reduce(
            (sum, allocation) =>
              sum + (allocation.hoursOverride ?? allocation.hoursComputed ?? 0),
            0
          );
        const standaloneAdmin = adminAllocations.reduce(
          (sum, allocation) => sum + allocation.hours,
          0
        );

        const total = teaching + moduleAdmin + standaloneAdmin;
        const maxTeaching = Number(profile.maxTeachingHours) || 0;
        const maxTotal = Number(profile.totalContract) || 0;

        return {
          _id: profile._id,
          fullName: profile.fullName,
          email: profile.email,
          userSubject: profile.userSubject,
          teamName: profile.teamName,
          role: profile.role,
          contract: profile.contract,
          fte: profile.fte,
          maxTeachingHours: maxTeaching,
          totalContract: maxTotal,
          teaching,
          admin: moduleAdmin + standaloneAdmin,
          total,
          teachingPct: maxTeaching > 0 ? Math.round((teaching / maxTeaching) * 100) : 0,
          totalPct: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0,
          allocationCount: allocations.length + adminAllocations.length,
          isCurrentUser: profile.userSubject === authContext.userId,
        };
      })
    );

    return {
      teamNames: teamNames ?? [...new Set(members.map((member) => member.teamName).filter(Boolean))],
      members,
    };
  },
});

async function filterVisibleProfiles(
  ctx: QueryCtx,
  userId: string,
  organisationId: Doc<'lecturer_profiles'>['organisationId'],
  profiles: Doc<'lecturer_profiles'>[]
) {
  const canViewOrg =
    (await hasOrgPermission(ctx, userId, 'staff.view.org', organisationId)) ||
    (await hasOrgPermission(
      ctx,
      userId,
      'workload.admin.staff.view',
      organisationId
    ));

  if (canViewOrg) return profiles;

  const canViewTeam =
    (await hasOrgPermission(ctx, userId, 'staff.view.team', organisationId)) ||
    (await hasOrgPermission(ctx, userId, 'manager.team.view', organisationId));

  if (canViewTeam) {
    const teamNames = await getManagedTeamNames(ctx, userId, organisationId);
    return profiles.filter(
      (profile) => profile.teamName && teamNames.includes(profile.teamName)
    );
  }

  return profiles.filter((profile) => profile.userSubject === userId);
}

async function requireOrgAdminTeamAccess(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  organisationId: Doc<'lecturer_profiles'>['organisationId']
) {
  const canManagePermissions = await hasOrgPermission(
    ctx,
    userId,
    'permissions.manage',
    organisationId
  );
  if (!canManagePermissions) {
    throw new Error('Permission denied: permissions.manage');
  }
}

async function assertCanViewProfile(
  ctx: QueryCtx,
  userId: string,
  profile: Doc<'lecturer_profiles'>
) {
  if (profile.userSubject === userId) return true;

  const canViewOrg =
    (await hasOrgPermission(ctx, userId, 'staff.view.org', profile.organisationId)) ||
    (await hasOrgPermission(
      ctx,
      userId,
      'workload.admin.staff.view',
      profile.organisationId
    ));
  if (canViewOrg) return true;

  await assertCanManageTeamMember(ctx, userId, profile);
  return true;
}
