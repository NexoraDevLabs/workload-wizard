import { NextResponse } from "next/server";

export const GET = () =>
  NextResponse.json({
    server: {
      CLERK_SECRET_KEY: typeof process.env.CLERK_SECRET_KEY === "string",
      CLERK_JWT_ISSUER_DOMAIN:
        typeof process.env.CLERK_JWT_ISSUER_DOMAIN === "string" ||
        typeof process.env.CLERK_ISSUER_URL === "string",
    },
    client: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string",
    },
  });
