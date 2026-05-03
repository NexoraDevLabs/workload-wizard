import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/authz';
import { withApiTracing } from '@/lib/otel/withApiTracing';

async function handleGet() {
  try {
    const user = await getAuthUser();
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return new NextResponse('Unauthorised', { status: 401 });
  }
}

export const GET = withApiTracing('api:/api/user', handleGet);
