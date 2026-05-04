import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { PERMISSION_ERRORS } from './constants';

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

/**
 * Permission enforcement wrapper
 * Throws an error if user doesn't have the required permission
 */
export const requirePermission = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionId: string
) => {
  const hasPermission = await ctx.db
    .query('users')
    .withIndex('by_subject', (q) => q.eq('subject', userId))
    .first()
    .then(async (user) => {
      if (!user) {
        return false;
      }

      // System roles bypass all permission checks
      if (user.systemRoles && user.systemRoles.length > 0) {
        const systemRoles: ReadonlyArray<string> = [
          'admin',
          'sysadmin',
          'developer',
        ] as const;
        if (
          user.systemRoles.some((role: string) => systemRoles.includes(role))
        ) {
          return true;
        }
      }

      const organisationId = await getPrimaryOrganisationId(ctx, userId);
      if (!organisationId) return false;

      // Get user's role assignment
      const roleAssignment = await ctx.db
        .query('user_role_assignments')
        .withIndex('by_user_org', (q) =>
          q.eq('userId', userId).eq('organisationId', organisationId)
        )
        .filter((q) => q.eq(q.field('isActive'), true))
        .first();

      if (!roleAssignment) {
        return false;
      }

      // Get the role
      const role = await ctx.db.get(roleAssignment.roleId);
      if (!role || !role.isActive) {
        return false;
      }

      // Check if permission is in the role's permissions array
      if (role.permissions.includes(permissionId)) {
        return true;
      }

      // Check system defaults for this permission
      const systemPermission = await ctx.db
        .query('system_permissions')
        .withIndex('by_permission_id', (q) => q.eq('id', permissionId))
        .first();

      if (!systemPermission || !systemPermission.isActive) {
        return false;
      }

      // Check if role name is in default roles for this permission
      return systemPermission.defaultRoles.includes(role.name);
    });

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
  if (user.systemRoles && user.systemRoles.length > 0) {
    const systemRoles = ['admin', 'sysadmin', 'developer'];
    if (user.systemRoles.some((role: string) => systemRoles.includes(role))) {
      return true;
    }
  }

  // Must be operating within their own organisation
  const actorOrganisationId = await getPrimaryOrganisationId(ctx, userId);
  if (String(actorOrganisationId) !== String(organisationId)) {
    throw new Error(PERMISSION_ERRORS.CROSS_ORG_ACCESS_DENIED);
  }

  // Then enforce the permission
  return requirePermission(ctx, userId, permissionId);
};
