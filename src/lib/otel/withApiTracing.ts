import type { NextRequest } from 'next/server';

type Handler = (
  req: NextRequest,
  ctx?: unknown
) => Promise<Response> | Response;

export function withApiTracing(name: string, handler: Handler): Handler {
  void name;
  return handler;
}
