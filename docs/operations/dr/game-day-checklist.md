# Disaster Recovery Game-Day Checklist

## Overview

This checklist is used during disaster recovery drills and actual incidents to ensure all critical steps are completed and nothing is overlooked.

## Pre-Incident Preparation

### Team Readiness

- [ ] **Incident Response Team Assigned**
  - [ ] Incident Commander identified
  - [ ] Technical Lead assigned
  - [ ] Communication Lead assigned
  - [ ] Backup team members available

- [ ] **Access and Credentials Verified**
  - [ ] Convex production deploy key available
  - [ ] R2 backup/restore credentials verified
  - [ ] Vercel API access confirmed
  - [ ] Clerk API access confirmed
  - [ ] GitHub Actions access verified

- [ ] **Communication Channels Ready**
  - [ ] Slack incident channel created
  - [ ] Status page access confirmed
  - [ ] Stakeholder contact list updated
  - [ ] Emergency contact numbers verified

### System Status Check

- [ ] **Backup System Health**
  - [ ] Latest backup available in R2
  - [ ] Backup integrity verified
  - [ ] R2 storage quota sufficient
  - [ ] Backup retention policy active

- [ ] **Target Environment Status**
  - [ ] Staging environment accessible
  - [ ] Production environment status known
  - [ ] Health endpoints responding
  - [ ] Monitoring systems operational

## Incident Response Phase

### Initial Response (0-15 minutes)

- [ ] **Incident Declaration**
  - [ ] Severity level determined
  - [ ] Incident channel created
  - [ ] Initial team notification sent
  - [ ] Stakeholder notification sent

- [ ] **Impact Assessment**
  - [ ] Affected systems identified
  - [ ] User impact estimated
  - [ ] Business impact assessed
  - [ ] Timeline for resolution estimated

- [ ] **Initial Communication**
  - [ ] Status page updated
  - [ ] Internal team notified
  - [ ] External stakeholders informed
  - [ ] Next update time communicated

### Investigation Phase (15-60 minutes)

- [ ] **Root Cause Analysis**
  - [ ] System logs reviewed
  - [ ] Error messages analyzed
  - [ ] Timeline of events documented
  - [ ] Potential causes identified

- [ ] **Backup Selection**
  - [ ] Available backups listed
  - [ ] Appropriate backup selected
  - [ ] Backup integrity verified
  - [ ] Selection rationale documented

- [ ] **Restoration Planning**
  - [ ] Restoration strategy defined
  - [ ] Required resources identified
  - [ ] Timeline for restoration estimated
  - [ ] Risk assessment completed

### Restoration Phase (60-120 minutes)

- [ ] **Environment Preparation**
  - [ ] Restore environment created
  - [ ] Required tools installed
  - [ ] Credentials configured
  - [ ] Network connectivity verified

- [ ] **Data Restoration**
  - [ ] Backup downloaded from R2
  - [ ] Archive extracted and verified
  - [ ] Convex data imported
  - [ ] Vercel environment variables updated
  - [ ] Clerk user data reviewed

- [ ] **System Validation**
  - [ ] Health endpoint tested
  - [ ] Critical functionality verified
  - [ ] Data integrity confirmed
  - [ ] Performance metrics checked

### Resolution Phase (120+ minutes)

- [ ] **System Monitoring**
  - [ ] Continuous monitoring enabled
  - [ ] Error rates monitored
  - [ ] Performance metrics tracked
  - [ ] User feedback collected

- [ ] **Communication Updates**
  - [ ] Status page updated
  - [ ] Stakeholders notified
  - [ ] Resolution confirmed
  - [ ] Post-incident plan communicated

## Post-Incident Phase

### Immediate Actions (0-24 hours)

- [ ] **Incident Documentation**
  - [ ] Timeline of events documented
  - [ ] Actions taken recorded
  - [ ] Issues encountered noted
  - [ ] Resolution steps documented

- [ ] **System Monitoring**
  - [ ] Enhanced monitoring enabled
  - [ ] Error rates tracked
  - [ ] Performance metrics monitored
  - [ ] User feedback collected

- [ ] **Team Debrief**
  - [ ] Initial debrief conducted
  - [ ] Key issues identified
  - [ ] Immediate improvements noted
  - [ ] Follow-up actions assigned

### Short-term Actions (1-7 days)

- [ ] **Post-Incident Review**
  - [ ] Formal review meeting scheduled
  - [ ] All participants invited
  - [ ] Agenda prepared
  - [ ] Documentation reviewed

- [ ] **Process Improvement**
  - [ ] Lessons learned documented
  - [ ] Process gaps identified
  - [ ] Improvement opportunities noted
  - [ ] Action items assigned

- [ ] **Documentation Updates**
  - [ ] Runbooks updated
  - [ ] Procedures revised
  - [ ] Checklists improved
  - [ ] Training materials updated

### Long-term Actions (1-4 weeks)

- [ ] **Comprehensive Analysis**
  - [ ] Root cause analysis completed
  - [ ] Contributing factors identified
  - [ ] Systemic issues addressed
  - [ ] Preventive measures implemented

- [ ] **Training and Drills**
  - [ ] Team training conducted
  - [ ] Disaster recovery drills planned
  - [ ] Emergency procedures updated
  - [ ] Knowledge transfer completed

## Quality Assurance Checklist

### Technical Validation

- [ ] **Data Integrity**
  - [ ] All data restored correctly
  - [ ] No data corruption detected
  - [ ] User accounts functional
  - [ ] System state consistent

- [ ] **System Functionality**
  - [ ] All critical features working
  - [ ] Performance within acceptable limits
  - [ ] Error rates normal
  - [ ] User experience satisfactory

- [ ] **Security Validation**
  - [ ] Access controls functional
  - [ ] Authentication working
  - [ ] Authorization correct
  - [ ] Data encryption verified

### Business Validation

- [ ] **User Impact**
  - [ ] User access restored
  - [ ] Data accessible
  - [ ] Functionality available
  - [ ] Performance acceptable

- [ ] **Operational Impact**
  - [ ] Business processes restored
  - [ ] Staff productivity normal
  - [ ] Customer service functional
  - [ ] Revenue impact minimized

## Emergency Contacts

### Internal Team

- [ ] **DevOps Team Lead**
  - [ ] Name: [Name]
  - [ ] Phone: [Number]
  - [ ] Email: [Email]
  - [ ] Slack: [Handle]

- [ ] **Senior Backend Engineer**
  - [ ] Name: [Name]
  - [ ] Phone: [Number]
  - [ ] Email: [Email]
  - [ ] Slack: [Handle]

- [ ] **Engineering Manager**
  - [ ] Name: [Name]
  - [ ] Phone: [Number]
  - [ ] Email: [Email]
  - [ ] Slack: [Handle]

### External Services

- [ ] **Convex Support**
  - [ ] Contact: [Information]
  - [ ] Escalation: [Process]
  - [ ] SLA: [Details]

- [ ] **Vercel Support**
  - [ ] Contact: [Information]
  - [ ] Escalation: [Process]
  - [ ] SLA: [Details]

- [ ] **Clerk Support**
  - [ ] Contact: [Information]
  - [ ] Escalation: [Process]
  - [ ] SLA: [Details]

## Success Metrics

### RTO Achievement

- [ ] **Target:** < 2 hours
- [ ] **Actual:** [Duration]
- [ ] **Status:** [Met/Exceeded/Missed]
- [ ] **Notes:** [Comments]

### RPO Achievement

- [ ] **Target:** < 24 hours
- [ ] **Actual:** [Duration]
- [ ] **Status:** [Met/Exceeded/Missed]
- [ ] **Notes:** [Comments]

### Data Integrity

- [ ] **Target:** 100% data recovery
- [ ] **Actual:** [Percentage]
- [ ] **Status:** [Met/Exceeded/Missed]
- [ ] **Notes:** [Comments]

### User Impact

- [ ] **Target:** Minimal user impact
- [ ] **Actual:** [Impact level]
- [ ] **Status:** [Met/Exceeded/Missed]
- [ ] **Notes:** [Comments]

## Lessons Learned

### What Went Well

- [ ] [Positive aspect 1]
- [ ] [Positive aspect 2]
- [ ] [Positive aspect 3]
- [ ] [Positive aspect 4]

### What Could Be Improved

- [ ] [Improvement area 1]
- [ ] [Improvement area 2]
- [ ] [Improvement area 3]
- [ ] [Improvement area 4]

### Action Items

- [ ] [Action 1] - Owner: [Name] - Due: [Date]
- [ ] [Action 2] - Owner: [Name] - Due: [Date]
- [ ] [Action 3] - Owner: [Name] - Due: [Date]
- [ ] [Action 4] - Owner: [Name] - Due: [Date]

## Sign-off

### Incident Commander

- [ ] **Name:** [Name]
- [ ] **Signature:** [Signature]
- [ ] **Date:** [Date]
- [ ] **Time:** [Time]

### Technical Lead

- [ ] **Name:** [Name]
- [ ] **Signature:** [Signature]
- [ ] **Date:** [Date]
- [ ] **Time:** [Time]

### Engineering Manager

- [ ] **Name:** [Name]
- [ ] **Signature:** [Signature]
- [ ] **Date:** [Date]
- [ ] **Time:** [Time]

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Next Review:** 2025-04-27  
**Owner:** DevOps Team Lead
