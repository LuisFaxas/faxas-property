import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Enhanced database connection test with detailed diagnostics
 */
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    databaseConfig: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      // Extract just the host/port without credentials
      databaseHost: process.env.DATABASE_URL ?
        process.env.DATABASE_URL.split('@')[1]?.split('/')[0] : 'not-set',
    },
    tests: []
  };

  // Test 1: Basic connection
  try {
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as server_time`;
    const responseTime = Date.now() - startTime;

    diagnostics.tests.push({
      name: 'basic_connection',
      success: true,
      responseTime: `${responseTime}ms`,
      result
    });
  } catch (error: any) {
    diagnostics.tests.push({
      name: 'basic_connection',
      success: false,
      error: error.message,
      code: error.code,
    });

    // Return early if connection failed
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      diagnostics,
      recommendation: getRecommendation(error)
    }, { status: 500 });
  }

  // Test 2: Count tables
  try {
    const tables = await prisma.$queryRaw<Array<{tablename: string}>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    diagnostics.tests.push({
      name: 'count_tables',
      success: true,
      tableCount: tables.length,
      tables: tables.map(t => t.tablename)
    });
  } catch (error: any) {
    diagnostics.tests.push({
      name: 'count_tables',
      success: false,
      error: error.message
    });
  }

  // Test 3: Check specific models
  try {
    const counts = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      tasks: await prisma.task.count(),
      contacts: await prisma.contact.count(),
    };

    diagnostics.tests.push({
      name: 'model_counts',
      success: true,
      counts
    });
  } catch (error: any) {
    diagnostics.tests.push({
      name: 'model_counts',
      success: false,
      error: error.message
    });
  }

  // Test 4: Check Miami Duplex
  try {
    const miamiDuplex = await prisma.project.findFirst({
      where: {
        OR: [
          { name: 'Miami Duplex Remodel' },
          { name: { contains: 'Miami' } }
        ]
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true
      }
    });

    diagnostics.tests.push({
      name: 'miami_duplex_check',
      success: true,
      found: !!miamiDuplex,
      project: miamiDuplex
    });
  } catch (error: any) {
    diagnostics.tests.push({
      name: 'miami_duplex_check',
      success: false,
      error: error.message
    });
  }

  const allSuccess = diagnostics.tests.every((t: any) => t.success);

  return NextResponse.json({
    success: allSuccess,
    message: allSuccess ? 'All database tests passed' : 'Some tests failed',
    diagnostics
  });
}

function getRecommendation(error: any): string {
  const errorMessage = error.message || '';

  if (errorMessage.includes("Can't reach database server")) {
    return 'Database server unreachable. For Vercel deployment with Supabase:\n' +
           '1. Use port 6543 for pooling (not 5432)\n' +
           '2. Set DATABASE_URL with pooling port: postgresql://...@db.supabase.co:6543/...\n' +
           '3. Set DIRECT_URL with direct port: postgresql://...@db.supabase.co:5432/...';
  }

  if (errorMessage.includes('timeout')) {
    return 'Connection timeout. Check if Supabase allows connections from Vercel IP addresses.';
  }

  if (errorMessage.includes('authentication')) {
    return 'Authentication failed. Verify database password in DATABASE_URL.';
  }

  if (errorMessage.includes('SSL')) {
    return 'SSL connection issue. Add ?sslmode=require to your DATABASE_URL.';
  }

  return 'Unknown database error. Check Vercel logs for more details.';
}

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';