# Technical Debt Fix Plan — GitHub Issues

> Copy any section below into a new GitHub Issue. Titles, labels, and acceptance criteria are provided.

---

## Epic: Technical Debt Reduction — Lint & Type Safety

**Labels:** `tech-debt`, `epic`
**Milestone:** Phase 0–6

### Summary

Track the six-week programme to reduce ESLint problems from 3,421 to <50 and warnings to <100, while raising type safety across the codebase.

### Acceptance Criteria

- Week-by-week targets hit (see Success Metrics).
- All phase issues closed.
- Final pass shows <50 errors, <100 warnings via `pnpm lint`.
- 95%+ code properly typed.

---

## Phase 0 — ESLint Configuration (Day 1)

**Title:** Phase 0: Fix ESLint configuration & hooks rules
**Labels:** `tech-debt`, `linting`, `priority: critical`, `phase:0`
**Milestone:** Phase 0

### Description

Establish a correct ESLint baseline so linting runs reliably.

### Tasks

- [x] Fix missing React hooks rules (`react-hooks/exhaustive-deps`).
- [x] Ensure all ESLint plugins are properly configured.
- [x] Verify configuration in `eslint.config.mjs` and `package.json` (deps).
- [x] Remove/merge any stray `.eslintrc*` files if present.
- [x] Confirm lint runs without configuration errors.

### Files

- `eslint.config.mjs`
- `package.json`
- Any `.eslintrc*`

### Acceptance Criteria

- Running `pnpm lint` completes with no configuration errors.
- React Hooks rules active and reported when violated.
- All ESLint plugins load without warnings.

---

## Phase 1 — Critical Type Safety (Week 1)

**Title:** Phase 1: Core data model typings & unsafe access (Critical)
**Labels:** `tech-debt`, `typescript`, `priority: high`, `phase:1`
**Milestone:** Phase 1

### Description

Remove `any` and unsafe access in core data model and domain-critical components.

### Sub-Issues

- [ ] `src/lib/actions/syncUsers.ts`
  - [ ] Remove `any` from Statsig adapter types.
  - [ ] Fix unsafe member access and function calls.
  - [ ] Resolve base-to-string conversion issues.
- [ ] `src/lib/actions/userActions.ts`
  - [ ] Fix unsafe array spreads.
  - [ ] Tighten template literal constraints.
  - [ ] Fix `unknown` in template literals.
- [ ] `src/lib/permissions.ts`
  - [ ] Remove redundant union constituents & `any` overrides.
  - [ ] Fix unsafe destructuring.
- [ ] `src/components/domain/EditStaffForm.tsx`
  - [ ] Proper form data types.
  - [ ] Safe API response handling.
  - [ ] No floating promises.
- [ ] `src/components/domain/FeatureBaseWidget.tsx`
  - [ ] Strong API response types.
  - [ ] Safe member access.
  - [ ] Await or handle all promises.
- [ ] `src/components/domain/UsersList.tsx`
  - [ ] Error handling types.
  - [ ] Remove unsafe assignments.
  - [ ] Correct promise chaining.

### Acceptance Criteria

- Type checks pass with no `any` in the files above (except intentional, documented utility escape hatches).
- No floating promises or unsafe member access remain.
- Lint error count reduced per Week 1 target (<2,000).

---

## Phase 1.3 — Promise Handling in Auth Components

**Title:** Phase 1.3: Promise handling fixes in auth components
**Labels:** `tech-debt`, `typescript`, `priority: high`, `phase:1`
**Milestone:** Phase 1

### Description

Fix async function implementations and floating promises in auth login surfaces.

### Tasks

- [ ] `src/components/login-form.tsx`: add proper `await`, fix async functions, remove floating promises.
- [ ] `src/hooks/useDevLogin.ts`: fix async patterns and result handling.

### Acceptance Criteria

- No ESLint complaints about floating promises.
- Errors are surfaced via the UI or logging as appropriate.
- TypeScript infers correct return types.

---

## Phase 2 — Component Type Safety (Week 2)

**Title:** Phase 2: Form & UI component typings (Medium)
**Labels:** `tech-debt`, `typescript`, `priority: medium`, `phase:2`
**Milestone:** Phase 2

### Description

Strengthen types on forms and common UI elements used across the app.

### Sub-Issues

- [ ] `src/components/domain/EditUserForm.tsx`
  - [ ] Error response types.
  - [ ] Remove unsafe assignments.
  - [ ] Promise handling in event handlers.
- [ ] `src/components/domain/OrganisationForm.tsx`
  - [ ] Submission types.
  - [ ] Promise handling.
- [ ] `src/components/domain/PermissionForm.tsx`
  - [ ] Validation types.
  - [ ] Promise handling.
- [ ] `src/components/ui/input-otp.tsx`
  - [ ] Slot typings (no `any`).
  - [ ] Safe member access.
- [ ] `src/components/ui/sidebar.tsx`
  - [ ] React Hooks rule compliance.
  - [ ] ESLint config alignment.
- [ ] `src/components/ui/command.tsx`
  - [ ] Remove empty interface; define minimal, correct shape.
- [ ] `src/components/ui/chart.tsx`
  - [ ] Fix object stringification warnings.
  - [ ] Remove unused variables.

### Acceptance Criteria

- All files above compile without `any` leaks.
- Hooks usage passes lint rules.
- No unused variables in UI layer.

---

## Phase 3 — API & Data Layer (Week 3)

**Title:** Phase 3: API response types, middleware & instrumentation (Medium)
**Labels:** `tech-debt`, `typescript`, `priority: medium`, `phase:3`
**Milestone:** Phase 3

### Description

Improve types around API integrations and platform middleware.

### Sub-Issues

- [ ] `src/lib/analytics.ts`
  - [ ] Strong function signatures (no `any` params).
  - [ ] Remove unused error variables.
- [ ] `src/lib/authz.ts`
  - [ ] Accurate error status code types.
  - [ ] Safe error member access.
- [ ] `src/lib/feature-flags/*`
  - [ ] Statsig integration types.
  - [ ] Async function implementations.
- [ ] `src/middleware.ts`
  - [ ] Error handling types.
  - [ ] Remove unused error variables.
- [ ] `src/instrumentation-client.ts`
  - [ ] E2E detection types.
  - [ ] Promise handling.
- [ ] `src/sanity/lib/*`
  - [ ] Sanity client types.
  - [ ] Async methods typed.

### Acceptance Criteria

- All above modules have explicit, accurate types.
- No `any` in public function signatures.
- Middleware & instrumentation pass lint.

---

## Phase 4 — Advanced Type Issues (Week 4)

**Title:** Phase 4: Complex unions, template literals, import-type consistency
**Labels:** `tech-debt`, `typescript`, `priority: medium`, `phase:4`
**Milestone:** Phase 4

### Description

Resolve advanced typing issues across complex unions, template literals, and import-type patterns.

### Sub-Issues

- [ ] `src/hooks/usePermissionActions.ts`
  - [ ] Remove redundant type constituents.
  - [ ] Remove `any` overrides in unions.
- [ ] `src/lib/actions/syncUsers.ts`
  - [ ] Import type annotations.
  - [ ] Union type fixes.
- [ ] `src/lib/actions/userActions.ts`
  - [ ] Template literal `unknown` and constraint fixes.
- [ ] Global: consistent `import type` usage across files.

### Acceptance Criteria

- Consistent `import type` usage where appropriate.
- Complex unions simplified and safe.
- No template-literal typing errors remain.

---

## Phase 5 — Cleanup & Optimisation (Week 5)

**Title:** Phase 5: Remove unused code & align ESLint rules (Low)
**Labels:** `tech-debt`, `linting`, `priority: low`, `phase:5`
**Milestone:** Phase 5

### Tasks

- [ ] Remove unused imports/variables.
- [ ] Prefix intentionally unused params with `_` where rules require it.
- [ ] Delete dead code.
- [ ] Align with:
  - `@typescript-eslint/consistent-type-imports`
  - `@typescript-eslint/no-unnecessary-type-assertion`
  - `@typescript-eslint/restrict-template-expressions`
  - `@typescript-eslint/no-unused-vars`

### Acceptance Criteria

- Lint runs clean for the above rules.
- Tree-shakeable code wherever possible.

---

## Phase 6 — Final Polish (Week 6)

**Title:** Phase 6: Edge cases, performance & final review (Low)
**Labels:** `tech-debt`, `priority: low`, `phase:6`
**Milestone:** Phase 6

### Tasks

- [ ] Address remaining type issues.
- [ ] Resolve complex type constraints.
- [ ] Performance pass (identify hotspots).
- [ ] Ensure consistency across files.
- [ ] Final code review and cleanup.

### Acceptance Criteria

- <50 ESLint errors and <100 warnings.
- > 95% code with proper types.
- Performance notes and follow-ups documented.

---

## Tracking & Metrics

**Title:** Tracking: Weekly targets & progress updates
**Labels:** `tracking`, `metrics`
**Milestone:** Phase 0–6

### Description

Create a single tracking issue to record weekly problem counts and progress.

### Checkpoints

- **Week 1:** <2,000 errors
- **Week 2:** <1,200 errors
- **Week 3:** <600 errors
- **Week 4:** <300 errors
- **Week 5:** <100 errors
- **Week 6:** <50 errors

### Acceptance Criteria

- Comment after each phase with lint counts and notable fixes.
- Attach `pnpm lint` output snippet per week.
