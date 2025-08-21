import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateTaskStatusSchema } from '@/lib/validations/task';

// PATCH /api/v1/tasks/[id]/status - Quick status update
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const data = updateTaskStatusSchema.parse(body);
    
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    });
    
    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Contractors can only update status of their assigned tasks
    if (authUser.role === 'CONTRACTOR' && existingTask.assignedToId !== authUser.uid) {
      throw new ApiError(403, 'Access denied');
    }
    
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: data.status,
        completedAt: data.status === 'DONE' ? new Date() : null
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE_STATUS',
        entityType: 'TASK',
        entityId: task.id,
        metadata: {
          from: existingTask.status,
          to: data.status
        }
      }
    });
    
    return successResponse(task, `Task status updated to ${data.status}`);
  } catch (error) {
    return errorResponse(error);
  }
}