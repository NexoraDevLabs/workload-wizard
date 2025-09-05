// src/lib/metrics.ts
type RLAction = 'hit' | 'block';

const enabled =
  (process.env.METRICS_PROVIDER || '').toLowerCase() === 'posthog';
const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';
const key = process.env.POSTHOG_API_KEY || '';

export function trackRateLimitEvent(
  action: RLAction,
  props: Record<string, unknown>
) {
  if (!enabled || !key) return;
  // fire-and-forget
  fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      event: `rate_limit_${action}`,
      properties: { ...props, env: process.env.NODE_ENV },
      distinct_id: String(props['id'] || 'anonymous'),
    }),
    keepalive: true,
  }).catch(() => {});
}
