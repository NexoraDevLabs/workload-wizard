// src/lib/kv.ts
// Returns a Redis-compatible client for @upstash/ratelimit.
// Using dynamic imports to reduce memory usage during build

export type KvLike = unknown; // Simplified type to avoid complex imports

let kvClient: KvLike | null = null;

export async function getKv(): Promise<KvLike> {
  if (kvClient) {
    return kvClient;
  }

  // 1) Namespaced Vercel KV
  const urlNs = process.env.WW_RL_KV_REST_API_URL;
  const tokenNs = process.env.WW_RL_KV_REST_API_TOKEN;
  if (urlNs && tokenNs) {
    const { createClient } = await import('@vercel/kv');
    kvClient = createClient({ url: urlNs, token: tokenNs });
    return kvClient;
  }

  // 2) Vercel KV defaults
  const urlV = process.env.KV_REST_API_URL;
  const tokenV = process.env.KV_REST_API_TOKEN;
  if (urlV && tokenV) {
    const { createClient } = await import('@vercel/kv');
    kvClient = createClient({ url: urlV, token: tokenV });
    return kvClient;
  }

  // 3) Upstash Redis via Redis.fromEnv() (works with UPSTASH_REDIS_REST_URL/TOKEN)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    const { Redis } = await import('@upstash/redis');
    kvClient = new Redis({ url: upstashUrl, token: upstashToken });
    return kvClient;
  }

  // 4) Fallback to @vercel/kv auto (in case Vercel injects)
  const { kv } = await import('@vercel/kv');
  kvClient = kv;
  return kvClient;
}
