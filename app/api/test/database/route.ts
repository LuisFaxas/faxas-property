import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Test endpoint to verify database connection
 */
export async function GET(request: NextRequest) {
  const steps: any[] = [];

  try {
    // Step 1: Test basic database connection
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      steps.push({
        step: 'database_connection',
        success: true,
        result,
      });
    } catch (dbError: any) {
      steps.push({
        step: 'database_connection',
        success: false,
        error: dbError.message,
      });
      throw dbError;
    }

    // Step 2: Count projects
    try {
      const projectCount = await prisma.project.count();
      steps.push({
        step: 'count_projects',
        success: true,
        count: projectCount,
      });
    } catch (countError: any) {
      steps.push({
        step: 'count_projects',
        success: false,
        error: countError.message,
      });
      throw countError;
    }

    // Step 3: Find Miami Duplex
    try {
      const miamiDuplex = await prisma.project.findFirst({
        where: { name: 'Miami Duplex Remodel' },
        select: { id: true, name: true, status: true },
      });
      steps.push({
        step: 'find_miami_duplex',
        success: true,
        found: !!miamiDuplex,
        project: miamiDuplex,
      });
    } catch (findError: any) {
      steps.push({
        step: 'find_miami_duplex',
        success: false,
        error: findError.message,
      });
      throw findError;
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      steps,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Database operation failed',
      details: error.message,
      steps,
    }, { status: 500 });
  }
}

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';