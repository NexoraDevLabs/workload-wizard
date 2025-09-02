# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for WorkloadWizard.

[![CI](https://github.com/sammcnab/workload-wizard/actions/workflows/ci.yml/badge.svg)](https://github.com/sammcnab/workload-wizard/actions/workflows/ci.yml)

## Overview

Our CI/CD pipeline consists of three main workflows that ensure code quality, security, and deployability:

1. **CI (Continuous Integration)** - Build, test, and audit
2. **CodeQL** - Static analysis for security vulnerabilities
3. **Semgrep** - Additional security scanning with SARIF output

All workflows are designed to be fast, reliable, and provide clear feedback through Job Summaries.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Purpose**: Core continuous integration checks
**Triggers**: 
- Push to `main` branch
- All pull requests

**Required Checks**: `build`, `test`, `audit`

#### Jobs

##### `build`
- **Purpose**: Compile and build the application
- **Runtime**: ~5-10 minutes
- **Dependencies**: Node.js 22, pnpm 10
- **Environment**: Includes dummy environment variables for server code
- **Artifacts**: Built application (not persisted)

##### `test`
- **Purpose**: Run unit tests with Vitest
- **Runtime**: ~2-5 minutes
- **Dependencies**: Same as build
- **Command**: `pnpm test -- --ci`

##### `audit`
- **Purpose**: Check for known security vulnerabilities in dependencies
- **Runtime**: ~1-3 minutes
- **Command**: `pnpm audit --audit-level=high || npm audit --audit-level=high`
- **Threshold**: High-severity vulnerabilities will fail the build

### 2. CodeQL Workflow (`codeql.yml`)

**Purpose**: Static application security testing (SAST)
**Triggers**: 
- Push to `main` branch
- All pull requests
- Weekly schedule (Mondays at 3 AM UTC)

**Required Checks**: `codeql`

#### Analysis Details
- **Languages**: JavaScript/TypeScript
- **Queries**: `security-extended`, `security-and-quality`
- **Runtime**: ~15-30 minutes
- **Output**: SARIF uploaded to GitHub Security tab

### 3. Semgrep Workflow (`semgrep.yml`)

**Purpose**: Additional security scanning with community rules
**Triggers**: 
- Push to `main` branch
- All pull requests

**Required Checks**: `semgrep`

#### Scan Details
- **Ruleset**: `p/ci` (OWASP + Semgrep community rules)
- **Runtime**: ~5-15 minutes
- **Output**: SARIF uploaded to GitHub Security tab
- **Coverage**: Security vulnerabilities, code quality issues

## Required Status Checks

The following checks must pass before any PR can be merged to `main`:

| Check Name | Workflow | Purpose | Typical Runtime |
|------------|----------|---------|-----------------|
| `build` | CI | Application builds successfully | 5-10 min |
| `test` | CI | All unit tests pass | 2-5 min |
| `audit` | CI | No high-severity vulnerabilities | 1-3 min |
| `codeql` | CodeQL | No security vulnerabilities found | 15-30 min |
| `semgrep` | Semgrep | Additional security checks pass | 5-15 min |

## Job Summaries

Every job publishes a Job Summary card that includes:

- ✅ Job completion status
- 🔧 Workflow and reference information
- 📊 Key outputs (Node/pnpm versions, etc.)
- 🎯 Job-specific metrics
- 🔗 Links to results (for security scans)

Example summary sections:
- **Workflow details**: Name, ref, commit SHA
- **Environment**: Runner OS, Node version, pnpm version
- **Results**: Status, specific outputs, links to dashboards

## Environment Variables

### CI Environment
All workflows include these environment variables to prevent issues during builds:

```yaml
NEXT_TELEMETRY_DISABLED: '1'
NODE_OPTIONS: '--max_old_space_size=4096'
NEXT_DISABLE_SOURCEMAPS: '1'
SENTRY_SKIP_AUTO_RELEASE: '1'
SENTRY_SOURCEMAPS: 'false'

# Dummy values for server code
NEXT_PUBLIC_CONVEX_URL: 'https://example.invalid'
CONVEX_DEPLOYMENT: 'https://example.invalid'
FEATFLAG_STATSIG_SERVER_API_KEY: 'test_server_key'
STATSIG_SERVER_SECRET_KEY: 'test_server_key'
STATSIG_SERVER_API_KEY: 'test_server_key'
CLERK_WEBHOOK_SECRET: 'test_webhook_secret'
WEBHOOK_SECRET: 'test_webhook_secret'
```

## Secrets Management

### Required Secrets
Secrets are configured in **Settings → Secrets and variables → Actions**:

| Secret Name | Purpose | Required For |
|-------------|---------|-------------|
| `NEXOROID_APP_ID` | GitHub App ID for bot commits | Frontend automation workflows |
| `NEXOROID_APP_PRIVATE_KEY` | GitHub App private key | Frontend automation workflows |
| `SEMGREP_APP_TOKEN` | Semgrep Cloud integration | Enhanced Semgrep features (optional) |

### Nexoroid Bot Configuration

For workflows that need to commit frontend changes, use the Nexoroid GitHub App:

```yaml
permissions:
  contents: write

steps:
  - name: Mint Nexoroid GitHub App token
    id: app-token
    uses: tibdex/github-app-token@v2
    with:
      app_id: ${{ secrets.NEXOROID_APP_ID }}
      private_key: ${{ secrets.NEXOROID_APP_PRIVATE_KEY }}

  - name: Checkout with App token
    uses: actions/checkout@v4
    with:
      token: ${{ steps.app-token.outputs.token }}
      fetch-depth: 0

  - name: Commit & push as Nexoroid[bot]
    if: ${{ always() }}
    run: |
      git config user.name "Nexoroid[bot]"
      git config user.email "nexoroid[bot]@users.noreply.github.com"
      if [ -n "$(git status --porcelain)" ]; then
        git add -A
        git commit -m "chore(frontend): automated update via CI"
        git push
      fi
```

## Branch Protection

### Manual Setup
1. Go to **Settings → Branches**
2. Add rule for `main` branch
3. Enable the following options:
   - **Require status checks to pass before merging**
   - **Require branches to be up to date before merging**
   - **Restrict pushes that create files**: Check all required status checks:
     - `build`
     - `test` 
     - `audit`
     - `codeql`
     - `semgrep`
   - **Require linear history**
   - **Include administrators**
   - **Require at least 1 approving review**
   - **Dismiss stale reviews when new commits are pushed**

### As-Code Option
If using the GitHub Settings app, add this to `.github/settings.yml`:

```yaml
branches:
  - name: main
    protection:
      required_status_checks:
        strict: true
        contexts:
          - build
          - test
          - audit
          - codeql
          - semgrep
      enforce_admins: true
      required_linear_history: true
      required_pull_request_reviews:
        required_approving_review_count: 1
        dismiss_stale_reviews: true
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Build Failures

**Problem**: `build` job fails
**Common Causes**:
- TypeScript compilation errors
- Missing environment variables
- Dependency issues

**Solutions**:
```bash
# Local reproduction
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build

# Check for type errors
pnpm typecheck

# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

#### 2. Test Failures

**Problem**: `test` job fails
**Common Causes**:
- Failing unit tests
- Outdated snapshots
- Environment setup issues

**Solutions**:
```bash
# Run tests locally
pnpm test

# Run in watch mode for debugging
pnpm test:watch

# Update snapshots if needed
pnpm test -- --update-snapshots
```

#### 3. Audit Failures

**Problem**: `audit` job fails
**Common Causes**:
- High-severity security vulnerabilities
- Outdated dependencies

**Solutions**:
```bash
# Check for vulnerabilities
pnpm audit
npm audit

# Fix automatically where possible
pnpm audit --fix
npm audit fix

# Manual review and updates
pnpm update
```

#### 4. CodeQL/Semgrep Issues

**Problem**: Security scanning fails or finds issues
**Common Causes**:
- New security vulnerabilities introduced
- False positives
- Configuration issues

**Solutions**:
1. **Review alerts** in GitHub Security tab
2. **Assess severity** and impact
3. **Fix real issues** or **suppress false positives**
4. **Update dependencies** if needed

#### 5. Cache Issues

**Problem**: Workflows fail due to cached dependencies
**Solutions**:
- **Re-run workflows** (GitHub UI)
- **Clear GitHub Actions cache** (Settings → Actions → Caches)
- **Update lockfile** and commit changes

#### 6. Permission Issues

**Problem**: Workflows fail due to insufficient permissions
**Solutions**:
- Check `permissions:` in workflow files
- Verify repository settings allow Actions
- Check if organization has restrictions

### Debugging Steps

1. **Check Job Summary** - Every job provides detailed output
2. **Review logs** - Click on failed jobs for detailed logs
3. **Compare with main** - Check if issue exists on main branch
4. **Reproduce locally** - Use same Node/pnpm versions
5. **Check recent changes** - Look at files changed in PR
6. **Verify environment** - Ensure all required secrets are set

### Performance Optimization

#### Cache Strategy
- **Node modules**: Cached by `actions/setup-node@v4`
- **pnpm store**: Global cache across runs
- **Build output**: Not cached (builds are fast)

#### Parallelization
- Jobs run independently where possible
- Use appropriate timeouts to prevent hanging
- Concurrency limits prevent resource conflicts

#### Resource Limits
- **Timeout**: All jobs have appropriate timeouts
- **Memory**: Set `NODE_OPTIONS: '--max_old_space_size=4096'`
- **Disk**: Clean up artifacts automatically

## Best Practices

### Workflow Design
1. **Minimal permissions** - Use least privilege principle
2. **Clear job names** - Match required status check names exactly
3. **Proper timeouts** - Prevent hanging jobs
4. **Error handling** - Use `if: ${{ always() }}` for cleanup
5. **Job summaries** - Always provide clear output

### Security
1. **Pin action versions** - Use specific SHA or version tags
2. **Secure secrets** - Never log secrets, use GitHub Secrets
3. **Verify dependencies** - Regular audit runs
4. **SARIF uploads** - Enable security dashboard integration

### Maintenance
1. **Regular updates** - Keep actions and dependencies current
2. **Monitor performance** - Track job run times
3. **Review alerts** - Address security findings promptly
4. **Documentation** - Keep runbooks current

## Migration from Legacy Workflows

The workflows in `.github/toreview.workflows/` have been streamlined to focus on core requirements:

### Changes Made
1. **Simplified structure** - Removed complex conditionals
2. **Standard triggers** - Push to main, all PRs
3. **Required checks only** - Focus on essential quality gates
4. **Job summaries** - Every job provides clear feedback
5. **Nexoroid bot ready** - Prepared for automated frontend commits

### Removed Features
- GitHub status checks (assumed to be stable)
- Complex path filtering (run on all changes)
- Workflow queuing (use GitHub's built-in concurrency)
- Multiple environments (simplified to main/PR)

## Support

For issues with CI/CD:

1. **Check this runbook** first
2. **Review GitHub Actions logs** for specific errors
3. **Test locally** using the same environment
4. **Create an issue** with reproduction steps and logs
5. **Contact maintainers** for urgent production issues