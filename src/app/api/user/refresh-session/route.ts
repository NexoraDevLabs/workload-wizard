import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getAuthContext();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    return NextResponse.json({ success: true, userId: user.userId });
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}
