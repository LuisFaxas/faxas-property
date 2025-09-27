import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth } from '@/lib/firebase-admin-singleton';
import { log } from '@/lib/logger';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  uptime: number;
  checks: {
    database: CheckResult;
    firebase: CheckResult;
    memory: CheckResult;
  };
  version?: string;
  environment: string;
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  details?: any;
}

// Track service start time
const startTime = Date.now();

/**
 * GET /api/health - Comprehensive health check
 */
export async function GET(request: NextRequest) {
  const checks: HealthCheck['checks'] = {
    database: { status: 'fail' },
    firebase: { status: 'fail' },
    memory: { status: 'fail' }
  };
  
  let overallStatus: HealthCheck['status'] = 'healthy';
  
  // 1. Check database connection
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'pass',
      responseTime: Date.now() - dbStart,
      message: 'connected'
    };
  } catch (error: any) {
    checks.database = {
      status: 'fail',
      message: 'Database connection failed',
      responseTime: Date.now() - dbStart,
      details: error.message
    };
    overallStatus = 'unhealthy';
    log.error('Health check: Database failed', error);
  }
  
  // 2. Check Firebase Admin
  const firebaseStart = Date.now();
  try {
    // Check if Firebase is properly initialized by accessing the auth instance
    const adminAuth = await getAdminAuth();
    if (adminAuth) {
      checks.firebase = {
        status: 'pass',
        responseTime: Date.now() - firebaseStart,
        message: 'initialized'
      };
    } else {
      throw new Error('Firebase app not initialized');
    }
  } catch (error: any) {
    checks.firebase = {
      status: 'fail',
      message: 'Firebase not properly initialized',
      responseTime: Date.now() - firebaseStart,
      details: error.message
    };
    overallStatus = 'unhealthy';
    log.error('Health check: Firebase failed', error);
  }
  
  // 3. Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (heapUsedPercent > 90) {
    checks.memory = {
      status: 'fail',
      message: 'Memory usage critical',
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(2) + '%',
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      }
    };
    overallStatus = 'unhealthy';
  } else if (heapUsedPercent > 75) {
    checks.memory = {
      status: 'warn',
      message: 'Memory usage high',
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(2) + '%',
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      }
    };
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  } else {
    checks.memory = {
      status: 'pass',
      message: 'Memory usage normal',
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(2) + '%',
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      }
    };
  }
  
  const response: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'control-center',
    uptime: Math.floor((Date.now() - startTime) / 1000), // in seconds
    checks,
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Log health check (only if there are issues)
  if (overallStatus !== 'healthy') {
    log.warn('Health check detected issues', { response });
  }
  
  // Return appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  
  return NextResponse.json(response, { status: statusCode });
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';