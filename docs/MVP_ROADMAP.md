# Workload Wizard – MVP Roadmap

## Purpose

Define the minimum viable product (MVP) for Workload Wizard.

This document sets a clear boundary for what is included, what is excluded, and the order of work. The goal is to ship a usable, stable product — not a complete system.

---

## Core Principle

**No new advanced infrastructure or features should be added until the full MVP user journey works end-to-end in production.**

If a feature does not directly support the MVP journey, it is deferred.

---

## MVP User Journey

A user should be able to:

1. Sign in to the application
2. Complete onboarding (if required)
3. Access their organisation
4. Create or select an academic year
5. Create courses and modules
6. Create staff (lecturer) profiles
7. Create module iterations and groups
8. Allocate teaching and admin hours to staff
9. View workload summaries per staff member

Success criteria:

- No developer intervention required
- No broken flows or dead ends
- Data persists correctly
- Permissions behave as expected

---

## Core MVP Features

### Authentication and Access

- WorkOS sign-in and sign-out
- Organisation-aware access (users scoped to organisation)
- Basic onboarding flow

### Academic Structure

- Academic year creation and selection
- Course creation
- Module creation
- Course year mapping (if implemented)

### Staff Management

- Lecturer/staff profile creation
- Basic staff attributes (e.g. FTE, role, workload limits)

### Teaching Structure

- Module iterations per academic year
- Group creation within modules

### Allocation

- Teaching allocation to staff
- Admin/non-teaching allocation to staff
- Ability to edit/remove allocations

### Workload Visibility

- Workload summary per staff member
- Basic totals (teaching, admin, total)
- Clear indication of over/under allocation (if implemented)

### Roles (MVP only)

- `sysadmin`
- `org_admin`
- `member`

No advanced permission editor required for MVP.

---

## Explicitly Deferred (Post-MVP)

The following must not block MVP delivery:

### Analytics and Observability

- PostHog (events, heatmaps, session replay)
- Advanced Sentry dashboards/alerts
- OpenTelemetry tracing

### Feature Management

- Statsig or database-backed feature flags

### Content / CMS

- Sanity Studio
- Blog or marketing content system

### Security Enhancements (beyond basic)

- CSP reporting dashboard
- Automated ZAP scanning
- Advanced rate limiting infrastructure

### Infrastructure and Ops

- Disaster recovery automation
- Backup/restore tooling
- Advanced deployment workflows

### Testing (beyond essentials)

- Visual regression testing
- Performance benchmarking suites
- Full E2E coverage

### Permissions

- Advanced role/permission UI
- Granular permission editor

---

## Non-Goals for MVP

- Perfect architecture
- Full schema redesign
- Complete test coverage
- Multi-organisation UX polish
- Optimised performance at scale

---

## Definition of MVP Complete

The MVP is complete when:

- A new user can:
  - Sign in
  - Set up their organisation data
  - Allocate workload
  - View a correct workload summary

- The app:
  - Builds successfully in CI and Vercel
  - Has no critical runtime errors
  - Enforces basic role and organisation boundaries
  - Has basic test coverage for critical logic

---

## Guardrails

Before adding any new feature, ask:

1. Does this directly support the MVP user journey?
2. Does this unblock a current blocker?
3. Is this required for a real user to use the system?

If the answer is no → defer.

---

## Next Step After MVP

Once MVP is stable:

- Improve UX and flows based on real usage
- Introduce analytics (PostHog or similar)
- Expand permissions model if needed
- Add advanced testing and observability
- Optimise performance and scale
