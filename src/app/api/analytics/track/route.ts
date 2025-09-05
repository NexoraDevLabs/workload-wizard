import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiTracing } from '@/lib/otel/withApiTracing';

// Minimal proxy placeholder. Hook to PostHog server SDK later if desired.
const BodySchema = z.object({
  event: z.string().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
});

async function handlePost(req: NextRequest) {
  try {
    const { event: _event, props: _props } = BodySchema.parse(await req.json());
    // For now, accept and no-op (or log). In future, forward to PH proxy endpoint/server SDK.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export const POST = withApiTracing('api:/api/analytics/track', handlePost);
