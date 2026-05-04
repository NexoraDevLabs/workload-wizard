import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function POST() {
  try {
    await getAuthContext();
    return NextResponse.json({
      success: true,
      message: 'Password reset is handled by WorkOS session management.',
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}
