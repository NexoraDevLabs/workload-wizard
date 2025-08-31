import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// Bundle analyzer configuration
let withBundleAnalyzer = (config: NextConfig) => config;

if (process.env.ANALYZE === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bundleAnalyzer = require('@next/bundle-analyzer');
  withBundleAnalyzer = bundleAnalyzer.default({
    enabled: true,
  });
}

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Reduce noisy infrastructure logs in CI
    if (config && typeof config === 'object') {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async rewrites() {
    return [
      // PostHog reverse proxy - DISABLED for direct access
      // Uncomment these lines to re-enable proxy
      /*
      {
        source: "/e/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/e/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      // Keep the old /ingest path for backward compatibility during transition
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/flags",
        destination: "https://eu.i.posthog.com/flags",
      },
      */
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

const config = withBundleAnalyzer(
  withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: 'smcnab-tech',
    project: 'workload-wizard',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  })
);

export default config;
