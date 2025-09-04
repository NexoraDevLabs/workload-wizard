// src/lib/kv.ts
// Returns a Redis-compatible client for @upstash/ratelimit.
import {
  createClient as createVercelKv,
  kv as vercelKvDefault,
} from '@vercel/kv';
import { Redis } from '@upstash/redis';

export type KvLike =
  | ReturnType<typeof Redis.fromEnv>
  | ReturnType<typeof createVercelKv>
  | typeof vercelKvDefault;

export function getKv(): KvLike {
  // 1) Namespaced Vercel KV
  const urlNs = process.env.WW_RL_KV_REST_API_URL;
  const tokenNs = process.env.WW_RL_KV_REST_API_TOKEN;
  if (urlNs && tokenNs) {
    return createVercelKv({ url: urlNs, token: tokenNs });
  }

  // 2) Vercel KV defaults
  const urlV = process.env.KV_REST_API_URL;
  const tokenV = process.env.KV_REST_API_TOKEN;
  if (urlV && tokenV) {
    return createVercelKv({ url: urlV, token: tokenV });
  }

  // 3) Upstash Redis via Redis.fromEnv() (works with UPSTASH_REDIS_REST_URL/TOKEN)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return new Redis({ url: upstashUrl, token: upstashToken });
  }

  // 4) Fallback to @vercel/kv auto (in case Vercel injects)
  return vercelKvDefault;
}
