\=== AUDIT START ===

# A) Executive Summary

**Project:** Workload Wizard (Next.js + Convex + Clerk + Tailwind + Sentry + Vitest)
**Snapshot (31 Aug 2025, Europe/London):** Mature app skeleton with strong TypeScript settings, centralised permissions, and a healthy dependency stack. However, quality gates are largely **disabled** (CI workflows parked outside the Actions folder), linting is effectively **broken** (`eslint.config.mjs` contains literal `...`), input validation is inconsistent on some API routes, and rate-limiting is **in-memory** (ineffective at scale). Privacy/observability defaults need tightening for GDPR alignment.

**Letter grades**

- **Security:** B-
- **Architecture:** B
- **Code Quality:** B
- **Reliability:** B-
- **Performance:** B
- **Data (DB/GDPR):** B-
- **CI/CD:** C
- **Testing:** D

**Top 10 Risks (short bullets)**

1. **CI gates inactive:** most workflows live in `.github/new.but.disabled.workflows/*`, not `.github/workflows/*` ⇒ no enforced checks. Evidence: directory layout.
2. **Broken ESLint config:** `eslint.config.mjs` contains literal `...` (syntax error), so linting cannot run. Evidence: `eslint.config.mjs` L13 shows `...tseslint.configs.recommended,`.
3. **In-memory rate limiting:** `src/middleware.ts` stores buckets in a process-local object; ineffective across serverless/edge instances. Evidence: `const RATE_LIMITS: Record<string, RateLimitBucket> = {};` (L16), `RATE_LIMIT_WINDOW_MS = 60_000` (L17).
4. **Builds ignore lint errors:** `next.config.ts` sets `ignoreDuringBuilds: true`, allowing failing lint merges. Evidence: `eslint.ignoreDuringBuilds: true` (L27).
5. **Over-broad tracing/logs:** Sentry `tracesSampleRate: 1.0` and `enableLogs: true` in server config (defaulting to development in env). Evidence: `sentry.server.config.ts` L11–L17.
6. **Missing strict env gating:** Secrets are optional in `src/lib/env.ts` (e.g., `CLERK_SECRET_KEY: z.string().optional()`, L14; `CONVEX_DEPLOY_KEY: z.string().optional()`, L17) ⇒ misconfig could slip through.
7. **Weak input validation:** `/api/complete-onboarding` casts `await request.json()` instead of validating. Evidence: `src/app/api/complete-onboarding/route.ts` L39: `const body = (await request.json()) as {...}` and no `zod` import.
8. **Public password-reset endpoint:** `/api/reset-password` is exposed with authentication checks in code; must ensure admin/authorisation is watertight. Evidence: route exists at `src/app/api/reset-password/route.ts`.
9. **No tests present:** Vitest configured, but no `*.test.*` files discovered ⇒ low confidence in critical paths.
10. **Security headers/CSP absent:** No central CSP or hard security headers defined in `next.config.ts`/middleware.

---

# B) Risk Register

| ID       | Title                                   | Severity | Likelihood | Area         | File/Path                                             | Summary                                                      | Impact                                      | Evidence (code refs)                                                | Fix Summary                                                                  |
| -------- | --------------------------------------- | -------- | ---------- | ------------ | ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| SEC-001  | CI workflows not running                | High     | High       | CI/CD        | `.github/new.but.disabled.workflows/*`                | Workflows stored outside `.github/workflows/` so none run    | Undetected regressions & vulns reach `main` | Folder layout; root `.github/repo-health.yml` also not in workflows | Move/enable minimum gate set in `.github/workflows/`                         |
| SEC-002  | ESLint config syntactically broken      | High     | High       | Code Quality | `eslint.config.mjs`                                   | Contains literal `...` ⇒ ESLint cannot parse/run             | Lint never enforces; bad patterns persist   | L13 shows `...tseslint.configs.recommended,`                        | Replace with valid flat config; add CI step “fail on warnings in CI”         |
| SEC-003  | In-memory rate limiting                 | High     | Medium     | Security     | `src/middleware.ts`                                   | Token bucket in process memory (Edge/Serverless non-durable) | Abuse/DoS window across instances           | L16 `RATE_LIMITS = {}`; L17 window; route matchers L42+             | Switch to durable rate limit (Upstash Redis/Convex), return standard headers |
| SEC-004  | Lint ignored in builds                  | Medium   | High       | CI/CD        | `next.config.ts`                                      | `ignoreDuringBuilds: true`                                   | Lint failures ship to prod                  | L27 shows setting                                                   | Set false in CI; or conditional on `CI`                                      |
| SEC-005  | Over-zealous tracing/logs               | Medium   | Medium     | Privacy/Obs  | `sentry.server.config.ts`                             | `tracesSampleRate: 1.0`, `enableLogs: true`                  | Excess data; cost & privacy risk            | L11–L17                                                             | Lower sample in prod; add PII scrubbing in `beforeSend`                      |
| SEC-006  | Secrets optional in env schema          | High     | Medium     | Security     | `src/lib/env.ts`                                      | Many critical vars optional                                  | Runtime misconfig hard to detect            | L14 `CLERK_SECRET_KEY: z.string().optional()`                       | Require secrets in prod; add startup fail-fast                               |
| SEC-007  | Missing schema validation on onboarding | High     | Medium     | API          | `src/app/api/complete-onboarding/route.ts`            | Casts body; no `zod.parse`                                   | Malformed/hostile payloads                  | L39 `request.json() as ...`                                         | Add strict Zod schema + safe parsing                                         |
| SEC-008  | Public password reset route             | High     | Low        | Auth         | `src/app/api/reset-password/route.ts`                 | Sensitive action available; relies on code checks            | Privilege escalation if checks drift        | Route exists; middleware lists reset paths                          | Enforce `requirePermission` + audit log + idempotent flow                    |
| ARCH-009 | Security headers/CSP missing            | Medium   | Medium     | Architecture | `next.config.ts`/middleware                           | No CSP/XFO/Referrer/Permissions policy                       | XSS/clickjacking window                     | No `headers()` in `next.config.ts`                                  | Add strict CSP + frame deny + referrer                                       |
| TEST-010 | No tests present                        | Medium   | High       | Testing      | repo-wide                                             | No unit/integration/E2E tests                                | Regression risk                             | 0 `*.test.*` files found                                            | Seed Vitest suites for authz/env/API                                         |
| DATA-011 | PII fields & audit logs                 | Medium   | Medium     | GDPR         | `convex/schema.ts`, `convex/audit.ts`                 | Stores names, phone, dept, IP                                | DPIA/retention obligations                  | Many PII fields; audit ipAddress                                    | Add retention, purpose limits, redaction, SAR export                         |
| PERF-012 | Build noise & no bundle guard           | Low      | Medium     | Perf         | `next.config.ts`                                      | No budget checks; analyser optional                          | Bundle bloat risk                           | `ANALYZE` gate present, off by default                              | Add CI budget & PR comment with analyser                                     |
| CI-013   | CodeQL/Semgrep parked                   | Medium   | Medium     | CI           | `.github/new.but.disabled.workflows/semgrep.yml` etc. | Security scanning disabled                                   | Missed vuln patterns                        | Files present but disabled                                          | Enable with least-priv tokens; weekly schedule                               |
| SEC-014  | Webhook hardening                       | Medium   | Low        | API          | `src/app/api/webhooks/clerk/route.ts`                 | Uses Svix verify; check error paths & time skew              | False accepts/denials                       | `CLERK_WEBHOOK_SECRET` (L63), `new Webhook` (L95)                   | Enforce timestamp window, replay cache, constant-time compare                |

---

# C) Findings Catalogue

## SEC-001 — CI workflows not running

**Context & Evidence**

- Workflows are stored under `.github/new.but.disabled.workflows/*` (e.g., `auto-label-prs.yml`, `semgrep.yml`, `quality.yml`) rather than `.github/workflows/*`, so GitHub Actions does not execute them.
- Root files like `.github/repo-health.yml` also **won’t run** unless placed under `.github/workflows/`.

**Why it’s a problem**
Quality/security gates are bypassed; regressions and vulnerabilities may land in `main`.

**Remediation (specific)**

- Create `.github/workflows/` and move a minimal gate set: `quality.yml`, `semgrep.yml`, `codeql.yml`, `secret-scan.yml`, `typecheck.yml`, `lint.yml`, `test.yml`.
- Use a fine-scoped GitHub App token (your Nexoroid app) for any write backs.

**Effort:** S (0.5–1 pd) • **Priority:** P0 • **Confidence:** 3
**Acceptance Criteria**

- Workflows visible under Actions and run on PRs.
- Required checks enforced in branch protection.
- Failing lint/type/test blocks merge.

---

## SEC-002 — ESLint config syntactically broken

**Context & Evidence**

- `eslint.config.mjs` contains literal `...` at L13 (`...tseslint.configs.recommended,`) which breaks parsing.

**Why it’s a problem**
Lint never executes; unsafe patterns slip in undetected.

**Remediation**
Replace with a valid flat config. **Minimal patch:**

```diff
diff --git a/eslint.config.mjs b/eslint.config.mjs
@@
-  ...tseslint.configs.recommended,
+  ...tseslint.configs.recommended,
+  // (Remove stray ellipses; ensure full rule objects are present)
```

_And ensure the full file contains proper arrays/objects (see E) for a recommended ruleset)._

**Effort:** S (0.5 pd) • **Priority:** P0 • **Confidence:** 3
**Acceptance Criteria**

- `pnpm lint:strict` passes locally; fails on any warnings in CI.
- ESLint step runs in PR checks.

---

## SEC-003 — In-memory rate limiting (ineffective at scale)

**Context & Evidence**

- `src/middleware.ts` uses a process-local map: `const RATE_LIMITS: Record<string, RateLimitBucket> = {};` (L16) with `RATE_LIMIT_WINDOW_MS = 60_000` (L17).

**Why it’s a problem**
Edge/serverless instances don’t share memory; limits are easily bypassed or reset, offering little abuse protection.

**Remediation (Upstash Redis example)**

```diff
diff --git a/src/middleware.ts b/src/middleware.ts
@@
-const RATE_LIMITS: Record<string, RateLimitBucket> = {};
-const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
-const RATE_LIMIT_TOKENS = 20;
+import { Ratelimit } from "@upstash/ratelimit";
+import { Redis } from "@upstash/redis";
+const ratelimit = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
+  ? new Ratelimit({
+      redis: new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }),
+      limiter: Ratelimit.fixedWindow(20, "1 m"),
+    })
+  : null;
@@
-  // check and decrement tokens from RATE_LIMITS[ip] ...
+  if (ratelimit) {
+    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
+    const { success, limit, remaining, reset } = await ratelimit.limit(`api:${ip}`);
+    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: {
+      "x-ratelimit-limit": String(limit),
+      "x-ratelimit-remaining": String(remaining),
+      "x-ratelimit-reset": String(reset),
+    }});
+  }
```

**Effort:** M (1–2 pd) • **Priority:** P0 • **Confidence:** 3
**Acceptance Criteria**

- 429s issued under sustained load across multiple regions.
- Standard rate-limit headers present.
- Load test demonstrates consistent limiting across cold starts.

---

## SEC-004 — Builds ignore lint errors

**Context & Evidence**

- `next.config.ts`: `ignoreDuringBuilds: true` (L27).

**Why it’s a problem**
Allows merging builds with lint violations.

**Remediation**

- Set `ignoreDuringBuilds: process.env.CI ? false : true` or simply `false` and fix violations.
  **Effort:** S (0.25 pd) • **Priority:** P1 • **Confidence:** 3
  **Acceptance Criteria**
- CI rejects PRs with lint errors.

---

## SEC-005 — Over-broad tracing/log verbosity

**Context & Evidence**

- `sentry.server.config.ts`: `enableLogs: true` (L11), `tracesSampleRate: 1.0` (L14), env defaults to development (L17).

**Why it’s a problem**
High volume data capture raises privacy and cost risk.

**Remediation**

- Use lower sample in prod (e.g., `0.1`) and `beforeSend` to scrub PII.
  **Minimal patch:**

```diff
diff --git a/sentry.server.config.ts b/sentry.server.config.ts
@@
-Sentry.init({
+Sentry.init({
   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
-  debug: false,
-  enableLogs: true,
-  tracesSampleRate: 1.0,
+  debug: process.env.NODE_ENV !== 'production',
+  enableLogs: process.env.NODE_ENV !== 'production',
+  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
+  beforeSend(event) {
+    // scrub likely PII
+    if (event.user) {
+      delete (event.user as any).email;
+      delete (event.user as any).phone;
+    }
+    return event;
+  },
```

**Effort:** S (0.5 pd) • **Priority:** P1 • **Confidence:** 3
**Acceptance Criteria**

- Lower event volume in prod; PII not present in Sentry payloads.

---

## SEC-006 — Secrets optional in env schema

**Context & Evidence**

- `src/lib/env.ts` marks critical vars optional (e.g., `CLERK_SECRET_KEY: z.string().optional()`, L14; `CONVEX_DEPLOY_KEY: z.string().optional()`, L17).

**Why it’s a problem**
Production can deploy with missing secrets, causing runtime failures or silent misbehaviour.

**Remediation**

- Require secrets in prod and fail fast.
  **Minimal patch:**

```diff
diff --git a/src/lib/env.ts b/src/lib/env.ts
@@
-const EnvSchema = z.object({
+const isProd = process.env.NODE_ENV === 'production';
+const required = <T extends z.ZodTypeAny>(s: T) => (isProd ? s : s.optional());
+const EnvSchema = z.object({
   NEXT_PUBLIC_CONVEX_URL: z.string().url(),
-  CLERK_SECRET_KEY: z.string().optional(),
+  CLERK_SECRET_KEY: required(z.string().min(1)),
   // ...
-  CONVEX_DEPLOY_KEY: z.string().optional(),
+  CONVEX_DEPLOY_KEY: required(z.string().min(1)),
   RESEND_API_KEY: z.string().optional(),
 });
```

**Effort:** S (0.5 pd) • **Priority:** P0 • **Confidence:** 3
**Acceptance Criteria**

- Missing secrets break startup in prod; clear error message.

---

## SEC-007 — Missing schema validation (complete-onboarding)

**Context & Evidence**

- `src/app/api/complete-onboarding/route.ts` reads body and **casts**: `const body = (await request.json()) as { onboardingData: OnboardingData };` (L39), no `zod` import.

**Why it’s a problem**
Malformed/hostile payloads can pass unchecked.

**Remediation**

```diff
diff --git a/src/app/api/complete-onboarding/route.ts b/src/app/api/complete-onboarding/route.ts
@@
+import { z } from 'zod';
+const OnboardingDataSchema = z.object({
+  jobRole: z.string().min(1),
+  department: z.string().min(1),
+  // extend as needed
+}).strict();
@@
-const body = (await request.json()) as { onboardingData: OnboardingData };
+const body = z.object({ onboardingData: OnboardingDataSchema }).parse(await request.json());
```

**Effort:** S (0.5 pd) • **Priority:** P0 • **Confidence:** 3
**Acceptance Criteria**

- Invalid body returns 400; valid path updates Clerk + Convex.

---

## SEC-008 — Public password reset route hardening

**Context & Evidence**

- Endpoint at `src/app/api/reset-password/route.ts`. Middleware lists reset routes as public (`isPublicRoute` includes `/reset-password`).
- Code checks current user/admin in route, but public surface increases risk if authorisation checks change.

**Why it’s a problem**
Privilege escalation if checks drift.

**Remediation**

- Require explicit permission (`requirePermission('users.admin')`) in handler.
- Rate-limit endpoint and add complete audit entries on invocation, success, failure.

**Effort:** S (0.5–1 pd) • **Priority:** P0 • **Confidence:** 2
**Acceptance Criteria**

- Non-admins get 403 with audit trail; admins succeed; rate-limit headers present.

---

## ARCH-009 — Security headers / CSP missing

**Context & Evidence**

- No `headers()` export in `next.config.ts`, no CSP middleware.

**Why it’s a problem**
XSS/clickjacking/over-permissive browser features.

**Remediation (example)**

```diff
diff --git a/next.config.ts b/next.config.ts
@@
 const nextConfig: NextConfig = {
+  async headers() {
+    return [{
+      source: "/(.*)",
+      headers: [
+        { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; frame-ancestors 'none';" },
+        { key: "X-Frame-Options", value: "DENY" },
+        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
+        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
+      ]
+    }];
+  },
```

_Tune CSP for your third-party domains (Clerk, Sentry, PostHog, Sanity)._

**Effort:** M (1–2 pd) • **Priority:** P1 • **Confidence:** 3
**Acceptance Criteria**

- Headers present on all pages; no broken resources after allow-listing.

---

## TEST-010 — No tests present

**Context & Evidence**

- 0 `*.test.*` found; Vitest is configured.

**Why it’s a problem**
Low defect detection; refactors risky.

**Remediation**

- Add unit tests for `src/lib/env.ts`, `src/lib/authz.ts`, API route handlers (schema tests), Convex permissions (query/mutation level).
  **Effort:** M (2–4 pd to seed) • **Priority:** P1 • **Confidence:** 3
  **Acceptance Criteria**
- CI runs tests; coverage baseline ≥ 40% lines for core modules.

---

## DATA-011 — PII & audit considerations

**Context & Evidence**

- PII in Convex schema (`users`, fields like `phone`, `department`, `pictureUrl`…), audit logs include `ipAddress` (`convex/audit.ts`).

**Why it’s a problem**
GDPR requires purpose limitation, minimisation, retention, SAR export.

**Remediation**

- Document DPIA; add retention policies (e.g., audit log 365 days), SAR export, and PII redaction in logs.
  **Effort:** M (2–3 pd policy + 1–2 pd code) • **Priority:** P2 • **Confidence:** 2
  **Acceptance Criteria**
- Retention job purges expired items; DPIA doc added to `/docs/compliance`.

---

(Additional lower-priority findings available on request.)

---

# D) Deprecated/Breaking Changes Map

| Area               | Current         | Target         | Notes / Migration                                                                                                        | Effort |
| ------------------ | --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| Next.js            | 15.5.2          | (stay current) | Keep `app/` router; ensure `headers()` CSP added; watch for next.js breaking changes around React 19                     | S      |
| React              | 19.1.1          | (stay current) | Verify any deprecated lifecycle usage in client components; prefer Server Components where fit                           | S      |
| Tailwind           | 4.1.x           | (stay current) | Ensure V4 config conventions applied (no legacy `tailwind.config.cjs` if unused)                                         | S      |
| ESLint Flat Config | custom          | stable         | Replace broken file with full, valid flat config; enable `eslint-plugin-security`, `@next/eslint-plugin-next` if desired | S      |
| Sentry SDK         | 10.7.0 (nextjs) | stable         | Add `beforeSend`; lower prod sampling                                                                                    | S      |

---

# E) TypeScript & Linting Baseline

**tsconfig highlights**

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` ✅
- **Risk:** `allowJs: true` ⇒ admit JS files; recommend `false` (or scope to specific paths).
- Recommend enabling: `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables` (if not already inferred), `noErrorTruncation: true` for better DX.

**Proposed ESLint (flat) rules to add**

- `no-console: ["error", { allow: ["warn","error"] }]` (already warn; make error in CI).
- `@typescript-eslint/no-floating-promises: "error"`; `@typescript-eslint/explicit-function-return-type: "warn"`
- `security/detect-object-injection`, `security/detect-non-literal-fs-filename` (via `eslint-plugin-security`)
- `import/no-default-export: "warn"` in app code to encourage named exports.
- `@next/next/no-html-link-for-pages`, Core Web Vitals plugin for Next.

**Tech-debt “hot” files by size/complexity (indicative)**

- `src/app/onboarding/page.tsx` (\~50 KB)
- `src/lib/actions/userActions.ts` (\~35 KB)
- `convex/users.ts` (\~24 KB)
- `src/app/account/profile/page.tsx` (\~21 KB)
  → Likely candidates for decomposition and focused tests.

---

# F) Database Review (Convex)

**General**

- Rich schema with multiple indexes (≈ 41 index refs noted). Good foundation.

**Recommendations**

- Ensure **unique** index on user subject (`users.by_subject`) and organisation code (if applicable). Evidence: `convex/users.ts` uses `withIndex('by_subject', ...)`.
- Add **retention** for audit logs (scheduled function to purge older than N days).
- Verify transaction boundaries for multi-step writes (Convex mutations): ensure idempotency keys for webhook-driven writes (Clerk).

---

# G) Performance Notes

- Enable durable **rate limiting** (see SEC-003) to protect CPU/edge cold-starts.
- Add **bundle budgets** and an analyser PR artifact.
- Ensure `next/image` is used with explicit `sizes`/`priority` for above-the-fold (found in a few pages).
- Consider caching headers for static routes (landing/blog) via `headers()`.

---

# H) CI/CD & Policy

- **Enable** baseline workflows under `.github/workflows/`:
  - `typecheck.yml`, `lint.yml`, `test.yml`, `codeql.yml`, `semgrep.yml`, `secret-scan.yml`, `dependency-review.yml`, `release-please.yml` (if used).

- **Branch protections:** require all checks, linear history, CODEOWNERS review.
- **Token scopes:** use Nexoroid App installation token for writes; Actions `GITHUB_TOKEN` for read-only.
- **Artifacts:** set retention to ≤ 7 days; avoid secrets in artifacts.
- **Commit signing:** enforce DCO or GPG/Sigstore at repo level.

---

# I) Remediation Backlog

## 1) Human-readable Roadmap

**Phase 0 — Critical security & stability (P0)**

- SEC-001: Move/enable CI workflows (DevOps, 1 pd).
- SEC-002: Fix ESLint config; enforce lint in CI (Tech Lead, 0.5 pd).
- SEC-006: Make secrets required in prod; fail fast (Backend, 0.5 pd).
- SEC-007: Add Zod validation to `/api/complete-onboarding` (Backend, 0.5 pd).
- SEC-003: Durable rate limiting (Backend, 1–2 pd).
- SEC-008: Tighten `/api/reset-password` permissions + audit (Backend, 0.5–1 pd).

**Phase 1 — Type-safety & lint baseline**

- Disable `allowJs` or scope it; add missing TS compiler flags.
- Introduce `@typescript-eslint/no-floating-promises` and security plugin.
- Decompose oversized files (onboarding page, user actions) with clear boundaries.

**Phase 2 — Deprecations & DB fixes**

- Confirm unique indexes (`users.subject`, `organisations.code`).
- Add audit log retention job.

**Phase 3 — Observability & tests**

- Sentry sampling & PII scrubbing; add `beforeSend`.
- Seed Vitest suites for env/authz/API; add minimal E2E for critical flows.

**Phase 4 — Performance & polish**

- Bundle budgets + PR analyser.
- CSP + hard security headers tuned for 3P domains.
- Caching headers for static content.

---

## 2) JSON tasks for tooling

```json
[
  {
    "id": "SEC-001",
    "title": "Enable baseline CI workflows",
    "labels": ["security", "ci", "P0"],
    "priority": "P0",
    "severity": "High",
    "area": "CI/CD",
    "paths": [".github/new.but.disabled.workflows/*", ".github/workflows/*"],
    "estimate_person_days": 1,
    "dependencies": [],
    "acceptance_criteria": [
      "Workflows moved to .github/workflows/",
      "PRs show checks and block on failure"
    ]
  },
  {
    "id": "SEC-002",
    "title": "Fix ESLint flat config and fail on lint in CI",
    "labels": ["code-quality", "lint", "P0"],
    "priority": "P0",
    "severity": "High",
    "area": "Lint",
    "paths": ["eslint.config.mjs", ".github/workflows/lint.yml"],
    "estimate_person_days": 0.5,
    "dependencies": ["SEC-001"],
    "acceptance_criteria": [
      "eslint.config.mjs parses and runs",
      "pnpm lint:strict fails on warnings in CI"
    ]
  },
  {
    "id": "SEC-003",
    "title": "Replace in-memory rate limit with Redis-backed",
    "labels": ["security", "api", "P0"],
    "priority": "P0",
    "severity": "High",
    "area": "API",
    "paths": ["src/middleware.ts"],
    "estimate_person_days": 2,
    "dependencies": [],
    "acceptance_criteria": [
      "Fixed-window 20/min per-IP enforced across regions",
      "429 with standard x-ratelimit headers",
      "Load test evidence attached"
    ]
  },
  {
    "id": "SEC-004",
    "title": "Disallow lint ignoreDuringBuilds in CI",
    "labels": ["ci", "lint", "P1"],
    "priority": "P1",
    "severity": "Medium",
    "area": "Build",
    "paths": ["next.config.ts"],
    "estimate_person_days": 0.25,
    "dependencies": ["SEC-002"],
    "acceptance_criteria": [
      "ignoreDuringBuilds is false in CI",
      "CI fails on lint errors"
    ]
  },
  {
    "id": "SEC-005",
    "title": "Reduce Sentry sampling and scrub PII",
    "labels": ["privacy", "observability", "P1"],
    "priority": "P1",
    "severity": "Medium",
    "area": "Observability",
    "paths": ["sentry.server.config.ts"],
    "estimate_person_days": 0.5,
    "dependencies": [],
    "acceptance_criteria": [
      "Prod tracesSampleRate ≤ 0.1",
      "beforeSend removes email/phone"
    ]
  },
  {
    "id": "SEC-006",
    "title": "Require secrets in prod via env schema",
    "labels": ["security", "config", "P0"],
    "priority": "P0",
    "severity": "High",
    "area": "Config",
    "paths": ["src/lib/env.ts"],
    "estimate_person_days": 0.5,
    "dependencies": [],
    "acceptance_criteria": [
      "Missing prod secrets cause startup failure",
      "Clear error messages for each missing key"
    ]
  },
  {
    "id": "SEC-007",
    "title": "Add Zod validation to complete-onboarding",
    "labels": ["security", "api", "P0"],
    "priority": "P0",
    "severity": "High",
    "area": "API",
    "paths": ["src/app/api/complete-onboarding/route.ts"],
    "estimate_person_days": 0.5,
    "dependencies": [],
    "acceptance_criteria": [
      "Invalid body yields 400",
      "Valid body updates Clerk and Convex"
    ]
  },
  {
    "id": "SEC-008",
    "title": "Harden reset-password endpoint",
    "labels": ["security", "auth", "P0"],
    "priority": "P0",
    "severity": "High",
    "area": "Auth",
    "paths": ["src/app/api/reset-password/route.ts", "src/middleware.ts"],
    "estimate_person_days": 1,
    "dependencies": ["SEC-003"],
    "acceptance_criteria": [
      "requirePermission enforced",
      "Audit log on attempt/success/failure",
      "Rate limit applied"
    ]
  },
  {
    "id": "ARCH-009",
    "title": "Add CSP and security headers",
    "labels": ["security", "headers", "P1"],
    "priority": "P1",
    "severity": "Medium",
    "area": "Web",
    "paths": ["next.config.ts"],
    "estimate_person_days": 1,
    "dependencies": [],
    "acceptance_criteria": [
      "CSP/XFO/Referrer/Permissions headers present",
      "All pages load without CSP violations"
    ]
  },
  {
    "id": "TEST-010",
    "title": "Seed unit tests (env/authz/API)",
    "labels": ["testing", "quality", "P1"],
    "priority": "P1",
    "severity": "Medium",
    "area": "Testing",
    "paths": ["src/lib/env.ts", "src/lib/authz.ts", "src/app/api/*/route.ts"],
    "estimate_person_days": 3,
    "dependencies": ["SEC-002"],
    "acceptance_criteria": [
      "Vitest runs in CI",
      "≥40% line coverage on core modules"
    ]
  },
  {
    "id": "DATA-011",
    "title": "Implement audit retention and DPIA docs",
    "labels": ["gdpr", "data", "P2"],
    "priority": "P2",
    "severity": "Medium",
    "area": "Data",
    "paths": ["convex/audit.ts", "docs/compliance/*"],
    "estimate_person_days": 3,
    "dependencies": [],
    "acceptance_criteria": [
      "Purge job removes logs > 365 days",
      "DPIA & retention policy documented"
    ]
  }
]
```

---

# J) Appendices

## J1. File tree (top level & key dirs; sizes)

Top entries by size:

- `.git/` \~12.8 MB
- `src/` \~1.68 MB
- `tsconfig.tsbuildinfo` \~0.80 MB
- `pnpm-lock.yaml` \~0.70 MB
- `convex/` \~0.27 MB
- `.github/` \~0.19 MB
- `doc-toreview/` \~0.14 MB
- `docs/` \~0.02 MB

Key directories:

- `src/app/*` (pages & API routes; e.g., `onboarding/page.tsx`, `api/update-user-email/route.ts`, `api/reset-password/route.ts`)
- `src/lib/*` (env, permissions, actions, services)
- `convex/*` (schema, users, audit, roles; many indexes)
- `.github/*` (issue templates, actions configs—**most in disabled folder**)

## J2. SBOM-style (selected dependencies)

- **next\@15.5.2**, **react\@19.1.1**, **typescript@^5.9.2**
- **convex@^1.26.2**, **@clerk/nextjs@^6.31.6**
- **@sentry/nextjs@^10.7.0** (reduce prod sampling; scrub PII)
- **zod@^4.1.5** (use consistently on all API inputs)
- **posthog-js@^1.261.0**, **@flags-sdk/statsig@^0.2.2** (document analytics; configure EU endpoints if available)
- **tailwindcss@^4.1.12** (verify v4 conventions)

## J3. Lint/TS error inventory

- **Not computed** because ESLint is syntactically broken and CI is disabled.
  **Needed artefacts:** run `pnpm typecheck` and `pnpm lint:strict` after fixing `eslint.config.mjs`; export machine-readable reports for baseline.

## J4. Glossary

- **Convex:** Backend/database runtime used here for queries/mutations and schema.
- **Clerk:** Auth & identity provider (OIDC/JWT).
- **CSP:** Content Security Policy headers to mitigate XSS and resource loading risks.
- **PII:** Personally Identifiable Information (names, phone, IP, etc.).
- **DPIA:** Data Protection Impact Assessment (GDPR).
- **Upstash:** Serverless Redis used here as a durable rate-limit store example.

---

**Notes on evidence coverage**
Several files in the archive contain literal `...` placeholders (e.g., `eslint.config.mjs`, some app files). Where present, I referenced surrounding concrete lines; for ambiguous sections I specified exactly what artefact or log output is needed to verify further.

\=== AUDIT END ===
