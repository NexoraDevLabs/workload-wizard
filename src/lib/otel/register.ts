import { trace } from '@opentelemetry/api';

// TODO post-MVP: Keep manual OpenTelemetry API spans until observability scope is revisited.
let isInitialized = false;

export async function registerOTel() {
  // Safe to run multiple times; idempotent.
  if (process.env.NEXT_RUNTIME !== 'nodejs' || isInitialized) {
    return;
  }

  // Initialize OpenTelemetry tracer
  // This ensures the global API is initialized and available for manual spans
  trace.getTracer('workload-wizard');

  isInitialized = true;
}
