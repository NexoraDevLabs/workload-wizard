import * as Sentry from '@sentry/nextjs';

// Define proper types for E2E detection
interface E2EWindow extends Window {
  __E2E__?: boolean;
}

// E2E guard
const E2E =
  (typeof window !== 'undefined' && (window as E2EWindow).__E2E__ === true) ||
  process.env.NEXT_PUBLIC_E2E === 'true';

// PostHog configuration with basic features
if (
  !E2E &&
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY
) {
  // Handle the promise properly
  import('posthog-js')
    .then((posthog) => {
      posthog.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      });
    })
    .catch(() => {
      // Silent fail for PostHog initialization
    });
}

if (!E2E && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: 1.0,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release version
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'v0.4.0',

    // Integrations
    integrations: [
      // Session replay integration
      Sentry.replayIntegration({
        // Mask sensitive data
        maskAllText: false,
        maskAllInputs: false,
        blockAllMedia: false,
      }),
    ],
  });
}

// Export router transition hook for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
