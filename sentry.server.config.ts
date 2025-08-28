import * as Sentry from '@sentry/nextjs';

// Silence Sentry SDK telemetry without relying on typed options
process.env.SENTRY_TELEMETRY_DISABLED = '1';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  debug: false,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'v0.4.0',
});
