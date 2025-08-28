import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flagName = searchParams.get('flag');

    return NextResponse.json({ flag: flagName, enabled: false, removed: true });
  } catch (error) {
    // Error getting feature flag
    return NextResponse.json(
      { error: 'Failed to get feature flag' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ ok: true, removed: true });
  } catch (error) {
    // Error updating feature flag
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}
