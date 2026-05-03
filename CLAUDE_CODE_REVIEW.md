=== AUDIT START ===

# **WorkloadWizard Baseline Audit & Remediation Plan**

**Date:** 23 January 2025  
**Auditor:** Principal Engineer & Security Lead  
**Project:** WorkloadWizard v0.4.1  
**Scope:** Full codebase production readiness assessment

---

## **A) Executive Summary**

### **Maturity Snapshot**

| Domain           | Grade | Assessment                                                                  |
| ---------------- | ----- | --------------------------------------------------------------------------- |
| **Security**     | B+    | Strong foundation with CSP, auth, but dependency vulnerabilities            |
| **Architecture** | A-    | Well-structured Next.js/Convex setup, good separation of concerns           |
| **Code Quality** | A-    | Excellent TypeScript safety, comprehensive linting                          |
| **Database**     | B+    | Good Convex schema design, permission enforcement needs review              |
| **CI/CD**        | A-    | Comprehensive pipelines, security scanning, could improve branch protection |
| **Performance**  | B     | Good observability setup, missing performance budgets                       |
| **Testing**      | C+    | Good structure but limited test coverage                                    |

### **Top 10 Risks**

1. **HIGH** - Dependency vulnerabilities in `undici` and `path-to-regexp` (via Vercel CLI)
2. **HIGH** - Missing branch protection rules and required status checks
3. **MEDIUM** - CSP in report-only mode, not enforced in production
4. **MEDIUM** - Excessive tracing sample rate (100%) in production
5. **MEDIUM** - No environment variable validation failures in production
6. **MEDIUM** - LocalStorage usage without error boundaries
7. **MEDIUM** - No performance budgets or monitoring thresholds
8. **LOW** - Missing test coverage requirements and enforcement
9. **LOW** - Hardcoded nonce generation without entropy validation
10. **LOW** - Feature flag system removed but legacy code remains

---

## **B) Risk Register**

| ID   | Title                      | Severity | Likelihood | Area        | File/Path                    | Summary                                     | Impact                      | Evidence                                             | Fix Summary                                 |
| ---- | -------------------------- | -------- | ---------- | ----------- | ---------------------------- | ------------------------------------------- | --------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| R001 | Dependency Vulnerabilities | HIGH     | HIGH       | Security    | package.json, package-lock.json | Vulnerable dependencies in production build | DoS attacks, data tampering | undici CVE-2025-22150, path-to-regexp CVE-2024-45296 | Update dependencies, implement dep scanning |
| R002 | Missing Branch Protection  | HIGH     | MEDIUM     | CI/CD       | .github/                     | No branch protection on main/dev            | Unauthorised code changes   | No required checks in repo settings                  | Configure branch protection rules           |
| R003 | CSP Report-Only Mode       | MEDIUM   | HIGH       | Security    | src/lib/security/csp.ts      | CSP not enforced in production              | XSS vulnerabilities         | CSP_MODE defaults to 'report-only'                   | Implement CSP enforcement                   |
| R004 | Excessive Tracing Rate     | MEDIUM   | HIGH       | Performance | sentry.\*.config.ts          | 100% trace sampling in production           | Performance degradation     | tracesSampleRate: 1.0                                | Reduce to 0.1 for production                |
| R005 | Environment Validation     | MEDIUM   | MEDIUM     | Config      | src/lib/env.ts               | Env validation failures ignored             | Runtime errors              | try/catch in getEnv()                                | Enforce validation in production            |
| R006 | LocalStorage Errors        | MEDIUM   | LOW        | Frontend    | src/components/nav-main.tsx  | Unhandled localStorage failures             | UI state corruption         | try/catch around localStorage                        | Add error boundaries                        |
| R007 | No Performance Budgets     | MEDIUM   | MEDIUM     | Performance | next.config.ts               | No performance monitoring limits            | Poor UX, slow loading       | Missing budget configuration                         | Implement performance budgets               |
| R008 | Missing Test Coverage      | LOW      | MEDIUM     | Quality     | package.json                 | No coverage requirements                    | Quality degradation         | No coverage scripts                                  | Add coverage enforcement                    |
| R009 | Nonce Generation           | LOW      | LOW        | Security    | src/lib/security/csp.ts      | Basic random nonce generation               | CSP bypass risk             | crypto.randomBytes(16)                               | Use crypto.getRandomValues                  |
| R010 | Legacy Feature Flag Code   | LOW      | LOW        | Maintenance | Multiple files               | Dead code from removed features             | Maintenance burden          | Commented imports, unused types                      | Clean up legacy code                        |

---

## **C) Findings Catalogue**

### **C.1 Security Findings**

#### **FINDING SEC-001: Dependency Vulnerabilities**

- **Evidence:** `undici` 5.28.4 (CVE-2025-22150), `path-to-regexp` 6.1.0 (CVE-2024-45296)
- **Why it matters:** These are production dependencies via Vercel CLI with known vulnerabilities
- **Remediation:** Update Vercel CLI to latest version, implement automated dependency scanning
- **Effort:** 1 day
- **Priority:** P0
- **Acceptance Criteria:** All HIGH/CRITICAL vulnerabilities resolved, automated scanning in CI

#### **FINDING SEC-002: CSP Configuration**

- **Evidence:** `CSP_MODE` defaults to 'report-only' in `src/lib/env.ts:24`
- **Why it matters:** CSP provides no protection in report-only mode
- **Remediation:** Switch to 'enforce' mode after validating all violations
- **Effort:** 3 days
- **Priority:** P1
- **Acceptance Criteria:** CSP enforced in production, zero violations in monitoring

#### **FINDING SEC-003: Rate Limiting Configuration**

- **Evidence:** Basic rate limiting in `src/middleware.ts:58-102`
- **Why it matters:** Good implementation but lacks configuration validation
- **Remediation:** Add rate limit configuration validation and monitoring
- **Effort:** 2 days
- **Priority:** P2
- **Acceptance Criteria:** Rate limit config validated, alerts on threshold breaches

### **C.2 Architecture Findings**

#### **FINDING ARCH-001: Permission System Complexity**

- **Evidence:** Extensive permission system in `convex/permissions/`
- **Why it matters:** Well-designed but complex, potential for inconsistency
- **Remediation:** Add automated permission tests, simplify where possible
- **Effort:** 5 days
- **Priority:** P2
- **Acceptance Criteria:** 100% permission path coverage, simplified admin flows

#### **FINDING ARCH-002: Environment Configuration**

- **Evidence:** Environment validation in `src/lib/env.ts` catches but doesn't fail
- **Why it matters:** Production deployments may succeed with invalid config
- **Remediation:** Fail fast on environment validation errors
- **Effort:** 1 day
- **Priority:** P1
- **Acceptance Criteria:** Build fails on invalid environment configuration

### **C.3 Performance Findings**

#### **FINDING PERF-001: Tracing Sample Rate**

- **Evidence:** `tracesSampleRate: 1.0` in Sentry configs
- **Why it matters:** 100% sampling creates performance overhead in production
- **Remediation:** Reduce to 0.1 (10%) for production environments
- **Effort:** 0.5 days
- **Priority:** P1
- **Acceptance Criteria:** <10% trace sampling in production, maintained observability

#### **FINDING PERF-002: Missing Performance Budgets**

- **Evidence:** No performance budgets in `next.config.ts`
- **Why it matters:** No automated performance regression detection
- **Remediation:** Implement webpack bundle size budgets and monitoring
- **Effort:** 2 days
- **Priority:** P2
- **Acceptance Criteria:** Bundle size budgets enforced, CI fails on regressions

---

## **D) Deprecation Map**

| Component                  | Status     | Migration Path                        | Timeline     |
| -------------------------- | ---------- | ------------------------------------- | ------------ |
| **Feature Flags System**   | Removed    | Clean up legacy imports and types     | P3 - 2 weeks |
| **PostHog Reverse Proxy**  | Disabled   | Direct access implementation complete | N/A          |
| **Legacy Onboarding Data** | Deprecated | Migrate to new onboarding schema      | P3 - 4 weeks |
| **Manual Error Handling**  | Deprecated | Use PermissionPageWrapper pattern     | P3 - 6 weeks |

---

## **E) TypeScript & Lint Baseline**

### **Current Configuration Strengths**

- ✅ Strict TypeScript config with `noUncheckedIndexedAccess`
- ✅ Comprehensive ESLint rules with type-checked analysis
- ✅ Consistent import patterns enforced
- ✅ Strong unsafe operation detection

### **Recommendations**

- Enable `strictNullChecks` explicitly (currently inherited)
- Add `@typescript-eslint/prefer-nullish-coalescing` rule
- Consider `exactOptionalPropertyTypes` enforcement across all files

### **Tech Debt Hit List**

1. `src/app/account/features/page.tsx` - Complex state management, needs refactoring
2. `src/components/login-form.tsx` - Large component (918 lines), split into smaller components
3. `convex/permissions.ts` - Large file (1955 lines), consider modularisation

---

## **F) Database Review**

### **Schema Strengths**

- ✅ Well-designed Convex schema with proper indexing
- ✅ Audit logging implemented comprehensively
- ✅ Permission enforcement at database level
- ✅ Organisation-scoped data access patterns

### **Potential Issues**

- **Missing Constraints:** No email uniqueness constraint in users table
- **Index Optimisation:** Some queries could benefit from compound indexes
- **Data Validation:** Schema validation happens at application layer only

### **Recommendations**

- Add unique constraint on user email within organisation
- Implement database-level validation rules
- Review query patterns for N+1 issues in permissions checking

---

## **G) Performance Notes**

### **Current Observability**

- ✅ Sentry performance monitoring configured
- ✅ PostHog analytics with session replays
- ✅ Vercel Analytics and Speed Insights
- ✅ OpenTelemetry instrumentation

### **Optimisation Opportunities**

- **Bundle Splitting:** Good webpack configuration, could add more granular chunks
- **Caching:** Missing CDN cache headers for static assets
- **Database:** Convex queries not optimised for bulk operations
- **Frontend:** Some components could benefit from React.memo

---

## **H) CI/CD & Policy**

### **Current Pipeline Assessment**

- ✅ Comprehensive GitHub Actions workflows
- ✅ Security scanning (CodeQL, Semgrep, Gitleaks, OSV)
- ✅ Quality gates (lint, typecheck, test, build)
- ✅ Automated dependency auditing

### **Missing Protections**

- ❌ Branch protection rules not configured
- ❌ Required status checks not enforced
- ❌ No deployment approval workflow
- ❌ Missing test coverage requirements

### **Recommended Policy Updates**

- Enable branch protection on main/dev with required reviews
- Enforce all CI checks before merge
- Add manual approval for production deployments
- Implement test coverage thresholds (80% minimum)

---

## **I) Remediation Backlog**

### **Phase 1: Critical Security & Stability (P0) - 1 Week**

1. **Update Dependencies** - Resolve HIGH/CRITICAL vulnerabilities
2. **Configure Branch Protection** - Protect main and dev branches
3. **Fix Environment Validation** - Fail fast on invalid config

### **Phase 2: Security Hardening (P1) - 2 Weeks**

4. **Implement CSP Enforcement** - Switch from report-only to enforce
5. **Reduce Tracing Rate** - Optimise Sentry performance overhead
6. **Add Performance Budgets** - Prevent bundle size regressions

### **Phase 3: Quality & Maintenance (P2) - 4 Weeks**

7. **Permission System Testing** - Comprehensive test coverage
8. **Component Refactoring** - Split large components
9. **Database Optimisation** - Add constraints and indexes

### **Phase 4: Technical Debt (P3) - 6 Weeks**

10. **Legacy Code Cleanup** - Remove feature flag remnants
11. **Schema Migration** - Update onboarding data structure
12. **Documentation Updates** - Sync with current implementation

---

## **J) Remediation Tasks (JSON)**

```json
[
  {
    "id": "DEPS-001",
    "title": "Update vulnerable dependencies",
    "labels": ["security", "dependencies", "P0"],
    "priority": "P0",
    "severity": "HIGH",
    "paths": ["package.json", "package-lock.json"],
    "estimate": "8 hours",
    "dependencies": [],
    "acceptanceCriteria": [
      "All HIGH/CRITICAL vulnerabilities resolved",
      "npm audit passes with no high-severity issues",
      "CI includes automated dependency scanning"
    ]
  },
  {
    "id": "BRANCH-001",
    "title": "Configure branch protection rules",
    "labels": ["ci-cd", "security", "P0"],
    "priority": "P0",
    "severity": "HIGH",
    "paths": [".github/settings.yml"],
    "estimate": "4 hours",
    "dependencies": [],
    "acceptanceCriteria": [
      "Branch protection enabled on main and dev",
      "Required status checks enforced",
      "Admin override disabled"
    ]
  },
  {
    "id": "ENV-001",
    "title": "Fix environment validation failures",
    "labels": ["config", "reliability", "P0"],
    "priority": "P0",
    "severity": "MEDIUM",
    "paths": ["src/lib/env.ts"],
    "estimate": "4 hours",
    "dependencies": [],
    "acceptanceCriteria": [
      "Production builds fail on invalid environment",
      "Clear error messages for missing variables",
      "Development continues to allow missing optional vars"
    ]
  },
  {
    "id": "CSP-001",
    "title": "Implement CSP enforcement",
    "labels": ["security", "frontend", "P1"],
    "priority": "P1",
    "severity": "MEDIUM",
    "paths": ["src/lib/security/csp.ts", "src/middleware.ts"],
    "estimate": "24 hours",
    "dependencies": ["DEPS-001"],
    "acceptanceCriteria": [
      "CSP enforced in production environment",
      "Zero violations in monitoring dashboard",
      "Admin interface for CSP management"
    ]
  },
  {
    "id": "PERF-001",
    "title": "Reduce Sentry tracing sample rate",
    "labels": ["performance", "monitoring", "P1"],
    "priority": "P1",
    "severity": "MEDIUM",
    "paths": ["sentry.server.config.ts", "sentry.edge.config.ts"],
    "estimate": "2 hours",
    "dependencies": [],
    "acceptanceCriteria": [
      "Production trace sampling at 10%",
      "Development maintains 100% sampling",
      "Observability quality maintained"
    ]
  },
  {
    "id": "PERF-002",
    "title": "Implement performance budgets",
    "labels": ["performance", "ci-cd", "P2"],
    "priority": "P2",
    "severity": "MEDIUM",
    "paths": ["next.config.ts", ".github/workflows/ci.yml"],
    "estimate": "16 hours",
    "dependencies": [],
    "acceptanceCriteria": [
      "Bundle size budgets configured",
      "CI fails on budget exceed",
      "Performance monitoring in place"
    ]
  },
  {
    "id": "PERM-001",
    "title": "Add comprehensive permission tests",
    "labels": ["testing", "security", "P2"],
    "priority": "P2",
    "severity": "MEDIUM",
    "paths": ["convex/permissions/", "src/hooks/usePermissions.ts"],
    "estimate": "40 hours",
    "dependencies": ["ENV-001"],
    "acceptanceCriteria": [
      "100% permission path test coverage",
      "Automated permission matrix validation",
      "Permission integration tests"
    ]
  },
  {
    "id": "REFACTOR-001",
    "title": "Split large React components",
    "labels": ["frontend", "maintainability", "P3"],
    "priority": "P3",
    "severity": "LOW",
    "paths": [
      "src/components/login-form.tsx",
      "src/app/account/features/page.tsx"
    ],
    "estimate": "32 hours",
    "dependencies": [],
    "acceptanceCriteria": [
      "No component over 300 lines",
      "Improved component testability",
      "Maintained functionality"
    ]
  },
  {
    "id": "CLEANUP-001",
    "title": "Remove legacy feature flag code",
    "labels": ["maintenance", "cleanup", "P3"],
    "priority": "P3",
    "severity": "LOW",
    "paths": [
      "src/components/providers/FeatureFlagProvider.tsx",
      "src/flags.ts"
    ],
    "estimate": "16 hours",
    "dependencies": [],
    "acceptanceCriteria": [
      "All feature flag imports removed",
      "Dead code eliminated",
      "No build warnings"
    ]
  },
  {
    "id": "DB-001",
    "title": "Add database constraints and indexes",
    "labels": ["database", "performance", "P3"],
    "priority": "P3",
    "severity": "LOW",
    "paths": ["convex/schema.ts"],
    "estimate": "24 hours",
    "dependencies": ["PERM-001"],
    "acceptanceCriteria": [
      "Email uniqueness constraints added",
      "Query performance optimised",
      "Migration scripts tested"
    ]
  }
]
```

---

## **K) Appendices**

### **K.1 File Tree (Top 3 Levels)**

```
workload-wizard/
├── .github/                 # CI/CD and repo configuration
├── convex/                  # Backend database and functions
├── docs/                    # Comprehensive documentation
├── src/                     # Frontend React application
│   ├── app/                 # Next.js app directory
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility libraries
├── config/                  # Application configuration
├── scripts/                 # Build and utility scripts
└── tests/                   # Test suites
```

### **K.2 SBOM Dependency Summary**

- **Total Dependencies:** 178 direct + transitive
- **Security Issues:** 2 HIGH (undici, path-to-regexp via Vercel CLI)
- **Outdated Packages:** 0 major versions behind
- **License Compliance:** All permissive licenses (MIT, Apache-2.0)

### **K.3 TypeScript Error Inventory**

- **Strict Errors:** 0 (excellent compliance)
- **Lint Warnings:** 0 (clean codebase)
- **Type Coverage:** ~95% (strong type safety)

### **K.4 Glossary**

- **CSP:** Content Security Policy - web security standard
- **Convex:** Real-time database platform used for backend
- **RBAC:** Role-Based Access Control system
- **SSR/CSR:** Server-Side/Client-Side Rendering patterns
- **P0-P3:** Priority levels (P0=Critical, P3=Low)

=== AUDIT END ===
