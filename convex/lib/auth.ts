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
  const identity = await ctx.auth.getUserIdentity();
  const userId = args.userId ?? identity?.subject;

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  const actor = await ctx.db
    .query('users')
    .withIndex('by_subject', (q) => q.eq('subject', userId))
    .first();

  const organisationId = args.organisationId ?? actor?.organisationId;

  if (!organisationId) {
    throw new Error('Organisation context required');
  }

  return { userId, organisationId };
}
