import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await getAuthContext();
    await request.json();
    return NextResponse.json({
      success: true,
      message: 'Username updates are database-managed after WorkOS removal.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update username',
      },
      { status: 500 }
    );
  }
}
