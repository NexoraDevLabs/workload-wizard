# TypeScript Safety Guidelines

This document outlines our TypeScript safety practices and guidelines for maintaining type safety across the codebase.

## Overview

We use strict TypeScript configuration with elevated safety rules to catch potential runtime errors at compile time. This includes:

- `noUncheckedSideEffectImports`: Prevents importing modules that might have side effects without explicit handling
- `verbatimModuleSyntax`: Requires explicit `import type` for type-only imports
- Elevated `@typescript-eslint/no-unsafe-*` rules to error level for application code

## When to Suppress Rules

Suppressions should be used sparingly and only in specific circumstances:

### 1. External Library Boundaries

When working with untyped third-party libraries or APIs that don't provide proper TypeScript definitions.

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- justified: upstream types missing; tracked in #123; remove by 2025-10-31
const result = someUntypedLibrary.method();
```

### 2. Convex Type Inference Issues

For complex Convex queries/mutations where type inference becomes excessively deep.

```typescript
// @ts-expect-error - Type instantiation is excessively deep due to Convex type inference
const data = useQuery(api.complex.getData, { params });
```

For monitoring libraries where callback types are complex.

```typescript
return event;
```

## Suppression Format

All suppressions must include:

1. **Justification**: Brief explanation of why suppression is needed
2. **Tracking**: Issue number or TODO for follow-up
3. **Time-box**: Date by which to remove the suppression

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- justified: upstream types missing; tracked in #123; remove by 2025-10-31
```

## Preferred Alternatives

Instead of suppressing rules, prefer these approaches:

### 1. Type Guards and Runtime Validation

```typescript
// Instead of: const data: any = JSON.parse(input);
const parsed: unknown = JSON.parse(input);
const result = Schema.safeParse(parsed);
if (!result.success) throw new Error('Invalid payload');
const data = result.data; // now properly typed
```

### 2. Explicit Type Imports

```typescript
// Instead of: import { Type, Value } from './module';
import type { Type } from './module';
import { Value } from './module';
```

### 3. Generic Constraints

```typescript
// Instead of: function process(data: any) {
function process<T extends Record<string, unknown>>(data: T) {
  // T is constrained but flexible
}
```

### 4. Branded Types and Assertion Functions

```typescript
type UserId = string & { __brand: 'UserId' };
function assertUserId(value: unknown): asserts value is UserId {
  if (typeof value !== 'string') throw new Error('Invalid user ID');
}
```

## Migration to verbatimModuleSyntax

When converting implicit type imports to explicit:

### Before:

```typescript
import { Component, Props } from './component';
```

### After:

```typescript
import type { Props } from './component';
import { Component } from './component';
```

### Auto-fix Available

Most of these conversions can be automatically applied using:

```bash
npm run lint --fix
```

## Test Files

Test files have relaxed rules (warnings instead of errors) for the unsafe rules to avoid churn during development:

- `@typescript-eslint/no-unsafe-assignment`: warn
- `@typescript-eslint/no-unsafe-call`: warn
- `@typescript-eslint/no-unsafe-member-access`: warn
- `@typescript-eslint/no-unsafe-return`: warn
- `@typescript-eslint/no-unsafe-argument`: warn

## Quick Checklist

When migrating code to be compatible with our safety rules:

- [ ] Replace `any` with `unknown` and add proper type guards
- [ ] Convert implicit type imports to `import type`
- [ ] Add runtime validation for external data sources
- [ ] Use generic constraints instead of `any` where possible
- [ ] Add proper error handling for type assertions
- [ ] Document any necessary suppressions with justification and tracking

## Enforcement

These rules are enforced in CI/CD:

- `npm run typecheck`: Must pass with 0 errors
- `npm run lint`: Must pass with 0 errors (warnings allowed in test files)

Any new suppressions should be reviewed and approved as part of the PR process.
