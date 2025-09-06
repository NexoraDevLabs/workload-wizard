# ZAP Nightly Baseline Triage SOP

## Purpose & Scope

This SOP covers the triage process for OWASP ZAP Baseline security scan results that run nightly against our staging environment. The scans are passive (non-intrusive) and focus on identifying common web application security vulnerabilities.

**Workflow:** [ZAP Nightly Baseline](https://github.com/sammcnab/workload-wizard/actions/workflows/zap-nightly.yml)

## Severity Mapping & SLA

| ZAP Severity | Internal Severity | SLA              | Owner             |
| ------------ | ----------------- | ---------------- | ----------------- |
| High         | SEV-2             | ≤1 business day  | Security/Platform |
| Medium       | SEV-3             | ≤3 business days | Security/Platform |
| Low          | SEV-4             | ≤1 week          | Security/Platform |
| Info         | SEV-5             | Next sprint      | Security/Platform |

**Comms:** Private Teams channel `#security-alerts`

## Triage Process

### 1. Review Code Scanning Alerts

- [ ] Check [Code Scanning alerts](https://github.com/sammcnab/workload-wizard/security/code-scanning) after each nightly run
- [ ] Filter by tool: "ZAP Baseline"
- [ ] Review new findings and changes from previous runs

### 2. Handle New High Severity Findings

- [ ] Create GitHub Issue with `type:security` label
- [ ] Include evidence:
  - Link to workflow run
  - Screenshot of finding details
  - Affected URL/endpoint
  - ZAP rule ID and description
- [ ] Assign to Security/Platform owner
- [ ] Add to private Teams channel for visibility

### 3. Decision: Fix or Exclude

**Fix:**

- [ ] Create implementation task
- [ ] Link to security issue
- [ ] Track progress in issue

**Exclude:**

- [ ] Add entry to `.zap/rules.tsv`
- [ ] Include justification and review-by date
- [ ] Document in issue why exclusion is appropriate
- [ ] Close issue with exclusion note

### 4. Verification

- [ ] Verify fix/exclusion on next nightly run
- [ ] Update issue status
- [ ] Close loop in Teams channel

## Evidence & Audit

For each finding, document:

- **Workflow Run:** Link to GitHub Actions run
- **Artifacts:** Download HTML report from workflow artifacts
- **SARIF Alert:** Link to specific Code Scanning alert
- **Issue:** Link to created GitHub issue (if applicable)
- **Resolution:** Fix implementation or exclusion justification

## Change History

| Date       | Change      | Author    | Notes                            |
| ---------- | ----------- | --------- | -------------------------------- |
| 2024-12-19 | Initial SOP | DevSecOps | Created for ZAP nightly baseline |

## Related Documentation

- [Security Overview](../../system/SECURITY.md)
- [Incident Response](../../processes/INCIDENTS.md)
- [ZAP Rules Configuration](../../../.zap/rules.tsv)
