import { NextRequest, NextResponse } from 'next/server';

/**
 * Public diagnostic endpoint to check environment variable availability
 * This helps debug Firebase Admin initialization issues in production
 */
export async function GET(request: NextRequest) {
  // Check which Firebase Admin credentials are available
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,

    // Check Firebase Admin credential methods (without exposing values)
    firebaseAdmin: {
      hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      base64Length: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    },

    // Check Firebase Client config (public vars)
    firebaseClient: {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'not-set',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not-set',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'not-set',
    },

    // Check database
    database: {
      hasUrl: !!process.env.DATABASE_URL,
      urlLength: process.env.DATABASE_URL?.length || 0,
    },

    // Test base64 decode if available
    base64Test: {
      canDecode: false,
      hasValidJson: false,
      error: null as string | null,
    }
  };

  // Try to decode base64 if present
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      diagnostics.base64Test.canDecode = true;

      try {
        const parsed = JSON.parse(decoded);
        diagnostics.base64Test.hasValidJson = true;
        // Add some non-sensitive validation
        diagnostics.base64Test = {
          ...diagnostics.base64Test,
          hasProjectId: !!parsed.project_id,
          hasPrivateKey: !!parsed.private_key,
          hasClientEmail: !!parsed.client_email,
          projectIdMatches: parsed.project_id === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        };
      } catch (parseError: any) {
        diagnostics.base64Test.hasValidJson = false;
        diagnostics.base64Test.error = `JSON parse failed: ${parseError.message}`;
      }
    } catch (decodeError: any) {
      diagnostics.base64Test.canDecode = false;
      diagnostics.base64Test.error = `Base64 decode failed: ${decodeError.message}`;
    }
  }

  // Try to initialize Firebase Admin to see if it works
  let adminInitTest = {
    success: false,
    error: null as string | null,
    method: null as string | null,
  };

  try {
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin-singleton');
    const admin = await getFirebaseAdmin();
    adminInitTest.success = true;
    adminInitTest.method = diagnostics.firebaseAdmin.hasBase64 ? 'base64' : 'individual-vars';
  } catch (error: any) {
    adminInitTest.success = false;
    adminInitTest.error = error.message || 'Unknown error';
  }

  // Return diagnostics
  return NextResponse.json({
    success: adminInitTest.success,
    diagnostics,
    adminInitTest,
    recommendation: getRecommendation(diagnostics, adminInitTest),
  });
}

function getRecommendation(diagnostics: any, adminInitTest: any): string {
  if (adminInitTest.success) {
    return 'Firebase Admin is working correctly.';
  }

  if (!diagnostics.firebaseAdmin.hasBase64 &&
      !diagnostics.firebaseAdmin.hasProjectId &&
      !diagnostics.firebaseAdmin.hasClientEmail &&
      !diagnostics.firebaseAdmin.hasPrivateKey) {
    return 'No Firebase Admin credentials found. Add FIREBASE_SERVICE_ACCOUNT_BASE64 to Vercel environment variables.';
  }

  if (diagnostics.firebaseAdmin.hasBase64 && !diagnostics.base64Test.canDecode) {
    return 'FIREBASE_SERVICE_ACCOUNT_BASE64 is present but cannot be decoded. Check if it\'s properly formatted.';
  }

  if (diagnostics.firebaseAdmin.hasBase64 && !diagnostics.base64Test.hasValidJson) {
    return 'FIREBASE_SERVICE_ACCOUNT_BASE64 decodes but is not valid JSON. Re-encode your service account JSON.';
  }

  if (diagnostics.firebaseAdmin.hasProjectId &&
      !diagnostics.firebaseAdmin.hasClientEmail) {
    return 'Missing FIREBASE_CLIENT_EMAIL environment variable.';
  }

  if (diagnostics.firebaseAdmin.hasProjectId &&
      !diagnostics.firebaseAdmin.hasPrivateKey) {
    return 'Missing FIREBASE_PRIVATE_KEY environment variable.';
  }

  return 'Unknown issue. Check the adminInitTest.error for details.';
}

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';