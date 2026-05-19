import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_ERRORS } from './constants';

async function getPrimaryOrganisationId(
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

function isSystemUser(user: Doc<'users'> | null) {
  if (!user?.systemRoles || user.systemRoles.length === 0) return false;
  const systemRoles: ReadonlyArray<string> = [
    'admin',
    'sysadmin',
    'developer',
  ] as const;
  return user.systemRoles.some((role: string) => systemRoles.includes(role));
}

function canonicalOrgRoleName(name: string) {
  const role = name.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (
    role === 'organisation admin' ||
    role === 'organization admin' ||
    role === 'org admin' ||
    role === 'orgadmin' ||
    role === 'admin'
  ) {
    return 'Organisation Admin';
  }
  if (role === 'workload admin' || role === 'workloadadmin') {
    return 'Workload Admin';
  }
  if (role === 'manager' || role === 'team manager') {
    return 'Manager';
  }
  if (role === 'user' || role === 'viewer' || role === 'lecturer') {
    return 'User';
  }
  return name;
}

async function getProfileOrgRoles(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  organisationId: Id<'organisations'>
) {
  const profile = await ctx.db
    .query('user_profiles')
    .withIndex('by_user_org', (q) =>
      q.eq('userId', userId).eq('organisationId', organisationId)
    )
    .first();

  return [...new Set((profile?.orgRoles || []).map(canonicalOrgRoleName))];
}

async function hasPermissionInOrganisation(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionId: string,
  organisationId: Id<'organisations'>
) {
  const user = await ctx.db
    .query('users')
    .withIndex('by_subject', (q) => q.eq('subject', userId))
    .first();

  if (!user) return false;
  if (isSystemUser(user)) return true;

  const profileOrgRoles = await getProfileOrgRoles(ctx, userId, organisationId);
  if (
    profileOrgRoles.some((roleName) =>
      (DEFAULT_ROLE_PERMISSIONS[roleName] || []).includes(permissionId)
    )
  ) {
    return true;
  }

  const roleAssignments = await ctx.db
    .query('user_role_assignments')
    .withIndex('by_user_org', (q) =>
      q.eq('userId', userId).eq('organisationId', organisationId)
    )
    .filter((q) => q.eq(q.field('isActive'), true))
    .collect();

  const roles = (
    await Promise.all(roleAssignments.map((assignment) => ctx.db.get(assignment.roleId)))
  ).filter((role): role is Doc<'user_roles'> => Boolean(role?.isActive));

  if (roles.some((role) => role.permissions.includes(permissionId))) {
    return true;
  }

  const systemPermission = await ctx.db
    .query('system_permissions')
    .withIndex('by_permission_id', (q) => q.eq('id', permissionId))
    .first();

  if (!systemPermission?.isActive) return false;

  return (
    profileOrgRoles.some((roleName) =>
      systemPermission.defaultRoles.includes(roleName)
    ) || roles.some((role) => systemPermission.defaultRoles.includes(role.name))
  );
}

/**
 * Permission enforcement wrapper
 * Throws an error if user doesn't have the required permission
 */
export const requirePermission = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionId: string
) => {
  const organisationId = await getPrimaryOrganisationId(ctx, userId);
  const hasPermission = organisationId
    ? await hasPermissionInOrganisation(ctx, userId, permissionId, organisationId)
    : false;

  if (!hasPermission) {
    throw new Error(`${PERMISSION_ERRORS.PERMISSION_DENIED}: ${permissionId}`);
  }

  return true;
};

/**
 * Org-scoped permission enforcement wrapper
 * Ensures the actor is operating within the specified organisation
 * and has the required permission (or is sysadmin/developer).
 */
export const requireOrgPermission = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionId: string,
  organisationId: string
) => {
  const user = await ctx.db
    .query('users')
    .withIndex('by_subject', (q) => q.eq('subject', userId))
    .first();

  if (!user) {
    throw new Error(PERMISSION_ERRORS.USER_NOT_FOUND);
  }

  // System roles bypass checks
  if (isSystemUser(user)) {
    return true;
  }

  // Must be operating within their own organisation
  const actorOrganisationId = await getPrimaryOrganisationId(ctx, userId);
  if (String(actorOrganisationId) !== String(organisationId)) {
    throw new Error(PERMISSION_ERRORS.CROSS_ORG_ACCESS_DENIED);
  }

  const hasPermission = await hasPermissionInOrganisation(
    ctx,
    userId,
    permissionId,
    organisationId as Id<'organisations'>
  );

  if (!hasPermission) {
    throw new Error(`${PERMISSION_ERRORS.PERMISSION_DENIED}: ${permissionId}`);
  }

  return true;
};

export const hasOrgPermission = hasPermissionInOrganisation;

export const getManagedTeamNames = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  organisationId: Id<'organisations'>
) => {
  const canViewTeam =
    (await hasPermissionInOrganisation(
      ctx,
      userId,
      'manager.team.view',
      organisationId
    )) ||
    (await hasPermissionInOrganisation(
      ctx,
      userId,
      'staff.view.team',
      organisationId
    ));

  if (!canViewTeam) {
    throw new Error(`${PERMISSION_ERRORS.PERMISSION_DENIED}: manager.team.view`);
  }

  const assignments = await ctx.db
    .query('manager_team_assignments')
    .withIndex('by_manager_org', (q) =>
      q.eq('managerUserId', userId).eq('organisationId', organisationId)
    )
    .filter((q) => q.eq(q.field('isActive'), true))
    .collect();

  return [...new Set(assignments.map((assignment) => assignment.teamName))];
};

export const assertCanManageTeamMember = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  member: Doc<'lecturer_profiles'>,
  permissionId = 'manager.team.member.view'
) => {
  const hasTeamMemberPermission =
    (await hasPermissionInOrganisation(
      ctx,
      userId,
      permissionId,
      member.organisationId
    )) ||
    (await hasPermissionInOrganisation(
      ctx,
      userId,
      'staff.view.team',
      member.organisationId
    )) ||
    (await hasPermissionInOrganisation(
      ctx,
      userId,
      'allocations.view.team',
      member.organisationId
    ));

  if (!hasTeamMemberPermission) {
    throw new Error(`${PERMISSION_ERRORS.PERMISSION_DENIED}: ${permissionId}`);
  }

  const teamName = member.teamName?.trim();
  if (!teamName) {
    throw new Error(PERMISSION_ERRORS.PERMISSION_DENIED);
  }

  const assignments = await ctx.db
    .query('manager_team_assignments')
    .withIndex('by_manager_org', (q) =>
      q.eq('managerUserId', userId).eq('organisationId', member.organisationId)
    )
    .filter((q) =>
      q.and(
        q.eq(q.field('isActive'), true),
        q.eq(q.field('teamName'), teamName)
      )
    )
    .collect();

  if (assignments.length === 0) {
    throw new Error(PERMISSION_ERRORS.PERMISSION_DENIED);
  }

  return true;
};

export const assertCanManageOrganisationWorkload = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  organisationId: Id<'organisations'>,
  mode: 'view' | 'adjust' = 'view'
) => {
  const permissionId =
    mode === 'adjust'
      ? 'workload.admin.allocations.adjust'
      : 'workload.admin.allocations.view';

  const fallbackPermission =
    mode === 'adjust' ? 'allocations.assign' : 'allocations.view';

  const canAccess =
    (await hasPermissionInOrganisation(ctx, userId, permissionId, organisationId)) ||
    (await hasPermissionInOrganisation(ctx, userId, fallbackPermission, organisationId));

  if (!canAccess) {
    throw new Error(`${PERMISSION_ERRORS.PERMISSION_DENIED}: ${permissionId}`);
  }

  return true;
};
