import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateTaskStatusSchema } from '@/lib/validations/task';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/v1/tasks/[id]/status - Quick status update
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = updateTaskStatusSchema.parse(body);
    
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });
    
    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Contractors can only update status of their assigned tasks
    if (authUser.role === 'CONTRACTOR' && existingTask.assignedToId !== authUser.uid) {
      throw new ApiError(403, 'Access denied');
    }
    
    const updateData: any = {
      status: data.status
    };
    
    if (data.status === 'COMPLETED') {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : new Date();
      updateData.progressPercentage = 100;
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId: id,
        userId: authUser.uid,
        action: 'STATUS_CHANGED',
        details: {
          from: existingTask.status,
          to: data.status
        }
      }
    });
    
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE_STATUS',
        entity: 'TASK',
        entityId: task.id,
        meta: {
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

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';