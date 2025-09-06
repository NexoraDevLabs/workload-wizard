# Tabletop Exercise: CI Failure Due to Expired Secret

## Exercise Overview

**Scenario**: CI failure caused by an expired/rotated secret  
**Duration**: 60 minutes  
**Participants**: 4-6 team members  
**Date**: [To be scheduled within 30 days]  
**Location**: [Meeting room or video conference]

## Objectives

1. **Test incident response procedures** for CI failures
2. **Practice secret rotation workflows** under pressure
3. **Validate communication protocols** during incidents
4. **Identify gaps** in current processes and tooling
5. **Improve team coordination** for security-related incidents

## Roles & Responsibilities

| Role                   | Participant | Responsibilities                            |
| ---------------------- | ----------- | ------------------------------------------- |
| **Incident Commander** | [Name]      | Overall coordination, decision making       |
| **Platform Owner**     | [Name]      | Technical investigation, fix implementation |
| **On-call Engineer**   | [Name]      | Emergency response, deployment              |
| **Comms Lead**         | [Name]      | Stakeholder notification, status updates    |
| **Security Lead**      | [Name]      | Security assessment, approval               |
| **Observer**           | [Name]      | Process documentation, gap analysis         |

## Scenario Background

**Time**: 14:30 GMT, Tuesday  
**Context**: The development team is preparing for a major release scheduled for 16:00 GMT. Multiple PRs are queued for merge, and the release pipeline is critical.

**Initial State**:

- All systems operational
- CI pipeline green
- No known issues
- Team focused on release preparation

## Inject Timeline

### Inject 1: Initial Detection (14:30)

**Situation**: GitHub Actions workflow "CI" starts failing for all new PRs
**Evidence**:

- Error message: "Authentication failed: Invalid API key"
- Failing step: "Deploy to Vercel"
- All PRs showing red status checks

**Expected Actions**:

- [ ] Acknowledge incident within 15 minutes
- [ ] Create GitHub issue using incident template
- [ ] Assign Incident Commander
- [ ] Begin investigation

### Inject 2: Investigation Results (14:45)

**Situation**: Investigation reveals Vercel API token has expired
**Evidence**:

- Vercel dashboard shows "Invalid API key" error
- Last successful deployment was 2 hours ago
- Token expiry date was yesterday

**Expected Actions**:

- [ ] Identify root cause (expired secret)
- [ ] Assess impact (all deployments blocked)
- [ ] Determine severity (P1 - blocking)
- [ ] Plan immediate fix

### Inject 3: Secret Rotation Required (15:00)

**Situation**: New Vercel token needs to be generated and deployed
**Evidence**:

- Current token is invalid
- New token available from Vercel dashboard
- Need to update GitHub Actions secrets

**Expected Actions**:

- [ ] Generate new Vercel token
- [ ] Update GitHub Actions secrets
- [ ] Test deployment with new token
- [ ] Deploy fix to production

### Inject 4: Stakeholder Pressure (15:15)

**Situation**: Release manager asking for status update
**Evidence**:

- Release deadline approaching (45 minutes)
- Multiple teams waiting for deployment
- Business impact increasing

**Expected Actions**:

- [ ] Provide status update to stakeholders
- [ ] Communicate timeline for resolution
- [ ] Escalate if needed
- [ ] Update incident issue

### Inject 5: Resolution (15:30)

**Situation**: New token deployed, CI pipeline green
**Evidence**:

- GitHub Actions workflow successful
- Vercel deployment completed
- All PRs showing green status

**Expected Actions**:

- [ ] Verify fix effectiveness
- [ ] Update stakeholders
- [ ] Close incident issue
- [ ] Schedule post-mortem

## Expected Actions Checklist

### Incident Response

- [ ] **Acknowledge** incident within 15 minutes
- [ ] **Create** GitHub issue using incident template
- [ ] **Assign** roles and responsibilities
- [ ] **Investigate** root cause systematically
- [ ] **Communicate** status updates regularly

### Secret Rotation

- [ ] **Identify** affected systems (Vercel, GitHub Actions)
- [ ] **Generate** new secret securely
- [ ] **Update** GitHub Actions secrets
- [ ] **Test** deployment process
- [ ] **Verify** fix effectiveness

### Communication

- [ ] **Notify** internal team immediately
- [ ] **Update** stakeholders every 15 minutes
- [ ] **Document** all actions taken
- [ ] **Escalate** if timeline at risk

### Documentation

- [ ] **Record** timeline of events
- [ ] **Document** decisions and rationale
- [ ] **Capture** lessons learned
- [ ] **Identify** process improvements

## SIMULATED RESULTS

> **⚠️ NOTE**: The following section contains simulated/example results from a previous tabletop exercise. This is for reference only and should be replaced with actual results when the live exercise is conducted.

### Exercise Execution Summary

**Date**: 2024-01-15  
**Duration**: 55 minutes  
**Participants**: 6 team members  
**Outcome**: Successful resolution with identified improvements

### Timeline of Events

| Time  | Event                 | Action Taken                               | Responsible        |
| ----- | --------------------- | ------------------------------------------ | ------------------ |
| 14:30 | CI failure detected   | Incident acknowledged, issue created       | Incident Commander |
| 14:35 | Investigation started | Checked Vercel logs, identified auth error | Platform Owner     |
| 14:45 | Root cause identified | Expired Vercel API token                   | Platform Owner     |
| 14:50 | Severity assessed     | P1 - blocking all deployments              | Incident Commander |
| 15:00 | Fix planned           | Generate new token, update secrets         | Platform Owner     |
| 15:10 | New token generated   | Retrieved from Vercel dashboard            | Platform Owner     |
| 15:15 | Secrets updated       | Updated GitHub Actions secrets             | On-call Engineer   |
| 15:20 | Test deployment       | Verified fix with test PR                  | Platform Owner     |
| 15:25 | Production fix        | Deployed fix to all environments           | On-call Engineer   |
| 15:30 | Resolution confirmed  | CI pipeline green, all PRs passing         | Incident Commander |

### Key Decisions Made

1. **Immediate hotfix** rather than waiting for scheduled maintenance
2. **Parallel testing** of new token in staging before production
3. **Stakeholder notification** every 15 minutes as planned
4. **Documentation** of all steps for future reference

### Issues Identicated

#### Process Gaps

- [ ] **Secret expiry monitoring** - No automated alerts for expiring secrets
- [ ] **Token rotation schedule** - Vercel tokens not on regular rotation schedule
- [ ] **Emergency procedures** - No documented emergency secret rotation process
- [ ] **Testing procedures** - Insufficient testing of secret updates

#### Tooling Improvements

- [ ] **Secret monitoring** - Need automated alerts for secret expiry
- [ ] **Rotation automation** - Consider automated secret rotation tools
- [ ] **Testing automation** - Automated testing after secret updates
- [ ] **Documentation** - Better documentation of secret locations

#### Communication Issues

- [ ] **Escalation criteria** - Unclear when to escalate to management
- [ ] **External communication** - No clear process for user notifications
- [ ] **Status updates** - Inconsistent update frequency during incident

### Lessons Learned

1. **Proactive monitoring** of secret expiry dates is critical
2. **Regular rotation** of all secrets prevents emergency situations
3. **Testing procedures** must include secret validation
4. **Communication protocols** need clearer escalation criteria
5. **Documentation** of secret locations must be kept current

### Action Items

| Action                                     | Owner          | Due Date   | Priority |
| ------------------------------------------ | -------------- | ---------- | -------- |
| Implement secret expiry monitoring         | Platform Owner | 2024-02-01 | High     |
| Create emergency secret rotation SOP       | Security Lead  | 2024-01-30 | High     |
| Add secret rotation to regular maintenance | Platform Owner | 2024-02-15 | Medium   |
| Improve testing procedures for secrets     | Platform Owner | 2024-02-01 | Medium   |
| Update communication escalation criteria   | Comms Lead     | 2024-01-25 | Low      |

### Success Metrics

- **Response time**: 5 minutes (target: ≤15 minutes) ✅
- **Resolution time**: 60 minutes (target: ≤4 hours) ✅
- **Communication**: 100% stakeholder updates on time ✅
- **Documentation**: Complete audit trail maintained ✅
- **Team coordination**: Effective role assignment and handoffs ✅

## Post-Exercise Activities

### Immediate Actions (Within 24 hours)

- [ ] **Schedule post-mortem** meeting
- [ ] **Update incident response SOP** with lessons learned
- [ ] **Create action items** for identified improvements
- [ ] **Notify stakeholders** of exercise completion

### Short-term Actions (Within 1 week)

- [ ] **Implement secret monitoring** alerts
- [ ] **Update secret rotation schedule**
- [ ] **Improve testing procedures**
- [ ] **Train team** on new procedures

### Long-term Actions (Within 1 month)

- [ ] **Automate secret rotation** where possible
- [ ] **Conduct follow-up exercise** to validate improvements
- [ ] **Update all SOPs** based on learnings
- [ ] **Share results** with broader team

## TODO: Live Exercise

**⚠️ IMPORTANT**: This tabletop exercise must be conducted live within 30 days of SOP implementation.

### Preparation Checklist

- [ ] **Schedule exercise** with all participants
- [ ] **Prepare inject materials** and evidence
- [ ] **Set up communication channels** (Slack/Teams)
- [ ] **Assign observer** to document process
- [ ] **Prepare evaluation criteria**

### Post-Exercise Requirements

- [ ] **Conduct post-mortem** within 48 hours
- [ ] **Update SOPs** based on findings
- [ ] **Implement improvements** identified
- [ ] **Schedule follow-up exercise** in 3 months
- [ ] **Document results** in this file

### Success Criteria

- [ ] All participants understand their roles
- [ ] Incident response procedures followed
- [ ] Communication protocols effective
- [ ] Process improvements identified
- [ ] Team coordination successful
