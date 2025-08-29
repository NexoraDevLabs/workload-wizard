import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // This endpoint can be used to test session refresh
    // In a real implementation, you might force a session refresh here

    return NextResponse.json({
      success: true,
      message: 'Session refresh requested',
      userId: userId,
      note: 'The session should be refreshed to pick up any metadata changes',
    });
  } catch (error) {
    // Session refresh error
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to refresh session',
      },
      { status: 500 }
    );
  }
}
