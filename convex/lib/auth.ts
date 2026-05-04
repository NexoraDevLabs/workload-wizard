import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

type AuthArgs = {
  userId?: string;
  organisationId?: Id<'organisations'>;
  [key: string]: unknown;
};

type AuthContext = {
  userId: string;
  organisationId: Id<'organisations'>;
};

export async function getAuthContext(
  ctx: QueryCtx | MutationCtx,
  args: AuthArgs = {}
): Promise<AuthContext> {
  const userId = args.userId;

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  const memberships = await ctx.db
    .query('user_organisations')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();

  const primaryMembership =
    memberships.find((membership) => membership.isPrimary) ??
    memberships[0] ??
    null;

  const organisationId = args.organisationId ?? primaryMembership?.organisationId;

  if (!organisationId) {
    throw new Error('Organisation context required');
  }

  return { userId, organisationId };
}
