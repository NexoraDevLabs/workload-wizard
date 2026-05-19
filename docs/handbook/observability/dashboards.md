# Dashboards How-to Guide

## Purpose

Dashboards provide a shared view of system health for developers and stakeholders. Use them to:

- Monitor real-time performance metrics
- Identify trends and patterns over time
- Correlate issues across different system components
- Communicate system status to stakeholders

## Dashboards to Use

### Web Performance Dashboard

**Purpose**: Monitor Core Web Vitals and page load performance

**Key Metrics**:

- **P95 Page Load Time**: 95th percentile page load duration
- **Core Web Vitals**: LCP, FID/INP, CLS scores
- **Time to First Byte (TTFB)**: Server response time
- **First Contentful Paint (FCP)**: Visual loading progress

**Access**: [TODO: Add Vercel Speed Insights dashboard link]

**Alert Thresholds**:

- LCP P75 > 2.5s (Poor)
- FID P75 > 100ms (Poor)
- CLS P75 > 0.25 (Poor)

### API/Convex Performance Dashboard

**Purpose**: Monitor backend API and database performance

**Key Metrics**:

- **P95/P99 Latency**: Response time percentiles by endpoint
- **Error Rate**: 4xx/5xx error percentage by endpoint
- **Request Volume**: Requests per minute by endpoint
- **Database Operations**: Convex query/mutation performance

**Alert Thresholds**:

- API P95 > 500ms (P1), > 350ms (P2)
- Error Rate > 2% (P1), > 1% (P2)
- Convex P95 > 200ms (P1), > 100ms (P2)

### Auth (WorkOS) Dashboard

**Purpose**: Monitor authentication service health

**Key Metrics**:

- **Sign-in Success Rate**: Percentage of successful authentications
- **Error Spikes**: Authentication failure patterns
- **Session Duration**: Average user session length
- **Geographic Distribution**: Auth performance by region

**Access**: [TODO: Add WorkOS dashboard link]

**Alert Thresholds**:

- Success Rate < 95% (P1)
- Error Spike > 3x baseline (P1)

### Queues/Redis Dashboard

**Purpose**: Monitor background job processing and caching

**Key Metrics**:

- **Queue Processing Rate**: Jobs processed per minute
- **Queue Latency**: Time from job creation to completion
- **Redis Hit Rate**: Cache effectiveness
- **Memory Usage**: Redis memory consumption

**Access**: [TODO: Add Redis/Queue dashboard link]

**Alert Thresholds**:

- Queue Latency > 5 minutes (P1)
- Redis Hit Rate < 80% (P2)
- Memory Usage > 90% (P1)

## Creating/Editing Dashboards

### Step-by-Step Process

1. **Duplicate Template**:
   - Find existing dashboard template
   - Click "Duplicate" or "Clone"
   - Rename with descriptive name

2. **Set Environment Filter**:
   - Add environment filter: `environment:production` or `environment:staging`
   - Configure time range: Last 24h, 7d, or 30d
   - Set refresh interval: 1m, 5m, or 15m

3. **Add Panels**:
   - **Time Series**: For latency and throughput metrics
   - **Stat Panels**: For current values and thresholds
   - **Table Panels**: For top N lists (slowest endpoints, errors)
   - **Heatmap Panels**: For request distribution patterns

4. **Configure Queries**:

   ```bash
   # API Performance Query
   event.type:transaction transaction:*api* | p95(transaction.duration) by transaction

   # Error Rate Query
   event.type:transaction | failure_rate() by transaction

   # Request Volume Query
   event.type:transaction transaction:*api* | count() by transaction
   ```

5. **Save to Team Folder**:
   - Create team folder: `WorkloadWizard/Platform`
   - Set appropriate permissions
   - Add team members as viewers/editors

### Panel Configuration

#### Time Series Panels

**Use for**: Latency trends, throughput over time

**Configuration**:

- **Query**: `event.type:transaction | p95(transaction.duration) by transaction`
- **Visualisation**: Line chart with smooth curves
- **Y-axis**: Duration in milliseconds
- **Legend**: Show by transaction name
- **Thresholds**: Green < 500ms, Yellow 500-1000ms, Red > 1000ms

#### Stat Panels

**Use for**: Current values, single metrics

**Configuration**:

- **Query**: `event.type:transaction | failure_rate()`
- **Visualisation**: Single stat with gauge
- **Unit**: Percentage
- **Thresholds**: Green < 1%, Yellow 1-5%, Red > 5%

#### Table Panels

**Use for**: Top N lists, detailed breakdowns

**Configuration**:

- **Query**: `event.type:transaction | p95(transaction.duration) by transaction`
- **Visualisation**: Table with sorting
- **Columns**: Transaction name, P95 duration, error rate, request count
- **Sorting**: By P95 duration (descending)

## Tagging & Ownership

### Panel Ownership

Every panel must have an **Owner** tag:

- `team:platform` — Core platform team
- `team:feature-auth` — Authentication team
- `team:feature-courses` — Course management team
- `team:feature-allocations` — Staff allocation team

### Tagging Convention

```yaml
# Panel metadata
owner: team:platform
component: api-performance
environment: production
severity: p1
```

### Ownership Responsibilities

- **Panel Owner**: Maintains panel accuracy and relevance
- **Team Lead**: Reviews dashboard effectiveness monthly
- **Platform Team**: Ensures dashboard infrastructure reliability

## Review Cadence

### Weekly Review

**Every Monday** (15 minutes):

- [ ] Check P95/P99 trends for all services
- [ ] Review error rate spikes from previous week
- [ ] Identify any performance regressions
- [ ] Update alert thresholds if needed

### Alert Follow-up

**Same Day** for high severity:

- [ ] Acknowledge alert within 15 minutes
- [ ] Investigate root cause using dashboard data
- [ ] Implement fix or workaround
- [ ] Document lessons learned

### Monthly Review

**First Friday** of each month (30 minutes):

- [ ] Review dashboard effectiveness
- [ ] Update panel queries and visualisations
- [ ] Adjust ownership assignments
- [ ] Plan dashboard improvements

## Dashboard Templates

### API Performance Template

```yaml
title: 'API Performance - Production'
panels:
  - type: timeseries
    title: 'P95 Latency by Endpoint'
    query: 'event.type:transaction transaction:*api* | p95(transaction.duration) by transaction'
  - type: stat
    title: 'Overall Error Rate'
    query: 'event.type:transaction | failure_rate()'
  - type: table
    title: 'Slowest Endpoints'
    query: 'event.type:transaction transaction:*api* | p95(transaction.duration) by transaction'
```

### Database Performance Template

```yaml
title: 'Convex Performance - Production'
panels:
  - type: timeseries
    title: 'P95 Query Duration'
    query: 'event.type:transaction transaction:*convex* | p95(transaction.duration) by transaction'
  - type: stat
    title: 'Query Error Rate'
    query: 'event.type:transaction transaction:*convex* | failure_rate()'
  - type: table
    title: 'Most Frequent Queries'
    query: 'event.type:transaction transaction:*convex* | count() by transaction'
```

## Troubleshooting

### Missing Data

1. **Check time range**: Ensure data exists for selected period
2. **Verify filters**: Confirm environment and service filters are correct
3. **Check sampling**: Ensure traces are being sampled and sent
4. **Review queries**: Validate query syntax and field names

### Inaccurate Metrics

1. **Verify span naming**: Ensure consistent naming conventions
2. **Check attribute mapping**: Confirm attributes are being set correctly
3. **Review aggregation**: Verify P95/P99 calculations are correct
4. **Validate filters**: Ensure queries filter data appropriately

### Performance Issues

1. **Reduce query complexity**: Simplify complex queries
2. **Increase refresh interval**: Reduce dashboard refresh frequency
3. **Limit data retention**: Use shorter time ranges for real-time dashboards
4. **Optimise visualisations**: Use simpler chart types for large datasets

## Related Documentation

- [Traces Guide](./traces.md) — Understanding trace data
- [Alerts & Ownership](./alerts-and-ownership.md) — Responding to dashboard alerts
- [Bundle Reports Guide](./bundle-reports.md) — Client-side performance analysis
