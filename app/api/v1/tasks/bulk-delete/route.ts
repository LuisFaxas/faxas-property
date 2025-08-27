import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { bulkDeleteTasksSchema } from '@/lib/validations/task';

// DELETE /api/v1/tasks/bulk-delete - Bulk delete tasks
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = bulkDeleteTasksSchema.parse(body);
    
    // Check if all tasks exist and belong to accessible projects
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: data.taskIds }
      },
      select: {
        id: true,
        title: true,
        projectId: true
      }
    });
    
    if (tasks.length !== data.taskIds.length) {
      const foundIds = tasks.map(t => t.id);
      const missingIds = data.taskIds.filter(id => !foundIds.includes(id));
      return errorResponse({
        message: `Tasks not found: ${missingIds.join(', ')}`,
        code: 'TASKS_NOT_FOUND'
      });
    }
    
    // Use transaction to delete all tasks and related data
    const result = await prisma.$transaction(async (tx) => {
      // Delete related data first (cascade delete should handle most of this)
      // Delete task activities
      await tx.taskActivity.deleteMany({
        where: { taskId: { in: data.taskIds } }
      });
      
      // Delete task comments
      await tx.taskComment.deleteMany({
        where: { taskId: { in: data.taskIds } }
      });
      
      // Delete task attachments
      await tx.taskAttachment.deleteMany({
        where: { taskId: { in: data.taskIds } }
      });
      
      // Delete checklist items
      await tx.taskChecklistItem.deleteMany({
        where: { taskId: { in: data.taskIds } }
      });
      
      // Delete task dependencies where task is either predecessor or dependent
      await tx.taskDependency.deleteMany({
        where: {
          OR: [
            { predecessorTaskId: { in: data.taskIds } },
            { dependentTaskId: { in: data.taskIds } }
          ]
        }
      });
      
      // Finally, delete the tasks
      const deletedTasks = await tx.task.deleteMany({
        where: {
          id: { in: data.taskIds }
        }
      });
      
      return deletedTasks;
    });
    
    // Log bulk delete activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'BULK_DELETE',
        entity: 'TASK',
        entityId: data.taskIds.join(','),
        meta: {
          count: result.count,
          taskIds: data.taskIds,
          taskTitles: tasks.map(t => t.title)
        }
      }
    });
    
    return successResponse(
      { deleted: result.count },
      `Successfully deleted ${result.count} task${result.count !== 1 ? 's' : ''}`
    );
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return errorResponse(error);
  }
}