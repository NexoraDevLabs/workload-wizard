# SOP: CI Failure Triage & Resolution

## Purpose & Scope

This Standard Operating Procedure (SOP) defines the process for responding to and resolving CI/CD pipeline failures in the WorkloadWizard project. This includes GitHub Actions workflow failures, build errors, test failures, and deployment issues that block development progress.

## Definitions

| Term               | Definition                                                                         |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Red Build**      | CI pipeline failure that blocks merging to main/dev branches                       |
| **Merge Blocking** | Policy preventing PRs from merging when CI is failing                              |
| **Flaky Test**     | Test that intermittently fails due to timing, race conditions, or external factors |
| **Business Day**   | Monday to Friday, 09:00-17:00 GMT                                                  |
| **Working Hours**  | 09:00-17:00 GMT on business days                                                   |
| **Hotfix**         | Emergency fix deployed outside normal CI process                                   |
| **Workaround**     | Temporary solution to unblock development while permanent fix is developed         |

## Roles & RACI

| Role                 | Responsibility                            | Accountable | Consulted       | Informed       |
| -------------------- | ----------------------------------------- | ----------- | --------------- | -------------- |
| **First Responder**  | Initial triage and immediate fix attempts | ✓           |                 |                |
| **Platform Owner**   | Complex fixes, infrastructure issues      |             | First Responder |                |
| **On-call Engineer** | Emergency response outside working hours  |             | First Responder | Platform Owner |
| **Comms Lead**       | Team notification of CI status            |             | First Responder |                |

## SLAs/Targets

| Failure Type          | Acknowledge Target | Fix Target | Escalation Target |
| --------------------- | ------------------ | ---------- | ----------------- |
| **P1 (Blocking)**     | ≤ 15 minutes       | ≤ 4 hours  | ≤ 1 hour          |
| **P2 (Non-blocking)** | ≤ 1 hour           | ≤ 8 hours  | ≤ 4 hours         |
| **P3 (Cosmetic)**     | ≤ 4 hours          | ≤ 24 hours | N/A               |
| **Flaky Tests**       | ≤ 30 minutes       | ≤ 2 hours  | ≤ 1 hour          |

## Triggers

### Automatic Detection

- **GitHub Actions workflow failures**
- **Build process errors** (TypeScript, ESLint, formatting)
- **Test failures** (unit tests, E2E tests, integration tests)
- **Deployment failures** (Vercel, Convex, environment issues)
- **Security scan failures** (CodeQL, Semgrep, dependency checks)

### Manual Detection

- **Developer reports** of CI issues
- **PR status checks** showing failures
- **Monitoring alerts** from CI systems
- **Stakeholder notifications** of blocked development

## Required Tools

- **GitHub**: Actions, Issues, Pull Requests, Code scanning
- **Vercel**: Deployment logs, environment variables, build settings
- **Convex**: Deployment logs, function logs, database status
- **Clerk**: Authentication logs, API status
- **Upstash/Redis**: Connection logs, performance metrics
- **Statsig**: Feature flag status, API logs
- **Local Development**: Git, Node.js, pnpm, testing tools

## Procedure

### 1. Initial Triage (First 15 Minutes)

- [ ] **Acknowledge failure** within SLA timeframe
- [ ] **Assess failure severity**:
  - [ ] P1: Blocks all development, affects production
  - [ ] P2: Blocks specific features, affects staging
  - [ ] P3: Cosmetic issues, doesn't block development
- [ ] **Create GitHub Issue** using `ci_failure.yml` template
- [ ] **Gather initial information**:
  - [ ] Failing workflow/job name
  - [ ] Error messages and logs
  - [ ] Recent changes that might have caused failure
  - [ ] Timeline of when failure started

### 2. Quick Fix Attempts

- [ ] **Re-run failed job** (if flaky test suspected)
- [ ] **Check for obvious issues**:
  - [ ] Syntax errors in code
  - [ ] Missing environment variables
  - [ ] Dependency version conflicts
  - [ ] Configuration file errors
- [ ] **Apply immediate fixes** if obvious:
  - [ ] Fix syntax errors
  - [ ] Update environment variables
  - [ ] Adjust configuration settings
- [ ] **Re-run CI** to verify fix

### 3. Investigation Phase

- [ ] **Analyse failure patterns**:
  - [ ] Is it a new failure or recurring?
  - [ ] Does it affect all PRs or specific ones?
  - [ ] Is it related to recent changes?
- [ ] **Examine logs in detail**:
  - [ ] GitHub Actions logs
  - [ ] Build output and error messages
  - [ ] Test execution logs
  - [ ] Deployment logs
- [ ] **Compare with last successful run**:
  - [ ] Identify differences in configuration
  - [ ] Check for new dependencies
  - [ ] Review recent code changes

### 4. Common Failure Classes & Fixes

#### Build/Compilation Errors

- [ ] **TypeScript errors**:
  - [ ] Fix type mismatches
  - [ ] Update type definitions
  - [ ] Add missing type annotations
- [ ] **ESLint errors**:
  - [ ] Fix linting violations
  - [ ] Update ESLint configuration
  - [ ] Add ESLint disable comments (temporary)
- [ ] **Formatting errors**:
  - [ ] Run Prettier to fix formatting
  - [ ] Update Prettier configuration
  - [ ] Check for conflicting formatters

#### Test Failures

- [ ] **Unit test failures**:
  - [ ] Fix broken test assertions
  - [ ] Update test data and mocks
  - [ ] Fix test environment setup
- [ ] **E2E test failures**:
  - [ ] Check for UI changes affecting selectors
  - [ ] Update test data and fixtures
  - [ ] Fix timing issues and waits
- [ ] **Flaky tests**:
  - [ ] Add retry logic
  - [ ] Improve test stability
  - [ ] Add to flaky test list for monitoring

#### Infrastructure Issues

- [ ] **Vercel deployment failures**:
  - [ ] Check build settings and environment variables
  - [ ] Verify Node.js version compatibility
  - [ ] Review build output and logs
- [ ] **Convex deployment issues**:
  - [ ] Check function syntax and imports
  - [ ] Verify database schema changes
  - [ ] Review deployment logs
- [ ] **Third-party service issues**:
  - [ ] Check service status pages
  - [ ] Verify API keys and configuration
  - [ ] Implement retry logic or fallbacks

### 5. Escalation Process

- [ ] **Escalate to Platform Owner** if:
  - [ ] Fix requires infrastructure changes
  - [ ] Issue affects multiple systems
  - [ ] Resolution time exceeds SLA
  - [ ] Complex debugging required
- [ ] **Escalate to On-call Engineer** if:
  - [ ] Failure occurs outside working hours
  - [ ] Issue affects production systems
  - [ ] Emergency fix required
- [ ] **Update issue** with escalation details and timeline

### 6. Fix Implementation

- [ ] **Create fix branch** from appropriate base branch
- [ ] **Implement fix**:
  - [ ] Code changes for identified issue
  - [ ] Configuration updates
  - [ ] Test updates and improvements
- [ ] **Test fix locally**:
  - [ ] Run affected test suites
  - [ ] Verify build process
  - [ ] Check deployment process
- [ ] **Create PR** with fix:
  - [ ] Use conventional commit message
  - [ ] Include detailed description
  - [ ] Link to CI failure issue
- [ ] **Monitor CI** for fix validation

### 7. Post-Fix Activities

- [ ] **Verify fix effectiveness**:
  - [ ] Confirm CI passes consistently
  - [ ] Run additional validation tests
  - [ ] Monitor for regression issues
- [ ] **Update documentation** if needed:
  - [ ] Add troubleshooting steps
  - [ ] Update runbooks
  - [ ] Document new procedures
- [ ] **Close GitHub issue** with resolution summary
- [ ] **Add to test suite** if applicable:
  - [ ] Convert fix into regression test
  - [ ] Add monitoring for similar issues

## Communications

### Internal Notifications

- **P1 failures**: Immediate notification to development team
- **P2 failures**: Notification within 1 hour
- **Status updates**: Every 30 minutes for P1, hourly for P2
- **Resolution**: Notification within 15 minutes of fix

### External Communications

- **Status page updates** for user-facing CI issues
- **Stakeholder notifications** for extended outages
- **Documentation updates** for process improvements

### GitHub Issue Management

- Use `ci_failure.yml` template for consistency
- Link to failing workflow runs and PRs
- Update labels based on failure type and status
- Close with resolution summary and lessons learned

## Evidence & Artefacts

### Required Documentation

- [ ] **GitHub Issue** with full failure details
- [ ] **CI logs** from failing and successful runs
- [ ] **Fix PR** with code changes and description
- [ ] **Test results** showing fix validation
- [ ] **Timeline** of investigation and resolution

### Audit Trail

- [ ] **Who investigated** (team member, timestamp)
- [ ] **What was found** (root cause analysis)
- [ ] **How it was fixed** (solution implemented)
- [ ] **Prevention measures** (process improvements)

## KPIs & Review

### Key Performance Indicators

- **Acknowledge time**: Average time from failure to acknowledgment
- **Resolution time**: Average time from failure to fix deployment
- **Escalation rate**: Percentage of failures requiring escalation
- **Recurrence rate**: Percentage of similar failures

### Review Schedule

- **Weekly**: Review CI failure trends and patterns
- **Monthly**: Analyse resolution times and escalation rates
- **Quarterly**: Review CI process and tooling
- **Annually**: Full CI/CD process review

### Success Metrics

- 100% of P1 failures acknowledged within 15 minutes
- 95% of P1 failures resolved within 4 hours
- <10% escalation rate for CI failures
- Zero recurring failures within 30 days

## Change History

| Date       | Author        | Summary              |
| ---------- | ------------- | -------------------- |
| 2024-01-15 | Platform Team | Initial SOP creation |
