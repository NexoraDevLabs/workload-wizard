/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/authz';
import { updateUser } from '@/lib/actions/userActions';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const userId = String(body.userId || authUser.id);
    await updateUser(userId, {
      ...(body.newEmail || body.email
        ? { email: String(body.newEmail || body.email) }
        : {}),
      ...(body.username ? {} : {}),
      ...(body.firstName ? { firstName: String(body.firstName) } : {}),
      ...(body.lastName ? { lastName: String(body.lastName) } : {}),
      ...(Array.isArray(body.roles) ? { roles: body.roles } : {}),
      ...(body.organisationId
        ? { organisationId: String(body.organisationId) }
        : {}),
      ...(typeof body.isActive === 'boolean'
        ? { isActive: body.isActive }
        : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update user',
      },
      { status: 500 }
    );
  }
}
