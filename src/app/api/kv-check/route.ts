// src/app/api/kv-check/route.ts
import { NextResponse } from 'next/server';
import { getKv } from '../../../lib/kv';

export async function GET() {
  try {
    const kv = await getKv();
    // Test basic connectivity
    const result = await (kv as { ping: () => Promise<string> }).ping();
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
