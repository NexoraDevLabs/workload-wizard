import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCsp, generateNonce, getCSPMode } from '@/lib/security/csp';

// Mock the environment
vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(() => ({
    NODE_ENV: 'test',
    NEXT_PUBLIC_CONVEX_URL: 'https://test-convex.convex.cloud',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
    CSP_MODE: 'report-only',
  })),
}));

describe('CSP Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateNonce', () => {
    it('should generate a nonce', () => {
      const nonce = generateNonce();
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('getCSPMode', () => {
    it('should return report-only by default', () => {
      const mode = getCSPMode();
      expect(mode).toBe('report-only');
    });

    it('should return enforce when configured', async () => {
      const { getEnv } = vi.mocked(await import('@/lib/env'));
      getEnv.mockReturnValue({
        CSP_MODE: 'enforce',
        NODE_ENV: 'test',
        NEXT_PUBLIC_CONVEX_URL: 'https://test-convex.convex.cloud',
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      });

      const mode = getCSPMode();
      expect(mode).toBe('enforce');
    });
  });

  describe('buildCsp', () => {
    it('should build a valid CSP policy', () => {
      const nonce = 'test-nonce-123';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
        reportUri: '/api/csp-report',
        reportTo: 'csp-endpoint',
      });

      expect(policy).toContain("default-src 'self'");
      expect(policy).toContain("base-uri 'self'");
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("frame-ancestors 'none'");
      expect(policy).toContain(
        `script-src 'self' 'strict-dynamic' 'nonce-${nonce}'`
      );
      expect(policy).toContain(`style-src 'self' 'nonce-${nonce}'`);
      expect(policy).toContain('upgrade-insecure-requests');
    });

    it('should include nonce in script and style directives', () => {
      const nonce = 'test-nonce-456';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
      });

      expect(policy).toContain(`'nonce-${nonce}'`);
    });

    it('should include reporting directives in report-only mode', () => {
      const nonce = 'test-nonce-789';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
        reportUri: '/api/csp-report',
        reportTo: 'csp-endpoint',
      });

      expect(policy).toContain('report-uri /api/csp-report');
      expect(policy).toContain('report-to csp-endpoint');
    });

    it('should not include reporting directives in enforce mode', () => {
      const nonce = 'test-nonce-101';
      const policy = buildCsp({
        nonce,
        mode: 'enforce',
        reportUri: '/api/csp-report',
        reportTo: 'csp-endpoint',
      });

      expect(policy).not.toContain('report-uri');
      expect(policy).not.toContain('report-to');
    });

    it('should include service-specific allowlists', () => {
      const nonce = 'test-nonce-202';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
      });

      // Convex
      expect(policy).toContain('*.convex.cloud');
      expect(policy).toContain('*.convex.dev');

      // Clerk
      expect(policy).toContain('*.clerk.accounts.dev');
      expect(policy).toContain('*.clerk.com');

      // Sentry
      expect(policy).toContain('*.sentry.io');
      expect(policy).toContain('*.sentry-cdn.com');

      // Vercel
      expect(policy).toContain('vitals.vercel-insights.com');
      expect(policy).toContain('va.vercel-scripts.com');

      // Sanity
      expect(policy).toContain('cdn.sanity.io');

      // Google Fonts
      expect(policy).toContain('fonts.googleapis.com');
      expect(policy).toContain('fonts.gstatic.com');

      // Featurebase
      expect(policy).toContain('widget.featurebase.app');
    });

    it('should include https: fallback for all directives', () => {
      const nonce = 'test-nonce-303';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
      });

      expect(policy).toContain('https:');
    });

    it('should include wss: for connect-src', () => {
      const nonce = 'test-nonce-404';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
      });

      expect(policy).toContain('wss:');
    });

    it('should include data: and blob: for appropriate directives', () => {
      const nonce = 'test-nonce-505';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
      });

      expect(policy).toContain('data:');
      expect(policy).toContain('blob:');
    });
  });

  describe('CSP Policy Structure', () => {
    it('should have all required directives', () => {
      const nonce = 'test-nonce-606';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
      });

      const directives = policy.split(';').map((d) => d.trim());

      expect(directives).toContain("default-src 'self'");
      expect(directives).toContain("base-uri 'self'");
      expect(directives).toContain("object-src 'none'");
      expect(directives).toContain("frame-ancestors 'none'");
      expect(directives.some((d) => d.startsWith('script-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('style-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('img-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('font-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('connect-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('frame-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('media-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('worker-src'))).toBe(true);
      expect(directives.some((d) => d.startsWith('manifest-src'))).toBe(true);
      expect(directives).toContain('upgrade-insecure-requests');
    });

    it('should have proper directive format', () => {
      const nonce = 'test-nonce-707';
      const policy = buildCsp({
        nonce,
        mode: 'report-only',
      });

      const directives = policy.split(';').map((d) => d.trim());

      // Each directive should have a value
      directives.forEach((directive) => {
        if (directive && !directive.includes(' ')) {
          // Single word directives like 'upgrade-insecure-requests' are valid
          expect(['upgrade-insecure-requests'].includes(directive)).toBe(true);
        } else if (directive && directive.includes(' ')) {
          // Multi-word directives should have values
          const [_name, ...values] = directive.split(' ');
          expect(values.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
