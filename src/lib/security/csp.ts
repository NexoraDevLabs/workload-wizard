import { getEnv } from '@/lib/env';

export type CSPMode = 'report-only' | 'enforce';

export interface CSPConfig {
  nonce: string;
  mode: CSPMode;
  reportUri?: string;
  reportTo?: string;
}

export interface CSPAllowlist {
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  frameSrc: string[];
  mediaSrc: string[];
  workerSrc: string[];
  manifestSrc: string[];
}

// Default allowlist - will be extended with detected services
const DEFAULT_ALLOWLIST: CSPAllowlist = {
  scriptSrc: ['self'],
  styleSrc: ['self'],
  imgSrc: ['self', 'data:', 'blob:'],
  fontSrc: ['self', 'data:'],
  connectSrc: ['self'],
  frameSrc: ['self'],
  mediaSrc: ['self', 'blob:'],
  workerSrc: ['self', 'blob:'],
  manifestSrc: ['self'],
};

// Service-specific allowlists
const SERVICE_ALLOWLISTS: Record<string, Partial<CSPAllowlist>> = {
  convex: {
    connectSrc: ['*.convex.cloud', '*.convex.dev'],
  },
  clerk: {
    scriptSrc: ['*.clerk.accounts.dev', '*.clerk.com'],
    connectSrc: ['*.clerk.accounts.dev', '*.clerk.com'],
    frameSrc: ['*.clerk.accounts.dev', '*.clerk.com'],
    imgSrc: ['img.clerk.com', 'images.clerk.com'],
  },
  sentry: {
    scriptSrc: ['*.sentry-cdn.com', '*.sentry.io'],
    connectSrc: ['*.sentry.io', '*.sentry-cdn.com'],
    imgSrc: ['*.sentry.io'],
  },
  statsig: {
    scriptSrc: ['*.statsig.com', '*.statsigapi.net'],
    connectSrc: ['*.statsig.com', '*.statsigapi.net'],
  },
  vercel: {
    scriptSrc: ['vitals.vercel-insights.com', 'va.vercel-scripts.com'],
    connectSrc: ['vitals.vercel-insights.com', 'va.vercel-scripts.com'],
    imgSrc: ['va.vercel-scripts.com'],
  },
  posthog: {
    scriptSrc: ['eu-assets.i.posthog.com', 'eu.i.posthog.com'],
    connectSrc: ['eu.i.posthog.com', 'eu-assets.i.posthog.com'],
    imgSrc: ['eu-assets.i.posthog.com'],
  },
  sanity: {
    imgSrc: ['cdn.sanity.io'],
    connectSrc: ['*.sanity.io'],
  },
  googleFonts: {
    styleSrc: ['fonts.googleapis.com'],
    fontSrc: ['fonts.gstatic.com'],
    connectSrc: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  },
  featurebase: {
    scriptSrc: ['widget.featurebase.app'],
    connectSrc: ['widget.featurebase.app'],
    frameSrc: ['widget.featurebase.app'],
  },
};

/**
 * Builds a comprehensive CSP policy based on detected services and configuration
 */
export function buildCsp(config: CSPConfig): string {
  const env = getEnv();
  const allowlist = buildAllowlist(env);

  const directives: string[] = [
    // Core security directives
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",

    // Script sources with nonce and strict-dynamic
    `script-src 'self' 'strict-dynamic' 'nonce-${config.nonce}' ${allowlist.scriptSrc.join(' ')}`,

    // Style sources with nonce
    `style-src 'self' 'nonce-${config.nonce}' ${allowlist.styleSrc.join(' ')}`,

    // Image sources
    `img-src ${allowlist.imgSrc.join(' ')}`,

    // Font sources
    `font-src ${allowlist.fontSrc.join(' ')}`,

    // Connect sources (XHR, fetch, WebSocket)
    `connect-src ${allowlist.connectSrc.join(' ')} wss:`,

    // Frame sources
    `frame-src ${allowlist.frameSrc.join(' ')}`,

    // Media sources
    `media-src ${allowlist.mediaSrc.join(' ')}`,

    // Worker sources
    `worker-src ${allowlist.workerSrc.join(' ')}`,

    // Manifest sources
    `manifest-src ${allowlist.manifestSrc.join(' ')}`,

    // Upgrade insecure requests
    'upgrade-insecure-requests',
  ];

  // Add reporting directives
  if (config.mode === 'report-only') {
    if (config.reportUri) {
      directives.push(`report-uri ${config.reportUri}`);
    }
    if (config.reportTo) {
      directives.push(`report-to ${config.reportTo}`);
    }
  }

  return directives.join('; ');
}

/**
 * Builds the allowlist based on detected services and environment configuration
 */
function buildAllowlist(env: ReturnType<typeof getEnv>): CSPAllowlist {
  const allowlist = { ...DEFAULT_ALLOWLIST };

  // Add HTTPS fallback for all directives
  const addHttps = (sources: string[]) => [...sources, 'https:'];

  // Detect and add service-specific allowlists
  if (env.NEXT_PUBLIC_CONVEX_URL) {
    mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.convex);
  }

  if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || env.CLERK_SECRET_KEY) {
    mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.clerk);
  }

  // Always include Sentry (commonly used for error monitoring)
  mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.sentry);

  if (
    env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ||
    env.FEATFLAG_STATSIG_SERVER_API_KEY
  ) {
    mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.statsig);
  }

  // Vercel Analytics and Speed Insights are always present in Vercel deployments
  mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.vercel);

  if (env.NEXT_PUBLIC_POSTHOG_KEY) {
    mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.posthog);
  }

  // Sanity is used for images
  mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.sanity);

  // Google Fonts are used (Geist fonts)
  mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.googleFonts);

  // Featurebase widget
  mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.featurebase);

  // Add HTTPS fallback for all directives
  return {
    scriptSrc: addHttps(allowlist.scriptSrc),
    styleSrc: addHttps(allowlist.styleSrc),
    imgSrc: addHttps(allowlist.imgSrc),
    fontSrc: addHttps(allowlist.fontSrc),
    connectSrc: addHttps(allowlist.connectSrc),
    frameSrc: addHttps(allowlist.frameSrc),
    mediaSrc: addHttps(allowlist.mediaSrc),
    workerSrc: addHttps(allowlist.workerSrc),
    manifestSrc: addHttps(allowlist.manifestSrc),
  };
}

/**
 * Merges a service allowlist into the main allowlist
 */
function mergeAllowlist(
  target: CSPAllowlist,
  source: Partial<CSPAllowlist> | undefined
): void {
  if (!source) return;

  Object.entries(source).forEach(([key, sources]) => {
    if (sources) {
      const targetKey = key as keyof CSPAllowlist;
      target[targetKey] = [...target[targetKey], ...sources];
    }
  });
}

/**
 * Generates a cryptographically strong nonce
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

/**
 * Gets the CSP mode from environment variables
 */
export function getCSPMode(): CSPMode {
  const env = getEnv();
  return env.CSP_MODE === 'enforce' ? 'enforce' : 'report-only';
}

/**
 * Builds the Report-To header configuration
 */
export function buildReportToHeader(reportUri: string): string {
  return JSON.stringify({
    group: 'csp-endpoint',
    max_age: 10886400, // 30 days
    endpoints: [{ url: reportUri }],
    include_subdomains: true,
  });
}
