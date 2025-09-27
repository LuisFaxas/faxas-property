import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth } from '@/lib/firebase-admin-singleton';

/**
 * Simplified version of project initialization for testing
 */
export async function GET(request: NextRequest) {
  const steps: any[] = [];

  try {
    // Step 1: Verify auth
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Missing authorization',
      }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];

    // Step 2: Verify token
    let userId: string;
    let userEmail: string;
    try {
      const adminAuth = await getAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      userEmail = decodedToken.email || '';
      steps.push({
        step: 'auth_verified',
        success: true,
        userId,
        email: userEmail,
      });
    } catch (authError: any) {
      steps.push({
        step: 'auth_failed',
        success: false,
        error: authError.message,
      });
      return NextResponse.json({
        success: false,
        error: 'Auth verification failed',
        details: authError.message,
        steps,
      }, { status: 401 });
    }

    // Step 3: Check if user exists in database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
      steps.push({
        step: 'user_lookup',
        success: true,
        found: !!user,
        role: user?.role,
      });

      if (!user) {
        // Create user if doesn't exist
        user = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail,
            role: 'ADMIN',
          },
        });
        steps.push({
          step: 'user_created',
          success: true,
        });
      }
    } catch (userError: any) {
      steps.push({
        step: 'user_operation_failed',
        success: false,
        error: userError.message,
      });
      return NextResponse.json({
        success: false,
        error: 'User operation failed',
        details: userError.message,
        steps,
      }, { status: 500 });
    }

    // Step 4: Check/Create Miami Duplex
    let miamiDuplex;
    try {
      miamiDuplex = await prisma.project.findFirst({
        where: { name: 'Miami Duplex Remodel' },
      });

      if (!miamiDuplex) {
        miamiDuplex = await prisma.project.create({
          data: {
            name: 'Miami Duplex Remodel',
            status: 'ACTIVE',
            projectType: 'RENOVATION',
            description: 'Complete renovation of Miami duplex property',
            color: '#3B82F6',
            address: 'Miami, FL',
            clientName: 'FAXAS Property Management',
            totalBudget: 500000,
            contingency: 50000,
            startDate: new Date('2025-01-01'),
            targetEndDate: new Date('2025-12-31'),
            timezone: 'America/New_York',
          },
        });
        steps.push({
          step: 'project_created',
          success: true,
          projectId: miamiDuplex.id,
        });
      } else {
        steps.push({
          step: 'project_exists',
          success: true,
          projectId: miamiDuplex.id,
        });
      }
    } catch (projectError: any) {
      steps.push({
        step: 'project_operation_failed',
        success: false,
        error: projectError.message,
      });
      return NextResponse.json({
        success: false,
        error: 'Project operation failed',
        details: projectError.message,
        steps,
      }, { status: 500 });
    }

    // Step 5: Ensure membership
    try {
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: miamiDuplex.id,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        await prisma.projectMember.create({
          data: {
            projectId: miamiDuplex.id,
            userId: user.id,
            role: user.role,
          },
        });
        steps.push({
          step: 'membership_created',
          success: true,
        });
      } else {
        steps.push({
          step: 'membership_exists',
          success: true,
        });
      }
    } catch (memberError: any) {
      steps.push({
        step: 'membership_failed',
        success: false,
        error: memberError.message,
      });
      // Don't fail the whole operation for membership issues
    }

    // Return the project
    return NextResponse.json({
      success: true,
      project: {
        id: miamiDuplex.id,
        name: miamiDuplex.name,
        status: miamiDuplex.status,
      },
      steps,
      message: 'Miami Duplex initialization complete',
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Initialization failed',
      details: error.message,
      stack: error.stack,
      steps,
    }, { status: 500 });
  }
}

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';