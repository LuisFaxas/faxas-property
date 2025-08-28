import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateTaskSchema, updateTaskStatusSchema } from '@/lib/validations/task';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Module } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to resolve projectId from task
async function resolveTaskProject(req: NextRequest, ctx: any): Promise<string | null> {
  const { params } = ctx;
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    select: { projectId: true }
  });
  return task?.projectId || null;
}

// GET /api/v1/tasks/[id] - Get single task with all details
export const GET = withAuth(
  async (request: NextRequest, ctx: RouteParams, security: SecurityContext) => {
    const { auth } = security;
    const { params } = ctx;
    const { id } = await params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            color: true
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        subtasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                email: true
              }
            },
            _count: {
              select: {
                subtasks: true,
                attachments: true,
                comments: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        dependencies: {
          include: {
            predecessorTask: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
                progressPercentage: true
              }
            }
          }
        },
        dependents: {
          include: {
            dependentTask: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true
              }
            }
          }
        },
        attachments: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        comments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 50 // Limit initial comments
        },
        watchers: {
          select: {
            userId: true,
            createdAt: true
          }
        },
        photos: {
          orderBy: {
            takenAt: 'desc'
          }
        },
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 20 // Limit initial activities
        },
        checklistItems: {
          orderBy: {
            order: 'asc'
          }
        },
        rfiLinks: {
          include: {
            rfi: {
              select: {
                id: true,
                rfiNumber: true,
                subject: true,
                status: true
              }
            }
          }
        },
        submittalLinks: {
          include: {
            submittal: {
              select: {
                id: true,
                submittalNumber: true,
                title: true,
                status: true
              }
            }
          }
        },
        changeOrderLinks: {
          include: {
            changeOrder: {
              select: {
                id: true,
                coNumber: true,
                title: true,
                status: true,
                costImpact: true
              }
            }
          }
        },
        _count: {
          select: {
            attachments: true,
            comments: true,
            watchers: true,
            photos: true,
            activities: true,
            checklistItems: true,
            subtasks: true
          }
        }
      }
    });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Verify project access
    if (security.projectId && task.projectId !== security.projectId) {
      throw new ApiError(403, 'Task belongs to different project');
    }
    
    // Check access for contractors
    if (auth.role === 'CONTRACTOR') {
      const hasAccess = task.assignedToId === auth.uid || 
                       task.assignedContact?.userId === auth.uid;
      if (!hasAccess) {
        throw new ApiError(403, 'Access denied');
      }
    }
    
    // Calculate completion percentage if has checklist items
    let checklistProgress = 0;
    if (task.checklistItems.length > 0) {
      const completedItems = task.checklistItems.filter(item => item.isCompleted).length;
      checklistProgress = Math.round((completedItems / task.checklistItems.length) * 100);
    }
    
    // Calculate subtask progress
    let subtaskProgress = 0;
    if (task.subtasks.length > 0) {
      const completedSubtasks = task.subtasks.filter(st => st.status === 'COMPLETED').length;
      subtaskProgress = Math.round((completedSubtasks / task.subtasks.length) * 100);
    }
    
    // Determine if task is blocked by dependencies
    const isBlockedByDependencies = task.dependencies.some(
      dep => dep.predecessorTask.status !== 'COMPLETED'
    );
    
    return successResponse({
      ...task,
      checklistProgress,
      subtaskProgress,
      isBlockedByDependencies,
      isWatching: task.watchers.some(w => w.userId === auth.uid)
    });
  },
  {
    module: Module.TASKS,
    action: 'view',
    resolveProjectId: resolveTaskProject
  }
);

// PUT /api/v1/tasks/[id] - Update task
export const PUT = withAuth(
  async (request: NextRequest, ctx: RouteParams, security: SecurityContext) => {
    const { auth, projectId } = security;
    const { params } = ctx;
    const { id } = await params;
    const body = await request.json();
    const data = updateTaskSchema.parse({ ...body, id });
    
    // Check if task exists and belongs to project
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        startDate: true,
        assignedToId: true,
        progressPercentage: true,
        estimatedHours: true,
        actualHours: true,
        isOnCriticalPath: true,
        isMilestone: true,
        location: true,
        trade: true,
        weatherDependent: true,
        requiresInspection: true,
        inspectionStatus: true,
        tags: true,
        customFields: true,
        latitude: true,
        longitude: true,
        locationName: true,
        relatedContactIds: true
      }
    });
    
    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Verify task belongs to project
    if (projectId && existingTask.projectId !== projectId) {
      throw new ApiError(403, 'Task belongs to different project');
    }
    
    // Build update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.progressPercentage = 100;
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId || null;
    if (data.progressPercentage !== undefined) updateData.progressPercentage = data.progressPercentage;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
    if (data.actualHours !== undefined) updateData.actualHours = data.actualHours;
    if (data.isOnCriticalPath !== undefined) updateData.isOnCriticalPath = data.isOnCriticalPath;
    if (data.isMilestone !== undefined) updateData.isMilestone = data.isMilestone;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.trade !== undefined) updateData.trade = data.trade;
    if (data.weatherDependent !== undefined) updateData.weatherDependent = data.weatherDependent;
    if (data.requiresInspection !== undefined) updateData.requiresInspection = data.requiresInspection;
    if (data.inspectionStatus !== undefined) updateData.inspectionStatus = data.inspectionStatus;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.customFields !== undefined) updateData.customFields = data.customFields;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.locationName !== undefined) updateData.locationName = data.locationName;
    if (data.relatedContactIds !== undefined) updateData.relatedContactIds = data.relatedContactIds;
    
    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Log activity
    const changes: any = {};
    Object.keys(updateData).forEach(key => {
      if (existingTask[key as keyof typeof existingTask] !== updateData[key]) {
        changes[key] = {
          from: existingTask[key as keyof typeof existingTask],
          to: updateData[key]
        };
      }
    });
    
    await prisma.taskActivity.create({
      data: {
        taskId: id,
        userId: auth.uid,
        action: 'UPDATED',
        details: changes
      }
    });
    
    await prisma.auditLog.create({
      data: {
        userId: auth.uid,
        action: 'UPDATE',
        entity: 'TASK',
        entityId: id,
        meta: changes
      }
    });
    
    return successResponse(updatedTask, 'Task updated successfully');
  },
  {
    module: Module.TASKS,
    action: 'edit',
    resolveProjectId: resolveTaskProject
  }
);

// DELETE /api/v1/tasks/[id] - Delete task
export const DELETE = withAuth(
  async (request: NextRequest, ctx: RouteParams, security: SecurityContext) => {
    const { auth, projectId } = security;
    const { params } = ctx;
    const { id } = await params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        projectId: true,
        _count: {
          select: {
            subtasks: true
          }
        }
      }
    });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Verify task belongs to project
    if (projectId && task.projectId !== projectId) {
      throw new ApiError(403, 'Task belongs to different project');
    }
    
    if (task._count.subtasks > 0) {
      throw new ApiError(400, 'Cannot delete task with subtasks. Delete subtasks first.');
    }
    
    // Delete task (cascades will handle related records)
    await prisma.task.delete({
      where: { id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: auth.uid,
        action: 'DELETE',
        entity: 'TASK',
        entityId: id,
        meta: {
          title: task.title
        }
      }
    });
    
    return successResponse(null, 'Task deleted successfully');
  },
  {
    roles: ['ADMIN'],
    module: Module.TASKS,
    action: 'edit',
    resolveProjectId: resolveTaskProject
  }
);

// PATCH /api/v1/tasks/[id] - Quick status update
export const PATCH = withAuth(
  async (request: NextRequest, ctx: RouteParams, security: SecurityContext) => {
    const { auth, projectId } = security;
    const { params } = ctx;
    const { id } = await params;
    const body = await request.json();
    const data = updateTaskStatusSchema.parse(body);
    
    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        assignedToId: true,
        assignedContactId: true,
        status: true
      },
      include: {
        assignedContact: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Verify task belongs to project
    if (projectId && task.projectId !== projectId) {
      throw new ApiError(403, 'Task belongs to different project');
    }
    
    // Check access
    if (auth.role === 'CONTRACTOR') {
      const hasAccess = task.assignedToId === auth.uid || 
                       task.assignedContact?.userId === auth.uid;
      if (!hasAccess) {
        throw new ApiError(403, 'Access denied');
      }
    }
    
    // Update status
    const updateData: any = {
      status: data.status
    };
    
    if (data.status === 'COMPLETED') {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : new Date();
      updateData.progressPercentage = 100;
    }
    
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData
    });
    
    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId: id,
        userId: auth.uid,
        action: 'STATUS_CHANGED',
        details: {
          from: task.status,
          to: data.status
        }
      }
    });
    
    return successResponse(updatedTask, 'Task status updated');
  },
  {
    module: Module.TASKS,
    action: 'edit',
    resolveProjectId: resolveTaskProject
  }
);