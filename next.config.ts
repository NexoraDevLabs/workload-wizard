import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// Load environment variables on startup
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadEnvironment } = require('./lib/env-loader');
  loadEnvironment();
} catch (error) {
  console.warn('Environment loader not found, continuing with default env loading');
}

// Bundle analyzer configuration
let withBundleAnalyzer = (config: NextConfig) => config;

if (process.env.ANALYZE === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const bundleAnalyzer = require('@next/bundle-analyzer');
  // Properly type the bundle analyzer function with explicit typing
  const bundleAnalyzerFn = (
    bundleAnalyzer as {
      default: (options: {
        enabled: boolean;
      }) => (config: NextConfig) => NextConfig;
    }
  ).default;
  withBundleAnalyzer = bundleAnalyzerFn({
    enabled: true,
  });
}

const nextConfig: NextConfig = {
  /* config options here */
  // Environment variables are handled by lib/env-loader.js
  // NODE_ENV is automatically available in Next.js
  eslint: {
    // Don't block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  webpack: (config): NextConfig => {
    // Reduce noisy infrastructure logs in CI
    if (
      config &&
      typeof config === 'object' &&
      'infrastructureLogging' in config
    ) {
      // Properly type the webpack config with explicit typing
      const webpackConfig = config as {
        infrastructureLogging?: { level?: string };
      };
      if (webpackConfig.infrastructureLogging) {
        webpackConfig.infrastructureLogging.level = 'error';
      }
    }
    return config as NextConfig;
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
  experimental: {
    // Disable optimizeCss to avoid critters dependency issue
    optimizeCss: false,
  },
};

const config = withBundleAnalyzer(
  withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: 'smcnab-tech',
    project: 'workload-wizard',

    // Suppress all Sentry build logs and warnings (including auth token warnings)
    silent: true,

    // For all available options, see:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  })
);

export default config;
