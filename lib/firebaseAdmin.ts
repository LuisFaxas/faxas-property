import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App;

function getAdminApp(): App {
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
        throw new Error('Firebase credentials not found. Set either FIREBASE_SERVICE_ACCOUNT_BASE64 or individual FIREBASE_* environment variables');
      }

      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Invalid service account: missing required fields');
      }

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });

      global.adminApp = adminApp;
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error(`Failed to initialize Firebase Admin SDK: ${error}`);
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