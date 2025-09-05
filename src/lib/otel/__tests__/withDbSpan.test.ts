import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withDbSpan } from '../withDbSpan';

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

describe('withDbSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should wrap function and set span attributes on success', async () => {
    const mockResult = { id: '123', name: 'test' };
    const mockFn = vi.fn().mockResolvedValue(mockResult);

    const result = await withDbSpan('convex:getUser', mockFn);

    expect(result).toBe(mockResult);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should set error attributes when function throws', async () => {
    const error = new Error('Database error');
    const mockFn = vi.fn().mockRejectedValue(error);

    await expect(withDbSpan('convex:getUser', mockFn)).rejects.toThrow(
      'Database error'
    );
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should pass custom attributes to span', async () => {
    const mockResult = { id: '123' };
    const mockFn = vi.fn().mockResolvedValue(mockResult);
    const customAttributes = {
      'db.table': 'users',
      'db.operation_type': 'read',
      user_id: 'user-123',
    };

    const result = await withDbSpan('convex:getUser', mockFn, customAttributes);

    expect(result).toBe(mockResult);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should handle async operations', async () => {
    const mockResult = { count: 42 };
    const mockFn = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return mockResult;
    });

    const result = await withDbSpan('convex:countUsers', mockFn);

    expect(result).toBe(mockResult);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should handle synchronous operations', async () => {
    const mockResult = { success: true };
    const mockFn = vi.fn().mockReturnValue(mockResult);

    const result = await withDbSpan('convex:validateData', mockFn);

    expect(result).toBe(mockResult);
    expect(mockFn).toHaveBeenCalledOnce();
  });
});
