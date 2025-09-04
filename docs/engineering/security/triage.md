# Security Findings Triage & SLAs

This document defines how our organisation triages and resolves security findings from CI.

## Scanners in CI

- **Dependency Check (PR only):** Runs `pnpm audit` to check for vulnerabilities at **high** or above severity.
- **OSV Scanner:** Scans `pnpm-lock.yaml` and the workspace on PRs and `main`. Fails on **HIGH/CRITICAL** results.
- **Gitleaks:** Scans for secrets on PRs and `main`. Fails on any finding (configurable via `GITLEAKS_EXIT_CODE`).

## Where to See Results

- **PR Checks:** Each scanner reports as a required check. Blocking status indicates action is required.
- **Code Scanning (SARIF):** Results appear under _Security → Code scanning alerts_ (if enabled).
- **Artefacts:** Downloadable SARIF/JSON reports are attached to workflow runs for auditability.

## Severity, Ownership, and SLAs

| Severity | Examples                                     | Owner(s)                 | SLA to Triage   | SLA to Remediate |
| -------- | -------------------------------------------- | ------------------------ | --------------- | ---------------- |
| Critical | Actively exploited secrets, RCE in prod deps | Module owners + Security | 4 hours         | 24 hours         |
| High     | Secrets in history, high CVSS in prod deps   | Module owners            | 1 business day  | 3 business days  |
| Medium   | Moderate dep vulns, non-prod exposure        | Module owners            | 3 business days | 10 business days |
| Low      | Low risk patterns, dev-only issues           | Module owners            | 5 business days | Next sprint      |

> **Note:** If a secret is leaked, rotate it immediately and invalidate old credentials. Document the rotation in the PR.

## Triage Workflow

1. **Identify**: Review failing check(s) and download artefacts if additional detail is needed.
2. **Assess**: Confirm severity and affected scope. For secrets, rotate immediately.
3. **Fix**: Update dependencies, patch, or remove secrets. Add tests where appropriate.
4. **Verify**: Re-run CI and confirm all checks pass.
5. **Document**: Reference the scanner finding in the PR and add brief remediation notes.

## Configuration Knobs

- `SECURITY_SEVERITY_THRESHOLD` (workflow env): dependency-review threshold (default: `high`).
- `OSV_FAIL_SEVERITY` (workflow env): `HIGH` / `CRITICAL` fail threshold (default: `HIGH`).
- `GITLEAKS_EXIT_CODE` (workflow env): `1` to fail on any finding, `0` to warn only (default: `1`).

## Exceptions

Temporary exceptions require:

- An issue capturing risk, justification, and a remediation plan/date.
- Adding a label `security:exception` and linking to the PR.
- Re-review in the next sprint review.
