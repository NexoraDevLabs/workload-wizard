/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { NextRequest} from 'next/server';
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
  } else if (typeof body === 'object' && body !== null && 'type' in body && (body as { type: unknown }).type === 'csp-violation') {
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
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
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
    
    // Validate required fields
    if (!report.effectiveDirective || !report.violatedDirective) {
      // eslint-disable-next-line no-console
      console.error('Invalid CSP report: missing required fields', report);
      return NextResponse.json({ error: 'Invalid report format' }, { status: 400 });
    }

    // Extract and sanitize data
    const ipAddress = getClientIP(request);
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent'));
    
    // Prepare report data
    const reportData = {
      timestamp: (typeof report.timestamp === 'number' ? report.timestamp : Date.now()),
      userAgent,
      ipAddress,
      effectiveDirective: String(report.effectiveDirective),
      violatedDirective: String(report.violatedDirective),
      blockedURI: (typeof report.blockedURI === 'string' ? report.blockedURI : undefined),
      documentURI: (typeof report.documentURI === 'string' ? report.documentURI : undefined),
      referrer: (typeof report.referrer === 'string' ? report.referrer : undefined),
      sourceFile: (typeof report.sourceFile === 'string' ? report.sourceFile : undefined),
      lineNumber: (typeof report.lineNumber === 'number' ? report.lineNumber : undefined),
      columnNumber: (typeof report.columnNumber === 'number' ? report.columnNumber : undefined),
      scriptSample: (typeof report.scriptSample === 'string' ? report.scriptSample.substring(0, 1000) : undefined), // Limit script sample length
      disposition: (typeof report.disposition === 'string' ? report.disposition : 'report'),
      originalPolicy: (typeof report.originalPolicy === 'string' ? report.originalPolicy : undefined),
      // Note: organisationId and userId would need to be extracted from context if available
      organisationId: undefined,
      userId: undefined,
    };

                // Store the report
            if (convex && api.csp && api.csp.addReport) {
              await convex.mutation(api.csp.addReport, reportData);
            }

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing CSP report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
