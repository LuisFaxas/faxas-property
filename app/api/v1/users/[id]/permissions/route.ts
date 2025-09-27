import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { requireRole } from '@/lib/api/auth-check';
import { updatePermissionsSchema } from '@/lib/validations/user';
import { Module } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/users/[id]/permissions
 * Get user's module permissions across all projects
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id: userId } = await params;
    
    // Get URL parameters
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Get permissions with optional project filter
    const whereClause: any = { userId: userId };
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    const permissions = await prisma.userModuleAccess.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: [
        { projectId: 'asc' },
        { module: 'asc' }
      ]
    });
    
    // Group permissions by project
    const permissionsByProject = permissions.reduce((acc, perm) => {
      const projectId = perm.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: {
            id: perm.project?.id || projectId,
            name: perm.project?.name || 'Unknown Project',
            status: perm.project?.status || 'UNKNOWN'
          },
          permissions: {}
        };
      }
      
      acc[projectId].permissions[perm.module] = {
        canView: perm.canView,
        canEdit: perm.canEdit
      };
      
      return acc;
    }, {} as Record<string, any>);
    
    // If no permissions exist, return empty structure with all modules
    const allModules: Module[] = [
      'TASKS', 'SCHEDULE', 'BUDGET', 'PROCUREMENT', 'CONTACTS',
      'PROJECTS', 'PROPOSALS', 'RFIS', 'SUBMITTALS', 'CHANGE_ORDERS',
      'SAFETY', 'WEATHER', 'PHOTOS', 'PLANS', 'UPLOADS'
    ];
    
    // Ensure all modules are represented in the response
    Object.keys(permissionsByProject).forEach(projectId => {
      allModules.forEach(module => {
        if (!permissionsByProject[projectId].permissions[module]) {
          permissionsByProject[projectId].permissions[module] = {
            canView: false,
            canEdit: false
          };
        }
      });
    });
    
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      permissions: Object.values(permissionsByProject),
      modules: allModules
    });
    
  } catch (error) {
    console.error('GET /api/v1/users/[id]/permissions error:', error);
    return errorResponse(error);
  }
}

/**
 * PUT /api/v1/users/[id]/permissions
 * Update user's module permissions for a specific project
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id: userId } = await params;
    
    // Get URL parameters
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      throw new ApiError(400, 'projectId query parameter is required');
    }
    
    // Parse and validate request body
    const body = await request.json();
    const data = updatePermissionsSchema.parse(body);
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true }
    });
    
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    
    // Verify user is a member of the project
    const membership = await prisma.projectMember.findFirst({
      where: {
        userId: userId,
        projectId: projectId
      }
    });
    
    if (!membership) {
      throw new ApiError(400, 'User is not a member of this project');
    }
    
    // Update permissions in transaction
    const updatedPermissions = await prisma.$transaction(async (tx) => {
      // 1. Delete existing permissions for this project
      await tx.userModuleAccess.deleteMany({
        where: {
          userId: userId,
          projectId: projectId
        }
      });
      
      // 2. Create new permissions
      const permissionsToCreate = data.permissions.map(perm => ({
        userId: userId,
        projectId: projectId,
        module: perm.module,
        canView: perm.canView,
        canEdit: perm.canEdit
      }));
      
      if (permissionsToCreate.length > 0) {
        await tx.userModuleAccess.createMany({
          data: permissionsToCreate
        });
      }
      
      // 3. Return updated permissions
      return await tx.userModuleAccess.findMany({
        where: {
          userId: userId,
          projectId: projectId
        },
        orderBy: { module: 'asc' }
      });
    });
    
    // Log the permission change for audit trail
    console.log(`Permissions updated for user ${user.email} in project ${project.name} by ${authUser.email}`);
    
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      project: {
        id: project.id,
        name: project.name
      },
      permissions: updatedPermissions.reduce((acc, perm) => {
        acc[perm.module] = {
          canView: perm.canView,
          canEdit: perm.canEdit
        };
        return acc;
      }, {} as Record<string, any>),
      message: 'Permissions updated successfully'
    });
    
  } catch (error) {
    console.error('PUT /api/v1/users/[id]/permissions error:', error);
    return errorResponse(error);
  }
}

/**
 * POST /api/v1/users/[id]/permissions/bulk
 * Bulk update permissions across multiple projects
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const { id: userId } = await params;
    
    // Parse request body
    const body = await request.json();
    const { projectPermissions } = body;
    
    if (!Array.isArray(projectPermissions)) {
      throw new ApiError(400, 'projectPermissions must be an array');
    }
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Validate and update permissions for each project
    const results = await prisma.$transaction(async (tx) => {
      const updateResults = [];
      
      for (const projectPerm of projectPermissions) {
        const { projectId, permissions } = projectPerm;
        
        // Verify project exists and user is member
        const [project, membership] = await Promise.all([
          tx.project.findUnique({ where: { id: projectId } }),
          tx.projectMember.findFirst({
            where: { userId, projectId }
          })
        ]);
        
        if (!project || !membership) {
          continue; // Skip invalid projects
        }
        
        // Delete existing permissions
        await tx.userModuleAccess.deleteMany({
          where: { userId, projectId }
        });
        
        // Create new permissions
        if (permissions && permissions.length > 0) {
          await tx.userModuleAccess.createMany({
            data: permissions.map((perm: any) => ({
              userId,
              projectId,
              module: perm.module,
              canView: perm.canView,
              canEdit: perm.canEdit
            }))
          });
        }
        
        updateResults.push({
          projectId,
          projectName: project.name,
          permissionsUpdated: permissions?.length || 0
        });
      }
      
      return updateResults;
    });
    
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      results,
      message: `Bulk permissions updated for ${results.length} projects`
    });
    
  } catch (error) {
    console.error('POST /api/v1/users/[id]/permissions/bulk error:', error);
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';