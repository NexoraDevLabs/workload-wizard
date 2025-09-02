import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple debug endpoint to check environment and routing
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ? 'SET' : 'NOT_SET',
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ? 'SET' : 'NOT_SET',
      },
    };

    return NextResponse.json(debug, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
