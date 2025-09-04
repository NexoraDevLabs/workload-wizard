export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const isProd = process.env.NODE_ENV === 'production';
const DEFAULT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const SENSITIVE_KEYS = [
  'password',
  'pass',
  'token',
  'secret',
  'authorization',
  'auth',
  'email',
  'apiKey',
  'apikey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'sessionId',
  'session_id',
  'cookie',
  'cookies',
  'jwt',
  'bearer',
  'key',
  'privateKey',
  'private_key',
  'publicKey',
  'public_key',
  'credential',
  'credentials',
  'ssn',
  'socialSecurityNumber',
  'creditCard',
  'credit_card',
  'cvv',
  'cvc',
  'pin',
  'pwd',
  'passwd',
  'passphrase',
  'seed',
  'mnemonic',
  'private',
  'confidential',
  'sensitive',
];

// Redact helper (exported for tests)
export function redact<T>(value: T): T {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(v => redact(v)) as unknown as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v);
      }
    }
    return out as unknown as T;
  }
  if (typeof value === 'string') {
    // Mask bearer tokens and other common patterns
    return value
      .replace(/bearer\s+[a-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/token\s*[:=]\s*[a-z0-9._-]+/gi, 'token: [REDACTED]')
      .replace(/key\s*[:=]\s*[a-z0-9._-]+/gi, 'key: [REDACTED]')
      .replace(/password\s*[:=]\s*[^\s]+/gi, 'password: [REDACTED]')
      .replace(/secret\s*[:=]\s*[a-z0-9._-]+/gi, 'secret: [REDACTED]') as unknown as T;
  }
  return value;
}

function levelIndex(level: Exclude<LogLevel, 'silent'>): number {
  return { error: 0, warn: 1, info: 2, debug: 3 }[level];
}

function makeLogger(level: LogLevel = DEFAULT_LEVEL): {
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  child: () => ReturnType<typeof makeLogger>;
} {
  const noop = () => {};
  if (isProd || level === 'silent') {
    return { error: noop, warn: noop, info: noop, debug: noop, child: () => makeLogger(level) };
  }

  // At this point, level is guaranteed to be one of the non-silent levels
  const currentIdx = levelIndex(level);

  const out =
    (kind: 'error' | 'warn' | 'info' | 'debug') =>
    (...args: unknown[]) => {
      const idx = levelIndex(kind);
      if (idx > currentIdx) return;
                     
              (console as Record<string, (...args: unknown[]) => void>)[kind](...args.map(redact));
    };

  return {
    error: out('error'),
    warn: out('warn'),
    info: out('info'),
    debug: out('debug'),
    child: () => makeLogger(level),
  };
}

export const logger = makeLogger();
export default logger;
