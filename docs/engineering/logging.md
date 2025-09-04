# Logging Guidelines

This document outlines the logging system and guidelines for the WorkloadWizard application.

## Overview

We use a custom logger instead of `console.*` methods to ensure:

- No logging output in production bundles
- Automatic redaction of sensitive data
- Configurable log levels
- ESLint enforcement against console usage

## Usage

### Basic Usage

```typescript
import { logger } from '@/lib/logger';

// Log messages at different levels
logger.debug('Debug information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred');
```

### Logging Objects

```typescript
const userData = {
  id: '123',
  email: 'user@example.com',
  password: 'secret123', // This will be redacted
  preferences: {
    theme: 'dark',
    apiKey: 'key123', // This will be redacted
  },
};

logger.info('User data:', userData);
// Output: User data: { id: '123', email: '[REDACTED]', password: '[REDACTED]', preferences: { theme: 'dark', apiKey: '[REDACTED]' } }
```

### Child Loggers

```typescript
const childLogger = logger.child();
childLogger.info('Message from child logger');
```

## Log Levels

The logger supports the following levels (in order of priority):

1. `silent` - No logging
2. `error` - Only error messages
3. `warn` - Warning and error messages
4. `info` - Info, warning, and error messages (default)
5. `debug` - All messages

### Setting Log Level

Set the `LOG_LEVEL` environment variable:

```bash
# Development
LOG_LEVEL=debug

# Production
LOG_LEVEL=error

# Silent (no logging)
LOG_LEVEL=silent
```

## Production Behavior

In production (`NODE_ENV=production`), all logger methods are no-ops to ensure no logging output appears in production bundles.

## Data Redaction

The logger automatically redacts sensitive information from logged data:

### Redacted Keys

- `password`, `pass`, `pwd`, `passwd`
- `token`, `accessToken`, `refreshToken`
- `secret`, `apiKey`, `api_key`
- `email`, `emailAddress`
- `authorization`, `auth`
- `jwt`, `bearer`
- `key`, `privateKey`, `publicKey`
- `credential`, `credentials`
- `ssn`, `socialSecurityNumber`
- `creditCard`, `credit_card`, `cvv`, `cvc`
- `pin`, `passphrase`
- `seed`, `mnemonic`
- `private`, `confidential`, `sensitive`

### String Pattern Redaction

- `Bearer token123` → `Bearer [REDACTED]`
- `token: abc123` → `token: [REDACTED]`
- `key: secret_key` → `key: [REDACTED]`
- `password: mypass` → `password: [REDACTED]`
- `secret: hidden` → `secret: [REDACTED]`

## ESLint Enforcement

The project uses ESLint to prevent `console.*` usage in application code:

- **Error**: `console.log`, `console.info`, `console.warn`, `console.error` are blocked
- **Allowed**: Only in test files, scripts, and build tools

### Override Locations

- `**/*.test.*` - Test files
- `**/tests/**` - Test directories
- `scripts/**` - Build and utility scripts
- `**/test/**` - Additional test directories

## Build Verification

A build verification script ensures no console calls are present in production bundles:

```bash
# Run verification after build
pnpm verify:no-console
```

This script:

1. Builds the application
2. Scans build artifacts for console calls
3. Reports any violations with file and line numbers
4. Exits with error code if violations found

## Best Practices

### Do's

- Use `logger.info()` for general information
- Use `logger.warn()` for warnings
- Use `logger.error()` for errors
- Use `logger.debug()` for debug information
- Log objects and arrays (they'll be automatically redacted)
- Use descriptive log messages

### Don'ts

- Never use `console.*` methods in application code
- Don't log sensitive data directly (use objects that will be redacted)
- Don't log in tight loops or performance-critical code
- Don't rely on logs for critical business logic

### Examples

```typescript
// ✅ Good
logger.info('User logged in', { userId: user.id, email: user.email });
logger.error('Database connection failed', { error: error.message });

// ❌ Bad
console.log('User logged in', user); // Will be caught by ESLint
logger.info('Password is:', password); // Sensitive data in message
```

## Testing

The logger includes comprehensive tests covering:

- Redaction functionality
- Log level filtering
- Production no-op behavior
- Child logger creation

Run tests with:

```bash
pnpm test
```

## Migration from console.\*

When migrating existing code:

1. Import the logger: `import { logger } from '@/lib/logger';`
2. Replace console methods:
   - `console.log` → `logger.info`
   - `console.info` → `logger.info`
   - `console.warn` → `logger.warn`
   - `console.error` → `logger.error`
3. Run ESLint to catch any missed instances
4. Run build verification to ensure no console calls in production

## Troubleshooting

### ESLint Errors

If you see ESLint errors about console usage:

1. Replace with appropriate logger method
2. If console is needed (e.g., in scripts), move to `scripts/` directory
3. For test files, ensure they're in the correct test directory

### Build Verification Failures

If `pnpm verify:no-console` fails:

1. Check the reported files and line numbers
2. Replace console calls with logger methods
3. Rebuild and verify again

### Missing Logs in Development

1. Check `LOG_LEVEL` environment variable
2. Ensure you're not in production mode
3. Verify logger import is correct
