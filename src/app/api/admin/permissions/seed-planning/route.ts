import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { recordAudit } from '@/lib/audit';
import { can } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/authz';

interface ApiError {
  statusCode?: number;
  message?: string;
}

export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const me = await currentUser();
    const authUser = await getAuthUser();
    if (!can(authUser, 'permissions.seed')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    const performedByName = me
      ? `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim() ||
        me.primaryEmailAddress?.emailAddress ||
        me.username ||
        me.id
      : undefined;

    // Only create client when actually needed
    const client = new ConvexHttpClient(convexUrl);
    const result = await client.mutation(
      api.permissions.seedPlanningMvpPermissions,
      {
        performedBy: userId,
        ...(performedByName ? { performedByName } : {}),
      }
    );

    await recordAudit({
      action: 'permissions.updated',
      actorId: userId,
      success: true,
      entityType: 'permission',
      entityId: 'seedPlanningMvpPermissions',
      meta: { result },
    });

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    const status =
      typeof apiError?.statusCode === 'number' ? apiError.statusCode : 500;
    return NextResponse.json(
      { error: apiError?.message ?? 'Failed to seed permissions' },
      { status }
    );
  }
}
