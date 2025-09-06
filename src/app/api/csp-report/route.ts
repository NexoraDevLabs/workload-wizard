/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getEnv } from '@/lib/env';

// Initialize Convex client
function getConvexClient(): ConvexHttpClient | null {
  const env = getEnv();
  if (!env.NEXT_PUBLIC_CONVEX_URL) return null;
  return new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
}

// Parse CSP violation report from different formats
function parseCSPReport(body: unknown): Record<string, unknown> {
  // Handle both application/csp-report and application/reports+json formats
  if (typeof body === 'object' && body !== null && 'csp-report' in body) {
    // Legacy CSP report format
    return (body as { 'csp-report': Record<string, unknown> })['csp-report'];
  } else if (
    typeof body === 'object' &&
    body !== null &&
    'type' in body &&
    (body as { type: unknown }).type === 'csp-violation'
  ) {
    // Reporting API format
    return body as Record<string, unknown>;
  } else {
    // Assume it's a direct CSP report
    return body as Record<string, unknown>;
  }
}

// Extract IP address from request
function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return undefined;
}

// Sanitize user agent to remove PII
function sanitizeUserAgent(userAgent: string | null): string | undefined {
  if (!userAgent) return undefined;

  // Remove common PII patterns while keeping useful info
  return userAgent
    .replace(/\([^)]*\)/g, '()') // Remove parenthetical info
    .replace(/\d+\.\d+\.\d+\.\d+/g, '0.0.0.0') // Remove IP addresses
    .substring(0, 500); // Limit length
}

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    if (!convex) {
      // eslint-disable-next-line no-console
      console.error('Convex client not available for CSP report storage');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Parse the request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse CSP report JSON:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Parse the CSP report
    const report = parseCSPReport(body);

    // Normalize field names (handle both camelCase and kebab-case)
    const effectiveDirective =
      report.effectiveDirective || report['effective-directive'];
    const violatedDirective =
      report.violatedDirective || report['violated-directive'];

    // Validate required fields
    if (!effectiveDirective || !violatedDirective) {
      // eslint-disable-next-line no-console
      console.error('Invalid CSP report: missing required fields', report);
      return NextResponse.json(
        { error: 'Invalid report format' },
        { status: 400 }
      );
    }

    // Extract and sanitize data
    const ipAddress = getClientIP(request);
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent'));

    // For now, we don't have context to extract these
    const _organisationId = undefined;
    const _userId = undefined;

    // Prepare report data - only include defined values for exactOptionalPropertyTypes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reportData: any = {
      timestamp:
        typeof report.timestamp === 'number' ? report.timestamp : Date.now(),
      effectiveDirective: String(effectiveDirective),
      violatedDirective: String(violatedDirective),
    };

    // Add optional fields only if they have values
    if (userAgent) reportData.userAgent = userAgent;
    if (ipAddress) reportData.ipAddress = ipAddress;

    const blockedURI =
      typeof report.blockedURI === 'string'
        ? report.blockedURI
        : typeof report['blocked-uri'] === 'string'
          ? report['blocked-uri']
          : undefined;
    if (blockedURI) reportData.blockedURI = blockedURI;

    const documentURI =
      typeof report.documentURI === 'string'
        ? report.documentURI
        : typeof report['document-uri'] === 'string'
          ? report['document-uri']
          : undefined;
    if (documentURI) reportData.documentURI = documentURI;

    if (typeof report.referrer === 'string')
      reportData.referrer = report.referrer;

    const sourceFile =
      typeof report.sourceFile === 'string'
        ? report.sourceFile
        : typeof report['source-file'] === 'string'
          ? report['source-file']
          : undefined;
    if (sourceFile) reportData.sourceFile = sourceFile;

    const lineNumber =
      typeof report.lineNumber === 'number'
        ? report.lineNumber
        : typeof report['line-number'] === 'number'
          ? report['line-number']
          : undefined;
    if (lineNumber !== undefined) reportData.lineNumber = lineNumber;

    const columnNumber =
      typeof report.columnNumber === 'number'
        ? report.columnNumber
        : typeof report['column-number'] === 'number'
          ? report['column-number']
          : undefined;
    if (columnNumber !== undefined) reportData.columnNumber = columnNumber;

    const scriptSample =
      typeof report.scriptSample === 'string'
        ? report.scriptSample.substring(0, 1000)
        : typeof report['script-sample'] === 'string'
          ? report['script-sample'].substring(0, 1000)
          : undefined;
    if (scriptSample) reportData.scriptSample = scriptSample;

    if (typeof report.disposition === 'string')
      reportData.disposition = report.disposition;

    const originalPolicy =
      typeof report.originalPolicy === 'string'
        ? report.originalPolicy
        : typeof report['original-policy'] === 'string'
          ? report['original-policy']
          : undefined;
    if (originalPolicy) reportData.originalPolicy = originalPolicy;

    // Store the report
    if (convex && api.csp?.addReport) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await convex.mutation(api.csp.addReport as any, reportData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing CSP report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
