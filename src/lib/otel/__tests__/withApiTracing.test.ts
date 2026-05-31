import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withApiTracing } from '../withApiTracing';
import type { NextRequest } from 'next/server';

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

  it('should call the handler on success', async () => {
    const handler = vi.fn().mockResolvedValue(mockResponse);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    const result = await wrappedHandler(mockRequest);

    expect(result).toBe(mockResponse);
    expect(handler).toHaveBeenCalledWith(mockRequest, undefined);
  });

  it('should preserve thrown handler errors', async () => {
    const error = new Error('Test error');
    const handler = vi.fn().mockRejectedValue(error);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    await expect(wrappedHandler(mockRequest)).rejects.toThrow('Test error');
    expect(handler).toHaveBeenCalledWith(mockRequest, undefined);
  });

  it('should preserve 4xx responses', async () => {
    const errorResponse = new Response('{"error": "Bad request"}', {
      status: 400,
      statusText: 'Bad Request',
    });
    const handler = vi.fn().mockResolvedValue(errorResponse);
    const wrappedHandler = withApiTracing('api:/api/test', handler);

    const result = await wrappedHandler(mockRequest);

    expect(result).toBe(errorResponse);
  });

  it('should preserve 5xx responses', async () => {
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
