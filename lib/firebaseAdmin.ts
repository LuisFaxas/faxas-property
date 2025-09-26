import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length === 0) {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
      console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set');
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set');
    }

    try {
      // Decode base64 and parse JSON
      const decodedString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');

      // Try to parse the decoded string
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(decodedString);
      } catch (parseError) {
        // Log more details about the parsing error
        console.error('JSON Parse Error:', parseError);
        console.error('Decoded string first 100 chars:', decodedString.substring(0, 100));
        throw new Error(`Failed to parse service account JSON: ${parseError}`);
      }

      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Invalid service account JSON: missing required fields');
      }

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      // In production, we might want to continue without admin features
      // but for now, throw to identify the issue
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