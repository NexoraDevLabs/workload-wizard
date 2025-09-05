# Observability Dashboards

This document describes the monitoring dashboards available for WorkloadWizard and how to interpret the metrics.

## Sentry Performance Dashboard

### Dashboard: "API & DB Observability - P95 Latency & Error Rate"

**Location**: Sentry → Performance → Dashboards

**Widgets:**

#### 1. API P95 Duration (ms)

- **Purpose**: Monitor 95th percentile response times for API endpoints
- **Query**: `event.type:transaction project:workload-wizard transaction:*api*`
- **Aggregation**: `p95(transaction.duration)`
- **Grouping**: By transaction (endpoint)
- **Alert Threshold**: > 1500ms for 10 minutes

**Interpretation:**

- **Green (< 500ms)**: Excellent performance
- **Yellow (500-1000ms)**: Good performance, monitor trends
- **Red (> 1500ms)**: Poor performance, investigate immediately

#### 2. API Error Rate (%)

- **Purpose**: Track error rates by API endpoint
- **Query**: `event.type:transaction project:workload-wizard transaction:*api*`
- **Aggregation**: `failure_rate()`
- **Grouping**: By transaction (endpoint)
- **Alert Threshold**: > 5% error rate

**Interpretation:**

- **Green (< 1%)**: Excellent reliability
- **Yellow (1-5%)**: Monitor for trends
- **Red (> 5%)**: High error rate, investigate

#### 3. DB Operations P95 Duration (ms)

- **Purpose**: Monitor database operation performance
- **Query**: `event.type:transaction project:workload-wizard transaction:*db*`
- **Aggregation**: `p95(transaction.duration)`
- **Grouping**: By transaction (operation)
- **Alert Threshold**: > 1000ms for 10 minutes

**Interpretation:**

- **Green (< 200ms)**: Excellent database performance
- **Yellow (200-500ms)**: Good performance, monitor
- **Red (> 1000ms)**: Slow database operations

#### 4. Overall Error Rate (%)

- **Purpose**: System-wide error rate monitoring
- **Query**: `event.type:transaction project:workload-wizard`
- **Aggregation**: `failure_rate()`
- **Alert Threshold**: > 3% error rate

#### 5. Request Volume by Endpoint

- **Purpose**: Understand traffic patterns
- **Query**: `event.type:transaction project:workload-wizard transaction:*api*`
- **Aggregation**: `count()`
- **Grouping**: By transaction (endpoint)
- **Sorting**: By request count (descending)

## Vercel Speed Insights

### Dashboard: Speed Insights

**Location**: Vercel Dashboard → Speed Insights

**Key Metrics:**

#### Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s (Good), < 4.0s (Needs Improvement), > 4.0s (Poor)
- **FID (First Input Delay)**: < 100ms (Good), < 300ms (Needs Improvement), > 300ms (Poor)
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good), < 0.25 (Needs Improvement), > 0.25 (Poor)

#### Performance Metrics

- **P95 Response Time**: 95th percentile response time
- **P99 Response Time**: 99th percentile response time
- **Error Rate**: Percentage of failed requests

#### Geographic Performance

- **Performance by Region**: Response times across different geographic locations
- **CDN Performance**: Edge server performance

## Dashboard Access

### Sentry Dashboard

1. Navigate to [Sentry](https://sentry.io)
2. Select your organization
3. Go to Performance → Dashboards
4. Find "API & DB Observability - P95 Latency & Error Rate"

### Vercel Speed Insights

1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Speed Insights tab

## Custom Queries

### Common Sentry Queries

#### Find slowest API endpoints

```
event.type:transaction project:workload-wizard transaction:*api*
| p95(transaction.duration) by transaction
| sort by p95(transaction.duration) desc
```

#### Find most error-prone endpoints

```
event.type:transaction project:workload-wizard transaction:*api*
| failure_rate() by transaction
| sort by failure_rate() desc
```

#### Database operation performance

```
event.type:transaction project:workload-wizard transaction:*db*
| p95(transaction.duration) by transaction
| sort by p95(transaction.duration) desc
```

#### Error analysis

```
event.type:error project:workload-wizard
| count() by error.type, error.value
| sort by count() desc
```

### Time Range Filters

- **Last 1 hour**: Real-time monitoring
- **Last 24 hours**: Daily performance trends
- **Last 7 days**: Weekly patterns
- **Last 30 days**: Monthly trends

## Performance Baselines

### API Endpoints

- **Health checks**: < 100ms P95
- **User authentication**: < 500ms P95
- **Data queries**: < 1000ms P95
- **File uploads**: < 5000ms P95

### Database Operations

- **Simple queries**: < 100ms P95
- **Complex queries**: < 500ms P95
- **Mutations**: < 200ms P95
- **Bulk operations**: < 2000ms P95

### Error Rate Targets

- **API endpoints**: < 1% error rate
- **Database operations**: < 0.5% error rate
- **Overall system**: < 2% error rate

## Troubleshooting Dashboard Issues

### Missing Data

1. **Check sampling rates**: Ensure traces are being sampled
2. **Verify environment**: Confirm correct project/environment
3. **Check time range**: Data may not be available for selected time range

### Inaccurate Metrics

1. **Verify span naming**: Ensure consistent naming conventions
2. **Check attribute mapping**: Confirm attributes are being set correctly
3. **Review filters**: Ensure queries are filtering correctly

### Performance Impact

1. **Monitor sampling overhead**: Adjust sampling rates if needed
2. **Check trace volume**: High trace volume may impact performance
3. **Review alert frequency**: Too many alerts can cause alert fatigue

## Dashboard Maintenance

### Regular Tasks

- **Weekly**: Review performance trends and error rates
- **Monthly**: Update alert thresholds based on historical data
- **Quarterly**: Review and optimize dashboard queries

### Alert Tuning

- **Monitor alert frequency**: Adjust thresholds to reduce noise
- **Review alert effectiveness**: Ensure alerts lead to actionable responses
- **Update alert recipients**: Keep alert channels current

## Related Documentation

- [Overview](./overview.md) - General observability architecture
- [Alerts](./alerts.md) - Alert configuration and runbooks
- [Performance Monitoring](../engineering/perf/) - Performance optimization guidelines
