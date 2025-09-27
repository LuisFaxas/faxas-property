/**
 * Session Management
 * Handles session timeout, refresh tokens, and session validation
 */

import { auth } from '@/lib/firebaseAdmin';
import { ApiError } from './response';
import { prisma } from '@/lib/prisma';

// Session configuration
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_TOKEN_ROTATION_DAYS = 7; // Rotate refresh tokens every 7 days

// In-memory session store (should use Redis in production)
const sessionStore = new Map<string, SessionData>();

interface SessionData {
  userId: string;
  email: string;
  lastActivity: number;
  createdAt: number;
  projectId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const sessionId = generateSessionId();
  
  const sessionData: SessionData = {
    userId,
    email,
    lastActivity: Date.now(),
    createdAt: Date.now(),
    ipAddress,
    userAgent
  };
  
  sessionStore.set(sessionId, sessionData);
  
  // In production, store in Redis with TTL
  // await redis.setex(`session:${sessionId}`, SESSION_TIMEOUT_MS / 1000, JSON.stringify(sessionData));
  
  // Log session creation
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'SESSION_CREATED',
      entity: 'session',
      entityId: sessionId,
      meta: {
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString()
      }
    }
  }).catch(console.error); // Don't fail on audit log errors
  
  return sessionId;
}

/**
 * Validate and update session
 */
export async function validateSession(sessionId: string): Promise<SessionData> {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    throw new ApiError(401, 'Invalid or expired session');
  }
  
  const now = Date.now();
  const timeSinceActivity = now - session.lastActivity;
  
  // Check if session has timed out
  if (timeSinceActivity > SESSION_TIMEOUT_MS) {
    sessionStore.delete(sessionId);
    throw new ApiError(401, 'Session timed out due to inactivity');
  }
  
  // Update last activity
  session.lastActivity = now;
  sessionStore.set(sessionId, session);
  
  return session;
}

/**
 * Destroy session
 */
export async function destroySession(sessionId: string): Promise<void> {
  const session = sessionStore.get(sessionId);
  
  if (session) {
    // Log session destruction
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'SESSION_DESTROYED',
        entity: 'session',
        entityId: sessionId,
        meta: {
          duration: Date.now() - session.createdAt,
          destroyedAt: new Date().toISOString()
        }
      }
    }).catch(console.error);
    
    sessionStore.delete(sessionId);
  }
  
  // In production, also delete from Redis
  // await redis.del(`session:${sessionId}`);
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      sessionStore.delete(sessionId);
    }
  }
}

/**
 * Get active session count for a user
 */
export function getUserSessionCount(userId: string): number {
  let count = 0;
  
  for (const session of sessionStore.values()) {
    if (session.userId === userId) {
      count++;
    }
  }
  
  return count;
}

/**
 * Validate Firebase token and check for refresh
 */
export async function validateFirebaseToken(token: string): Promise<{
  decodedToken: any;
  shouldRefresh: boolean;
}> {
  try {
    const decodedToken = await auth.verifyIdToken(token, true);

    // Critical: Check if decodedToken is null (Firebase Admin not initialized)
    if (!decodedToken) {
      console.error('[Session] Token verification returned null - Firebase Admin may not be initialized');
      throw new ApiError(401, 'Token verification failed - Firebase Admin not initialized properly');
    }

    // Check if token is close to expiry (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decodedToken.exp - now;
    const shouldRefresh = timeUntilExpiry < 300; // 5 minutes

    return {
      decodedToken,
      shouldRefresh
    };
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      throw new ApiError(401, 'Token expired. Please refresh your authentication.');
    }
    
    if (error.code === 'auth/id-token-revoked') {
      throw new ApiError(401, 'Token has been revoked. Please sign in again.');
    }
    
    throw new ApiError(401, 'Invalid authentication token');
  }
}

/**
 * Generate a secure session ID
 */
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}

// Export session configuration
export const SESSION_CONFIG = {
  TIMEOUT_MS: SESSION_TIMEOUT_MS,
  REFRESH_ROTATION_DAYS: REFRESH_TOKEN_ROTATION_DAYS
};