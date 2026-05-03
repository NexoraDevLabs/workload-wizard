# Observability Alerts

This document describes the alerting configuration for WorkloadWizard and provides runbooks for responding to alerts.

## Alert Rules

### 1. API P95 Latency High

**Rule Name**: `API P95 Latency High`

**Trigger Conditions**:

- P95 latency > 1500ms (1.5 seconds)
- Duration: 10 minutes
- Scope: API endpoints (`transaction:*api*`)

**Actions**:

- Slack notification to `#alerts` channel
- Email notification to on-call engineer

**Severity**: High

**Runbook**:

1. **Immediate Actions**:
   - Check Sentry Performance dashboard for affected endpoints
   - Review recent deployments for potential causes
   - Check system resources (CPU, memory, database connections)

2. **Investigation Steps**:
   - Identify the slowest endpoints from the dashboard
   - Check for database query performance issues
   - Review error logs for related issues
   - Check external service dependencies

3. **Resolution**:
   - If database issue: Check query performance, consider indexing
   - If external service: Check service health, implement timeouts
   - If code issue: Review recent changes, consider rollback
   - If resource issue: Scale resources or optimize code

### 2. High Error Rate

**Rule Name**: `High Error Rate`

**Trigger Conditions**:

- > 5 errors in 5 minutes
- Scope: All transactions

**Actions**:

- Slack notification to `#alerts` channel
- PagerDuty escalation (if configured)

**Severity**: Critical

**Runbook**:

1. **Immediate Actions**:
   - Check Sentry Issues dashboard for new error spikes
   - Review system health dashboard
   - Check if issue is affecting all users or specific segments

2. **Investigation Steps**:
   - Identify error types and patterns
   - Check for database connectivity issues
   - Review authentication service status
   - Check external API dependencies

3. **Resolution**:
   - If authentication issue: Check WorkOS service status
   - If database issue: Check Convex service status
   - If external API issue: Check service health, implement fallbacks
   - If code issue: Review recent deployments, consider rollback

### 3. Database Operation Errors

**Rule Name**: `Database Operation Errors`

**Trigger Conditions**:

- > 3 database errors in 5 minutes
- Scope: Database operations (`transaction:*db*`)

**Actions**:

- Slack notification to `#alerts` channel
- Email notification to database team

**Severity**: High

**Runbook**:

1. **Immediate Actions**:
   - Check Convex service status
   - Review database connection metrics
   - Check for rate limiting issues

2. **Investigation Steps**:
   - Identify specific database operations failing
   - Check query performance and timeouts
   - Review database logs for errors
   - Check for schema or data issues

3. **Resolution**:
   - If connection issue: Check network connectivity, restart services
   - If query issue: Optimize queries, add indexes
   - If rate limiting: Check usage patterns, adjust limits
   - If data issue: Review data integrity, fix corrupted data

## Alert Configuration

### Setting Up Alerts

#### Automated Setup (Recommended)

```bash
# Set required environment variables
export SENTRY_ORG=your_org_slug
export SENTRY_PROJECT=your_project_slug
export SENTRY_AUTH_TOKEN=your_api_token

# Create alerts
npm alerts:sentry
```

#### Manual Setup

1. Navigate to Sentry → Settings → Alerts → Rules
2. Create new rule for each alert type
3. Configure conditions and actions
4. Test alert rules

### Alert Channels

#### Slack Integration

1. Install Sentry Slack app
2. Configure webhook URL
3. Set up channel notifications
4. Configure user mentions for different severity levels

#### Email Notifications

1. Configure SMTP settings in Sentry
2. Set up email templates
3. Configure recipient lists
4. Set up escalation policies

#### PagerDuty Integration (Optional)

1. Install Sentry PagerDuty integration
2. Configure service mapping
3. Set up escalation policies
4. Configure on-call schedules

## Alert Thresholds

### Current Thresholds

| Metric          | Warning | Critical | Duration |
| --------------- | ------- | -------- | -------- |
| API P95 Latency | 1000ms  | 1500ms   | 10min    |
| Error Rate      | 2%      | 5%       | 5min     |
| DB Errors       | 2/min   | 3/min    | 5min     |

### Threshold Tuning

#### Factors to Consider

- **Historical Performance**: Base thresholds on historical data
- **Business Impact**: Consider user experience impact
- **Resource Constraints**: Account for system capacity
- **Seasonal Patterns**: Adjust for traffic variations

#### Tuning Process

1. **Collect Baseline Data**: Monitor metrics for 2-4 weeks
2. **Set Initial Thresholds**: Use 95th percentile + buffer
3. **Monitor Alert Frequency**: Adjust to reduce noise
4. **Review Monthly**: Update based on performance trends

## Alert Response Procedures

### On-Call Responsibilities

#### Primary On-Call

- **Response Time**: 15 minutes for critical alerts
- **Escalation**: Escalate to secondary if no response
- **Documentation**: Log all actions and decisions

#### Secondary On-Call

- **Response Time**: 30 minutes for high severity
- **Backup**: Support primary on-call
- **Escalation**: Escalate to engineering manager if needed

### Alert Acknowledgment

#### Acknowledgment Process

1. **Acknowledge Alert**: Respond in Slack within 5 minutes
2. **Assess Severity**: Determine actual impact
3. **Investigate**: Follow runbook procedures
4. **Update Status**: Provide regular updates
5. **Resolve**: Confirm resolution and document

#### Communication Template

```
🚨 Alert: [Alert Name]
Status: Investigating/Resolved
Impact: [User impact description]
ETA: [Expected resolution time]
Actions: [Steps being taken]
```

## Alert Testing

### Test Procedures

#### Monthly Testing

1. **Test Alert Rules**: Verify rules are working
2. **Test Notifications**: Confirm delivery channels
3. **Test Escalation**: Verify escalation procedures
4. **Update Runbooks**: Keep procedures current

#### Test Scenarios

- **Latency Test**: Simulate slow response times
- **Error Test**: Generate test errors
- **Database Test**: Simulate database issues
- **Integration Test**: Test end-to-end alerting

### Test Commands

```bash
# Test Sentry integration
curl -X POST https://sentry.io/api/0/projects/org/project/events/ \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  -d '{"message": "Test alert", "level": "error"}'

# Test Slack integration
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text": "Test alert from WorkloadWizard"}'
```

## Alert Metrics

### Key Metrics to Track

#### Alert Performance

- **Alert Response Time**: Time to acknowledge alerts
- **Resolution Time**: Time to resolve issues
- **False Positive Rate**: Percentage of non-actionable alerts
- **Alert Volume**: Number of alerts per day/week

#### System Health

- **Uptime**: System availability percentage
- **Error Rate**: Overall system error rate
- **Performance**: P95 response times
- **User Impact**: Number of affected users

### Monthly Review

#### Review Agenda

1. **Alert Summary**: Review all alerts from the month
2. **Performance Analysis**: Analyze response and resolution times
3. **Threshold Review**: Evaluate threshold effectiveness
4. **Process Improvement**: Identify areas for improvement
5. **Training Needs**: Identify knowledge gaps

#### Action Items

- **Update Thresholds**: Adjust based on performance data
- **Improve Runbooks**: Update procedures based on learnings
- **Training**: Provide additional training as needed
- **Tool Improvements**: Enhance monitoring and alerting tools

## Troubleshooting

### Common Issues

#### Missing Alerts

1. **Check Rule Configuration**: Verify conditions and actions
2. **Check Integration Status**: Ensure Slack/email integrations are working
3. **Check Alert History**: Review Sentry alert history
4. **Test Manually**: Send test alerts

#### Too Many Alerts

1. **Review Thresholds**: Increase thresholds if appropriate
2. **Add Filters**: Exclude non-critical conditions
3. **Consolidate Rules**: Combine similar alert rules
4. **Implement Suppression**: Add alert suppression for maintenance windows

#### Alert Fatigue

1. **Prioritize Alerts**: Focus on high-impact alerts
2. **Reduce Noise**: Eliminate non-actionable alerts
3. **Improve Context**: Add more context to alert messages
4. **Implement Escalation**: Use escalation to reduce primary on-call load

## Related Documentation

- [Overview](./overview.md) - General observability architecture
- [Dashboards](./dashboards.md) - Dashboard configuration and interpretation
- [Performance Monitoring](../engineering/perf/) - Performance optimization guidelines
