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

// Store original console and NODE_ENV
const originalConsole = global.console;
const originalNodeEnv = process.env.NODE_ENV;
const originalLogLevel = process.env.LOG_LEVEL;

describe('logger', () => {
  beforeEach(() => {
    // Mock console
    global.console = mockConsole as Record<string, unknown>;
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset environment
    delete process.env.LOG_LEVEL;
    
    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original console and environment
    global.console = originalConsole;
    process.env.NODE_ENV = originalNodeEnv;
    if (originalLogLevel) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  describe('redact function', () => {
    it('should redact sensitive keys in objects', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
        token: 'abc123',
        data: {
          apiKey: 'key123',
          normalField: 'value',
        },
      };

      const result = redact(input);

      expect(result).toEqual({
        username: 'john',
        password: '[REDACTED]',
        email: '[REDACTED]',
        token: '[REDACTED]',
        data: {
          apiKey: '[REDACTED]',
          normalField: 'value',
        },
      });
    });

    it('should redact sensitive keys in arrays', () => {
      const input = [
        { name: 'user1', password: 'pass1' },
        { name: 'user2', token: 'token2' },
      ];

      const result = redact(input);

      expect(result).toEqual([
        { name: 'user1', password: '[REDACTED]' },
        { name: 'user2', token: '[REDACTED]' },
      ]);
    });

    it('should redact bearer tokens in strings', () => {
      const input = 'Bearer abc123def456';
      const result = redact(input);
      expect(result).toBe('Bearer [REDACTED]');
    });

    it('should redact various token patterns in strings', () => {
      const inputs = [
        'token: abc123',
        'key: secret_key',
        'password: mypass',
        'secret: hidden',
      ];

      inputs.forEach(input => {
        const result = redact(input);
        expect(result).toContain('[REDACTED]');
      });
    });

    it('should handle null and undefined', () => {
      expect(redact(null)).toBe(null);
      expect(redact(undefined)).toBe(undefined);
    });

    it('should handle primitive values', () => {
      expect(redact('hello')).toBe('hello');
      expect(redact(123)).toBe(123);
      expect(redact(true)).toBe(true);
    });
  });

  describe('logger in development', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should log messages when level allows', async () => {
      const { logger } = await import('../logger');
      logger.info('test message');
      expect(mockConsole.info).toHaveBeenCalledWith('test message');
    });

    it('should respect LOG_LEVEL environment variable', async () => {
      process.env.LOG_LEVEL = 'warn';
      
      // Re-import logger to pick up new LOG_LEVEL
      const { logger: newLogger } = await import('../logger');
      
      newLogger.info('should not log');
      newLogger.warn('should log');
      newLogger.error('should log');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith('should log');
      expect(mockConsole.error).toHaveBeenCalledWith('should log');
    });

    it('should redact sensitive data in logged messages', async () => {
      const { logger } = await import('../logger');
      const sensitiveData = {
        username: 'john',
        password: 'secret123',
        message: 'Bearer token123',
      };

      logger.info('User data:', sensitiveData);

      expect(mockConsole.info).toHaveBeenCalledWith('User data:', {
        username: 'john',
        password: '[REDACTED]',
        message: 'Bearer [REDACTED]',
      });
    });

    it('should support all log levels', async () => {
      // Set LOG_LEVEL to debug to allow all levels
      process.env.LOG_LEVEL = 'debug';
      
      // Re-import logger to pick up new LOG_LEVEL
      const { logger: debugLogger } = await import('../logger');
      
      debugLogger.debug('debug message');
      debugLogger.info('info message');
      debugLogger.warn('warn message');
      debugLogger.error('error message');

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
      process.env.NODE_ENV = 'production';
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
    it('should not log anything when LOG_LEVEL is silent', async () => {
      process.env.LOG_LEVEL = 'silent';
      
      // Re-import logger to pick up new LOG_LEVEL
      const { logger: silentLogger } = await import('../logger');
      
      silentLogger.debug('debug message');
      silentLogger.info('info message');
      silentLogger.warn('warn message');
      silentLogger.error('error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });
});
