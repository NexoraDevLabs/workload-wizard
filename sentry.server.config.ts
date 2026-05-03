import * as Sentry from '@sentry/nextjs';

process.env.SENTRY_TELEMETRY_DISABLED = '1';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    debug: false,
    enableLogs: false,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'v0.4.0',
  });
}
