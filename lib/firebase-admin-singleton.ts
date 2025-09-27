/**
 * Firebase Admin Singleton - Production-Grade Implementation
 *
 * This module provides a single, lazy-initialized Firebase Admin instance
 * that works reliably in both development and Vercel production environments.
 *
 * Key features:
 * - Lazy initialization (no top-level imports)
 * - Global memoization to prevent re-initialization
 * - Base64 credentials preferred (Vercel-friendly)
 * - Clear error messages for debugging
 * - Never returns null - always throws descriptive errors
 */

import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';

// Global memoization to survive HMR and multiple imports
declare global {
  var __FIREBASE_ADMIN_APP: App | undefined;
  var __FIREBASE_ADMIN_AUTH: Auth | undefined;
  var __FIREBASE_ADMIN_STORAGE: Storage | undefined;
  var __FIREBASE_ADMIN_INITIALIZED: boolean | undefined;
}

/**
 * Get or initialize Firebase Admin SDK
 * @throws {Error} If initialization fails or credentials are missing
 */
export async function getFirebaseAdmin() {
  // Check if running on client
  if (typeof window !== 'undefined') {
    throw new Error('[Firebase Admin] Cannot initialize on client side');
  }

  // Return memoized instance if already initialized
  if (global.__FIREBASE_ADMIN_INITIALIZED && global.__FIREBASE_ADMIN_APP) {
    const { getAuth, getStorage } = await import('firebase-admin/auth');
    return {
      app: global.__FIREBASE_ADMIN_APP,
      auth: () => global.__FIREBASE_ADMIN_AUTH!,
      storage: () => global.__FIREBASE_ADMIN_STORAGE!
    };
  }

  // Dynamic import to avoid top-level initialization
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getStorage } = await import('firebase-admin/storage');

  // Check if already initialized by another instance
  const existingApps = getApps();
  if (existingApps.length > 0) {
    global.__FIREBASE_ADMIN_APP = existingApps[0];
    global.__FIREBASE_ADMIN_AUTH = getAuth(existingApps[0]);
    global.__FIREBASE_ADMIN_STORAGE = getStorage(existingApps[0]);
    global.__FIREBASE_ADMIN_INITIALIZED = true;

    console.log('[Firebase Admin Singleton] Using existing app instance');

    return {
      app: global.__FIREBASE_ADMIN_APP,
      auth: () => global.__FIREBASE_ADMIN_AUTH!,
      storage: () => global.__FIREBASE_ADMIN_STORAGE!
    };
  }

  // Initialize new instance
  console.log('[Firebase Admin Singleton] Initializing new instance...');

  let serviceAccount: any;

  // Method 1: Base64 encoded service account (PREFERRED for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log('[Firebase Admin Singleton] Using base64 credentials');

    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);

      if (!serviceAccount.project_id) {
        throw new Error('Invalid service account: missing project_id');
      }

      console.log(`[Firebase Admin Singleton] Decoded base64 for project: ${serviceAccount.project_id}`);
    } catch (error: any) {
      console.error('[Firebase Admin Singleton] Failed to parse base64:', error?.message);
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64: ${error?.message}`);
    }
  }
  // Method 2: Individual environment variables (FALLBACK)
  else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.log('[Firebase Admin Singleton] Using individual environment variables');

    // Handle private key newlines
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
    // Log what we have for debugging
    console.error('[Firebase Admin Singleton] Missing credentials. Environment check:', {
      hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL
    });

    throw new Error(
      '[Firebase Admin Singleton] Missing Firebase credentials. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_BASE64 (preferred) or individual FIREBASE_* variables in Vercel.'
    );
  }

  // Validate credentials
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error(
      `[Firebase Admin Singleton] Invalid credentials - missing required fields: ` +
      `project_id=${!!serviceAccount.project_id}, ` +
      `private_key=${!!serviceAccount.private_key}, ` +
      `client_email=${!!serviceAccount.client_email}`
    );
  }

  // Initialize Firebase Admin
  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });

    // Store in global for memoization
    global.__FIREBASE_ADMIN_APP = app;
    global.__FIREBASE_ADMIN_AUTH = getAuth(app);
    global.__FIREBASE_ADMIN_STORAGE = getStorage(app);
    global.__FIREBASE_ADMIN_INITIALIZED = true;

    console.log(`[Firebase Admin Singleton] ✅ Initialized successfully for project: ${serviceAccount.project_id}`);

    return {
      app,
      auth: () => global.__FIREBASE_ADMIN_AUTH!,
      storage: () => global.__FIREBASE_ADMIN_STORAGE!
    };
  } catch (error: any) {
    console.error('[Firebase Admin Singleton] Initialization failed:', {
      error: error?.message,
      code: error?.code,
      stack: error?.stack
    });

    throw new Error(
      `[Firebase Admin Singleton] Failed to initialize: ${error?.message || 'Unknown error'}`
    );
  }
}

/**
 * Helper to get just the Auth instance
 */
export async function getAdminAuth(): Promise<Auth> {
  const admin = await getFirebaseAdmin();
  return admin.auth();
}

/**
 * Helper to get just the Storage instance
 */
export async function getAdminStorage(): Promise<Storage> {
  const admin = await getFirebaseAdmin();
  return admin.storage();
}