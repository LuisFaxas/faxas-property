import { headers } from 'next/headers';
import { auth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { ApiError } from './response';
import { NextRequest } from 'next/server';
import type { User, Role, Module, ProjectMember } from '@prisma/client';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  role: Role;
  user: User;
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
  action: 'view' | 'edit' | 'upload' | 'request'
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
    request: access.canRequest
  };
  
  if (!actionMap[action]) {
    throw new ApiError(403, `Cannot ${action} ${module} in this project`);
  }
}