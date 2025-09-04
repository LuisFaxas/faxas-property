import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { Module, Role } from '@prisma/client';

/**
 * Initialize user account with proper setup
 * Creates user, project membership, and module access
 */
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }
    
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: decodedToken.uid }
    });
    
    if (existingUser) {
      return successResponse({
        user: existingUser,
        message: 'User already initialized'
      });
    }
    
    // Get role from Firebase custom claims or default to VIEWER
    const customClaims = await auth.getUser(decodedToken.uid).then(u => u.customClaims);
    const role = (customClaims?.role as Role) || 'VIEWER';
    
    // Create user and initial setup in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const user = await tx.user.create({
        data: {
          id: decodedToken.uid,
          email: decodedToken.email!,
          role: role
        }
      });
      
      // 2. Get or create default project
      let project = await tx.project.findFirst({
        where: { id: 'miami-duplex' }
      });
      
      if (!project) {
        project = await tx.project.create({
          data: {
            id: 'miami-duplex',
            name: 'Miami Duplex Remodel',
            status: 'ACTIVE',
            projectType: 'RENOVATION',
            description: 'Complete renovation of Miami duplex property',
            clientName: 'Property Owner',
            clientEmail: decodedToken.email!,
            timezone: 'America/New_York'
          }
        });
      }
      
      // 3. Create project membership
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: role
        }
      });
      
      // 4. Create module access based on role
      const modules: Module[] = ['TASKS', 'SCHEDULE', 'BUDGET', 'CONTACTS', 'PROCUREMENT'];
      const isAdmin = role === 'ADMIN' || role === 'STAFF';
      const isContractor = role === 'CONTRACTOR';
      
      for (const module of modules) {
        await tx.userModuleAccess.create({
          data: {
            userId: user.id,
            projectId: project.id,
            module: module,
            canView: true,
            canEdit: isAdmin || (isContractor && module !== 'BUDGET'),
            canUpload: isAdmin || isContractor,
            canRequest: isContractor
          }
        });
      }
      
      // 5. Log the initialization
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_INITIALIZED',
          entity: 'user',
          entityId: user.id,
          meta: {
            email: user.email,
            role: user.role,
            projectId: project.id
          }
        }
      });
      
      return { user, project };
    });
    
    return successResponse({
      user: result.user,
      project: result.project,
      message: 'User successfully initialized'
    });
    
  } catch (error) {
    console.error('User initialization error:', error);
    return errorResponse(error);
  }
}

// Check initialization status
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }
    
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
      include: {
        projectMemberships: {
          include: {
            project: true
          }
        }
      }
    });
    
    return successResponse({
      initialized: !!user,
      user: user,
      projects: user?.projectMemberships.map(m => m.project) || []
    });
    
  } catch (error) {
    return errorResponse(error);
  }
}