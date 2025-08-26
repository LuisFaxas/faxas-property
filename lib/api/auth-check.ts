import { headers } from 'next/headers';
import { auth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { ApiError } from './response';
import type { User, Role } from '@prisma/client';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  role: Role;
  user: User;
};

export async function requireAuth(): Promise<AuthenticatedUser> {
  const headersList = await headers();
  const authorization = headersList.get('authorization');
  
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid authorization header');
  }
  
  const token = authorization.split('Bearer ')[1];
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.role,
      user
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    
    // More specific error messages for better debugging
    if (error?.code === 'auth/id-token-expired') {
      console.error('Token expired for user');
      throw new ApiError(401, 'Token expired - please refresh your session');
    }
    
    if (error?.code === 'auth/argument-error') {
      console.error('Invalid token format:', error.message);
      throw new ApiError(401, 'Invalid token format');
    }
    
    if (error?.code === 'auth/id-token-revoked') {
      console.error('Token has been revoked');
      throw new ApiError(401, 'Token has been revoked - please sign in again');
    }
    
    // Log the actual error for debugging
    console.error('Auth verification error:', error?.code || error?.message || error);
    throw new ApiError(401, 'Authentication failed - please sign in again');
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthenticatedUser> {
  const authUser = await requireAuth();
  
  if (!allowedRoles.includes(authUser.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
  
  return authUser;
}

export async function optionalAuth(): Promise<AuthenticatedUser | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}