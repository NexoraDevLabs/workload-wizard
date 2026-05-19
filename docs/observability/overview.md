# Observability Overview

This document describes the observability infrastructure for WorkloadWizard, including tracing, monitoring, and alerting capabilities.

## Architecture

The observability stack consists of:

- **OpenTelemetry**: Distributed tracing and metrics collection
- **Vercel Speed Insights**: Real User Monitoring (RUM) for P95 Web Vitals

## Tracing Infrastructure

### API Route Tracing

All API routes are automatically instrumented with tracing using the `withApiTracing` wrapper:

```typescript
import { withApiTracing } from '@/lib/otel/withApiTracing';

async function handleGet(req: NextRequest) {
  // Your route logic
  return NextResponse.json({ data: 'example' });
}

export const GET = withApiTracing('api:/api/example', handleGet);
```

**Traced Attributes:**

- `http.method`: HTTP method (GET, POST, etc.)
- `http.route`: Route name (e.g., `api:/api/example`)
- `http.url`: Full request URL
- `http.status_code`: Response status code
- `http.status_class`: Status code class (200, 400, 500, etc.)
- `runtime`: Next.js runtime (nodejs)
- `user_agent`: Client user agent
- `http.request_id`: Request ID if present in headers

### Database Tracing

Convex operations are wrapped with `withDbSpan` for database performance monitoring:

```typescript
import { withDbSpan } from '@/lib/otel/withDbSpan';

const result = await withDbSpan('convex:getUser', () =>
  convex.query(api.users.get, { userId })
);
```

**Traced Attributes:**

- `db.operation`: Operation name (e.g., `convex:getUser`)
- `db.system`: Database system (`convex`)
- `db.success`: Whether the operation succeeded
- `error`: Set to `true` if operation failed
- `error.type`: Error type (`db_error`, `exception`, etc.)

## Monitoring Dashboards

- **API P95 Duration**: 95th percentile response times for API endpoints
- **API Error Rate**: Error rate percentage by endpoint
- **DB Operations P95**: Database operation performance
- **Overall Error Rate**: System-wide error rate
- **Request Volume**: Request count by endpoint

### Vercel Speed Insights

Real User Monitoring (RUM) data is collected via Vercel Speed Insights:

- **P95 Web Vitals**: Core Web Vitals including LCP, FID, CLS
- **Performance Metrics**: Real user performance data
- **Geographic Distribution**: Performance by region

**Access**: Vercel Dashboard → Speed Insights

## Alerting

### Alert Rules

The following alert rules are configured:

1. **API P95 Latency High**
   - Trigger: P95 latency > 1.5 seconds for 10 minutes
   - Scope: API endpoints (`transaction:*api*`)
   - Action: Slack notification to `#alerts`

2. **High Error Rate**
   - Trigger: > 5 errors in 5 minutes
   - Scope: All transactions
   - Action: Slack notification to `#alerts`

3. **Database Operation Errors**
   - Trigger: > 3 database errors in 5 minutes
   - Scope: Database operations (`transaction:*db*`)
   - Action: Slack notification to `#alerts`

### Alert Configuration

```bash
# Create dashboards

# Create alerts
```

**Required Environment Variables:**

## Environment Configuration

### Required Environment Variables

```bash

```

### Sampling Rates

- **Traces Sample Rate**: 20% (0.2) - Adjust based on traffic volume
- **Profiles Sample Rate**: 0% (0.0) - Disabled to reduce overhead
- **Error Sampling**: 100% - All errors are captured

## Troubleshooting

### Common Issues

1. **Missing Traces**
   - Verify `instrumentation.ts` is at the root of the project
   - Check that `NEXT_RUNTIME=nodejs` in production

2. **High Sampling Overhead**
   - Consider using dynamic sampling based on error rates

3. **Missing Database Traces**
   - Ensure Convex operations are wrapped with `withDbSpan`
   - Check that database operations are not failing silently

### Debug Mode

Enable debug logging by setting:

```bash

```

## Best Practices

1. **Consistent Naming**: Use consistent naming patterns for spans:
   - API routes: `api:/api/route-name`
   - Database ops: `db:operation-name` or `convex:operation-name`

2. **Meaningful Attributes**: Add relevant attributes to spans for better filtering and analysis

3. **Error Handling**: Always wrap operations that might fail with appropriate error handling

4. **Performance Impact**: Monitor the performance impact of tracing and adjust sampling rates accordingly

## Related Documentation

- [Dashboards](./dashboards.md) - Detailed dashboard configuration
- [Alerts](./alerts.md) - Alert configuration and runbooks
- [Performance Monitoring](../engineering/perf/) - Performance optimization guidelines
