import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_STATSIG_CLIENT_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Add missing environment variables
  FEATFLAG_STATSIG_SERVER_API_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_ISSUER_URL: z.string().optional(),
  CLERK_JWT_ISSUER_DOMAIN: z.string().optional(),
  CONVEX_DEPLOY_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof EnvSchema>;

let parsed: Env | null = null;

export function getEnv(): Env {
  if (!parsed) {
    parsed = EnvSchema.parse({
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_STATSIG_CLIENT_KEY:
        process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NODE_ENV: process.env.NODE_ENV,
      // Parse missing environment variables
      FEATFLAG_STATSIG_SERVER_API_KEY:
        process.env.FEATFLAG_STATSIG_SERVER_API_KEY,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_ISSUER_URL: process.env.CLERK_ISSUER_URL,
      CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
      CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    });
  }
  return parsed;
}

// Parse eagerly at import time to fail fast in production builds
// Safe in dev/test too
void getEnv();
