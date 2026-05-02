import * as Sentry from '@sentry/nextjs';

process.env.SENTRY_TELEMETRY_DISABLED = '1';

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  debug: false,

  // Do not send application logs to Sentry
  enableLogs: false,

  // Keep error reporting, but massively reduce performance tracing
  tracesSampleRate: isProduction ? 0.01 : 0,

  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'v0.4.0',
});
