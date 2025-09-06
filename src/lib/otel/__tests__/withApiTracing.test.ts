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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- Mock span for testing
        return callback(span);
      }),
    })),
  },
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('withApiTracing', () => {
  let mockRequest: NextRequest;
  let mockResponse: Response;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      method: 'POST',
      url: 'https://example.com/api/test',
      headers: {
        get: vi.fn((key: string) => {
          if (key === 'user-agent') return 'test-agent';
          if (key === 'x-request-id') return 'req-123';
          return null;
        }),
      },
    } as unknown as NextRequest;

    mockResponse = new Response('{"success": true}', {
      status: 200,
      statusText: 'OK',
    });
  });

  it('should wrap handler and set span attributes on success', async () => {
    const handler = vi.fn().mockResolvedValue(mockResponse);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    const result = await wrappedHandler(mockRequest);

    expect(result).toBe(mockResponse);
    expect(handler).toHaveBeenCalledWith(mockRequest, undefined);
  });

  it('should set error attributes when handler throws', async () => {
    const error = new Error('Test error');
    const handler = vi.fn().mockRejectedValue(error);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    await expect(wrappedHandler(mockRequest)).rejects.toThrow('Test error');
    expect(handler).toHaveBeenCalledWith(mockRequest, undefined);
  });

  it('should set error attributes for 4xx responses', async () => {
    const errorResponse = new Response('{"error": "Bad request"}', {
      status: 400,
      statusText: 'Bad Request',
    });
    const handler = vi.fn().mockResolvedValue(errorResponse);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    const result = await wrappedHandler(mockRequest);

    expect(result).toBe(errorResponse);
  });

  it('should set error attributes for 5xx responses', async () => {
    const errorResponse = new Response('{"error": "Internal server error"}', {
      status: 500,
      statusText: 'Internal Server Error',
    });
    const handler = vi.fn().mockResolvedValue(errorResponse);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    const result = await wrappedHandler(mockRequest);

    expect(result).toBe(errorResponse);
  });

  it('should handle context parameter', async () => {
    const context = { userId: 'user-123' };
    const handler = vi.fn().mockResolvedValue(mockResponse);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    const result = await wrappedHandler(mockRequest, context);

    expect(result).toBe(mockResponse);
    expect(handler).toHaveBeenCalledWith(mockRequest, context);
  });
});
