import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebaseAdmin';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { requireRole } from '@/lib/api/auth-check';
import { createUserSchema, getUsersQuerySchema } from '@/lib/validations/user';
import { Role, Module } from '@prisma/client';

/**
 * GET /api/v1/users
 * List users with filtering, pagination, and permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN or STAFF role
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const query = getUsersQuerySchema.parse(queryParams);
    
    // Build where clause for filtering
    const where: any = {};
    
    if (query.role) {
      where.role = query.role;
    }
    
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { contact: { name: { contains: query.search, mode: 'insensitive' } } }
      ];
    }
    
    // Get users with related data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              lastActivityAt: true,
              lastLoginAt: true,
              portalStatus: true
            }
          },
          projectMemberships: {
            where: query.projectId ? { projectId: query.projectId } : undefined,
            include: {
              project: {
                select: { id: true, name: true }
              }
            }
          },
          // Get module access for the specified project
          ...(query.projectId && {
            access: {
              where: { projectId: query.projectId }
            }
          })
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.offset,
        take: query.limit
      }),
      prisma.user.count({ where })
    ]);
    
    // Transform users data to include computed fields
    const transformedUsers = users.map(user => {
      const contact = user.contact;
      const membership = user.projectMemberships[0];
      
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: contact?.name || user.email.split('@')[0],
        company: contact?.company,
        status: contact?.portalStatus || 'ACTIVE',
        lastActive: contact?.lastActivityAt || contact?.lastLoginAt,
        createdAt: user.createdAt,
        projectMembership: membership ? {
          projectId: membership.project.id,
          projectName: membership.project.name,
          joinedAt: membership.createdAt
        } : null,
        permissions: (user as any).access || []
      };
    });
    
    return successResponse({
      users: transformedUsers,
      pagination: {
        total,
        page: Math.floor(query.offset / query.limit) + 1,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit)
      }
    });
    
  } catch (error) {
    console.error('GET /api/v1/users error:', error);
    return errorResponse(error);
  }
}

/**
 * POST /api/v1/users
 * Create a new user with role and permissions
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN role for user creation
    const authUser = await requireRole(['ADMIN']);
    
    // Parse and validate request body
    const body = await request.json();
    const data = createUserSchema.parse(body);
    
    // Check if user already exists in Firebase
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(data.email);
      throw new ApiError(400, 'User with this email already exists');
    } catch (fbError: any) {
      if (fbError.code !== 'auth/user-not-found') {
        throw fbError;
      }
      // User doesn't exist in Firebase, which is what we want
    }
    
    // Check if user exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new ApiError(400, 'User already exists in the system');
    }
    
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Create Firebase user if sending invite
    if (data.sendInvite) {
      firebaseUser = await auth.createUser({
        email: data.email,
        emailVerified: false
      });
      
      // Set custom claims for role-based access
      await auth.setCustomUserClaims(firebaseUser.uid, {
        role: data.role
      });
      
      // Generate email verification link (Firebase handles sending)
      await auth.generateEmailVerificationLink(data.email);
    }
    
    // Create user and related records in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user record
      const user = await tx.user.create({
        data: {
          id: firebaseUser?.uid || `temp-${Date.now()}`,
          email: data.email,
          role: data.role
        }
      });
      
      // 2. Create project membership
      await tx.projectMember.create({
        data: {
          userId: user.id,
          projectId: data.projectId,
          role: data.role
        }
      });
      
      // 3. Set default module permissions based on role
      let defaultPermissions = data.permissions;
      
      if (!defaultPermissions) {
        // Set default permissions based on role
        const allModules: Module[] = [
          'TASKS', 'SCHEDULE', 'BUDGET', 'PROCUREMENT', 'CONTACTS',
          'PROJECTS', 'PROPOSALS', 'RFIS', 'SUBMITTALS', 'CHANGE_ORDERS',
          'SAFETY', 'WEATHER', 'PHOTOS', 'PLANS', 'UPLOADS'
        ];
        
        defaultPermissions = allModules.map(module => {
          // Define role-based permissions
          switch (data.role) {
            case 'ADMIN':
              return { module, canView: true, canEdit: true };
            case 'STAFF':
              return { 
                module, 
                canView: true, 
                canEdit: !['BUDGET', 'PROJECTS'].includes(module) 
              };
            case 'CONTRACTOR':
              return { 
                module, 
                canView: ['TASKS', 'SCHEDULE', 'PLANS', 'PHOTOS'].includes(module),
                canEdit: ['TASKS'].includes(module)
              };
            case 'VIEWER':
              return { 
                module, 
                canView: ['TASKS', 'SCHEDULE', 'PLANS'].includes(module),
                canEdit: false 
              };
            default:
              return { module, canView: false, canEdit: false };
          }
        });
      }
      
      // 4. Create module permissions
      if (defaultPermissions.length > 0) {
        await tx.userModuleAccess.createMany({
          data: defaultPermissions.map(perm => ({
            userId: user.id,
            projectId: data.projectId,
            module: perm.module,
            canView: perm.canView,
            canEdit: perm.canEdit
          }))
        });
      }
      
      return user;
    });
    
    // Return user with permissions
    const userWithPermissions = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        projectMemberships: {
          where: { projectId: data.projectId },
          include: {
            project: {
              select: { id: true, name: true }
            }
          }
        },
        access: {
          where: { projectId: data.projectId }
        }
      }
    });
    
    return successResponse({
      user: userWithPermissions,
      message: data.sendInvite ? 
        'User created and invitation sent' : 
        'User created successfully'
    });
    
  } catch (error) {
    console.error('POST /api/v1/users error:', error);
    return errorResponse(error);
  }
}