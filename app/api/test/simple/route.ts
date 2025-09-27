import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple test endpoint to verify API routes work
 */
export async function GET(request: NextRequest) {
  try {
    // Just return success without any auth or database calls
    return NextResponse.json({
      success: true,
      message: 'Simple API route working',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';