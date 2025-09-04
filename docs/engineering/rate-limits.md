# Rate Limiting

This document describes the Redis-backed rate limiting implementation for Edge middleware on Vercel.

## Overview

The rate limiting system uses Upstash/Vercel KV for persistent state storage and implements sliding window rate limiting for all API routes. It's designed to work in Edge runtime environments with HTTP-only Redis clients.

## Supported Backends

The system supports multiple Redis backends in order of preference:

1. **Dedicated, namespaced KV** (preferred if present)
2. **Vercel KV defaults**
3. **Upstash Redis defaults**

## Environment Variables

### Rate Limit Configuration

- `RATE_LIMIT_MAX` (default: `120`) - Maximum requests per window
- `RATE_LIMIT_WINDOW_SEC` (default: `60`) - Window duration in seconds
- `RATE_LIMIT_ROUTE_OVERRIDES` (optional) - JSON object for per-route overrides

Example route overrides:

```json
{
  "^/api/auth": { "windowSec": 60, "max": 30 },
  "^/api/admin": { "windowSec": 300, "max": 10 }
}
```

### KV Credentials (in order of preference)

#### 1. Dedicated, namespaced KV

- `WW_RL_KV_REST_API_URL`
- `WW_RL_KV_REST_API_TOKEN`

#### 2. Vercel KV defaults

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

#### 3. Upstash Redis defaults

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Metrics Configuration

- `METRICS_PROVIDER` (set to `"posthog"` to enable)
- `POSTHOG_API_KEY` - PostHog API key
- `POSTHOG_HOST` (default: `"https://app.posthog.com"`)

## Response Headers

The rate limiter adds the following headers to all API responses:

- `RateLimit-Limit` - Maximum requests allowed per window
- `RateLimit-Remaining` - Remaining requests in current window
- `RateLimit-Reset` - Seconds until window resets
- `Retry-After` - Seconds to wait before retrying (only on 429 responses)

## Metrics

When PostHog is configured, the system emits the following events:

- `rate_limit_hit` - Successful request within rate limit
- `rate_limit_block` - Request blocked due to rate limit

Event properties include:

- `path` - API route path
- `id` - Client identifier (IP or user ID)
- `remaining` - Remaining requests
- `limit` - Total limit
- `env` - Environment (development/production)

## Load Testing

Use the included k6 script to test rate limiting effectiveness:

```bash
TARGET=https://your-app.vercel.app k6 run tests/k6/ratelimit.js
```

The test runs 50 virtual users for 30 seconds and verifies:

- Responses are either 200 or 429
- Rate limit headers are present
- Response times are under 1 second

## Debugging

A debug endpoint is available at `/api/kv-check` to verify KV connectivity:

```bash
curl https://your-app.vercel.app/api/kv-check
```

Expected response:

```json
{
  "ok": true,
  "message": "KV connection successful",
  "ping": "PONG"
}
```

## Implementation Details

### Edge Compatibility

- Uses HTTP-only Redis clients (no TCP connections)
- Compatible with Vercel Edge Runtime
- Non-blocking metrics collection

### Rate Limiting Algorithm

- Sliding window algorithm via `@upstash/ratelimit`
- Client identification: prefers `x-user-id` header, falls back to IP
- Per-route configuration support
- Analytics enabled for monitoring

### Error Handling

- Graceful fallback if KV is unavailable
- Non-blocking metrics collection
- Detailed error responses for debugging

## Monitoring

Monitor rate limiting effectiveness through:

1. **PostHog Events** - Track hit/block ratios and patterns
2. **Response Headers** - Monitor remaining limits in real-time
3. **Vercel Analytics** - Track 429 response rates
4. **KV Metrics** - Monitor Redis performance and errors

## Troubleshooting

### Common Issues

1. **KV Connection Failed**
   - Verify environment variables are set correctly
   - Check KV service status
   - Test with `/api/kv-check` endpoint

2. **Rate Limits Too Strict**
   - Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_SEC`
   - Use `RATE_LIMIT_ROUTE_OVERRIDES` for specific routes

3. **Metrics Not Appearing**
   - Verify `METRICS_PROVIDER=posthog`
   - Check `POSTHOG_API_KEY` is set
   - Ensure PostHog project is configured correctly
