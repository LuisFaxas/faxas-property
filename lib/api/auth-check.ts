import { headers } from 'next/headers';
import { auth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { ApiError } from './response';
import { NextRequest } from 'next/server';
import { validateFirebaseToken, createSession, validateSession } from './session';
import type { User, Role, Module, ProjectMember } from '@prisma/client';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  role: Role;
  user: User;
  sessionId?: string;
  shouldRefresh?: boolean;
};

export async function requireAuth(request?: NextRequest): Promise<AuthenticatedUser> {
  let authorization: string | null = null;
  
  // Try to get authorization from request first (for testing)
  if (request) {
    authorization = request.headers.get('authorization');
  } else {
    // Fall back to Next.js headers() for production
    try {
      const headersList = await headers();
      authorization = headersList.get('authorization');
    } catch (error) {
      // In test environment, headers() might not be available
      throw new ApiError(401, 'No authorization header');
    }
  }
  
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid authorization header');
  }
  
  const token = authorization.split('Bearer ')[1];
  
  try {
    // Validate Firebase token with refresh check
    const { decodedToken, shouldRefresh } = await validateFirebaseToken(token);

    // Critical: Ensure we have a valid decodedToken
    if (!decodedToken || !decodedToken.uid) {
      console.error('[Auth Check] Token validation failed - decodedToken is null or invalid');
      throw new ApiError(401, 'Authentication failed - Firebase Admin may not be properly initialized');
    }

    // Check for session if provided
    const sessionId = request?.headers.get('x-session-id') || undefined;
    if (sessionId) {
      try {
        await validateSession(sessionId);
      } catch (error) {
        // Session invalid but token is valid, create new session
        console.log('Session validation failed, will create new session');
      }
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid }
    });
    
    if (!user) {
      console.log(`User not found in database for UID: ${decodedToken.uid}, email: ${decodedToken.email}`);
      // Instead of throwing, try to initialize the user
      try {
        // Get role from Firebase custom claims
        const firebaseUser = await auth.getUser(decodedToken.uid);
        const role = (firebaseUser.customClaims?.role as Role) || 'VIEWER';
        
        // Create user in database
        const newUser = await prisma.user.create({
          data: {
            id: decodedToken.uid,
            email: decodedToken.email!,
            role: role
          }
        });
        
        // Return the newly created user
        return {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          role: newUser.role,
          user: newUser,
          sessionId,
          shouldRefresh
        };
      } catch (initError) {
        console.error('Failed to auto-initialize user:', initError);
        throw new ApiError(404, 'User not found. Please use /api/v1/auth/initialize to set up your account.');
      }
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.role,
      user,
      sessionId,
      shouldRefresh
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

// Check if user is a member of a project
export async function assertProjectMember(
  userId: string, 
  projectId: string
): Promise<ProjectMember> {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });
  
  if (!member) {
    throw new ApiError(403, 'Not a member of this project');
  }
  
  return member;
}

// Get all projects a user has access to
export async function getUserProjects(userId: string): Promise<string[]> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true }
  });
  
  return memberships.map(m => m.projectId);
}

// Check if user has specific module access for a project
export async function requireModuleAccess(
  userId: string,
  projectId: string,
  module: Module,
  action: 'view' | 'edit' | 'upload' | 'request' | 'approve'
): Promise<void> {
  const access = await prisma.userModuleAccess.findFirst({
    where: {
      userId,
      projectId,
      module
    }
  });
  
  if (!access) {
    throw new ApiError(403, `No ${module} access for this project`);
  }
  
  const actionMap = {
    view: access.canView,
    edit: access.canEdit,
    upload: access.canUpload,
    request: access.canRequest,
    approve: access.canEdit // Map approve to edit permission
  };
  
  if (!actionMap[action]) {
    throw new ApiError(403, `Cannot ${action} ${module} in this project`);
  }
}