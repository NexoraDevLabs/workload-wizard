<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

- [Testing Procedures - WorkloadWizard](#testing-procedures---workloadwizard)
  - [🎯 **Overview**](#-overview)
  - [🚀 **Quick Start**](#-quick-start)
    - [Prerequisites](#prerequisites)
    - [Running Tests](#running-tests)
      - [All Tests](#all-tests)
      - [Specific Test Types](#specific-test-types)
      - [Test Runner Options](#test-runner-options)
  - [🧪 **Test Types**](#-test-types)
    - [1. Unit Tests (`pnpm test`)](#1-unit-tests-pnpm-test)
    - [2. E2E Tests (`pnpm e2e`)](#2-e2e-tests-pnpm-e2e)
    - [3. Performance Tests (`pnpm test:performance`)](#3-performance-tests-pnpm-testperformance)
    - [4. Visual Regression Tests (`pnpm test:visual`)](#4-visual-regression-tests-pnpm-testvisual)
    - [5. Group Creation Tests (`pnpm test:e2e --grep group-creation`)](#5-group-creation-tests-pnpm-teste2e---grep-group-creation)
  - [🔧 **Test Configuration**](#-test-configuration)
    - [Playwright Configuration (`playwright.config.ts`)](#playwright-configuration-playwrightconfigts)
    - [Test Fixtures (`tests/e2e/fixtures.ts`)](#test-fixtures-testse2efixturests)
  - [📊 **Test Results & Reporting**](#-test-results--reporting)
    - [Output Locations](#output-locations)
    - [Viewing Results](#viewing-results)
  - [🚨 **Troubleshooting**](#-troubleshooting)
    - [Common Issues](#common-issues)
      - [1. Module Attachment Dropdown Not Populating](#1-module-attachment-dropdown-not-populating)
      - [2. Group Creation Failing](#2-group-creation-failing)
      - [3. Visual Regression Tests Failing](#3-visual-regression-tests-failing)
    - [Debug Mode](#debug-mode)
  - [📈 **Performance Benchmarks**](#-performance-benchmarks)
    - [Target Metrics](#target-metrics)
    - [Performance Testing Commands](#performance-testing-commands)
  - [🔄 **Continuous Integration**](#-continuous-integration)
    - [CI Pipeline Integration](#ci-pipeline-integration)
    - [Pre-commit Hooks](#pre-commit-hooks)
  - [📝 **Adding New Tests**](#-adding-new-tests)
    - [1. Unit Tests](#1-unit-tests)
    - [2. E2E Tests](#2-e2e-tests)
    - [3. Performance Tests](#3-performance-tests)
    - [4. Visual Regression Tests](#4-visual-regression-tests)
  - [🎯 **Test Coverage Goals**](#-test-coverage-goals)
  - [📚 **Additional Resources**](#-additional-resources)
  - [🤝 **Contributing**](#-contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Testing Procedures - WorkloadWizard

This document outlines the comprehensive testing procedures implemented for the WorkloadWizard application.

## 🎯 **Overview**

The testing suite covers:

- **Unit Tests**: Core business logic and utilities
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load time and responsiveness metrics
- **Visual Regression Tests**: UI consistency and component testing
- **Group Creation Tests**: Specific functionality testing

## 🚀 **Quick Start**

### Prerequisites

1. **Environment Variables** (required for E2E tests):

   ```bash
   export WORKOS_TEST_USER_EMAIL="your-test-email@example.com"
   export WORKOS_TEST_USER_PASSWORD="your-test-password"
   export E2E_ASSUME_ADMIN="true"
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

### Running Tests

#### All Tests

```bash
# Using the test runner script
./scripts/test-runner.sh

# Or using npm
pnpm test:all
```

#### Specific Test Types

```bash
# Unit tests only
pnpm test

# E2E tests only
pnpm e2e

# Performance tests only
pnpm test:performance

# Visual regression tests only
pnpm test:visual

# Smoke tests only
pnpm test:smoke
```

#### Test Runner Options

```bash
# Run specific test type
./scripts/test-runner.sh -t performance

# Run with verbose output
./scripts/test-runner.sh -v

# Update visual regression snapshots
./scripts/test-runner.sh -u

# Run only performance tests
./scripts/test-runner.sh --performance-only

# Run only visual tests
./scripts/test-runner.sh --visual-only
```

## 🧪 **Test Types**

### 1. Unit Tests (`pnpm test`)

**Location**: `tests/` directory
**Framework**: Vitest
**Coverage**: Core business logic, utilities, and helpers

**Key Test Files**:

- `allocations-math.spec.ts` - Mathematical calculations
- `permissions-helpers.spec.ts` - Permission system
- `authz.spec.ts` - Authorization logic

### 2. E2E Tests (`pnpm e2e`)

**Location**: `tests/e2e/` directory
**Framework**: Playwright
**Coverage**: Full user journeys and workflows

**Key Test Files**:

- `core-workflow.spec.ts` - Basic application flow
- `core-workflow-allocation.spec.ts` - Allocation workflow
- `allocations-capacity.spec.ts` - Staff capacity testing
- `courses.spec.ts` - Course management
- `modules.spec.ts` - Module management
- `staff-capacity.spec.ts` - Staff capacity

### 3. Performance Tests (`pnpm test:performance`)

**Location**: `tests/e2e/performance.spec.ts`
**Framework**: Playwright with performance metrics
**Coverage**: Page load times, responsiveness, and performance

**Performance Metrics**:

- Dashboard load time: < 3 seconds
- Courses page load time: < 3 seconds
- Modules page load time: < 3 seconds
- Staff capacity page load time: < 3 seconds
- Course creation: < 5 seconds
- Module creation: < 5 seconds
- Navigation between pages: < 2 seconds average

**Performance Assertions**:

```typescript
// Example performance assertion
const loadTime = Date.now() - startTime;
expect(loadTime).toBeLessThan(3000); // 3 seconds
```

### 4. Visual Regression Tests (`pnpm test:visual`)

**Location**: `tests/e2e/visual-regression.spec.ts`
**Framework**: Playwright with screenshot comparison
**Coverage**: UI consistency across components and viewports

**Visual Test Coverage**:

- Dashboard layout consistency
- Sidebar navigation
- Form components
- Table components
- Button components
- Card components
- Modal components
- Responsive design (tablet, mobile)
- Loading states
- Error states

**Screenshot Configuration**:

```typescript
// Example screenshot test
await expect(page).toHaveScreenshot('dashboard-layout.png', {
  fullPage: true,
  timeout: 10000,
});
```

**Visual Comparison Settings**:

- Threshold: 10% pixel difference tolerance
- Max diff pixels: 100
- Output directory: `test-results/`

### 5. Group Creation Tests (`pnpm test:e2e --grep group-creation`)

**Location**: `tests/e2e/group-creation.spec.ts`
**Framework**: Playwright
**Coverage**: Module iteration and group creation functionality

**Test Scenarios**:

- Create module iteration and group
- Create group in existing iteration
- Group creation form validation
- Multiple group creation with different names

## 🔧 **Test Configuration**

### Playwright Configuration (`playwright.config.ts`)

```typescript
// Visual comparison settings
expect: {
  toHaveScreenshot: {
    threshold: 0.1,        // 10% tolerance
    maxDiffPixels: 100,    // Max pixel differences
  },
},

// Test projects
projects: [
  { name: "setup", testMatch: /auth\.setup\.ts/ },
  { name: "smoke", dependencies: ["setup"] },
  { name: "e2e", dependencies: ["setup"] },
  { name: "performance", dependencies: ["setup"] },
  { name: "visual-regression", dependencies: ["setup"] },
],

// Output configuration
outputDir: "test-results/",
reporter: [
  ["list"],
  ["html", { outputFolder: "test-results/html-report" }],
  ["json", { outputFile: "test-results/results.json" }],
],
```

### Test Fixtures (`tests/e2e/fixtures.ts`)

```typescript
export const test = base.extend<{ seedDemoData: void }>({
  seedDemoData: [
    async ({}, use) => {
      // Auto-seed demo data before tests
      const assumeAdmin = process.env.E2E_ASSUME_ADMIN === 'true';
      if (assumeAdmin) {
        // Seed demo data using local-only test helpers.
      }
      await use();
    },
    { scope: 'worker', auto: true },
  ],
});
```

## 📊 **Test Results & Reporting**

### Output Locations

- **Screenshots**: `test-results/`
- **HTML Report**: `test-results/html-report/index.html`
- **JSON Results**: `test-results/results.json`
- **Traces**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)

### Viewing Results

```bash
# Open HTML report
open test-results/html-report/index.html

# View test results directory
ls -la test-results/
```

## 🚨 **Troubleshooting**

### Common Issues

#### 1. Module Attachment Dropdown Not Populating

**Problem**: Module attachment dropdown shows no options
**Cause**: Permission issue - user lacks `modules.view` permission
**Solution**: Ensure the test user has the required role before running the test.

#### 2. Group Creation Failing

**Problem**: Cannot create groups in module iterations
**Cause**: Missing module iteration or permission issues
**Solution**: Ensure iteration exists and user has proper role

#### 3. Visual Regression Tests Failing

**Problem**: Screenshots don't match expected baseline
**Solution**: Update snapshots after intentional UI changes

```bash
# Update all visual snapshots
./scripts/test-runner.sh -u

# Update specific test snapshots
pnpm test:visual --update-snapshots
```

### Debug Mode

```bash
# Run tests with UI for debugging
pnpm e2e:ui

# Run specific test with debug output
pnpm e2e --grep "test-name" --debug
```

## 📈 **Performance Benchmarks**

### Target Metrics

| Metric            | Target | Current |
| ----------------- | ------ | ------- |
| Dashboard Load    | < 3s   | TBD     |
| Page Navigation   | < 2s   | TBD     |
| Form Submission   | < 5s   | TBD     |
| Data Table Render | < 2s   | TBD     |

### Performance Testing Commands

```bash
# Run performance tests only
pnpm test:performance

# Run with performance profiling
pnpm test:performance --project=performance

# View performance metrics
cat test-results/results.json | jq '.results[].metrics'
```

## 🔄 **Continuous Integration**

### CI Pipeline Integration

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    export E2E_ASSUME_ADMIN=true
    pnpm test:all

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

### Pre-commit Hooks

```bash
# Run tests before commit
pnpm test:smoke

# Run full test suite
pnpm test:all
```

## 📝 **Adding New Tests**

### 1. Unit Tests

```typescript
// tests/new-feature.spec.ts
import { describe, it, expect } from 'vitest';

describe('New Feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

### 2. E2E Tests

```typescript
// tests/e2e/new-feature.spec.ts
import { test, expect } from './fixtures';

test('new feature workflow', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page.getByRole('heading')).toBeVisible();
});
```

### 3. Performance Tests

```typescript
// Add to tests/e2e/performance.spec.ts
test('new feature performance', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/new-feature');
  await expect(page.getByRole('heading')).toBeVisible();

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);
});
```

### 4. Visual Regression Tests

```typescript
// Add to tests/e2e/visual-regression.spec.ts
test('new feature visual consistency', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page).toHaveScreenshot('new-feature-page.png', {
    fullPage: true,
    timeout: 10000,
  });
});
```

## 🎯 **Test Coverage Goals**

- **Unit Tests**: 90%+ coverage
- **E2E Tests**: All critical user journeys
- **Performance Tests**: All major pages and actions
- **Visual Tests**: All UI components and responsive breakpoints
- **Integration Tests**: All API endpoints and data flows

## 📚 **Additional Resources**

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](./TESTING_BEST_PRACTICES.md)
- [Performance Testing Guide](./PERFORMANCE_TESTING.md)
- [Visual Regression Guide](./VISUAL_REGRESSION.md)

## 🤝 **Contributing**

When adding new tests:

1. Follow existing naming conventions
2. Include proper error handling
3. Add performance assertions where appropriate
4. Include visual regression tests for UI changes
5. Update this documentation
6. Ensure tests pass in CI environment

---

**Last Updated**: $(date)
**Test Suite Version**: 2.0.0
**Maintainer**: Development Team
