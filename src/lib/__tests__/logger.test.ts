import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redact } from '../logger';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const originalConsole = global.console;

describe('logger', () => {
  beforeEach(() => {
    // Mock console
    global.console = mockConsole as unknown as Console;
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original console and environment
    global.console = originalConsole;
    vi.unstubAllEnvs();
  });

  describe('redact function', () => {
    it('should redact sensitive keys in objects', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
        token: 'abc123',
        normalField: 'value',
      };
      
      const result = redact(input);
      
      expect(result).toEqual({
        username: 'john',
        password: '[REDACTED]',
        email: '[REDACTED]',
        token: '[REDACTED]',
        normalField: 'value',
      });
    });

    it('should redact sensitive keys in arrays', () => {
      const input = [
        { name: 'user1', password: 'pass1' },
        { name: 'user2', secret: 'secret2' },
      ];
      
      const result = redact(input);
      
      expect(result).toEqual([
        { name: 'user1', password: '[REDACTED]' },
        { name: 'user2', secret: '[REDACTED]' },
      ]);
    });

    it('should redact bearer tokens in strings', () => {
      const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const result = redact(input);
      expect(result).toBe('Bearer [REDACTED]');
    });

    it('should redact various token patterns in strings', () => {
      expect(redact('token: abc123def456')).toBe('token: [REDACTED]');
      expect(redact('api_key=xyz789')).toBe('api_key: [REDACTED]');
      expect(redact('authorization: Bearer token123')).toBe('authorization: Bearer [REDACTED]');
    });

    it('should handle null and undefined', () => {
      expect(redact(null)).toBe(null);
      expect(redact(undefined)).toBe(undefined);
    });

    it('should handle primitive values', () => {
      expect(redact('string')).toBe('string');
      expect(redact(123)).toBe(123);
      expect(redact(true)).toBe(true);
    });
  });

  describe('logger in development', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('should log messages when level allows', async () => {
      const { logger } = await import('../logger');
      logger.info('test message');
      expect(mockConsole.info).toHaveBeenCalledWith('test message');
    });

    it('should respect LOG_LEVEL environment variable', async () => {
      vi.stubEnv('LOG_LEVEL', 'error');
      const { logger } = await import('../logger');
      
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      
      expect(mockConsole.error).toHaveBeenCalledWith('error message');
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should redact sensitive data in logged messages', async () => {
      const { logger } = await import('../logger');
      logger.info('User data:', { username: 'john', password: 'secret' });
      
      expect(mockConsole.info).toHaveBeenCalledWith('User data:', {
        username: 'john',
        password: '[REDACTED]',
      });
    });

    it('should support all log levels', async () => {
      vi.stubEnv('LOG_LEVEL', 'debug');
      const { logger } = await import('../logger');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith('debug message');
      expect(mockConsole.info).toHaveBeenCalledWith('info message');
      expect(mockConsole.warn).toHaveBeenCalledWith('warn message');
      expect(mockConsole.error).toHaveBeenCalledWith('error message');
    });

    it('should create child loggers', async () => {
      const { logger } = await import('../logger');
      const childLogger = logger.child();
      
      childLogger.info('child message');
      expect(mockConsole.info).toHaveBeenCalledWith('child message');
    });
  });

  describe('logger in production', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('should not log anything in production', async () => {
      // Re-import logger to pick up production NODE_ENV
      const { logger: prodLogger } = await import('../logger');
      
      prodLogger.debug('debug message');
      prodLogger.info('info message');
      prodLogger.warn('warn message');
      prodLogger.error('error message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe('logger with silent level', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('LOG_LEVEL', 'silent');
    });

    it('should not log anything when LOG_LEVEL is silent', async () => {
      const { logger } = await import('../logger');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });
});