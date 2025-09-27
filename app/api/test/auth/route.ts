import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin-singleton';

/**
 * Test endpoint to verify Firebase Admin auth verification
 */
export async function GET(request: NextRequest) {
  const steps: any[] = [];

  try {
    // Step 1: Check authorization header
    const authorization = request.headers.get('authorization');
    steps.push({
      step: 'authorization_header',
      success: true,
      hasAuth: !!authorization,
      startsWithBearer: authorization?.startsWith('Bearer '),
    });

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Missing Bearer token',
        steps,
      }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    steps.push({
      step: 'token_extracted',
      success: true,
      tokenLength: token.length,
    });

    // Step 2: Get Firebase Admin
    try {
      const adminAuth = await getAdminAuth();
      steps.push({
        step: 'firebase_admin_initialized',
        success: true,
      });

      // Step 3: Verify token
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        steps.push({
          step: 'token_verified',
          success: true,
          uid: decodedToken.uid,
          email: decodedToken.email,
        });

        return NextResponse.json({
          success: true,
          message: 'Auth verification successful',
          user: {
            uid: decodedToken.uid,
            email: decodedToken.email,
          },
          steps,
        });
      } catch (verifyError: any) {
        steps.push({
          step: 'token_verification_failed',
          success: false,
          error: verifyError.message,
          code: verifyError.code,
        });

        return NextResponse.json({
          success: false,
          error: 'Token verification failed',
          details: verifyError.message,
          steps,
        }, { status: 401 });
      }
    } catch (adminError: any) {
      steps.push({
        step: 'firebase_admin_failed',
        success: false,
        error: adminError.message,
      });

      return NextResponse.json({
        success: false,
        error: 'Firebase Admin initialization failed',
        details: adminError.message,
        steps,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message,
      steps,
    }, { status: 500 });
  }
}

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';