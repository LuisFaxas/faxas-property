import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App;

function getAdminApp(): App | null {
  // Skip Firebase Admin only during Next.js build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn('Firebase Admin initialization skipped during build phase');
    return null as any;
  }

  if (getApps().length === 0) {
    try {
      let serviceAccount: any;

      // Try method 1: Individual environment variables (most reliable for Vercel)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        console.log('Using individual Firebase environment variables');

        // Handle different private key formats
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // If the key contains literal \n, replace with actual newlines
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
      // Try method 2: Base64 encoded service account (fallback)
      else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        console.log('Using base64 Firebase service account');
        const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

        try {
          const decodedString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
          serviceAccount = JSON.parse(decodedString);
        } catch (parseError) {
          console.error('Failed to parse base64 service account:', parseError);
          console.error('Base64 length:', serviceAccountBase64.length);
          throw new Error(`Failed to parse service account JSON: ${parseError}`);
        }
      }
      else {
        console.warn('Firebase credentials not found. Admin features will be limited.');
        return null as any;
      }

      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        console.error('Invalid service account: missing required fields');
        return null as any;
      }

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });

      global.adminApp = adminApp;
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      // Don't throw during build - just log and return null
      return null as any;
    }
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());
export const auth = adminAuth();

export default getAdminApp;