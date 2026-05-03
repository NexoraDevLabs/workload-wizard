// next.config.ts

// TODO post-MVP: @opentelemetry/instrumentation is kept because @sentry/nextjs requires it while loading config.
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';
import bundleAnalyzer from '@next/bundle-analyzer';

// Environment variables are loaded automatically by Next.js from .env files

// Bundle analyzer configuration
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

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
    // Block production builds on ESLint errors.
    ignoreDuringBuilds: false,
  },

  typescript: {
    // Block production builds on TypeScript errors.
    ignoreBuildErrors: false,
  },

  experimental: {
    // Disable optimizeCss to avoid critters dependency issue
    optimizeCss: false,
    // Keep import optimisation for packages used directly by the app.
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config: WebpackConfig) => {
    // Type assertion to ensure proper typing for webpack config mutation

    const webpackConfig = config;

    // Reduce noisy infrastructure logs in CI

    if (webpackConfig.infrastructureLogging) {
      webpackConfig.infrastructureLogging.level = 'error';
    }

    // Optimize for memory usage during build

    if (webpackConfig.optimization?.splitChunks) {
      const currentSplitChunks = webpackConfig.optimization.splitChunks;

      const newOptimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          ...currentSplitChunks,
          chunks: 'all' as const,
          cacheGroups: {
            ...currentSplitChunks.cacheGroups,
          },
        },
      } as WebpackConfig['optimization'];

      if (newOptimization) {
        webpackConfig.optimization = newOptimization;
      }
    }

    return webpackConfig;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },

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
  silent: true,
};

// Export wrapped config
export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions);
