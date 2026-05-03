<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

- [WorkloadWizard](#workloadwizard)
  - [🚀 **New Advanced Features**](#-new-advanced-features)
    - [**Sentry Error Monitoring & Performance**](#sentry-error-monitoring--performance)
  - [🛠️ **Tech Stack**](#-tech-stack)
  - [📊 **Key Features**](#-key-features)
  - [🔒 **Access & Security**](#-access--security)
  - [🚀 **Quick Start**](#-quick-start)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
  - [🧪 **Testing**](#-testing)
    - [E2E Tests](#e2e-tests)
    - [Unit Tests](#unit-tests)
  - [📚 **Documentation**](#-documentation)
  - [🔒 **Security**](#-security)
  - [🔧 **Development**](#-development)
    - [Branching & CI](#branching--ci)
    - [Code Quality](#code-quality)
    - [Database](#database)
  - [🌟 **Advanced Features**](#-advanced-features)
    - [**Sentry Monitoring Dashboard**](#sentry-monitoring-dashboard)
  - [📈 **Performance & Monitoring**](#-performance--monitoring)
  - [🤝 **Contributing**](#-contributing)
  - [📄 **License**](#-license)
  - [🆘 **Support**](#-support)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# WorkloadWizard

[![CI](https://github.com/sammcnab/workload-wizard/actions/workflows/ci.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/ci.yml)
[![DR Backup](https://github.com/sammcnab/workload-wizard/actions/workflows/backup.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/backup.yml)
[![DR Restore Test](https://github.com/sammcnab/workload-wizard/actions/workflows/restore-test.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/restore-test.yml)

A comprehensive workload management application for educational institutions, built with Next.js, Convex, and WorkOS.

> **Private Repository** — access is by invitation only. If you need access, contact the maintainer.

## 🚀 **New Advanced Features**

### **Sentry Error Monitoring & Performance**

- **Session Replay** with privacy controls
- **User Feedback** collection with customizable forms
- **Performance Monitoring** with custom metrics and traces
- **Error Tracking** across client, server, and edge functions
- **Custom Breadcrumbs** and context for debugging

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Convex (real-time database)
- **Authentication**: WorkOS
- **Monitoring**: Sentry (session replay & user feedback)
- **Styling**: Tailwind CSS, shadcn/ui
- **Testing**: Playwright (E2E), Vitest (unit)

## 📊 **Key Features**

- **Academic Year Management** with scoped data access
- **Course & Module Management** with iterative planning
- **Staff Allocation** with capacity planning
- **Permission System** with role-based access control
- **Real-time Collaboration** with Convex
- **Comprehensive Testing** with E2E coverage target

## 🔒 **Access & Security**

- This is a **private** repository. Clone via **SSH** or **GitHub CLI** with an authenticated account:

  ```bash
  # SSH (recommended)
  git clone git@github.com:<OWNER>/<REPO>.git

  # or GitHub CLI
  git clone git@github.com:example/example-repo.git

  # or GitHub CLI
  gh repo clone example/example-repo
  ```

* Do **not** commit secrets. Use:
  - **GitHub Actions Secrets** for deployment credentials.
  - Local dev secrets in `.env.local` only (never commit).

* Preview deploys are restricted to collaborators via Vercel previews.

### **Security Scanning**

- **ZAP Nightly Baseline**: [![ZAP Nightly](https://github.com/sammcnab/workload-wizard/actions/workflows/zap-nightly.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/zap-nightly.yml) — Automated OWASP ZAP security scans against staging
  - Runs nightly at 01:00 UTC
  - Results available in [Code Scanning alerts](https://github.com/sammcnab/workload-wizard/security/code-scanning)
  - Triage process: [ZAP Triage SOP](docs/handbook/security/zap-triage.md)
- **Content Security Policy (CSP)**: [![CSP Check](https://github.com/sammcnab/workload-wizard/actions/workflows/csp-check.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/csp-check.yml) — Automated CSP header validation
  - Validates CSP headers in both report-only and enforce modes
  - Monitors violations via admin dashboard at `/admin/csp`
  - Configuration guide: [CSP Security Guide](docs/engineering/security/csp.md)

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+ (see `.nvmrc`)
- npm
- Convex account
- WorkOS account
- Sentry account (optional)

### Installation

```bash
# Clone the repository (requires access)
git clone git@github.com:<OWNER>/<REPO>.git
cd workload-wizard-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev

# In another terminal, start Convex
npx convex dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the MVP configuration:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your_convex_url.convex.cloud
CONVEX_DEPLOYMENT=your-convex-deployment

WORKOS_CLIENT_ID=pk_test_your_key
WORKOS_API_KEY=sk_test_your_key
WORKOS_CLIENT_ID=whsec_your_webhook_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: enables Sentry when configured
NEXT_PUBLIC_SENTRY_DSN=
```

Server routes validate `CONVEX_DEPLOYMENT`, `WORKOS_API_KEY`, and `WORKOS_CLIENT_ID` and throw a clear configuration error when required values are missing. Optional tools, including Sentry, stay disabled when their env vars are unset. Never commit real secrets.

## 🧪 **Testing**

### E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run smoke tests only
npm run e2e:smoke

# Optional specialised suites
npm run test:performance
npm run test:visual-regression
```

### Unit Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 **Documentation**

- **Sentry Integration**: `./docs/SENTRY.md` — Error tracking, session replay, user feedback
- **Permissions**: `./docs/PERMISSIONS.md` — Role-based access control
  _Removed: Feature Flags_
- **Testing**: `./docs/TESTING_PROCEDURES.md` — Testing guidelines and procedures

## 📖 **Operations Handbook**

- **[Operations Handbook](docs/handbook/operations/README.md)** — Standard Operating Procedures for security, incidents, secret rotation, and CI failures
- **[Observability Handbook](docs/handbook/observability/README.md)** — Comprehensive guides for monitoring, tracing, dashboards, and alerting

## 🔒 **Security**

- **[Security Overview](docs/engineering/security/_index.md)** — Core security topics and runbooks
  - **Headers & HTTPS** — HSTS, TLS, referrer-policy, cookies, CORS
  - **Content Security Policy (CSP)** — Report-only to enforce implementation
  - **Runbooks** — Vulnerability intake, secret rotation, incident response, CI failure triage
  - **Scanning** — ZAP nightly baseline, Dependabot/CodeQL alerts
  - **Disaster Recovery** — DR plan, backups & restore tests

## 🔧 **Operations**

### **Disaster Recovery (DR)**

- **Policy**: RPO=24h, RTO=2h with automated nightly backups to Cloudflare R2
- **Backups**: [Nightly DR Backup](https://github.com/sammcnab/workload-wizard/actions/workflows/backup.yml) — Convex data, Vercel env vars, minimal WorkOS extract
- **Restore Tests**: [Weekly Restore Test](https://github.com/sammcnab/workload-wizard/actions/workflows/restore-test.yml) — Automated staging validation
- **Documentation**:
  - [DR Policy](docs/operations/dr/policy.md) — Recovery objectives and data scope
  - [Backup Procedures](docs/operations/dr/backups.md) — Automated backup system details
  - [Restore Runbook](docs/operations/dr/restore-runbook.md) — Manual and automated restore procedures
  - [Communication Templates](docs/operations/dr/comms.md) — Incident response communication
  - [Game-Day Checklist](docs/operations/dr/game-day-checklist.md) — DR drill and incident checklist

### **Key Features**

- **Optimized Transfers**: zstd compression with content-based deduplication
- **Minimal Storage**: Archives stored in R2 only, manifests as GitHub artifacts
- **Observability**: Clear job summaries, Slack alerts on failure
- **Testing**: Weekly automated restore validation to staging environment

## 🔧 **Development**

### Branching & CI

- Branches:
  - `main` → production
  - `dev` → preview
  - `feat/*`, `fix/*` → short-lived feature/fix branches

- CI (GitHub Actions):
  - **Quality** → lint, typecheck, unit, build
  - **E2E** → Playwright/Cypress (when present)
  - **Security** → CodeQL, Semgrep
  - **Deploy** → Vercel previews on PRs/dev; production on main

- PRs:
  - Fill out the PR template (screenshots & test notes)
  - Use **Conventional Commits** in PR titles (e.g. `feat: add module planner`)
  - Required status checks must pass before merge

### Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run typecheck
```

### Type Safety

We maintain strict TypeScript safety with elevated linting rules and comprehensive type checking. See our [TypeScript Safety Guidelines](docs/handbook/engineering/ts-safety.md) for:

- Suppression guidelines and best practices
- Migration strategies for `verbatimModuleSyntax`
- Preferred alternatives to `any` types
- Runtime validation patterns

### Bundle Analysis

We provide a CI job to generate static HTML bundle analysis.
See **docs/handbook/engineering/bundle-analysis.md** for how to interpret the report.

### Database

```bash
# View Convex dashboard
npx convex dashboard

# Deploy schema changes
npx convex deploy
```

## 🌟 **Advanced Features**

## 📈 **Performance & Monitoring**

- **Error Monitoring** with Sentry
- **Performance Tracking** with custom metrics
- **Session Replay** for debugging user issues
- **User Feedback** collection for continuous improvement

## 🤝 **Contributing**

Internal contributors only:

1. Create a feature branch (`feat/*` or `fix/*`)
2. Make your changes
3. Add tests for new functionality
4. Ensure **Quality** and **E2E** pipelines pass
5. Submit a PR to `dev` with screenshots/test notes

> If using the emulated merge queue, label the PR `queue` to serialise merges.

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For internal support:

- Check `docs/` first
- Review existing issues
- Create a new issue with steps to reproduce, logs, and screenshots
