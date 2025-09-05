import { trace } from '@opentelemetry/api';

export async function withDbSpan<T>(
  operation: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('workload-wizard');
  
  return tracer.startActiveSpan(`db:${operation}`, async (span) => {
    try {
      // Set operation attributes
      span.setAttribute('db.operation', operation);
      span.setAttribute('db.system', 'convex');
      span.setAttribute('runtime', process.env.NEXT_RUNTIME ?? 'node');
      
      // Add custom attributes if provided
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      const result = await fn();
      
      // Mark as successful
      span.setAttribute('db.success', true);
      
      return result;
    } catch (err) {
      // Record exception and mark as error
      span.recordException(err as Error);
      span.setAttribute('error', true);
      span.setAttribute('error.type', 'db_error');
      span.setAttribute('db.success', false);
      
      // Best-effort Sentry capture
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Sentry = require('@sentry/nextjs');
        Sentry.captureException(err);
      } catch {
        // Sentry not available or failed
      }
      
      throw err;
    } finally {
      span.end();
    }
  });
}
