// src/lib/rateLimiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { getKv } from "./kv";

export type LimitConfig = { windowSec: number; max: number };

function parseOverrides(): Record<string, Partial<LimitConfig>> {
  try {
    return JSON.parse(process.env.RATE_LIMIT_ROUTE_OVERRIDES || "{}") as Record<string, Partial<LimitConfig>>;
  } catch {
    return {};
  }
}

export function getRouteConfig(pathname: string): LimitConfig {
  const base: LimitConfig = {
    windowSec: Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60),
    max: Number(process.env.RATE_LIMIT_MAX ?? 120),
  };
  const ov = parseOverrides();
  for (const pat of Object.keys(ov)) {
    const re = new RegExp(pat);
    if (re.test(pathname)) {
      const o = ov[pat];
      if (o) {
        return {
          windowSec: Number(o.windowSec ?? (o as Record<string, unknown>).window ?? base.windowSec),
          max: Number(o.max ?? base.max),
        };
      }
    }
  }
  return base;
}

export function createLimiterFor(pathname: string) {
  const cfg = getRouteConfig(pathname);
  const kv = getKv();

  return new Ratelimit({
    // @upstash/ratelimit accepts both @vercel/kv client and @upstash/redis client
    redis: kv as unknown as Parameters<typeof Ratelimit>[0]['redis'],
    limiter: Ratelimit.slidingWindow(cfg.max, `${cfg.windowSec} s`),
    analytics: true,
    prefix: "rl",
  });
}
