// src/app/api/kv-check/route.ts
import { NextResponse } from 'next/server';
import { getKv } from '../../../lib/kv';

export async function GET() {
  try {
    const kv = getKv();
    // Test basic connectivity
    const result = await kv.ping();
    return NextResponse.json({
      ok: true,
      message: 'KV connection successful',
      ping: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
