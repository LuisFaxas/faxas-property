import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateTaskSchema } from '@/lib/validations/task';

// GET /api/v1/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth();
    
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        relatedContacts: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true
          }
        }
      }
    });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Contractors can only view their assigned tasks
    if (authUser.role === 'CONTRACTOR' && task.assignedToId !== authUser.uid) {
      throw new ApiError(403, 'Access denied');
    }
    
    return successResponse(task);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/v1/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = updateTaskSchema.parse({ ...body, id: params.id });
    
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    });
    
    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }
    
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority,
        status: data.status,
        assignedToId: data.assignedToId,
        projectId: data.projectId,
        relatedContacts: data.relatedContactIds ? {
          set: [],
          connect: data.relatedContactIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        relatedContacts: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: task.id,
        metadata: {
          changes: {
            from: existingTask,
            to: task
          }
        }
      }
    });
    
    return successResponse(task, 'Task updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/v1/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    
    const task = await prisma.task.findUnique({
      where: { id: params.id }
    });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    await prisma.task.delete({
      where: { id: params.id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entityType: 'TASK',
        entityId: params.id,
        metadata: {
          deletedTask: task
        }
      }
    });
    
    return successResponse(null, 'Task deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}