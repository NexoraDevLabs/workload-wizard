# Disaster Recovery Policy

## Overview

This document defines the Disaster Recovery (DR) policy for the Workload Wizard application, ensuring business continuity and data protection in the event of system failures or data loss incidents.

## Recovery Objectives

### Recovery Point Objective (RPO)

- **Target:** 24 hours
- **Implementation:** Nightly automated backups at 02:00 Europe/London
- **Scope:** All critical data including Convex database, Vercel environment variables, and essential Clerk user data

### Recovery Time Objective (RTO)

- **Target:** 2 hours
- **Validation:** Weekly restore tests to staging environment
- **Scope:** Complete application restoration from backup

## Data Scope

### Critical Data Components

1. **Convex Database**
   - All application data and state
   - User workloads, allocations, and configurations
   - System metadata and audit logs

2. **Vercel Environment Variables**
   - Application configuration
   - API keys and secrets
   - Feature flags and environment-specific settings

3. **Clerk User Data (Minimal Extract)**
   - User IDs and external identifiers
   - Email addresses
   - Account status (banned, locked)
   - Timestamps (created, last active)

### Excluded Data

- Static assets (images, documents) - managed by Vercel
- Third-party service data (PostHog, Sentry) - managed by respective services
- Development and staging data

## Storage and Retention

### Primary Storage

- **Provider:** Cloudflare R2
- **Bucket:** `ww-backups` (configurable via `R2_BUCKET` secret)
- **Region:** Global (Cloudflare's distributed network)
- **Encryption:** At rest and in transit

### Retention Policy

- **Full Archives:** 30 days
- **Manifests:** 90 days
- **Lifecycle:** Automatic deletion after retention period
- **Deduplication:** Content-based hashing to minimize storage costs

### Backup Frequency

- **Daily:** Automated nightly backups at 02:00 Europe/London
- **Manual:** On-demand via GitHub Actions workflow dispatch
- **Deduplication:** Skip upload if content hash matches previous backup

## Validation and Testing

### Automated Testing

- **Frequency:** Weekly (Sundays at 03:00 Europe/London)
- **Scope:** Restore to staging environment
- **Validation:** Health endpoint verification and data integrity checks
- **Reporting:** GitHub Actions job summaries and optional Slack notifications

### Manual Testing

- **Frequency:** Quarterly
- **Scope:** Random historical backup restoration
- **Documentation:** Game-day checklist completion
- **Review:** RTO measurement and process improvement

## Ownership and Responsibilities

### Primary Owner

- **Role:** DevOps Team Lead
- **Responsibilities:**
  - Policy maintenance and updates
  - Backup process monitoring
  - Incident response coordination
  - Quarterly review and testing

### Secondary Owner

- **Role:** Senior Backend Engineer
- **Responsibilities:**
  - Technical implementation
  - Backup process troubleshooting
  - Documentation maintenance
  - Cross-training and knowledge transfer

### Escalation Path

1. DevOps Team Lead
2. Engineering Manager
3. CTO
4. CEO (for critical incidents)

## Communication and Incident Response

### Internal Communication

- **Slack Channel:** `#ops-alerts`
- **Escalation:** Automated notifications on backup failures
- **Status Page:** Internal dashboard for backup status

### External Communication

- **Customer Impact:** Minimal (staging-only testing)
- **Public Status:** No public disclosure required for testing
- **Incident Response:** Follow standard incident management procedures

## Compliance and Security

### Data Protection

- **GDPR Compliance:** Minimal PII in Clerk extracts
- **Encryption:** All data encrypted in transit and at rest
- **Access Control:** Least privilege principle for backup access
- **Audit Trail:** Complete backup and restore activity logging

### Security Measures

- **Authentication:** AWS CLI with R2 credentials
- **Authorization:** Separate backup/restore credentials
- **Monitoring:** Failed backup alerts and access logging
- **Isolation:** Staging environment for restore testing

## Review and Maintenance

### Quarterly Reviews

- **Policy Updates:** Based on business requirements and technology changes
- **Process Improvements:** Lessons learned from testing and incidents
- **Cost Optimization:** Storage and transfer cost analysis
- **Technology Updates:** Tool and service evaluation

### Annual Assessment

- **Business Continuity:** Alignment with business objectives
- **Technology Refresh:** Platform and tooling updates
- **Compliance Review:** Regulatory requirement changes
- **Training Updates:** Team knowledge and skill assessment

## Emergency Procedures

### Immediate Response (0-15 minutes)

1. Assess incident scope and impact
2. Activate incident response team
3. Determine if DR procedures are required
4. Begin restoration process if needed

### Short-term Response (15 minutes - 2 hours)

1. Execute restoration from latest backup
2. Validate data integrity and application functionality
3. Communicate status to stakeholders
4. Monitor system stability

### Long-term Response (2+ hours)

1. Conduct post-incident review
2. Update procedures based on lessons learned
3. Implement preventive measures
4. Document incident and resolution

## Success Metrics

### Backup Success Rate

- **Target:** 99.9% successful daily backups
- **Measurement:** GitHub Actions workflow success rate
- **Alerting:** Immediate notification on failures

### Restore Test Success Rate

- **Target:** 100% successful weekly restore tests
- **Measurement:** Staging environment health checks
- **Alerting:** Immediate notification on test failures

### RTO Achievement

- **Target:** < 2 hours for complete restoration
- **Measurement:** Time from incident declaration to full functionality
- **Validation:** Quarterly manual testing

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Next Review:** 2025-04-27  
**Owner:** DevOps Team Lead
