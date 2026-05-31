import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withDbSpan } from '../withDbSpan';

describe('withDbSpan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call the wrapped function on success', async () => {
    const mockResult = { id: '123', name: 'test' };
    const mockFn = vi.fn().mockResolvedValue(mockResult);

    const result = await withDbSpan('convex:getUser', mockFn);

    expect(result).toBe(mockResult);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should preserve thrown function errors', async () => {
    const error = new Error('Database error');
    const mockFn = vi.fn().mockRejectedValue(error);

    await expect(withDbSpan('convex:getUser', mockFn)).rejects.toThrow(
      'Database error'
    );
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should ignore custom attributes without changing the result', async () => {
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
