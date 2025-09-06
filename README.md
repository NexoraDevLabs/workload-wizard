<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

- [WorkloadWizard](#workloadwizard)
  - [🚀 **New Advanced Features**](#-new-advanced-features)
    - [**PostHog Analytics & Session Replays**](#posthog-analytics--session-replays)
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
  - [🔧 **Development**](#-development)
    - [Branching & CI](#branching--ci)
    - [Code Quality](#code-quality)
    - [Database](#database)
  - [🌟 **Advanced Features**](#-advanced-features)
    - [**PostHog Analytics Dashboard**](#posthog-analytics-dashboard)
    - [**Sentry Monitoring Dashboard**](#sentry-monitoring-dashboard)
    - [Feature Flag Management](#feature-flag-management)
  - [📈 **Performance & Monitoring**](#-performance--monitoring)
  - [🤝 **Contributing**](#-contributing)
  - [📄 **License**](#-license)
  - [🆘 **Support**](#-support)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# WorkloadWizard

[![CI](https://github.com/sammcnab/workload-wizard/actions/workflows/ci.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/ci.yml)
[![DR Backup](https://github.com/sammcnab/workload-wizard/actions/workflows/backup.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/backup.yml)
[![DR Restore Test](https://github.com/sammcnab/workload-wizard/actions/workflows/restore-test.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/restore-test.yml)

A comprehensive workload management application for educational institutions, built with Next.js, Convex, and Clerk.

> **Private Repository** — access is by invitation only. If you need access, contact the maintainer.

## 🚀 **New Advanced Features**

### **PostHog Analytics & Session Replays**

- **Session Recordings** with privacy-focused settings
- **Heatmaps** for user interaction analysis
- **Advanced Analytics** with autocapture and performance tracking
- Feature flags removed
- **Enhanced User Identification** with comprehensive tracking

### **Sentry Error Monitoring & Performance**

- **Session Replay** with privacy controls
- **User Feedback** collection with customizable forms
- **Performance Monitoring** with custom metrics and traces
- **Error Tracking** across client, server, and edge functions
- **Custom Breadcrumbs** and context for debugging

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Convex (real-time database)
- **Authentication**: Clerk
- **Analytics**: PostHog (session replays & heatmaps)
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
  - **GitHub Actions Secrets** for CI: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `CONVEX_DEPLOY_KEY`, etc.
  - Local dev secrets in `.env.local` only (never commit).

* Preview deploys are restricted to collaborators via Vercel previews.

### **Security Scanning**

- **ZAP Nightly Baseline**: [![ZAP Nightly](https://github.com/sammcnab/workload-wizard/actions/workflows/zap-nightly.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/zap-nightly.yml) — Automated OWASP ZAP security scans against staging
  - Runs nightly at 01:00 UTC
  - Results available in [Code Scanning alerts](https://github.com/sammcnab/workload-wizard/security/code-scanning)
  - Triage process: [ZAP Triage SOP](docs/handbook/security/zap-triage.md)

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+ (see `.nvmrc`)
- pnpm (or npm; pnpm preferred)
- Convex account
- Clerk account
- PostHog account (optional)
- Sentry account (optional)

### Installation

```bash
# Clone the repository (requires access)
git clone git@github.com:<OWNER>/<REPO>.git
cd workload-wizard-app

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the development server
pnpm dev

# In another terminal, start Convex
pnpm convex dev
```

### Environment Variables

```bash
# Required for Convex
NEXT_PUBLIC_CONVEX_URL=https://your_convex_url.convex.cloud

# Clerk (required for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# PostHog (optional; enables analytics, session replays & heatmaps)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Sentry (optional; enables error monitoring & session replay)
NEXT_PUBLIC_SENTRY_DSN=https://your_dsn@your_org.ingest.sentry.io/your_project

# Feature Flags (Statsig)
FEATFLAG_STATSIG_SERVER_API_KEY=your_statsig_server_api_key_here
NEXT_PUBLIC_STATSIG_CLIENT_KEY=your_statsig_client_key_here

# App version for tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> See `.env.example` for the full set. Never commit real secrets.

## 🧪 **Testing**

### E2E Tests

```bash
# Run all E2E tests
pnpm e2e

# Run smoke tests only
pnpm e2e:smoke

# Optional specialised suites
pnpm test:performance
pnpm test:visual-regression
```

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📚 **Documentation**

- **PostHog Integration**: `./docs/POSTHOG.md` — Session replays, heatmaps, analytics
- **Sentry Integration**: `./docs/SENTRY.md` — Error tracking, session replay, user feedback
- **Permissions**: `./docs/PERMISSIONS.md` — Role-based access control
  _Removed: Feature Flags_
- **Testing**: `./docs/TESTING_PROCEDURES.md` — Testing guidelines and procedures

## 📖 **Operations Handbook**

- **[Operations Handbook](docs/handbook/operations/README.md)** — Standard Operating Procedures for security, incidents, secret rotation, and CI failures

## 🔧 **Operations**

### **Disaster Recovery (DR)**

- **Policy**: RPO=24h, RTO=2h with automated nightly backups to Cloudflare R2
- **Backups**: [Nightly DR Backup](https://github.com/sammcnab/workload-wizard/actions/workflows/backup.yml) — Convex data, Vercel env vars, minimal Clerk extract
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
pnpm format

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

### Type Safety

We maintain strict TypeScript safety with elevated linting rules and comprehensive type checking. See our [TypeScript Safety Guidelines](docs/handbook/engineering/ts-safety.md) for:

- Suppression guidelines and best practices
- Migration strategies for `verbatimModuleSyntax`
- Preferred alternatives to `any` types
- Runtime validation patterns

### Bundle Analysis

We provide a CI job to generate static HTML bundle analysis. Run it via **Actions → Bundle Analysis** (or locally with `pnpm analyze`).  
See **docs/handbook/engineering/bundle-analysis.md** for how to interpret the report.

### Database

```bash
# View Convex dashboard
pnpm convex dashboard

# Deploy schema changes
pnpm convex deploy
```

## 🌟 **Advanced Features**

### **PostHog Analytics Dashboard**

Visit `/dev/posthog-test` to test:

- Session recordings with privacy controls
- Heatmaps for user interaction analysis
- Advanced analytics and user tracking

### **Sentry Monitoring Dashboard**

Visit `/sentry-example-page` to test:

- Error reporting and monitoring
- Performance tracking and metrics
- Session replay with privacy settings
- User feedback collection

### Feature Flag Management

**Statsig Integration** - Single source of truth for feature flags:

- Server-side evaluation with Clerk user context
- Convex integration for user enrollments
- Client-side bootstrap for performance
- Centralized flag keys in `src/flags.ts`

## 📈 **Performance & Monitoring**

- **Real-time Analytics** with PostHog
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
