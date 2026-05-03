# Traces How-to Guide

## Purpose

Distributed tracing helps you identify performance bottlenecks across the entire application stack. Use traces to:

- Find slow API routes and Convex operations
- Identify edge vs Node.js runtime hotspots
- Debug N+1 database queries and chatty network calls
- Correlate client-side performance with server-side operations

## Quick Start

### Local Development

Enable tracing in your local environment:

```bash
# Set trace level and start the app
TRACE_LEVEL=info npm run dev

# Or use the existing development script
npm run dev:trace
```

Traces will appear in your browser's developer tools and be sent to your configured observability provider.

### Staging/Production

Traces are automatically collected and sent to:

- **Sentry Performance**: [TODO: Add Sentry Performance dashboard link]
- **Vercel Speed Insights**: Available in Vercel Dashboard → Speed Insights
- **Observability Provider**: [TODO: Replace with actual provider - Datadog/New Relic/Sentry/Vercel]

## What to Instrument

### API Routes

All API routes are automatically instrumented with `withApiTracing`:

```typescript
import { withApiTracing } from '@/lib/otel/withApiTracing';

async function handleGet(req: NextRequest) {
  // Your route logic
  return NextResponse.json({ data: 'example' });
}

export const GET = withApiTracing('api:/api/example', handleGet);
```

### Convex Functions & Queries

Wrap Convex operations with `withDbSpan`:

```typescript
import { withDbSpan } from '@/lib/otel/withDbSpan';

const result = await withDbSpan('convex:getUser', () =>
  convex.query(api.users.get, { userId })
);
```

### Next.js Server Actions

Instrument server actions for end-to-end tracing:

```typescript
import { trace } from '@opentelemetry/api';

export async function createUser(formData: FormData) {
  return trace.getActiveSpan()?.setAttributes({
    'action.name': 'createUser',
    'action.type': 'mutation',
  });
}
```

### Critical Client Spans

Add Web Vitals and custom client-side spans:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Send Core Web Vitals to your observability provider
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Naming Conventions

Use consistent naming patterns for spans and attributes:

### Service Names

- `service=web-app` — Next.js application
- `service=edge` — Edge runtime functions
- `service=convex` — Convex database operations

### Span Names

- API routes: `GET /api/users`, `POST /api/courses`
- Convex operations: `convex:mutation:createUser`, `convex:query:getCourses`
- Database operations: `db:query:users`, `db:mutation:createCourse`

### Attributes

- `http.method` — HTTP method (GET, POST, etc.)
- `http.route` — Route pattern (`/api/users/:id`)
- `http.status_code` — Response status code
- `db.operation` — Database operation name
- `user.id` — User identifier (when available)

## Finding P95/P99 Latencies

### Using Sentry Performance

1. Navigate to Sentry → Performance → Transactions
2. Filter by service: `service:web-app` or `service:convex`
3. Sort by P95 or P99 duration
4. Click on specific transactions to see detailed traces

### Using Vercel Speed Insights

1. Open Vercel Dashboard → Speed Insights
2. Select time range (last 24h, 7d, 30d)
3. View P95/P99 metrics by page or API route
4. Drill down into specific performance issues

### Custom Queries

For advanced analysis, use these queries:

```bash
# Find slowest API endpoints
event.type:transaction transaction:*api* | p95(transaction.duration) by transaction

# Find slowest Convex operations
event.type:transaction transaction:*convex* | p95(transaction.duration) by transaction

# Find high error rate operations
event.type:transaction | failure_rate() by transaction | sort by failure_rate() desc
```

## Common Performance Fixes

### N+1 Database Calls

**Problem**: Multiple sequential database calls in loops

```typescript
// ❌ Bad: N+1 queries
for (const courseId of courseIds) {
  const course = await convex.query(api.courses.get, { courseId });
}
```

**Solution**: Batch queries or use joins

```typescript
// ✅ Good: Single batched query
const courses = await convex.query(api.courses.getBatch, { courseIds });
```

### Chatty Network Calls

**Problem**: Too many small API calls

```typescript
// ❌ Bad: Multiple small requests
const user = await fetchUser(userId);
const courses = await fetchUserCourses(userId);
const permissions = await fetchUserPermissions(userId);
```

**Solution**: Combine into single request

```typescript
// ✅ Good: Single comprehensive request
const userData = await fetchUserWithCoursesAndPermissions(userId);
```

### Serial Awaits

**Problem**: Sequential async operations

```typescript
// ❌ Bad: Serial execution
const user = await fetchUser(userId);
const courses = await fetchCourses();
const modules = await fetchModules();
```

**Solution**: Parallel execution

```typescript
// ✅ Good: Parallel execution
const [user, courses, modules] = await Promise.all([
  fetchUser(userId),
  fetchCourses(),
  fetchModules(),
]);
```

### Caching Strategy

**Problem**: Repeated expensive operations

```typescript
// ❌ Bad: No caching
const expensiveData = await performExpensiveCalculation();
```

**Solution**: Add appropriate caching

```typescript
// ✅ Good: With caching
const expensiveData = await cache.getOrSet(
  `expensive:${key}`,
  () => performExpensiveCalculation(),
  { ttl: 300 } // 5 minutes
);
```

## Verification Checklist

Before considering tracing complete, verify you can see spans for:

- [ ] Homepage load (`GET /`)
- [ ] User authentication (`POST /api/auth/login`)
- [ ] Top 3 API routes by traffic
- [ ] Top 3 Convex operations by frequency
- [ ] Critical user journeys (course creation, staff allocation)
- [ ] Error scenarios (failed authentication, validation errors)

## Troubleshooting

### Missing Traces

1. **Check instrumentation**: Ensure `instrumentation.ts` is at project root
2. **Verify environment**: Confirm `NEXT_RUNTIME=nodejs` in production
3. **Check sampling**: Verify trace sampling rate is > 0
4. **Review provider config**: Ensure DSN/endpoint is correctly configured

### High Sampling Overhead

1. **Reduce sample rate**: Lower `SENTRY_TRACES_SAMPLE_RATE` for high-traffic apps
2. **Use dynamic sampling**: Implement error-based sampling
3. **Filter noise**: Exclude health checks and static assets

### Incomplete Traces

1. **Check span duration**: Ensure spans are properly closed
2. **Review error handling**: Verify errors don't break trace context
3. **Validate naming**: Use consistent span naming conventions

## Related Documentation

- [Dashboards Guide](./dashboards.md) — Visualising trace data
- [Alerts & Ownership](./alerts-and-ownership.md) — Responding to performance issues
- [Performance Monitoring](../engineering/perf/) — Performance optimisation guidelines
