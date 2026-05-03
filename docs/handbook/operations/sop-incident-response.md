# SOP: Incident Response & Management

## Purpose & Scope

This Standard Operating Procedure (SOP) defines the process for detecting, responding to, and recovering from incidents affecting the WorkloadWizard application and its supporting infrastructure. This includes production outages, security incidents, performance degradation, and data integrity issues.

## Definitions

| Term                               | Definition                                                    |
| ---------------------------------- | ------------------------------------------------------------- |
| **SEV-1**                          | Critical incident with complete service outage or data breach |
| **SEV-2**                          | High severity incident with significant service degradation   |
| **SEV-3**                          | Medium severity incident with limited service impact          |
| **SEV-4**                          | Low severity incident with minimal user impact                |
| **Incident Commander**             | Person responsible for coordinating incident response         |
| **Business Day**                   | Monday to Friday, 09:00-17:00 GMT                             |
| **Mean Time to Detection (MTTD)**  | Time from incident start to detection                         |
| **Mean Time to Resolution (MTTR)** | Time from incident start to resolution                        |
| **Blast Radius**                   | Scope of systems and users affected by incident               |

## Roles & RACI

| Role                   | Responsibility                  | Accountable | Consulted          | Informed           |
| ---------------------- | ------------------------------- | ----------- | ------------------ | ------------------ |
| **Incident Commander** | Overall incident coordination   | ✓           |                    |                    |
| **On-call Engineer**   | Technical investigation and fix | ✓           | Incident Commander |                    |
| **Platform Owner**     | System architecture decisions   |             | On-call Engineer   | Incident Commander |
| **Comms Lead**         | Stakeholder communication       |             | Incident Commander |                    |
| **Security Lead**      | Security incident assessment    |             | Incident Commander |                    |

## SLAs/Targets

| Severity  | Detection Target | Response Target | Resolution Target |
| --------- | ---------------- | --------------- | ----------------- |
| **SEV-1** | ≤ 5 minutes      | ≤ 15 minutes    | ≤ 4 hours         |
| **SEV-2** | ≤ 15 minutes     | ≤ 30 minutes    | ≤ 8 hours         |
| **SEV-3** | ≤ 1 hour         | ≤ 2 hours       | ≤ 24 hours        |
| **SEV-4** | ≤ 4 hours        | ≤ 8 hours       | ≤ 3 business days |

## Triggers

### Automatic Detection

- **Vercel deployment failures** (build errors, deployment timeouts)
- **Convex service outages** (database unavailable, function failures)
- **WorkOS authentication failures** (login issues, token validation errors)
- **Upstash/Redis connectivity issues** (cache failures, connection timeouts)
- **Statsig service degradation** (feature flag failures)
- **GitHub Actions workflow failures** (CI/CD pipeline issues)
- **Application error rate spikes** (>5% error rate)
- **Response time degradation** (>2x normal response time)

### Manual Detection

- **User reports** via support channels
- **Stakeholder notifications** of service issues
- **Security alerts** from monitoring systems
- **Third-party service notifications**

## Required Tools

- **Monitoring**: Sentry, PostHog, Vercel Analytics
- **Communication**: Slack/Teams, GitHub Issues, Status page
- **Infrastructure**: Vercel, Convex, WorkOS, Upstash, Statsig
- **Development**: GitHub, Git, local development environment
- **Documentation**: Runbooks, architecture diagrams, contact lists

## Procedure

### 1. Incident Detection & Declaration

- [ ] **Acknowledge incident** within SLA timeframe
- [ ] **Assess initial severity** based on impact:
  - [ ] SEV-1: Complete outage, data breach, security incident
  - [ ] SEV-2: Significant degradation, major feature unavailable
  - [ ] SEV-3: Limited impact, minor feature issues
  - [ ] SEV-4: Minimal impact, cosmetic issues
- [ ] **Create GitHub Issue** using `incident.yml` template
- [ ] **Assign Incident Commander** based on severity
- [ ] **Set up communication channel** (private Slack/Teams channel)
- [ ] **Notify stakeholders** of incident declaration

### 2. First 15 Minutes (SEV-1/SEV-2)

- [ ] **Incident Commander takes charge**:
  - [ ] Assess current situation
  - [ ] Assign roles and responsibilities
  - [ ] Set communication cadence
- [ ] **On-call Engineer investigates**:
  - [ ] Check monitoring dashboards
  - [ ] Review recent deployments
  - [ ] Identify affected systems
  - [ ] Gather initial evidence
- [ ] **Comms Lead notifies stakeholders**:
  - [ ] Internal team notification
  - [ ] External status page update (if needed)
  - [ ] Set expectation for next update

### 3. Stabilisation Phase

- [ ] **Implement immediate mitigation**:
  - [ ] Rollback recent deployment (if applicable)
  - [ ] Enable maintenance mode (if needed)
  - [ ] Apply feature flags to disable affected functionality
  - [ ] Scale up resources (if performance issue)
- [ ] **Verify mitigation effectiveness**:
  - [ ] Check error rates
  - [ ] Monitor user reports
  - [ ] Validate core functionality
- [ ] **Update stakeholders** on stabilisation progress

### 4. Diagnosis Phase

- [ ] **Gather detailed information**:
  - [ ] Application logs and error traces
  - [ ] Infrastructure metrics and alerts
  - [ ] User reports and feedback
  - [ ] Recent changes and deployments
- [ ] **Identify root cause**:
  - [ ] Code changes causing issues
  - [ ] Infrastructure failures
  - [ ] Third-party service outages
  - [ ] Configuration problems
- [ ] **Document findings** in incident issue

### 5. Mitigation Phase

- [ ] **Develop fix strategy**:
  - [ ] Code fix for identified issue
  - [ ] Configuration changes
  - [ ] Infrastructure adjustments
  - [ ] Third-party service workarounds
- [ ] **Test fix in staging** (if time permits)
- [ ] **Deploy fix to production**:
  - [ ] Use hotfix branch for SEV-1
  - [ ] Follow normal deployment process for SEV-2+
- [ ] **Monitor fix effectiveness**

### 6. Recovery Phase

- [ ] **Verify service restoration**:
  - [ ] Run smoke tests
  - [ ] Check monitoring dashboards
  - [ ] Validate user functionality
- [ ] **Gradual feature re-enablement**:
  - [ ] Enable features via feature flags
  - [ ] Monitor for regression issues
  - [ ] Full service restoration
- [ ] **Update stakeholders** on recovery status

### 7. Post-Incident Activities

- [ ] **Schedule post-mortem** within 48 hours
- [ ] **Update incident issue** with resolution summary
- [ ] **Close communication channels**
- [ ] **Update status page** (if external notification was sent)
- [ ] **Document lessons learned**

## Communications

### Internal Communications

- **Incident Commander** coordinates all internal communication
- **Status updates** every 15 minutes for SEV-1, every 30 minutes for SEV-2
- **Escalation** to Platform Owner if technical decisions needed
- **Handoff** to next on-call engineer if incident extends beyond shift

### External Communications

- **Status page updates** for user-facing incidents
- **Stakeholder notifications** via email for SEV-1/SEV-2
- **Social media updates** if significant user impact
- **Post-incident summary** within 24 hours of resolution

### Communication Templates

#### Initial Notification

```
🚨 INCIDENT DECLARED - SEV-[1-4]
Service: [Service Name]
Impact: [Description of impact]
Commander: [Name]
Next update: [Time]
```

#### Status Update

```
📊 INCIDENT UPDATE - SEV-[1-4]
Status: [Investigating/Mitigating/Recovering/Resolved]
Progress: [Brief update]
Next update: [Time]
```

#### Resolution

```
✅ INCIDENT RESOLVED - SEV-[1-4]
Duration: [Total time]
Root cause: [Brief description]
Post-mortem: [Scheduled time]
```

## Evidence & Artefacts

### Required Documentation

- [ ] **GitHub Issue** with full incident details
- [ ] **Timeline** of all actions taken
- [ ] **Screenshots** of monitoring dashboards
- [ ] **Log files** and error traces
- [ ] **Deployment records** and rollback logs
- [ ] **Communication logs** from incident channel

### Post-Mortem Template

- [ ] **Incident summary** (what happened, when, impact)
- [ ] **Timeline** (detailed chronology of events)
- [ ] **Root cause analysis** (technical and process factors)
- [ ] **Contributing factors** (what made the incident worse)
- [ ] **Action items** (preventive measures, owner, due date)
- [ ] **Lessons learned** (process improvements)

## KPIs & Review

### Key Performance Indicators

- **MTTD**: Mean time to detection
- **MTTR**: Mean time to resolution
- **Incident frequency**: Number of incidents per month
- **Recovery success rate**: Percentage of incidents resolved without escalation

### Review Schedule

- **Weekly**: Review incident trends and patterns
- **Monthly**: Analyse MTTR and MTTD metrics
- **Quarterly**: Review incident response process
- **Annually**: Full incident management review

### Success Metrics

- MTTD < 10 minutes for SEV-1 incidents
- MTTR < 4 hours for SEV-1 incidents
- 95% of incidents resolved without escalation
- 100% of SEV-1 incidents have post-mortems

## Change History

| Date       | Author        | Summary              |
| ---------- | ------------- | -------------------- |
| 2024-01-15 | Platform Team | Initial SOP creation |
