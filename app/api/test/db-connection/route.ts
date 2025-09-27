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
      // Check for Supabase integration variables (REQUIRED)
      hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasPostgresNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
      // Extract just the host/port without credentials
      databaseHost: process.env.POSTGRES_PRISMA_URL ?
        process.env.POSTGRES_PRISMA_URL.split('@')[1]?.split('/')[0] : 'not-set',
      // Check if using correct pooler format
      usingPooler: process.env.POSTGRES_PRISMA_URL ?
        process.env.POSTGRES_PRISMA_URL.includes('pooler.supabase.com') : false,
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
    const dbUrl = process.env.POSTGRES_PRISMA_URL || '';
    const hasIntegrationVars = !!process.env.POSTGRES_PRISMA_URL;

    if (!hasIntegrationVars) {
      return '🚨 CRITICAL: Supabase Integration Variables NOT FOUND!\n\n' +
             'POSTGRES_PRISMA_URL is missing. The Supabase-Vercel integration should set this.\n\n' +
             'ACTION REQUIRED:\n' +
             '1. Go to Vercel Dashboard → Settings → Integrations\n' +
             '2. Check if Supabase integration is connected\n' +
             '3. Click on the integration and ensure your project is linked\n' +
             '4. Click "Sync Environment Variables" if available\n' +
             '5. Go to Settings → Environment Variables and verify POSTGRES_PRISMA_URL exists\n' +
             '6. Redeploy after confirming variables are set';
    }

    const isOldFormat = dbUrl.includes('db.') && dbUrl.includes('.supabase.co');
    const hasPooler = dbUrl.includes('pooler.supabase.com');
    const isCorrectPort = dbUrl.includes(':6543');
    const hasPgBouncer = dbUrl.includes('pgbouncer=true');

    if (isOldFormat) {
      return '🚨 CRITICAL: Old database format in POSTGRES_PRISMA_URL!\n\n' +
             'Your POSTGRES_PRISMA_URL still uses db.*.supabase.co format.\n\n' +
             'This means the Supabase integration is not properly configured.\n\n' +
             'ACTION REQUIRED:\n' +
             '1. Go to Vercel Dashboard → Settings → Integrations\n' +
             '2. Remove the Supabase integration completely\n' +
             '3. Re-add it and make sure to select your projects\n' +
             '4. The integration should set POSTGRES_PRISMA_URL with pooler.supabase.com\n' +
             '5. Redeploy after the integration updates the variables';
    }

    if (!hasPooler) {
      return '❌ Missing pooler endpoint. Use aws-0-[REGION].pooler.supabase.com format';
    }

    if (!isCorrectPort) {
      return '❌ Wrong port. Use port 6543 for transaction pooling (not 5432)';
    }

    if (!hasPgBouncer) {
      return '❌ Missing pgbouncer=true parameter. Add ?pgbouncer=true to DATABASE_URL';
    }

    return 'Database server unreachable. Check:\n' +
           '1. IP bans in Supabase Dashboard → Settings → Database → Network Bans\n' +
           '2. Supabase project is active (not paused)\n' +
           '3. Connection string format is correct';
  }

  if (errorMessage.includes('timeout')) {
    return 'Connection timeout. Add ?connect_timeout=300&pool_timeout=300 to DATABASE_URL';
  }

  if (errorMessage.includes('authentication')) {
    return 'Authentication failed. Check password and ensure no special characters cause issues.';
  }

  if (errorMessage.includes('SSL')) {
    return 'SSL connection issue. Add ?sslmode=require to your DATABASE_URL.';
  }

  return 'Unknown database error. Check Vercel Function logs for details.';
}

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';