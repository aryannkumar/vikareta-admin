import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'vikareta-admin',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      checks: {
        api: {
          status: 'healthy',
          responseTime: Date.now(),
        },
      },
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'vikareta-admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorData, { status: 503 });
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}