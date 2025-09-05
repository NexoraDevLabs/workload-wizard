# Disaster Recovery Restore Runbook

## Overview

This document provides step-by-step procedures for restoring Workload Wizard from backup, including both automated staging tests and manual production restoration.

## Automated Staging Restore Test

### Schedule

- **Frequency:** Weekly (Sundays at 03:00 Europe/London)
- **Trigger:** GitHub Actions scheduled workflow
- **Duration:** Typically 10-30 minutes
- **Environment:** Staging Convex deployment

### Process Overview

1. Download latest backup from R2
2. Extract archive contents
3. Import Convex data to staging
4. Validate health endpoint
5. Verify data integrity
6. Generate test report

### Validation Steps

- **Health Check:** `GET /api/health` returns `{ok: true}`
- **Data Integrity:** Verify all backup files are valid JSON
- **Convex Connectivity:** Confirm staging deployment is accessible
- **User Count:** Validate Clerk user data was imported

## Manual Production Restore

### Prerequisites

- **Authorization:** CTO or Engineering Manager approval required
- **Access:** Production Convex deploy key
- **Backup:** Valid backup archive in R2
- **Communication:** Incident response team notified

### Emergency Contact Information

- **Primary:** DevOps Team Lead
- **Secondary:** Senior Backend Engineer
- **Escalation:** Engineering Manager
- **Emergency:** CTO

### Step-by-Step Procedure

#### Phase 1: Incident Assessment (0-15 minutes)

1. **Declare Incident**

   ```bash
   # Create incident channel in Slack
   # Channel: #incident-workload-wizard-YYYY-MM-DD
   # Notify: @devops-team @engineering-managers
   ```

2. **Assess Impact**
   - Determine scope of data loss or corruption
   - Identify affected systems and users
   - Estimate business impact
   - Document incident details

3. **Choose Restore Strategy**
   - **Point-in-time:** Restore from specific backup
   - **Latest:** Restore from most recent backup
   - **Partial:** Restore specific components only

#### Phase 2: Backup Selection (15-30 minutes)

1. **List Available Backups**

   ```bash
   # List all backups in R2
   aws s3 ls s3://ww-backups/ --endpoint-url "$R2_ENDPOINT" --recursive

   # Get latest backup info
   aws s3 cp s3://ww-backups/latest.json latest.json --endpoint-url "$R2_ENDPOINT"
   cat latest.json
   ```

2. **Select Backup**
   - Choose appropriate backup based on incident timeline
   - Verify backup integrity and completeness
   - Document selection rationale

3. **Prepare Restore Environment**

   ```bash
   # Create restore directory
   mkdir -p restore-$(date +%Y%m%d-%H%M%S)
   cd restore-$(date +%Y%m%d-%H%M%S)

   # Set environment variables
   export CONVEX_DEPLOY_KEY_PROD="your-production-key"
   export R2_ACCESS_KEY_ID_RESTORE="your-restore-key"
   export R2_SECRET_ACCESS_KEY_RESTORE="your-restore-secret"
   export R2_BUCKET="ww-backups"
   export R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
   ```

#### Phase 3: Data Restoration (30-90 minutes)

1. **Download Backup**

   ```bash
   # Download selected backup
   aws s3 cp "s3://$R2_BUCKET/$BACKUP_FILE" "$BACKUP_FILE" --endpoint-url "$R2_ENDPOINT"

   # Verify download
   ls -la "$BACKUP_FILE"
   sha256sum "$BACKUP_FILE"
   ```

2. **Extract Archive**

   ```bash
   # Detect compression and extract
   if [[ "$BACKUP_FILE" == *.tar.zst ]]; then
     tar --zstd -xf "$BACKUP_FILE"
   elif [[ "$BACKUP_FILE" == *.tar.gz ]]; then
     tar -xzf "$BACKUP_FILE"
   else
     echo "Unknown compression format"
     exit 1
   fi

   # Verify contents
   ls -la
   ```

3. **Restore Convex Data**

   ```bash
   # Import to production Convex
   npx convex import --replace convex_snapshot.zip

   # Wait for import to complete
   sleep 60
   ```

4. **Restore Vercel Environment Variables**

   ```bash
   # Review environment variables
   cat vercel/env.json | jq '.'

   # Apply to Vercel (manual step - requires Vercel dashboard)
   # Navigate to: https://vercel.com/dashboard
   # Select project: workload-wizard
   # Go to Settings > Environment Variables
   # Update variables as needed
   ```

5. **Restore Clerk User Data**

   ```bash
   # Review user data
   cat clerk/users.min.json | jq 'length'

   # Note: Clerk user data restoration requires manual intervention
   # Contact Clerk support for user data restoration if needed
   ```

#### Phase 4: Validation and Testing (90-120 minutes)

1. **Health Check**

   ```bash
   # Test health endpoint
   curl -f https://workload-wizard.vercel.app/api/health

   # Expected response:
   # {"ok":true,"timestamp":"2025-01-27T...","service":"workload-wizard"}
   ```

2. **Functional Testing**

   ```bash
   # Test critical user flows
   # 1. User login
   # 2. Workload creation
   # 3. Data retrieval
   # 4. User management
   ```

3. **Data Integrity Verification**

   ```bash
   # Verify Convex data
   npx convex run --prod queries:getUserCount
   npx convex run --prod queries:getWorkloadCount

   # Compare with expected values
   ```

4. **Performance Testing**
   ```bash
   # Test response times
   # Monitor error rates
   # Check resource utilization
   ```

#### Phase 5: Communication and Monitoring (120+ minutes)

1. **Update Stakeholders**
   - Notify incident response team of restoration status
   - Update status page if applicable
   - Communicate with affected users if necessary

2. **Monitor System**
   - Watch for errors and anomalies
   - Monitor performance metrics
   - Check user feedback and reports

3. **Document Incident**
   - Record restoration steps taken
   - Document any issues encountered
   - Note lessons learned
   - Update procedures if needed

## Rollback Procedures

### If Restoration Fails

1. **Stop Restoration Process**

   ```bash
   # Cancel any running imports
   # Revert any partial changes
   ```

2. **Assess Damage**
   - Determine what was affected
   - Identify data corruption or loss
   - Plan recovery strategy

3. **Alternative Restoration**
   - Try different backup if available
   - Consider partial restoration
   - Escalate to senior team members

### If System Issues Persist

1. **Immediate Actions**
   - Revert to previous state if possible
   - Implement temporary workarounds
   - Communicate with users

2. **Investigation**
   - Analyze root cause
   - Identify additional issues
   - Plan comprehensive fix

3. **Recovery**
   - Implement proper fix
   - Test thoroughly
   - Monitor closely

## Post-Incident Procedures

### Immediate (0-24 hours)

1. **Incident Review Meeting**
   - Gather all participants
   - Review timeline and actions
   - Identify root causes
   - Document lessons learned

2. **System Monitoring**
   - Enhanced monitoring for 48 hours
   - Watch for related issues
   - Monitor user feedback

### Short-term (1-7 days)

1. **Process Improvement**
   - Update procedures based on lessons learned
   - Implement preventive measures
   - Train team on new procedures

2. **Documentation Updates**
   - Update runbooks
   - Revise incident response procedures
   - Update disaster recovery plans

### Long-term (1-4 weeks)

1. **Comprehensive Review**
   - Analyze incident impact
   - Evaluate response effectiveness
   - Plan system improvements

2. **Training and Drills**
   - Conduct team training
   - Plan disaster recovery drills
   - Update emergency procedures

## Testing and Validation

### Pre-Restore Testing

- Verify backup integrity
- Test restore process in staging
- Validate all components work together

### Post-Restore Testing

- Functional testing of critical paths
- Performance testing
- User acceptance testing
- Data integrity verification

### Regular Testing

- Monthly staging restore tests
- Quarterly production restore drills
- Annual comprehensive disaster recovery testing

## Emergency Contacts

### Internal Team

- **DevOps Team Lead:** [Contact Information]
- **Senior Backend Engineer:** [Contact Information]
- **Engineering Manager:** [Contact Information]
- **CTO:** [Contact Information]

### External Services

- **Convex Support:** [Support Contact]
- **Vercel Support:** [Support Contact]
- **Clerk Support:** [Support Contact]
- **Cloudflare R2 Support:** [Support Contact]

### Escalation Matrix

1. **Level 1:** DevOps Team Lead (0-30 minutes)
2. **Level 2:** Engineering Manager (30-60 minutes)
3. **Level 3:** CTO (60+ minutes)
4. **Level 4:** CEO (Critical incidents only)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Next Review:** 2025-04-27  
**Owner:** DevOps Team Lead
