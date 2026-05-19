# Observability for Contributors

## Quick Links

- **[Traces Guide](../handbook/observability/traces.md)** — How to instrument, trace, and debug performance issues
- **[Dashboards Guide](../handbook/observability/dashboards.md)** — Creating and interpreting performance dashboards
- **[Bundle Reports Guide](../handbook/observability/bundle-reports.md)** — Analysing bundle size and optimisation opportunities
- **[Alerts & Ownership](../handbook/observability/alerts-and-ownership.md)** — Alert thresholds, routing, and response procedures

## Before Raising Performance Issues

Before creating issues or PRs related to performance or latency:

1. **Check Dashboards**: Review relevant performance dashboards
2. **Attach Screenshots**: Include dashboard screenshots showing the issue
3. **Include Trace IDs**: Provide trace IDs for specific problematic requests
4. **Describe Impact**: Explain user impact and business context

### Required Information

When reporting performance issues, include:

- **Dashboard Screenshot**: Showing the performance problem
- **Trace ID**: For specific requests (if available)
- **Time Range**: When the issue occurred
- **Environment**: Staging or production
- **User Impact**: How many users affected
- **Steps to Reproduce**: How to trigger the issue

### Example Issue Template

```markdown
## Performance Issue Report

**Trace ID**: `abc123def456` (if available)
**Time Range**: 2024-01-15 14:30 - 15:00 UTC
**Environment**: Production
**Impact**: 50+ users experiencing slow page loads

**Description**:
The homepage is loading slowly with P95 latency of 2.5s.

**Steps to Reproduce**:

1. Navigate to homepage
2. Observe slow loading
3. Check browser dev tools for timing

**Expected Behavior**:
Homepage should load in < 1s P95.

**Additional Context**:
This started after the recent deployment of PR #123.
```

## Creating Temporary Dashboards

### For Feature Development

When working on new features, create temporary dashboards:

1. **Duplicate Template**: Use existing dashboard as template
2. **Add Feature Filter**: Include `feature:your-feature-name` in queries
3. **Set Time Range**: Use last 24h for development
4. **Share with Team**: Add team members as viewers

### Dashboard Naming Convention

```
[Feature Name] - [Environment] - [Date]
```

Examples:

- `Course Management - Staging - 2024-01-15`
- `Auth Flow - Production - 2024-01-15`
- `Bundle Analysis - Development - 2024-01-15`

### Cleanup Process

**Before Merging PR**:

1. **Archive Dashboard**: Mark as archived, don't delete
2. **Document Findings**: Add notes about performance impact
3. **Update Team**: Notify team of dashboard changes
4. **Remove Access**: Remove temporary team members

**After Feature Release**:

1. **Review Performance**: Check if dashboard is still needed
2. **Merge with Main**: Integrate useful panels into main dashboards
3. **Delete Temporary**: Remove archived temporary dashboards
4. **Update Documentation**: Update runbooks with new insights

## Creating Temporary Alerts

### For Feature Testing

When testing new features, create temporary alerts:

1. **Set Lower Thresholds**: Use more sensitive thresholds for testing
2. **Short Duration**: Use shorter time windows (1-5 minutes)
3. **Feature-Specific**: Include feature name in alert conditions
4. **Test Channel**: Use `#feature-testing` channel

### Alert Naming Convention

```
[Feature Name] - [Test Type] - [Date]
```

Examples:

- `Course Management - Performance Test - 2024-01-15`
- `Auth Flow - Error Test - 2024-01-15`
- `Bundle Size - Regression Test - 2024-01-15`

### Cleanup Process

**Before Merging PR**:

1. **Disable Alert**: Turn off alert, don't delete
2. **Document Results**: Record test results and findings
3. **Update Thresholds**: Adjust thresholds based on test results
4. **Remove Test Channel**: Clean up test notifications

**After Feature Release**:

1. **Review Effectiveness**: Check if alert caught real issues
2. **Integrate with Main**: Add useful alerts to main alerting system
3. **Delete Temporary**: Remove disabled test alerts
4. **Update Runbooks**: Include new alert procedures

## Fork-Specific Considerations

### Dashboard Access

When working in forks:

2. **Share with Team**: Add team members as collaborators
3. **Document Access**: Include access instructions in PR description
4. **Clean Up**: Remove access after PR is merged

### Alert Configuration

For fork testing:

1. **Use Test Environment**: Configure alerts for staging only
2. **Personal Notifications**: Use personal Slack/email for notifications
3. **Document Setup**: Include setup instructions in PR description
4. **Clean Up**: Remove test alerts after PR is merged

### Data Privacy

When working with observability data:

1. **No Production Data**: Never use production data in forks
2. **Anonymise Data**: Remove or mask sensitive information
3. **Secure Access**: Use secure methods for sharing dashboards
4. **Review Access**: Regularly review who has access to data

## Best Practices

### Performance Monitoring

1. **Monitor Early**: Set up monitoring before feature development
2. **Test Thresholds**: Validate alert thresholds with test data
3. **Document Assumptions**: Record why thresholds were chosen
4. **Review Regularly**: Check monitoring effectiveness monthly

### Collaboration

1. **Share Knowledge**: Document monitoring setup and findings
2. **Cross-Train**: Ensure multiple team members understand monitoring
3. **Regular Reviews**: Schedule monthly observability reviews
4. **Continuous Improvement**: Always look for ways to improve monitoring

### Troubleshooting

1. **Use Traces**: Always start with trace analysis for performance issues
2. **Check Dashboards**: Review dashboards before investigating code
3. **Correlate Data**: Look for patterns across different metrics
4. **Document Solutions**: Record successful troubleshooting approaches

## Getting Help

### Internal Resources

- **Platform Team**: For infrastructure and tooling questions
- **Feature Teams**: For domain-specific monitoring needs
- **Engineering Manager**: For escalation and process questions

### External Resources

- **Vercel Speed Insights**: [vercel.com/docs/analytics](https://vercel.com/docs/analytics)
- **OpenTelemetry**: [opentelemetry.io/docs](https://opentelemetry.io/docs)

### Emergency Contacts

- **On-Call Engineer**: Check current rotation in `#on-call`
- **Platform Team Lead**: Available in `#platform-alerts`
- **Engineering Manager**: Available in `#engineering-managers`
