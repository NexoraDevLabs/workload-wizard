# Alerts and Ownership

## Purpose

This document defines alert thresholds, ownership, and response procedures to make alerts actionable and reduce noise. Clear ownership ensures issues are resolved quickly and efficiently.

## Severity & Thresholds

### P1 (Page me) - Critical

**Response Time**: 15 minutes  
**Escalation**: Immediate to on-call engineer

#### API/Convex Performance

- **P95 latency > 500ms** for 10 minutes (production)
- **P99 latency > 1000ms** for 5 minutes (production)
- **Error rate ≥ 2%** for 5 minutes (production)

#### Authentication Failures

- **Auth success rate < 95%** for 5 minutes (production)
- **Auth failures spike > 3x baseline** for 5 minutes (production)

#### System Health

- **Database connection failures > 5** in 5 minutes
- **Memory usage > 90%** for 10 minutes
- **CPU usage > 95%** for 10 minutes

### P2 (Working hours) - High

**Response Time**: 2 hours during business hours  
**Escalation**: Next business day if not resolved

#### API/Convex Performance

- **P95 latency > 350ms** for 30 minutes (staging)
- **P95 latency > 250ms** for 1 hour (production)
- **Error rate ≥ 1%** for 15 minutes (staging/production)

#### Web Vitals

- **LCP P75 > 2.5s** for 1 hour (production)
- **FID P75 > 100ms** for 1 hour (production)
- **CLS P75 > 0.25** for 1 hour (production)

#### Resource Usage

- **Memory usage > 80%** for 30 minutes
- **CPU usage > 85%** for 30 minutes
- **Disk usage > 85%** for 1 hour

### P3 (Weekly review) - Medium

**Response Time**: Next business day  
**Escalation**: Weekly review meeting

#### Performance Trends

- **LCP P75 > 2.5s** on key pages for 7 days
- **Bundle size increase > 10%** from previous release
- **Error rate trend increasing** over 7 days

#### Capacity Planning

- **Memory usage trend increasing** over 30 days
- **CPU usage trend increasing** over 30 days
- **Database query time increasing** over 30 days

## Routing & Ownership

### Service-Based Routing

Use service labels to route alerts to appropriate teams:

#### `service:web-app` → **Platform Team**

- **Owner**: Platform Team Lead
- **Slack**: `#platform-alerts`
- **Escalation**: Engineering Manager

**Responsibilities**:

- Next.js application performance
- API route optimisation
- Client-side performance issues
- Core Web Vitals monitoring

#### `service:convex` → **Platform/Backend Team**

- **Owner**: Backend Team Lead
- **Slack**: `#backend-alerts`
- **Escalation**: Platform Team Lead

**Responsibilities**:

- Database query optimisation
- Convex function performance
- Data consistency issues
- Schema migration problems

#### `service:edge` → **Platform Team**

- **Owner**: Platform Team Lead
- **Slack**: `#platform-alerts`
- **Escalation**: Engineering Manager

**Responsibilities**:

- Edge runtime performance
- CDN optimisation
- Geographic performance
- Edge function debugging

### Feature-Based Routing

Use area labels for feature-specific alerts:

#### `area:auth` → **Auth Team**

- **Owner**: Auth Team Lead
- **Slack**: `#auth-alerts`
- **Escalation**: Platform Team Lead

**Responsibilities**:

- WorkOS integration issues
- Authentication flows
- User session management
- Permission system bugs

#### `area:courses` → **Course Management Team**

- **Owner**: Course Team Lead
- **Slack**: `#courses-alerts`
- **Escalation**: Product Manager

**Responsibilities**:

- Course creation/editing issues
- Module management problems
- Academic year transitions
- Course data integrity

#### `area:allocations` → **Allocations Team**

- **Owner**: Allocations Team Lead
- **Slack**: `#allocations-alerts`
- **Escalation**: Product Manager

**Responsibilities**:

- Staff allocation calculations
- Workload planning issues
- Capacity management problems
- Allocation algorithm bugs

### Environment-Based Routing

#### `environment:production` → **On-Call Engineer**

- **Primary**: Current on-call rotation
- **Secondary**: Team lead for affected service
- **Escalation**: Engineering Manager

#### `environment:staging` → **Feature Team**

- **Primary**: Team developing the feature
- **Secondary**: Platform Team
- **Escalation**: Team Lead

## Runbook Links

### Immediate Response

1. **Acknowledge Alert**: Respond in Slack within 5 minutes
2. **Assess Impact**: Determine user impact and severity
3. **Check Dashboards**: Use [Dashboards Guide](./dashboards.md) for investigation
4. **Review Traces**: Use [Traces Guide](./traces.md) for debugging

### Investigation Steps

1. **Check System Health**: Review CPU, memory, database metrics
2. **Identify Root Cause**: Use traces to find performance bottlenecks
3. **Check Recent Changes**: Review recent deployments and code changes
4. **Verify Dependencies**: Check external service status

### Resolution Procedures

1. **Implement Fix**: Deploy hotfix or rollback if necessary
2. **Monitor Recovery**: Watch metrics return to normal
3. **Document Incident**: Record details in incident log
4. **Post-Mortem**: Schedule follow-up for P1 incidents

## Escalation Procedures

### P1 Escalation

```
Alert → On-Call (15min) → Team Lead (30min) → Engineering Manager (1h) → CTO (2h)
```

**Escalation Triggers**:

- No acknowledgment within 15 minutes
- No progress within 30 minutes
- Issue affecting > 50% of users
- Data loss or security incident

### P2 Escalation

```
Alert → Team Lead (2h) → Engineering Manager (4h) → Product Manager (Next day)
```

**Escalation Triggers**:

- No acknowledgment within 2 hours
- No progress within 4 hours
- Issue affecting > 10% of users
- Performance degradation > 50%

### P3 Escalation

```
Alert → Team Lead (Next day) → Product Manager (Weekly review)
```

**Escalation Triggers**:

- No acknowledgment within 24 hours
- No progress within 1 week
- Recurring issues
- Technical debt accumulation

## Auto-Silencing Rules

### Maintenance Windows

**Scheduled Maintenance**:

- **Duration**: 2 hours
- **Silence**: All P2/P3 alerts
- **P1**: Manual override required

**Deployment Windows**:

- **Duration**: 30 minutes
- **Silence**: Performance alerts only
- **P1**: Manual override required

### Known Issues

**Temporary Silencing**:

- **Duration**: 4 hours maximum
- **Approval**: Team lead required
- **Documentation**: Must include reason and ETA

**Recurring Issues**:

- **Duration**: Until fix deployed
- **Approval**: Engineering manager required
- **Tracking**: Must be in backlog with priority

## Change History

| Date       | Change                        | Author              | Impact                  |
| ---------- | ----------------------------- | ------------------- | ----------------------- |
| 2024-01-15 | Initial alert thresholds      | Platform Team       | New alerting system     |
| 2024-01-20 | Added P3 severity             | Engineering Manager | Reduced noise           |
| 2024-02-01 | Updated ownership mapping     | Platform Team       | Clearer routing         |
| 2024-02-15 | Added auto-silencing rules    | Platform Team       | Reduced false positives |
| 2024-03-01 | Updated escalation procedures | Engineering Manager | Faster response times   |

## Alert Testing

### Monthly Testing

**Test Schedule**: First Monday of each month

**Test Scenarios**:

1. **P1 Test**: Simulate critical performance issue
2. **P2 Test**: Simulate high-severity issue
3. **P3 Test**: Simulate medium-severity issue
4. **Escalation Test**: Verify escalation procedures

**Test Commands**:

```bash
# Test Sentry alert
curl -X POST https://sentry.io/api/0/projects/org/project/events/ \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  -d '{"message": "Test P1 alert", "level": "error"}'

# Test Slack notification
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text": "Test alert from WorkloadWizard - P1"}'
```

### Quarterly Review

**Review Agenda**:

1. **Alert Effectiveness**: Review alert-to-action ratio
2. **Threshold Tuning**: Adjust based on historical data
3. **Ownership Updates**: Update team assignments
4. **Process Improvement**: Identify gaps and improvements

## Related Documentation

- [Traces Guide](./traces.md) — Debugging performance issues
- [Dashboards Guide](./dashboards.md) — Monitoring system health
- [Bundle Reports Guide](./bundle-reports.md) — Client-side performance analysis
