# Disaster Recovery Backups

## Overview

This document describes the automated backup system for Workload Wizard, including scheduling, contents, storage, and monitoring.

## Backup Schedule

### Automated Backups

- **Frequency:** Daily
- **Time:** 02:00 Europe/London (01:00 UTC)
- **Trigger:** GitHub Actions scheduled workflow
- **Duration:** Typically 5-15 minutes

### Manual Backups

- **Trigger:** GitHub Actions workflow dispatch
- **Access:** Repository administrators only
- **Options:** Force upload (bypass deduplication)

## Backup Contents

### 1. Convex Database Export

- **Source:** Production Convex deployment
- **Format:** ZIP archive containing JSON data
- **Size:** Variable (typically 1-50 MB)
- **Contents:**
  - All tables and documents
  - System metadata
  - Audit logs and timestamps

### 2. Vercel Environment Variables

- **Source:** Vercel API (`/v10/projects/{project}/env`)
- **Format:** Minified JSON
- **Size:** Typically < 10 KB
- **Contents:**
  - Application configuration
  - API keys and secrets
  - Feature flags
  - Environment-specific settings

### 3. WorkOS User Data (Minimal Extract)

- **Source:** WorkOS API with pagination
- **Format:** Minified JSON array
- **Size:** Variable (typically 10-100 KB)
- **Contents:**
  - `id`: User identifier
  - `external_id`: External system identifier
  - `created_at`: Account creation timestamp
  - `last_active_at`: Last activity timestamp
  - `banned`: Account ban status
  - `locked`: Account lock status
  - `email_addresses`: Array of email addresses

## Storage and Compression

### Compression Algorithm

- **Primary:** zstd (Zstandard) - faster and better compression
- **Fallback:** gzip - if zstd not available
- **Archive Format:** TAR with compression
- **File Extension:** `.tar.zst` or `.tar.gz`

### Storage Location

- **Provider:** Cloudflare R2
- **Bucket:** Configured via `R2_BUCKET` secret
- **Endpoint:** Configured via `R2_ENDPOINT` secret
- **Path Structure:**
  ```
  s3://ww-backups/
  ├── backup_20250127T020001Z.tar.zst
  ├── backup_20250128T020001Z.tar.zst
  └── latest.json
  ```

### Deduplication Strategy

- **Method:** Content-based hashing (SHA256)
- **Check:** Compare with previous backup's content hash
- **Behavior:** Skip upload if content unchanged
- **Manifest:** Upload small `run.json` with status

## Backup Process

### 1. Data Collection

```bash
# Export Convex data
convex export --prod --output backup/convex_snapshot.zip

# Fetch Vercel environment variables
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v10/projects/$VERCEL_PROJECT/env" \
  | jq -c '.' > backup/vercel/env.json

# Fetch WorkOS users with minimal fields
# (Paginated API calls with field filtering)
```

### 2. Manifest Creation

```json
{
  "timestamp": "2025-01-27T02:00:00Z",
  "source": "prod",
  "sizes": {
    "convex_zip": 1234567,
    "vercel_env": 2048,
    "workos_users": 51200
  }
}
```

### 3. Archive Creation

```bash
# Try zstd first, fallback to gzip
if command -v zstd >/dev/null 2>&1; then
  tar --zstd -cf "backup_${timestamp}.tar.zst" -C backup .
else
  tar -czf "backup_${timestamp}.tar.gz" -C backup .
fi
```

### 4. Deduplication Check

```bash
# Download latest.json from R2
aws s3 cp "s3://$R2_BUCKET/latest.json" latest.json --endpoint-url "$R2_ENDPOINT"

# Compare content hashes
if [ "$existing_hash" = "$new_hash" ]; then
  echo "Content unchanged, skipping upload"
  # Upload only run.json manifest
else
  echo "Content changed, proceeding with upload"
  # Upload archive and update latest.json
fi
```

## Monitoring and Observability

### GitHub Actions Job Summary

- **Status:** Uploaded/Skipped/Failed
- **Compression:** Algorithm used
- **Content Hash:** SHA256 checksum
- **File Sizes:** Individual component sizes
- **R2 Key:** Archive location in R2

### Artifacts

- **Manifest:** `backup/manifest.json` (7-14 day retention)
- **Run Log:** `run.json` with execution details
- **Archive:** Stored in R2 only (not GitHub)

### Alerting

- **Slack Notifications:** On backup failures
- **GitHub Notifications:** Workflow status updates
- **Email Alerts:** Repository administrators

## Manual Backup Execution

### Via GitHub Actions

1. Navigate to Actions tab in repository
2. Select "Nightly DR Backup to R2" workflow
3. Click "Run workflow"
4. Optionally check "Force upload" to bypass deduplication
5. Monitor execution in real-time

### Via Command Line (Development)

```bash
# Install dependencies
npm ci
npm install -g convex

# Set environment variables
export CONVEX_DEPLOY_KEY_PROD="your-prod-key"
export VERCEL_TOKEN="your-vercel-token"
export VERCEL_PROJECT="workload-wizard"
export WORKOS_API_KEY="your-workos-key"
export R2_ACCESS_KEY_ID_BACKUP="your-r2-key"
export R2_SECRET_ACCESS_KEY_BACKUP="your-r2-secret"
export R2_BUCKET="ww-backups"
export R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"

# Run backup script (if available)
npm run backup:manual
```

## Troubleshooting

### Common Issues

#### Backup Fails - Convex Export

- **Symptom:** `convex export` command fails
- **Causes:** Invalid deploy key, network issues, Convex service down
- **Resolution:** Verify `CONVEX_DEPLOY_KEY_PROD` secret, check Convex status

#### Backup Fails - Vercel API

- **Symptom:** Vercel environment fetch fails
- **Causes:** Invalid token, project not found, API rate limits
- **Resolution:** Verify `VERCEL_TOKEN` and `VERCEL_PROJECT` secrets

#### Backup Fails - WorkOS API

- **Symptom:** WorkOS user fetch fails
- **Causes:** Invalid secret key, API rate limits, pagination issues
- **Resolution:** Verify `WORKOS_API_KEY` secret, check API limits

#### Backup Fails - R2 Upload

- **Symptom:** Archive upload to R2 fails
- **Causes:** Invalid credentials, bucket not found, network issues
- **Resolution:** Verify R2 credentials and bucket configuration

#### Deduplication Issues

- **Symptom:** Content hash mismatch causing unnecessary uploads
- **Causes:** Data corruption, hash calculation errors
- **Resolution:** Check hash calculation logic, verify data integrity

### Debugging Steps

1. **Check Workflow Logs**
   - Navigate to Actions tab
   - Click on failed workflow run
   - Review step-by-step execution logs

2. **Verify Secrets**
   - Ensure all required secrets are set
   - Check secret values are correct and not expired

3. **Test Individual Components**
   - Test Convex export manually
   - Test Vercel API access
   - Test WorkOS API access
   - Test R2 connectivity

4. **Check Resource Limits**
   - Verify GitHub Actions runner resources
   - Check API rate limits
   - Monitor R2 storage quotas

## Lifecycle Management

### Archive Retention

- **Full Archives:** 30 days in R2
- **Manifests:** 90 days in R2
- **GitHub Artifacts:** 7-14 days
- **Logs:** 90 days in GitHub Actions

### Cost Optimization

- **Deduplication:** Reduces storage and transfer costs
- **Compression:** Minimizes storage footprint
- **Lifecycle Rules:** Automatic cleanup of old archives
- **Monitoring:** Regular cost analysis and optimization

### Security Considerations

- **Encryption:** All data encrypted in transit and at rest
- **Access Control:** Least privilege for backup credentials
- **Audit Trail:** Complete activity logging
- **Isolation:** Separate credentials for backup/restore

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Next Review:** 2025-04-27  
**Owner:** DevOps Team Lead
