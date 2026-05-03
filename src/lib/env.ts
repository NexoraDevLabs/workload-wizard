import { z } from 'zod';

const OptionalUrlSchema = z
  .string()
  .url()
  .optional()
  .or(z.literal('').transform(() => undefined));

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z
    .string()
    .url('NEXT_PUBLIC_CONVEX_URL must be a URL'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a URL'),
  NEXT_PUBLIC_SENTRY_DSN: OptionalUrlSchema,
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

const ServerEnvSchema = PublicEnvSchema.extend({
  CONVEX_DEPLOYMENT: z.string().min(1, 'CONVEX_DEPLOYMENT is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().min(1, 'CLERK_WEBHOOK_SECRET is required'),
  WORKOS_API_KEY: z.string().optional(),
  WORKOS_CLIENT_ID: z.string().optional(),
});

type PublicEnv = z.infer<typeof PublicEnvSchema>;
type ServerEnv = z.infer<typeof ServerEnvSchema>;

let parsedPublicEnv: PublicEnv | null = null;
let parsedServerEnv: ServerEnv | null = null;

function readPublicEnv() {
  return {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
  };
}

function formatEnvError(error: z.ZodError): Error {
  const missing = error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  return new Error(`Missing or invalid environment variables: ${missing}`);
}

export function getEnv(): PublicEnv {
  if (!parsedPublicEnv) {
    const result = PublicEnvSchema.safeParse(readPublicEnv());

    if (!result.success) {
      throw formatEnvError(result.error);
    }

    parsedPublicEnv = result.data;
  }

  return parsedPublicEnv;
}

export function getServerEnv(): ServerEnv {
  if (!parsedServerEnv) {
    const result = ServerEnvSchema.safeParse({
      ...readPublicEnv(),
      CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
      WORKOS_API_KEY: process.env.WORKOS_API_KEY,
      WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    });

    if (!result.success) {
      throw formatEnvError(result.error);
    }

    parsedServerEnv = result.data;
  }

  return parsedServerEnv;
}

export function validateServerEnv(): void {
  void getServerEnv();
}
