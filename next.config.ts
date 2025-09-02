// next.config.ts

import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// Load environment variables on startup
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const { loadEnvironment } = require('./lib/env-loader');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  loadEnvironment();
} catch {
  // Environment loader not found, continuing with default env loading
  console.warn(
    'Environment loader not found, continuing with default env loading'
  );
}

// Bundle analyzer configuration
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (config) => config;

if (process.env.ANALYZE === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const bundleAnalyzer = require('@next/bundle-analyzer');
  const bundleAnalyzerFn = (
    bundleAnalyzer as {
      default: (options: {
        enabled: boolean;
      }) => (config: NextConfig) => NextConfig;
    }
  ).default;

  withBundleAnalyzer = bundleAnalyzerFn({ enabled: true });
}

// Security headers applied to all routes
const securityHeaders: Array<{ key: string; value: string }> = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  // Environment variables are handled by lib/env-loader.js
  // NODE_ENV is automatically available in Next.js

  eslint: {
    // Don't block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },

  typescript: {
    // Don't type-check during builds (CI does this separately)
    ignoreBuildErrors: process.env.CI === 'true',
  },

  experimental: {
    // Disable optimizeCss to avoid critters dependency issue
    optimizeCss: false,
    // Keep your import optimisation
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  webpack: (config) => {
    // Reduce noisy infrastructure logs in CI
    const webpackConfig = config as {
      infrastructureLogging?: { level?: string };
    };
    if (webpackConfig.infrastructureLogging) {
      webpackConfig.infrastructureLogging.level = 'error';
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
      // (Uncomment to re-enable)
      // {
      //   source: '/e/static/:path*',
      //   destination: 'https://eu-assets.i.posthog.com/static/:path*',
      // },
      // {
      //   source: '/e/:path*',
      //   destination: 'https://eu.i.posthog.com/:path*',
      // },
      // {
      //   source: '/ingest/static/:path*',
      //   destination: 'https://eu-assets.i.posthog.com/static/:path*',
      // },
      // {
      //   source: '/ingest/:path*',
      //   destination: 'https://eu.i.posthog.com/:path*',
      // },
      // {
      //   source: '/ingest/flags',
      //   destination: 'https://eu.i.posthog.com/flags',
      // },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Security headers for all routes (must be top-level, not inside `experimental`)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

// Sentry options
const sentryOptions = {
  org: 'smcnab-tech',
  project: 'workload-wizard',
  // Suppress all Sentry build logs and warnings (including auth token warnings)
  silent: true,
  // For Vercel cron monitors
  automaticVercelMonitors: true,
};

// Export wrapped config
export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions);
