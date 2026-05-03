import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAuthUser } from '@/lib/authz';

export async function GET() {
  try {
    const user = await getAuthUser();
    const secret = process.env.FEATUREBASE_SSO_KEY;
    if (!secret) return NextResponse.json({ hash: null });
    const hash = crypto.createHmac('sha256', secret).update(user.id).digest('hex');
    return NextResponse.json({ hash, userId: user.id, email: user.email });
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}
