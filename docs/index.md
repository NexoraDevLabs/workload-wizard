# Workload Wizard Documentation

Welcome! This site covers everything from getting started to deep technical reference for the Workload Wizard project.

> Tip: If you’re new here, start with **Getting started → Quick start**.

---

## Quick links

- 🚀 **Quick start** → [getting-started/quick-start.md](getting-started/quick-start.md)
- 🧭 **User guide** → [user-guide/workloads.md](user-guide/workloads.md)
- 🔌 **API overview** → [reference/api/rest/index.md](reference/api/rest/index.md)
- 📦 **Environment variables** → [reference/config/environment-variables.md](reference/config/environment-variables.md)
- 🛠 **Contribution guide** → [../CONTRIBUTING.md](../CONTRIBUTING.md)
- 🛡 **Security policy** → [../SECURITY.md](../SECURITY.md)
- 📝 **Changelog** → [../CHANGELOG.md](../CHANGELOG.md)

---

## How these docs are organised

We follow a simple structure so you can find the right kind of help quickly:

- **Getting started** – tutorials that take you from zero to running locally.
- **User guide** – feature-focused guidance for everyday tasks.
- **How-to** – recipe-style steps to achieve a specific goal.
- **Concepts** – explanations of how things work and why.
- **Reference** – source-of-truth specs (APIs, schemas, config).
- **Architecture / Engineering / Operations / Security** – project internals, runbooks and standards.

---

## Contents

### Getting started

- [Quick start](getting-started/quick-start.md)
- [Prerequisites](getting-started/prerequisites.md)
- [Onboarding](getting-started/onboarding.md)

### User guide

- [Workloads overview](user-guide/workloads.md)
- [Wizard steps](user-guide/wizard-steps.md)
- [Accessibility](user-guide/accessibility.md)
- [FAQ](user-guide/faq.md)

### How-to

- [Import CSV](how-to/import-csv.md)
- [Configure Azure AD SSO](how-to/configure-azure-ad-sso.md)
- [Export reports](how-to/export-reports.md)
- [Troubleshoot daylight saving time](how-to/troubleshoot-dst.md)

### Concepts

- [Glossary](concepts/glossary.md)
- [Roles & permissions](concepts/roles-permissions.md)
- [Domain model](concepts/domain-model.md)

### Reference

- **API**
  - [Overview & authentication](reference/api/rest/index.md)
  - [Endpoints](reference/api/rest/endpoints.md)
  - [Webhooks](reference/api/webhooks.md)
  - [Schemas](reference/api/schemas/)
- **Configuration**
  - [Environment variables](reference/config/environment-variables.md)
- [CLI](reference/cli.md)

### Architecture

- [Overview](architecture/overview.md)
- **Diagrams**
  - [System context](architecture/diagrams/system-context.mmd)
  - [Container diagram](architecture/diagrams/container.mmd)
  - [Auth sequence](architecture/diagrams/sequence-auth.mmd)
- **ADRs**
  - [Index](architecture/adr/)
  - [Template](architecture/adr/template.md)

### Engineering

- [Conventions](engineering/conventions.md)
- [Frontend styleguide](engineering/frontend-styleguide.md)
- [Backend styleguide](engineering/backend-styleguide.md)
- [Testing](engineering/testing.md)
- [CI/CD](engineering/ci-cd.md)
- [Release process](engineering/release-process.md)

### Operations

- **Runbooks**
  - [Release](operations/runbooks/release.md)
  - [Rollback](operations/runbooks/rollback.md)
  - [Backup & restore](operations/runbooks/backup-restore.md)
  - [Incident response](operations/runbooks/incident-response.md)
- [Observability](operations/observability.md)
- [Infrastructure](operations/infrastructure.md)

### Security

- [Threat model](security/threat-model.md)
- [Data protection (UK GDPR)](security/data-protection.md)
- [Secret management](security/secret-management.md)
- [Vulnerability reporting](security/vulnerability-reporting.md)

### Compliance

- [GDPR](compliance/gdpr.md)
- [Accessibility standards (WCAG 2.2 AA)](compliance/accessibility-standards.md)

### Design

- [Design system](design/design-system.md)
- [Components & patterns](design/components.md)

### Release notes

- [Index](release-notes/index.md)

---

## Contributing to the docs

Small fixes are welcome! See [../CONTRIBUTING.md](../CONTRIBUTING.md) for branching, commit style, and PR checks.  
When adding new pages:

- Keep filenames **kebab-case**.
- Prefer British English spelling.
- Put diagrams as **source files** under `architecture/diagrams/` and export images to `assets/diagrams-export/`.

---

_Last updated: 2025-08-27_
