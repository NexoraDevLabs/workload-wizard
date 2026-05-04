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
  _ctx: QueryCtx | MutationCtx,
  args: AuthArgs = {}
): Promise<AuthContext> {
  const userId = args.userId;

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  const organisationId = args.organisationId;

  if (!organisationId) {
    throw new Error('Organisation context required');
  }

  return { userId, organisationId };
}
