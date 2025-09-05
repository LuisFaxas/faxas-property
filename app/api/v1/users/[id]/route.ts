import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebaseAdmin';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { requireRole, requireAuth } from '@/lib/api/auth-check';
import { updateUserSchema } from '@/lib/validations/user';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/v1/users/[id]
 * Get a specific user with full details
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const authUser = await requireAuth();
    const userId = params.id;
    
    // Users can only view their own profile unless they are ADMIN/STAFF
    if (authUser.id !== userId && !['ADMIN', 'STAFF'].includes(authUser.role)) {
      throw new ApiError(403, 'You can only view your own profile');
    }
    
    // Get user with full details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            company: true,
            specialty: true,
            category: true,
            status: true,
            emails: true,
            phones: true,
            notes: true,
            lastActivityAt: true,
            lastLoginAt: true,
            portalStatus: true,
            createdAt: true
          }
        },
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true
              }
            }
          }
        },
        tasks: {
          where: {
            status: { not: 'COMPLETED' }
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            project: {
              select: { id: true, name: true }
            }
          },
          orderBy: { dueDate: 'asc' },
          take: 10
        }
      }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Get module permissions across all projects
    const permissions = await prisma.userModuleAccess.findMany({
      where: { userId: userId },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
    
    // Group permissions by project
    const permissionsByProject = permissions.reduce((acc, perm) => {
      const projectId = perm.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectName: perm.project?.name || 'Unknown Project',
          permissions: []
        };
      }
      acc[projectId].permissions.push({
        module: perm.module,
        canView: perm.canView,
        canEdit: perm.canEdit
      });
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate activity stats
    const activityStats = {
      totalTasks: user.tasks.length,
      overdueTasks: user.tasks.filter(task => 
        task.dueDate && task.dueDate < new Date()
      ).length,
      projectsCount: user.projectMemberships.length,
      lastLogin: user.contact?.lastLoginAt,
      lastActivity: user.contact?.lastActivityAt
    };
    
    const response = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      profile: user.contact ? {
        name: user.contact.name,
        company: user.contact.company,
        specialty: user.contact.specialty,
        category: user.contact.category,
        status: user.contact.status,
        emails: user.contact.emails,
        phones: user.contact.phones,
        notes: user.contact.notes,
        portalStatus: user.contact.portalStatus
      } : null,
      projects: user.projectMemberships.map(membership => ({
        id: membership.project.id,
        name: membership.project.name,
        status: membership.project.status,
        role: membership.role,
        joinedAt: membership.createdAt
      })),
      permissions: Object.values(permissionsByProject),
      recentTasks: user.tasks,
      activityStats
    };
    
    return successResponse({ user: response });
    
  } catch (error) {
    console.error('GET /api/v1/users/[id] error:', error);
    return errorResponse(error);
  }
}

/**
 * PUT /api/v1/users/[id]
 * Update user details and role
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const authUser = await requireAuth();
    const userId = params.id;
    
    // Only ADMIN can update other users, users can update limited fields of their own profile
    const isUpdatingSelf = authUser.id === userId;
    const canUpdateOthers = ['ADMIN'].includes(authUser.role);
    
    if (!isUpdatingSelf && !canUpdateOthers) {
      throw new ApiError(403, 'You can only update your own profile');
    }
    
    // Parse and validate request body
    const body = await request.json();
    const data = updateUserSchema.parse(body);
    
    // Self-updates can't change role
    if (isUpdatingSelf && data.role) {
      throw new ApiError(403, 'You cannot change your own role');
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contact: true
      }
    });
    
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }
    
    // Update user in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update user record
      const updateData: any = {};
      if (data.email) updateData.email = data.email;
      if (data.role) updateData.role = data.role;
      
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          contact: true,
          projectMemberships: {
            include: {
              project: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });
      
      // 2. Update Firebase custom claims if role changed
      if (data.role) {
        try {
          await auth.setCustomUserClaims(userId, {
            role: data.role
          });
        } catch (fbError) {
          console.warn('Failed to update Firebase custom claims:', fbError);
          // Don't fail the entire operation for Firebase errors
        }
      }
      
      // 3. Update contact status if provided
      if (data.status && user.contact) {
        await tx.contact.update({
          where: { id: user.contact.id },
          data: { portalStatus: data.status }
        });
      }
      
      // 4. Update project memberships role if role changed
      if (data.role) {
        await tx.projectMember.updateMany({
          where: { userId: userId },
          data: { role: data.role }
        });
      }
      
      return user;
    });
    
    // Get updated permissions
    const permissions = await prisma.userModuleAccess.findMany({
      where: { userId: userId },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
    
    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      projects: updatedUser.projectMemberships,
      permissions: permissions.reduce((acc, perm) => {
        const projectId = perm.projectId;
        if (!acc[projectId]) {
          acc[projectId] = { projectId, projectName: perm.project?.name, permissions: [] };
        }
        acc[projectId].permissions.push({
          module: perm.module,
          canView: perm.canView,
          canEdit: perm.canEdit
        });
        return acc;
      }, {} as Record<string, any>)
    };
    
    return successResponse({
      user: response,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('PUT /api/v1/users/[id] error:', error);
    return errorResponse(error);
  }
}

/**
 * DELETE /api/v1/users/[id]
 * Delete a user (soft delete by default)
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const userId = params.id;
    
    // Prevent self-deletion
    if (authUser.id === userId) {
      throw new ApiError(400, 'You cannot delete your own account');
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contact: true,
        tasks: { where: { status: { not: 'COMPLETED' } } },
        projectMemberships: true
      }
    });
    
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }
    
    // Check for active tasks
    if (existingUser.tasks.length > 0) {
      throw new ApiError(400, 
        `Cannot delete user with ${existingUser.tasks.length} active tasks. ` +
        'Please reassign or complete these tasks first.'
      );
    }
    
    // Soft delete by updating contact status
    await prisma.$transaction(async (tx) => {
      // 1. Update contact status to indicate deletion
      if (existingUser.contact) {
        await tx.contact.update({
          where: { id: existingUser.contact.id },
          data: { 
            portalStatus: 'DELETED',
            userId: null  // Unlink from user
          }
        });
      }
      
      // 2. Remove project memberships
      await tx.projectMember.deleteMany({
        where: { userId: userId }
      });
      
      // 3. Remove module access
      await tx.userModuleAccess.deleteMany({
        where: { userId: userId }
      });
      
      // 4. Delete user record
      await tx.user.delete({
        where: { id: userId }
      });
    });
    
    // Disable Firebase user (don't delete to preserve audit trail)
    try {
      await auth.updateUser(userId, {
        disabled: true
      });
    } catch (fbError) {
      console.warn('Failed to disable Firebase user:', fbError);
      // Don't fail the operation for Firebase errors
    }
    
    return successResponse({
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('DELETE /api/v1/users/[id] error:', error);
    return errorResponse(error);
  }
}