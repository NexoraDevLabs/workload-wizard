import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/authz';

export async function POST() {
  try {
    await getAuthUser();
    return NextResponse.json({
      success: true,
      message: 'Password reset is handled by WorkOS session management.',
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}
