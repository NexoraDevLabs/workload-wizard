# Technical Debt Fix Plan

## Overview

This document outlines the systematic approach to fix 3,421+ linting issues in the workload-wizard project. The goal is to improve type safety, code quality, and maintainability while preserving functionality.

## Current Status

- ✅ **Build Issues**: RESOLVED - Project builds successfully
- ✅ **TypeScript Compilation**: RESOLVED - Type checking passes
- ❌ **Linting Issues**: 3,161 errors + 260 warnings = 3,421 total problems
- ❌ **Type Safety**: Extensive use of `any` types throughout codebase

## Phase 0: ESLint Configuration (Day 1)

**Priority: CRITICAL - Must fix first to get proper linting baseline**

### Tasks

- [x] Fix missing React hooks rules (`react-hooks/exhaustive-deps`)
- [x] Ensure all ESLint plugins are properly configured
- [x] Verify ESLint configuration in `eslint.config.mjs`
- [x] Test that linting runs without configuration errors

### Files to Check

- `eslint.config.mjs`
- `package.json` (ESLint dependencies)
- Any `.eslintrc` files

---

## Phase 1: Critical Type Safety (Week 1)

**Priority: HIGH - These affect runtime safety and data integrity**

### 1.1 Fix Core Data Model Types

- [ ] `src/lib/actions/syncUsers.ts`
  - [ ] Fix Statsig adapter types (remove `any`)
  - [ ] Fix unsafe member access on `any` values
  - [ ] Fix unsafe function calls
  - [ ] Fix base-to-string conversion issues

- [ ] `src/lib/actions/userActions.ts`
  - [ ] Fix unsafe array spread operations
  - [ ] Fix template literal type constraints
  - [ ] Fix `unknown` types in template literals

- [ ] `src/lib/permissions.ts`
  - [ ] Fix redundant union type issues
  - [ ] Fix `any` overrides in union types
  - [ ] Fix unsafe object destructuring

### 1.2 Fix Unsafe Member Access

- [ ] `src/components/domain/EditStaffForm.tsx`
  - [ ] Fix form data types (remove `any`)
  - [ ] Fix unsafe member access on API responses
  - [ ] Fix unsafe function calls

- [ ] `src/components/domain/FeatureBaseWidget.tsx`
  - [ ] Fix API response types
  - [ ] Fix unsafe member access
  - [ ] Fix floating promises

- [ ] `src/components/domain/UsersList.tsx`
  - [ ] Fix error handling types
  - [ ] Fix unsafe assignments
  - [ ] Fix promise handling

### 1.3 Fix Promise Handling

- [ ] `src/components/login-form.tsx`
  - [ ] Fix async function implementations
  - [ ] Add proper await expressions
  - [ ] Fix floating promises

- [ ] `src/hooks/useDevLogin.ts`
  - [ ] Fix async function implementations
  - [ ] Fix promise handling

---

## Phase 2: Component Type Safety (Week 2)

**Priority: MEDIUM - These affect component reliability**

### 2.1 Fix Form Components

- [ ] `src/components/domain/EditUserForm.tsx`
  - [ ] Fix error response types
  - [ ] Fix unsafe assignments
  - [ ] Fix promise handling in event handlers

- [ ] `src/components/domain/OrganisationForm.tsx`
  - [ ] Fix form submission types
  - [ ] Fix promise handling

- [ ] `src/components/domain/PermissionForm.tsx`
  - [ ] Fix validation types
  - [ ] Fix promise handling

### 2.2 Fix UI Components

- [ ] `src/components/ui/input-otp.tsx`
  - [ ] Fix slot types (remove `any`)
  - [ ] Fix unsafe member access

- [ ] `src/components/ui/sidebar.tsx`
  - [ ] Fix React hooks rules
  - [ ] Fix ESLint configuration

- [ ] `src/components/ui/command.tsx`
  - [ ] Fix empty interface declaration

- [ ] `src/components/ui/chart.tsx`
  - [ ] Fix object stringification warnings
  - [ ] Fix unused variables

---

## Phase 3: API & Data Layer (Week 3)

**Priority: MEDIUM - These affect data integrity**

### 3.1 Fix API Response Types

- [ ] `src/lib/analytics.ts`
  - [ ] Fix tracking function types
  - [ ] Remove unused error variables
  - [ ] Fix `any` types in function parameters

- [ ] `src/lib/authz.ts`
  - [ ] Fix error status code types
  - [ ] Fix unsafe member access on errors

- [ ] `src/lib/feature-flags/*`
  - [ ] Fix Statsig integration types
  - [ ] Fix async function implementations

### 3.2 Fix Middleware & Instrumentation

- [ ] `src/middleware.ts`
  - [ ] Fix error handling types
  - [ ] Remove unused error variables

- [ ] `src/instrumentation-client.ts`
  - [ ] Fix E2E detection types
  - [ ] Fix promise handling

- [ ] `src/sanity/lib/*`
  - [ ] Fix Sanity client types
  - [ ] Fix async method implementations

---

## Phase 4: Advanced Type Issues (Week 4)

**Priority: MEDIUM - These require sophisticated type system work**

### 4.1 Fix Complex Union Types

- [ ] `src/hooks/usePermissionActions.ts`
  - [ ] Fix redundant type constituents
  - [ ] Fix `any` overrides in union types

- [ ] `src/lib/actions/syncUsers.ts`
  - [ ] Fix import type annotation issues
  - [ ] Fix union type problems

### 4.2 Fix Template Literal Types

- [ ] `src/lib/actions/userActions.ts`
  - [ ] Fix `unknown` types in template literals
  - [ ] Fix type constraints

### 4.3 Fix Import Type Consistency

- [ ] Multiple files need `import type` fixes
- [ ] Fix consistent type import patterns

---

## Phase 5: Cleanup & Optimization (Week 5)

**Priority: LOW - These improve code quality**

### 5.1 Remove Unused Code

- [ ] Remove unused imports/variables
- [ ] Prefix unused variables with `_` where required
- [ ] Clean up dead code

### 5.2 Fix ESLint Rule Violations

- [ ] `@typescript-eslint/consistent-type-imports`
- [ ] `@typescript-eslint/no-unnecessary-type-assertion`
- [ ] `@typescript-eslint/restrict-template-expressions`
- [ ] `@typescript-eslint/no-unused-vars`

---

## Phase 6: Final Cleanup (Week 6)

**Priority: LOW - These are final polish items**

### 6.1 Address Edge Cases

- [ ] Fix any remaining type issues
- [ ] Resolve complex type constraints
- [ ] Fix remaining ESLint warnings

### 6.2 Performance & Consistency

- [ ] Identify performance optimization opportunities
- [ ] Ensure code consistency across files
- [ ] Final code review and cleanup

---

## Implementation Strategy

### Daily Process

1. **Pick 1-2 files per day** from the current phase
2. **Fix types systematically** - replace `any` with proper interfaces
3. **Test functionality** - ensure fixes don't break features
4. **Commit changes** - small, focused commits

### Type Definition Approach

```typescript
// Instead of:
const data: any = await api.getData();

// Use:
interface ApiResponse {
  id: string;
  name: string;
  // ... other properties
}
const data: ApiResponse = await api.getData();
```

### Error Handling Pattern

```typescript
// Instead of:
} catch (error) {
  console.log(error.anyProperty); // unsafe

// Use:
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // safe
  }
}
```

---

## Success Metrics

### Week-by-Week Goals

- **Week 1**: Reduce errors from 3,161 to <2,000
- **Week 2**: Reduce errors from 2,000 to <1,200
- **Week 3**: Reduce errors from 1,200 to <600
- **Week 4**: Reduce errors from 600 to <300
- **Week 5**: Reduce errors from 300 to <100
- **Week 6**: Reduce errors from 100 to <50

### Final Target

- **Total Errors**: <50
- **Total Warnings**: <100
- **Type Safety**: >95% of code properly typed

---

## Risk Mitigation

### Development Guidelines

1. **Test each fix** - Don't assume type changes are safe
2. **Fix incrementally** - Don't try to fix everything at once
3. **Maintain functionality** - Type safety shouldn't break features
4. **Document changes** - Keep track of what was fixed

### Rollback Strategy

- Keep commits small and focused
- Test functionality after each file fix
- Have ability to revert individual file changes if needed

---

## File Priority Matrix

### Critical (Fix First)

- `src/lib/actions/syncUsers.ts`
- `src/lib/actions/userActions.ts`
- `src/lib/permissions.ts`
- `src/components/domain/EditStaffForm.tsx`
- `src/components/domain/FeatureBaseWidget.tsx`

### High Priority

- `src/components/domain/UsersList.tsx`
- `src/components/login-form.tsx`
- `src/hooks/useDevLogin.ts`
- `src/lib/analytics.ts`

### Medium Priority

- `src/components/domain/EditUserForm.tsx`
- `src/components/ui/input-otp.tsx`
- `src/middleware.ts`
- `src/lib/feature-flags/*`

### Low Priority

- Unused imports/variables
- ESLint rule consistency
- Code formatting improvements

---

## Notes

- **Start with Phase 0** - ESLint configuration must be fixed first
- **Focus on runtime safety** - Prioritize fixes that prevent crashes
- **Maintain functionality** - Every fix should be tested
- **Document progress** - Update this file as phases are completed

---

## Progress Tracking

### Phase 0: ESLint Configuration

- [ ] Started: \_\_\_
- [ ] Completed: \_\_\_
- [ ] Notes: \_\_\_

### Phase 1: Critical Type Safety

- [ ] Started: \_\_\_
- [ ] Completed: \_\_\_
- [ ] Files Fixed: **_ / _**
- [ ] Notes: \_\_\_

### Phase 2: Component Type Safety

- [ ] Started: \_\_\_
- [ ] Completed: \_\_\_
- [ ] Files Fixed: **_ / _**
- [ ] Notes: \_\_\_

### Phase 3: API & Data Layer

- [ ] Started: \_\_\_
- [ ] Completed: \_\_\_
- [ ] Files Fixed: **_ / _**
- [ ] Notes: \_\_\_

### Phase 4: Advanced Type Issues

- [ ] Started: \_\_\_
- [ ] Completed: \_\_\_
- [ ] Files Fixed: **_ / _**
- [ ] Notes: \_\_\_

### Phase 5: Cleanup & Optimization

- [ ] Started: \_\_\_
- [ ] Completed: \_\_\_
- [ ] Files Fixed: **_ / _**
- [ ] Notes: \_\_\_

### Phase 6: Final Cleanup

- [ ] Started: \_\_\_
- [ ] Completed: \_\_\_
- [ ] Files Fixed: **_ / _**
- [ ] Notes: \_\_\_
