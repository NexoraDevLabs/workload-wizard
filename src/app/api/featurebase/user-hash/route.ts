import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAuthContext } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthContext();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const secret = process.env.FEATUREBASE_SSO_KEY;
    if (!secret) return NextResponse.json({ hash: null });
    const hash = crypto.createHmac('sha256', secret).update(user.userId).digest('hex');
    return NextResponse.json({ hash, userId: user.userId, email: user.email });
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
}
