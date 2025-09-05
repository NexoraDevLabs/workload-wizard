import { trace } from '@opentelemetry/api';

let isInitialized = false;

export function registerOTel() {
  // Safe to run multiple times; idempotent.
  if (process.env.NEXT_RUNTIME !== 'nodejs' || isInitialized) {
    return;
  }

  try {
    // Initialize Sentry Performance if DSN is present
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.2'),
      profilesSampleRate: Number(
        process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.0'
      ),
      enabled:
        Boolean(process.env.SENTRY_DSN) && process.env.NODE_ENV !== 'test',
      environment: process.env.NODE_ENV,
      beforeSend(event: unknown) {
        // Add custom attributes to all events
        if (event && typeof event === 'object' && 'tags' in event) {
          (event as { tags: Record<string, unknown> }).tags.runtime =
            process.env.NEXT_RUNTIME ?? 'node';
        }
        return event;
      },
    });
  } catch {
    // Sentry is optional - continue without it
  }

  // Initialize OpenTelemetry tracer
  // This ensures the global API is initialized and available for manual spans
  trace.getTracer('workload-wizard');

  isInitialized = true;
}
