import { trace } from '@opentelemetry/api';
import type { NextRequest } from 'next/server';

type Handler = (
  req: NextRequest,
  ctx?: unknown
) => Promise<Response> | Response;

export function withApiTracing(name: string, handler: Handler): Handler {
  return async (req, ctx) => {
    const tracer = trace.getTracer('workload-wizard');

    return await tracer.startActiveSpan(`api:${name}`, async (span) => {
      try {
        // Set span attributes
        span.setAttribute('http.method', req.method);
        span.setAttribute('http.route', name);
        span.setAttribute('http.url', req.url);
        span.setAttribute('runtime', process.env.NEXT_RUNTIME ?? 'node');
        span.setAttribute(
          'user_agent',
          req.headers.get('user-agent') ?? 'unknown'
        );

        // Add request ID if available
        const requestId = req.headers.get('x-request-id');
        if (requestId) {
          span.setAttribute('http.request_id', requestId);
        }

        const res = await handler(req, ctx);

        // Set response attributes
        span.setAttribute('http.status_code', res.status);
        span.setAttribute(
          'http.status_class',
          Math.floor(res.status / 100) * 100
        );

        // Mark as error if status >= 400
        if (res.status >= 400) {
          span.setAttribute('error', true);
          span.setAttribute(
            'error.type',
            res.status >= 500 ? 'server_error' : 'client_error'
          );
        }

        return res;
      } catch (err) {
        // Record exception and mark as error
        span.recordException(err as Error);
        span.setAttribute('error', true);
        span.setAttribute('error.type', 'exception');

        throw err;
      } finally {
        span.end();
      }
    });
  };
}
