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
    return;
  }

  // Critical: Log environment variable availability for debugging
  console.log('[Firebase Admin] Environment check:', {
    hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    base64Length: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  });

  try {
    let serviceAccount: any;

    // Try method 1: Base64 encoded service account (preferred for Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      console.log('[Firebase Admin] Initializing with base64 credentials');
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

      try {
        const decodedString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedString);
      } catch (parseError) {
        console.error('Failed to parse base64 service account:', parseError);
        throw parseError;
      }
    }
    // Try method 2: Individual environment variables (fallback)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('Initializing Firebase Admin with individual env vars');

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
      throw new Error('Invalid service account: missing required fields');
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

export async function getAdminAuth(): Promise<Auth> {
  if (!authInstance) {
    await initializeAdmin();
    const { getAuth } = await import('firebase-admin/auth');
    authInstance = getAuth(adminApp!);
  }
  return authInstance;
}

export async function getAdminStorage(): Promise<Storage> {
  if (!storageInstance) {
    await initializeAdmin();
    const { getStorage } = await import('firebase-admin/storage');
    storageInstance = getStorage(adminApp!);
  }
  return storageInstance;
}

// Export functions that return promises
export const adminAuthLazy = () => getAdminAuth();
export const adminStorageLazy = () => getAdminStorage();