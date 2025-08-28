import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, paginationMetadata } from '@/lib/api/response';
import { createTaskSchema, taskQuerySchema, bulkUpdateTasksSchema } from '@/lib/validations/task';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Prisma, Module } from '@prisma/client';

// GET /api/v1/tasks - List tasks with advanced filters
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    const { auth, projectId } = security;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = taskQuerySchema.parse(searchParams);
    
    // Enforce project scope from security context
    const where: Prisma.TaskWhereInput = {
      projectId: projectId!, // Required by wrapper
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
    if (auth.role === 'CONTRACTOR') {
      where.OR = [
        { assignedToId: auth.uid },
        { assignedContactId: auth.user.contact?.id }
      ];
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
  },
  {
    module: Module.TASKS,
    action: 'view',
    requireProject: true
  }
);

// POST /api/v1/tasks - Create new task with all features
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    const { auth, projectId } = security;
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
        projectId: projectId!,  // Use projectId from security context
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
        userId: auth.uid,
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
        userId: auth.uid,
        action: 'CREATED',
        details: {
          title: task.title,
          priority: task.priority,
          assignedTo: task.assignedToId
        }
      }
    });
    
    return successResponse(task, 'Task created successfully');
  },
  {
    module: Module.TASKS,
    action: 'edit',
    requireProject: true
  }
);

// PATCH /api/v1/tasks - Bulk update tasks
export const PATCH = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    const { auth, projectId } = security;
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
    
    // Update all tasks - ensure they belong to the project
    const result = await prisma.task.updateMany({
      where: {
        id: { in: data.taskIds },
        projectId: projectId!  // Ensure tasks belong to current project
      },
      data: updateData
    });
    
    // Log bulk activity
    await prisma.auditLog.create({
      data: {
        userId: auth.uid,
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
      userId: auth.uid,
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
  },
  {
    module: Module.TASKS,
    action: 'edit',
    requireProject: true
  }
);