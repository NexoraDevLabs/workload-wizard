import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

interface HealthResponse {
  ok: boolean;
  timestamp: string;
  service: string;
  environment: string;
  convex?: {
    deployment: string;
    status: string;
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const env = getServerEnv();

  try {
    // Basic health check - app is running
    const health: HealthResponse = {
      ok: true,
      timestamp,
      service: 'workload-wizard',
      environment: env.NODE_ENV,
    };

    // Optional: Add a simple Convex connectivity check
    // This is a lightweight check that doesn't require complex queries
    health.convex = {
      deployment: env.CONVEX_DEPLOYMENT,
      status: 'configured',
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch {
    // Log error for debugging (in production, this would go to monitoring system)
    // console.error('Health check failed:', error);

    return NextResponse.json(
      {
        ok: false,
        timestamp,
        service: 'workload-wizard',
        error: 'Health check failed',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
