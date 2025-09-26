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

  private async getAuth(): Promise<Auth> {
    if (!this.authPromise) {
      this.authPromise = (async () => {
        const { adminAuthLazy } = await import('./firebaseAdminLazy');
        return adminAuthLazy();
      })();
    }
    return this.authPromise;
  }

  async verifyIdToken(token: string) {
    if (typeof window === 'undefined' && !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 && !process.env.FIREBASE_PROJECT_ID) {
      // During build, return a mock user
      console.warn('Firebase Admin not initialized during build');
      return null;
    }
    const auth = await this.getAuth();
    return auth.verifyIdToken(token);
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

  private async getStorage(): Promise<Storage> {
    if (!this.storagePromise) {
      this.storagePromise = (async () => {
        const { adminStorageLazy } = await import('./firebaseAdminLazy');
        return adminStorageLazy();
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