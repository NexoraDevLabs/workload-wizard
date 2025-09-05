import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withApiTracing } from '../withApiTracing';
import type { NextRequest } from 'next/server';

// Mock OpenTelemetry
vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn(() => ({
      startActiveSpan: vi.fn((_name, callback) => {
        const span = {
          setAttribute: vi.fn(),
          recordException: vi.fn(),
          end: vi.fn(),
        };
        return callback(span);
      }),
    })),
  },
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('API Route Tracing Integration', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      method: 'GET',
      url: 'https://example.com/api/health',
      headers: {
        get: vi.fn((key: string) => {
          if (key === 'user-agent') return 'test-agent';
          return null;
        }),
      },
    } as unknown as NextRequest;
  });

  it('should trace a health check endpoint', async () => {
    const healthHandler = async (_req: NextRequest) => {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const tracedHandler = withApiTracing('api:/api/health', healthHandler);
    const response = await tracedHandler(mockRequest);

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('should trace an error endpoint', async () => {
    const errorHandler = async (_req: NextRequest) => {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const tracedHandler = withApiTracing('api:/api/not-found', errorHandler);
    const response = await tracedHandler(mockRequest);

    expect(response.status).toBe(404);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('Not found');
  });

  it('should trace an endpoint that throws', async () => {
    const throwingHandler = async (_req: NextRequest) => {
      throw new Error('Internal server error');
    };

    const tracedHandler = withApiTracing('api:/api/error', throwingHandler);

    await expect(tracedHandler(mockRequest)).rejects.toThrow('Internal server error');
  });
});
