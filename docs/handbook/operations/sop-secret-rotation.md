# SOP: Secret Rotation & Management

## Purpose & Scope

This Standard Operating Procedure (SOP) defines the process for rotating secrets, API keys, and credentials across all WorkloadWizard services. This includes Vercel environment variables, Convex deployment keys, Clerk authentication secrets, Upstash/Redis tokens, Statsig API keys, and GitHub Actions secrets.

## Definitions

| Term                 | Definition                                             |
| -------------------- | ------------------------------------------------------ |
| **Rotation**         | Process of generating new secret and retiring old one  |
| **Dual-key Overlap** | Period where both old and new secrets are valid        |
| **Blast Radius**     | Scope of systems affected by secret rotation           |
| **Rollback Plan**    | Procedure to revert to previous secret if issues occur |
| **Business Day**     | Monday to Friday, 09:00-17:00 GMT                      |
| **Production**       | Live environment serving end users                     |
| **Staging**          | Pre-production environment for testing                 |

## Roles & RACI

| Role                 | Responsibility             | Accountable | Consulted      | Informed      |
| -------------------- | -------------------------- | ----------- | -------------- | ------------- |
| **Platform Owner**   | Secret rotation execution  | ✓           |                |               |
| **Security Lead**    | Rotation approval, audit   |             | Platform Owner |               |
| **On-call Engineer** | Emergency rotation support |             | Platform Owner | Security Lead |
| **Comms Lead**       | Stakeholder notification   |             | Platform Owner |               |

## SLAs/Targets

| Rotation Type            | Target Timeline  | Rollback Window |
| ------------------------ | ---------------- | --------------- |
| **Emergency**            | ≤ 2 hours        | ≤ 1 hour        |
| **Scheduled Production** | ≤ 4 hours        | ≤ 2 hours       |
| **Scheduled Staging**    | ≤ 2 hours        | ≤ 1 hour        |
| **Planned Maintenance**  | ≤ 1 business day | ≤ 4 hours       |

## Triggers

- **Scheduled rotation** (every 90 days for production, 180 days for staging)
- **Suspected secret exposure** (immediate rotation required)
- **Personnel changes** (departing team members)
- **Security incident** (compromise detected)
- **Compliance requirements** (audit findings)
- **Service provider notification** (vendor security alert)

## Required Tools

- **Vercel**: Project settings, environment variables, deployment controls
- **Convex**: Dashboard, environment configuration, deployment keys
- **Clerk**: Dashboard, API keys, webhook secrets
- **Upstash/Redis**: Console, REST API tokens, connection URLs
- **Statsig**: Dashboard, server/API keys
- **GitHub**: Actions secrets, environment secrets, repository settings
- **Git**: Version control for configuration changes
- **Monitoring**: Application health checks, error tracking

## Procedure

### 1. Pre-Rotation Planning

- [ ] **Create GitHub Issue** using `secret_rotation.yml` template
- [ ] **Identify all affected systems**:
  - [ ] Vercel environment variables
  - [ ] Convex deployment keys
  - [ ] Clerk API keys and webhooks
  - [ ] Upstash/Redis tokens
  - [ ] Statsig server/API keys
  - [ ] GitHub Actions secrets
- [ ] **Assess blast radius** and potential impact
- [ ] **Plan dual-key overlap period** (minimum 1 hour)
- [ ] **Prepare rollback plan** with old secret values
- [ ] **Schedule maintenance window** if needed
- [ ] **Notify stakeholders** of planned rotation

### 2. Secret Generation

- [ ] **Generate new secret** using secure random generator
- [ ] **Validate secret format** meets service requirements
- [ ] **Store new secret securely** (temporary secure location)
- [ ] **Document secret characteristics** (length, format, expiry)

### 3. Staging Environment Rotation

- [ ] **Update Vercel staging environment**:
  - [ ] Navigate to Project → Settings → Environment Variables
  - [ ] Update preview environment variables
  - [ ] Deploy to staging for validation
- [ ] **Update Convex staging**:
  - [ ] Update environment variables in Convex dashboard
  - [ ] Redeploy staging deployment
- [ ] **Update other staging services**:
  - [ ] Clerk staging keys
  - [ ] Upstash staging tokens
  - [ ] Statsig staging keys
- [ ] **Validate staging functionality**:
  - [ ] Run smoke tests
  - [ ] Check application logs
  - [ ] Verify authentication flows
- [ ] **Monitor for 1 hour** before proceeding to production

### 4. Production Environment Rotation

- [ ] **Enable dual-key overlap** where possible
- [ ] **Update Vercel production**:
  - [ ] Navigate to Project → Settings → Environment Variables
  - [ ] Update production environment variables
  - [ ] Deploy to production
- [ ] **Update Convex production**:
  - [ ] Update environment variables in Convex dashboard
  - [ ] Redeploy production deployment
- [ ] **Update other production services**:
  - [ ] Clerk production keys
  - [ ] Upstash production tokens
  - [ ] Statsig production keys
  - [ ] GitHub Actions secrets
- [ ] **Validate production functionality**:
  - [ ] Run critical path tests
  - [ ] Monitor application metrics
  - [ ] Check error rates and performance

### 5. Post-Rotation Cleanup

- [ ] **Wait for dual-key overlap period** (minimum 1 hour)
- [ ] **Remove old secrets** from all systems
- [ ] **Update documentation** with new secret references
- [ ] **Verify old secrets are invalidated**
- [ ] **Update secret inventory** and rotation schedule
- [ ] **Close GitHub issue** with rotation summary

### 6. Emergency Rollback (if needed)

- [ ] **Identify rollback trigger** (service failure, errors, etc.)
- [ ] **Execute rollback plan**:
  - [ ] Revert to previous secret values
  - [ ] Redeploy affected services
  - [ ] Validate system recovery
- [ ] **Document rollback reason** and lessons learned
- [ ] **Schedule follow-up** to address root cause

## Communications

### Internal Notifications

- **Pre-rotation**: 24-hour advance notice for planned rotations
- **During rotation**: Status updates every 30 minutes
- **Post-rotation**: Completion notification within 1 hour
- **Emergency**: Immediate notification to on-call engineer

### External Communications

- **Planned maintenance**: Status page update if user impact expected
- **Emergency rotation**: Immediate status page update
- **Service providers**: Notify if rotation affects third-party integrations

### GitHub Issue Management

- Use `secret_rotation.yml` template for consistency
- Link to deployment logs and validation results
- Update labels based on rotation status
- Close with completion summary

## Evidence & Artefacts

### Required Documentation

- [ ] **GitHub Issue** with full rotation details
- [ ] **Secret inventory** showing old and new values (hashed)
- [ ] **Deployment logs** from all affected services
- [ ] **Validation test results** from staging and production
- [ ] **Rollback plan** with old secret values (encrypted)
- [ ] **Timeline** of all rotation steps

### Audit Trail

- [ ] **Who performed rotation** (team member, timestamp)
- [ ] **Which secrets were rotated** (service, secret type)
- [ ] **Validation results** (tests passed/failed)
- [ ] **Any issues encountered** and resolution
- [ ] **Rollback executed** (if applicable)

## KPIs & Review

### Key Performance Indicators

- **Rotation success rate**: Percentage of rotations completed without rollback
- **Rollback rate**: Percentage of rotations requiring emergency rollback
- **Rotation time**: Average time from start to completion
- **Secret coverage**: Percentage of secrets rotated on schedule

### Review Schedule

- **Monthly**: Review rotation logs and identify patterns
- **Quarterly**: Assess rotation frequency and update schedule
- **Annually**: Full secret management process review

### Success Metrics

- 100% of scheduled rotations completed on time
- <5% rollback rate for planned rotations
- Zero security incidents due to expired secrets
- 100% compliance with rotation schedule

## Change History

| Date       | Author        | Summary              |
| ---------- | ------------- | -------------------- |
| 2024-01-15 | Platform Team | Initial SOP creation |
