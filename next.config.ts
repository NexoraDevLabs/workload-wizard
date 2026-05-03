// next.config.ts

// TODO post-MVP: @opentelemetry/instrumentation is kept because @sentry/nextjs requires it while loading config.
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

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
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  experimental: {
    optimizeCss: false,
    // Keep import optimisation for packages used directly by the app.
    optimizePackageImports: ['lucide-react'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const sentryOptions = {
  org: 'smcnab-tech',
  project: 'workload-wizard',
  silent: true,
};

export default withSentryConfig(nextConfig, sentryOptions);
