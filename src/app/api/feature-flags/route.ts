import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const flagName = searchParams.get('flag');

    return NextResponse.json({ flag: flagName, enabled: false, removed: true });
  } catch {
    // Error getting feature flag
    return NextResponse.json(
      { error: 'Failed to get feature flag' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    return NextResponse.json({ ok: true, removed: true });
  } catch {
    // Error updating feature flag
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}
