import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/authz';

export async function POST() {
  try {
    const user = await getAuthUser();
    return NextResponse.json({ success: true, userId: user.id });
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}
