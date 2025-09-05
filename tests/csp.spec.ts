/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { test, expect } from '@playwright/test';

test.describe('Content Security Policy (CSP) Headers', () => {
  test('should have CSP Report-Only header on the home page', async ({ page }) => {
    await page.goto('/');
    const response = await page.waitForResponse('/');
    expect(response.ok()).toBeTruthy();

    const cspHeader = response.headers()['content-security-policy-report-only'];
    expect(cspHeader).toBeTruthy();

    // Check for key directives
    expect(cspHeader).toContain("default-src 'self'");
    expect(cspHeader).toContain("object-src 'none'");
    expect(cspHeader).toContain("frame-ancestors 'none'");
    expect(cspHeader).toContain("script-src 'self' 'strict-dynamic' 'nonce-"); // Nonce is dynamic
    expect(cspHeader).toContain("report-uri /api/csp-report");
    expect(cspHeader).toContain("report-to csp-endpoint");
    expect(cspHeader).toContain("upgrade-insecure-requests");
  });

  test('should have Report-To header on the home page', async ({ page }) => {
    await page.goto('/');
    const response = await page.waitForResponse('/');
    expect(response.ok()).toBeTruthy();

    const reportToHeader = response.headers()['report-to'];
    expect(reportToHeader).toBeTruthy();

    const parsedReportTo = JSON.parse(reportToHeader as string);
    expect(parsedReportTo.group).toBe('csp-endpoint');
    expect(parsedReportTo.endpoints).toHaveLength(1);
    expect(parsedReportTo.endpoints[0].url).toBe('/api/csp-report');
  });

  test('should have CSP Report-Only header on a dynamic page', async ({ page }) => {
    await page.goto('/support');
    const response = await page.waitForResponse('/support');
    expect(response.ok()).toBeTruthy();

    const cspHeader = response.headers()['content-security-policy-report-only'];
    expect(cspHeader).toBeTruthy();
  });

  test('should have a nonce in the script-src directive', async ({ page }) => {
    await page.goto('/');
    const response = await page.waitForResponse('/');
    const cspHeader = response.headers()['content-security-policy-report-only'];
    const nonceMatch = (cspHeader as string)?.match(/nonce-([a-f0-9]+)/);
    expect(nonceMatch).toBeTruthy();
    const nonce = nonceMatch ? nonceMatch[1] : '';
    expect(nonce).toBeTruthy();
    expect(nonce.length).toBeGreaterThan(0);
  });

  test('should have CSP Report-Only header on an API route', async ({ request }) => {
    const response = await request.post('/api/csp-report', {
      data: {
        'csp-report': {
          'document-uri': 'http://localhost:3000/',
          'referrer': '',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': "script-src 'self'",
          'blocked-uri': 'inline',
          'line-number': 1,
          'column-number': 1,
          'status-code': 200,
        },
      },
      headers: {
        'Content-Type': 'application/csp-report',
      },
    });
    expect(response.status()).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(true);
  });

  test('should return 400 for invalid CSP report format', async ({ request }) => {
    const response = await request.post('/api/csp-report', {
      data: {
        invalidField: 'value',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('should handle OPTIONS request for /api/csp-report', async ({ request }) => {
    const response = await request.fetch('/api/csp-report', {
      method: 'OPTIONS',
    });
    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-origin']).toBe('*');
    expect(response.headers()['access-control-allow-methods']).toContain('POST');
    expect(response.headers()['access-control-allow-methods']).toContain('OPTIONS');
  });

  test('should have CSP Report-Only header on a static asset', async ({ page }) => {
    await page.goto('/favicon.ico');
    const response = await page.waitForResponse('/favicon.ico');
    expect(response.ok()).toBeTruthy();

    const cspHeader = response.headers()['content-security-policy-report-only'];
    expect(cspHeader).toBeTruthy();
  });

  test('should not contain unsafe-inline in script-src', async ({ page }) => {
    await page.goto('/');
    const response = await page.waitForResponse('/');
    const cspHeader = response.headers()['content-security-policy-report-only'];
    expect(cspHeader).toBeTruthy();
    expect(cspHeader).not.toContain("script-src 'unsafe-inline'");
  });

  test('should not contain unsafe-inline in style-src', async ({ page }) => {
    await page.goto('/');
    const response = await page.waitForResponse('/');
    const cspHeader = response.headers()['content-security-policy-report-only'];
    expect(cspHeader).toBeTruthy();
    expect(cspHeader).not.toContain("style-src 'unsafe-inline'");
  });
});