/**
 * Firebase Admin Wrapper for Vercel Deployment
 * This file provides a compatibility layer that works during build and runtime
 */

import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';

// During build, return mock objects that won't crash
// At runtime, use the real Firebase Admin
class FirebaseAdminAuth {
  private authPromise: Promise<Auth> | null = null;
  private initializationError: Error | null = null;

  private async getAuth(): Promise<Auth> {
    if (this.initializationError) {
      console.error('[FirebaseAdminWrapper] Previous initialization failed:', this.initializationError);
      throw this.initializationError;
    }

    if (!this.authPromise) {
      this.authPromise = (async () => {
        try {
          console.log('[FirebaseAdminWrapper] Initializing Firebase Admin Auth...');
          const { adminAuthLazy } = await import('./firebaseAdminLazy');
          const auth = await adminAuthLazy();
          console.log('[FirebaseAdminWrapper] Firebase Admin Auth initialized successfully');
          return auth;
        } catch (error) {
          console.error('[FirebaseAdminWrapper] Failed to initialize Firebase Admin Auth:', error);
          this.initializationError = error as Error;
          throw error;
        }
      })();
    }
    return this.authPromise;
  }

  async verifyIdToken(token: string, checkRevoked?: boolean) {
    // Always attempt to verify the token properly
    // This is critical for production authentication
    try {
      console.log('[FirebaseAdminWrapper] Verifying ID token...');
      const auth = await this.getAuth();
      const decodedToken = await auth.verifyIdToken(token, checkRevoked);

      if (!decodedToken || !decodedToken.uid) {
        console.error('[FirebaseAdminWrapper] Token verification returned invalid result:', decodedToken);
        throw new Error('Token verification failed: Invalid decoded token');
      }

      console.log('[FirebaseAdminWrapper] Token verified successfully for uid:', decodedToken.uid);
      return decodedToken;
    } catch (error: any) {
      console.error('[FirebaseAdminWrapper] Token verification failed:', {
        error: error?.message || error,
        code: error?.code,
        tokenLength: token?.length
      });
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    const auth = await this.getAuth();
    return auth.getUserByEmail(email);
  }

  async createUser(properties: any) {
    const auth = await this.getAuth();
    return auth.createUser(properties);
  }

  async setCustomUserClaims(uid: string, claims: any) {
    const auth = await this.getAuth();
    return auth.setCustomUserClaims(uid, claims);
  }

  async generatePasswordResetLink(email: string) {
    const auth = await this.getAuth();
    return auth.generatePasswordResetLink(email);
  }

  async deleteUser(uid: string) {
    const auth = await this.getAuth();
    return auth.deleteUser(uid);
  }

  async updateUser(uid: string, properties: any) {
    const auth = await this.getAuth();
    return auth.updateUser(uid, properties);
  }

  async getUser(uid: string) {
    const auth = await this.getAuth();
    return auth.getUser(uid);
  }
}

class FirebaseAdminStorage {
  private storagePromise: Promise<Storage> | null = null;
  private initializationError: Error | null = null;

  private async getStorage(): Promise<Storage> {
    if (this.initializationError) {
      console.error('[FirebaseAdminWrapper] Previous storage initialization failed:', this.initializationError);
      throw this.initializationError;
    }

    if (!this.storagePromise) {
      this.storagePromise = (async () => {
        try {
          console.log('[FirebaseAdminWrapper] Initializing Firebase Admin Storage...');
          const { adminStorageLazy } = await import('./firebaseAdminLazy');
          const storage = await adminStorageLazy();
          console.log('[FirebaseAdminWrapper] Firebase Admin Storage initialized successfully');
          return storage;
        } catch (error) {
          console.error('[FirebaseAdminWrapper] Failed to initialize Firebase Admin Storage:', error);
          this.initializationError = error as Error;
          throw error;
        }
      })();
    }
    return this.storagePromise;
  }

  async bucket(name?: string) {
    const storage = await this.getStorage();
    return storage.bucket(name);
  }
}

// Export singleton instances that can be used synchronously
export const auth = new FirebaseAdminAuth();
export const adminAuth = () => auth;
export const adminStorage = () => new FirebaseAdminStorage();

// For backward compatibility
export default function getAdminApp() {
  console.warn('getAdminApp called - using wrapper');
  return null;
}