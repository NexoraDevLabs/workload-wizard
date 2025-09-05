// src/lib/monitoring.ts
// Wrap Sentry; no-ops if DSN/env disabled. Keeps tests simple and avoids bundle bloat.
type CaptureContext = {
  componentStack?: string | undefined;
  contextTag?: string | undefined;
  extras?: Record<string, unknown>;
};

export function captureUIException(
  error: unknown,
  ctx: CaptureContext = {}
): void {
  // Guard unknown → Error
  const err = error instanceof Error ? error : new Error(String(error));
  // Runtime feature detection — only load if available/configured
  // This file must not throw in non-Sentry environments.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports
    const Sentry = require('@sentry/nextjs') as typeof import('@sentry/nextjs');
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    Sentry.captureException(err, (scope) => {
      if (ctx.contextTag) scope.setTag('ui.context', ctx.contextTag);
      if (ctx.componentStack)
        scope.setExtra('componentStack', ctx.componentStack);
      if (ctx.extras)
        Object.entries(ctx.extras).forEach(([k, v]) => scope.setExtra(k, v));
      return scope;
    });
  } catch {
    // Sentry not installed/enabled — noop
  }
}
