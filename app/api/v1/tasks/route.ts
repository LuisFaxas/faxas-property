import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createTaskSchema, taskQuerySchema, bulkUpdateTasksSchema } from '@/lib/validations/task';
import { Prisma } from '@prisma/client';

// GET /api/v1/tasks - List tasks with advanced filters
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = taskQuerySchema.parse(searchParams);
    
    const where: Prisma.TaskWhereInput = {
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.status && { status: query.status }),
      ...(query.priority && { priority: query.priority }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
      ...(query.isOnCriticalPath !== undefined && { isOnCriticalPath: query.isOnCriticalPath }),
      ...(query.isMilestone !== undefined && { isMilestone: query.isMilestone }),
      ...(query.weatherDependent !== undefined && { weatherDependent: query.weatherDependent }),
      ...(query.requiresInspection !== undefined && { requiresInspection: query.requiresInspection }),
      ...(query.trade && { trade: query.trade }),
      ...(query.location && { location: query.location }),
      ...(query.tags && { tags: { hasSome: query.tags } }),
      ...(query.parentTaskId && { parentTaskId: query.parentTaskId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ]
      }),
      ...(query.dueDateFrom && query.dueDateTo && {
        dueDate: {
          gte: new Date(query.dueDateFrom),
          lte: new Date(query.dueDateTo)
        }
      }),
      ...(query.startDateFrom && query.startDateTo && {
        startDate: {
          gte: new Date(query.startDateFrom),
          lte: new Date(query.startDateTo)
        }
      })
    };
    
    // Contractors can only see their assigned tasks
    if (authUser.role === 'CONTRACTOR') {
      where.assignedToId = authUser.uid;
    }
    
    // Build orderBy clause
    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];
    if (query.sortBy) {
      orderBy.push({ [query.sortBy]: query.sortOrder || 'asc' });
    } else {
      orderBy.push({ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' });
    }
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true
            }
          },
          assignedContact: {
            select: {
              id: true,
              name: true,
              company: true,
              emails: true,
              phones: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          subtasks: query.includeSubtasks ? {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              progressPercentage: true
            }
          } : false,
          dependencies: {
            include: {
              predecessorTask: {
                select: {
                  id: true,
                  title: true,
                  status: true
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
                  status: true
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
              checklistItems: true,
              subtasks: true
            }
          }
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy
      }),
      prisma.task.count({ where })
    ]);
    
    // Calculate completion stats for tasks with subtasks
    const tasksWithStats = tasks.map(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        const completedSubtasks = task.subtasks.filter(st => st.status === 'COMPLETED').length;
        const subtaskProgress = Math.round((completedSubtasks / task.subtasks.length) * 100);
        return {
          ...task,
          subtaskProgress,
          completedSubtasks,
          totalSubtasks: task.subtasks.length
        };
      }
      return task;
    });
    
    return successResponse(
      tasksWithStats,
      undefined,
      {
        ...paginationMetadata(query.page, query.limit, total),
        view: query.view || 'list'
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/tasks - Create new task with all features
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createTaskSchema.parse(body);
    
    const task = await prisma.task.create({
      data: {
        // Basic fields
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        
        // Assignment
        assignedToId: data.assignedToId && data.assignedToId !== '' ? data.assignedToId : undefined,
        assignedContactId: data.assignedContactId && data.assignedContactId !== '' ? data.assignedContactId : undefined,
        projectId: data.projectId,
        relatedContactIds: data.relatedContactIds || [],
        
        // Progress tracking
        progressPercentage: data.progressPercentage || 0,
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        
        // Construction-specific
        isOnCriticalPath: data.isOnCriticalPath || false,
        isMilestone: data.isMilestone || false,
        location: data.location,
        trade: data.trade,
        weatherDependent: data.weatherDependent || false,
        requiresInspection: data.requiresInspection || false,
        inspectionStatus: data.inspectionStatus,
        
        // Location data
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        
        // Metadata
        tags: data.tags || [],
        customFields: data.customFields,
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern,
        
        // Mobile fields
        offlineCreated: data.offlineCreated || false,
        localId: data.localId,
        thumbnailUrl: data.thumbnailUrl,
        voiceNoteUrl: data.voiceNoteUrl,
        quickTemplate: data.quickTemplate,
        mobileMetadata: data.mobileMetadata,
        
        // Hierarchy
        parentTaskId: data.parentTaskId
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true
          }
        },
        assignedContact: {
          select: {
            id: true,
            name: true,
            company: true,
            emails: true,
            phones: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'CREATE',
        entity: 'TASK',
        entityId: task.id,
        meta: {
          title: task.title,
          assignedTo: task.assignedToId,
          priority: task.priority,
          isMilestone: task.isMilestone,
          isOnCriticalPath: task.isOnCriticalPath
        }
      }
    });
    
    // Create activity record
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: authUser.uid,
        action: 'CREATED',
        details: {
          title: task.title,
          priority: task.priority,
          assignedTo: task.assignedToId
        }
      }
    });
    
    return successResponse(task, 'Task created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/v1/tasks - Bulk update tasks
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = bulkUpdateTasksSchema.parse(body);
    
    const updateData: any = {};
    if (data.updates.status) updateData.status = data.updates.status;
    if (data.updates.priority) updateData.priority = data.updates.priority;
    if (data.updates.assignedToId !== undefined) updateData.assignedToId = data.updates.assignedToId;
    if (data.updates.dueDate) updateData.dueDate = new Date(data.updates.dueDate);
    if (data.updates.tags) updateData.tags = data.updates.tags;
    if (data.updates.trade) updateData.trade = data.updates.trade;
    if (data.updates.location) updateData.location = data.updates.location;
    
    // Update all tasks
    const result = await prisma.task.updateMany({
      where: {
        id: { in: data.taskIds }
      },
      data: updateData
    });
    
    // Log bulk activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'BULK_UPDATE',
        entity: 'TASK',
        entityId: data.taskIds.join(','),
        meta: {
          count: result.count,
          updates: data.updates
        }
      }
    });
    
    // Create activity records for each task
    const activities = data.taskIds.map(taskId => ({
      taskId,
      userId: authUser.uid,
      action: 'BULK_UPDATED',
      details: data.updates
    }));
    
    await prisma.taskActivity.createMany({
      data: activities
    });
    
    return successResponse(
      { updated: result.count },
      `Successfully updated ${result.count} tasks`
    );
  } catch (error) {
    return errorResponse(error);
  }
}