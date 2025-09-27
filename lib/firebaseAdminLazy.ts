import { App } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;
let authInstance: Auth | null = null;
let storageInstance: Storage | null = null;

async function initializeAdmin() {
  if (adminApp) return;

  const { initializeApp, getApps, cert } = await import('firebase-admin/app');

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    console.log('[Firebase Admin] Using existing Firebase Admin app');
    return;
  }

  // Critical: Log environment variable availability for debugging
  const envCheck = {
    hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    base64Length: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    isProduction: process.env.NODE_ENV === 'production'
  };

  console.log('[Firebase Admin] Environment check:', envCheck);

  // Log critical warning if in production without credentials
  if (envCheck.isProduction && !envCheck.hasBase64 && !envCheck.hasProjectId) {
    console.error('[Firebase Admin] CRITICAL: Running in production without Firebase credentials!');
  }

  try {
    let serviceAccount: any;

    // Try method 1: Base64 encoded service account (preferred for Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      console.log('[Firebase Admin] Initializing with base64 credentials');
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

      try {
        const decodedString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedString);
        console.log('[Firebase Admin] Successfully parsed base64 service account for project:', serviceAccount.project_id);
      } catch (parseError: any) {
        console.error('[Firebase Admin] Failed to parse base64 service account:', {
          error: parseError?.message || parseError,
          base64Length: serviceAccountBase64.length,
          firstChars: serviceAccountBase64.substring(0, 50)
        });
        throw new Error(`Failed to parse Firebase service account: ${parseError?.message || parseError}`);
      }
    }
    // Try method 2: Individual environment variables (fallback)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('[Firebase Admin] Initializing with individual env vars for project:', process.env.FIREBASE_PROJECT_ID);

      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'not-set',
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || 'not-set',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
        universe_domain: 'googleapis.com'
      };
    }
    else {
      console.error('[Firebase Admin] CRITICAL: No Firebase credentials found in environment');
      console.error('[Firebase Admin] Required: FIREBASE_SERVICE_ACCOUNT_BASE64 or individual FIREBASE_* variables');
      console.error('[Firebase Admin] Available env keys:', Object.keys(process.env).filter(k => k.includes('FIREBASE')));
      throw new Error('Firebase Admin credentials not available - check Vercel environment variables');
    }

    // Validate required fields
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error('[Firebase Admin] Invalid service account - missing fields:', {
        hasProjectId: !!serviceAccount.project_id,
        hasPrivateKey: !!serviceAccount.private_key,
        hasClientEmail: !!serviceAccount.client_email
      });
      throw new Error('Invalid service account: missing required fields');
    }

    console.log('[Firebase Admin] Service account validated successfully');

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });

    console.log('[Firebase Admin] ✅ Firebase Admin SDK initialized successfully for project:', serviceAccount.project_id);
  } catch (error: any) {
    console.error('[Firebase Admin] ❌ Failed to initialize Firebase Admin:', {
      error: error?.message || error,
      code: error?.code,
      stack: error?.stack
    });

    // Re-throw with more context
    throw new Error(`Firebase Admin initialization failed: ${error?.message || error}`);
  }
}

export async function getAdminAuth(): Promise<Auth> {
  if (!authInstance) {
    console.log('[Firebase Admin] Getting Auth instance...');
    await initializeAdmin();

    if (!adminApp) {
      throw new Error('[Firebase Admin] Admin app not initialized after initializeAdmin()');
    }

    const { getAuth } = await import('firebase-admin/auth');
    authInstance = getAuth(adminApp);
    console.log('[Firebase Admin] Auth instance created successfully');
  }
  return authInstance;
}

export async function getAdminStorage(): Promise<Storage> {
  if (!storageInstance) {
    console.log('[Firebase Admin] Getting Storage instance...');
    await initializeAdmin();

    if (!adminApp) {
      throw new Error('[Firebase Admin] Admin app not initialized after initializeAdmin()');
    }

    const { getStorage } = await import('firebase-admin/storage');
    storageInstance = getStorage(adminApp);
    console.log('[Firebase Admin] Storage instance created successfully');
  }
  return storageInstance;
}

// Export functions that return promises
export const adminAuthLazy = () => getAdminAuth();
export const adminStorageLazy = () => getAdminStorage();