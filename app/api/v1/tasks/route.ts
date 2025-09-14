import { NextRequest } from 'next/server';
import { successResponse, paginationMetadata, errorResponse } from '@/lib/api/response';
import { createTaskSchema, taskQuerySchema, bulkUpdateTasksSchema } from '@/lib/validations/task';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Module } from '@prisma/client';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';
import { prisma } from '@/lib/prisma';

// GET /api/v1/tasks - List tasks with advanced filters
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.TASKS, 'read');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      // Parse query parameters
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = taskQuerySchema.parse(searchParams);
      
      // Build where clause - projectId is automatically enforced by repository
      const where: any = {
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
      const role = await Policy.getUserProjectRole(auth.user.id, projectId!);
      if (role === 'CONTRACTOR') {
        // Get the contact ID associated with this user
        const contact = await prisma.contact.findFirst({
          where: {
            projectId: projectId!,
            userId: auth.user.id
          }
        });
        
        if (contact) {
          where.OR = [
            { assignedToId: auth.user.id },
            { assignedContactId: contact.id }
          ];
        } else {
          where.assignedToId = auth.user.id;
        }
      }
      
      // Determine the order
      const orderBy: any = {};
      if (query.sortBy) {
        orderBy[query.sortBy] = query.sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }
      
      // Use scoped repository for data access
      const [tasks, totalCount] = await Promise.all([
        repos.tasks.findMany({
          where,
          include: {
            assignedTo: {
              select: {
                id: true,
                email: true,
                role: true
              }
            },
            assignedContact: {
              select: {
                id: true,
                name: true,
                emails: true,
                phones: true,
                company: true,
                specialty: true
              }
            },
            subtasks: query.includeSubtasks ? {
              select: {
                id: true,
                title: true,
                status: true,
                completedAt: true
              }
            } : false,
            attachments: true,
            dependencies: (query as any).includeDependencies ? {
              include: {
                dependsOn: true
              }
            } : false,
            dependents: (query as any).includeDependencies ? {
              include: {
                task: true
              }
            } : false
          },
          orderBy,
          skip: (query.page - 1) * query.limit,
          take: query.limit
        }),
        repos.tasks.count({ where })
      ]);
      
      // Apply rate limiting based on role
      const rateLimitTier = await Policy.getRateLimitTier(auth.user.id);
      
      return successResponse(
        tasks,
        `Retrieved ${tasks.length} tasks`
      );
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    module: Module.TASKS,
    action: 'view',
    requireProject: true
  }
);

// POST /api/v1/tasks - Create a new task
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.TASKS, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const body = await request.json();
      const validatedData = createTaskSchema.parse(body);
      
      // Handle assignee - can be either a user or contact
      let assigneeData: any = {};
      if ((validatedData as any).assigneeType === 'USER' && validatedData.assignedToId) {
        assigneeData.assignedToId = validatedData.assignedToId;
      } else if ((validatedData as any).assigneeType === 'CONTACT' && validatedData.assignedContactId) {
        assigneeData.assignedContactId = validatedData.assignedContactId;
      }
      
      // Create task using scoped repository
      const task = await repos.tasks.create({
        data: {
          ...validatedData,
          ...assigneeData,
          projectId: projectId!, // Enforced by repository
          createdBy: auth.user.id,
          customFields: validatedData.customFields || {},
          subtasks: (validatedData as any).subtasks ? {
            create: (validatedData as any).subtasks
          } : undefined
        },
        include: {
          assignedTo: true,
          assignedContact: true,
          subtasks: true,
          attachments: true
        }
      });
      
      // Create activity log
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          userId: auth.user.id,
          action: 'CREATED'
        }
      });
      
      // Log policy decision for audit
      await Policy.logPolicyDecision(
        auth.user.id,
        projectId!,
        Module.TASKS,
        'write',
        true,
        'Task created successfully'
      );
      
      return successResponse(task, 'Task created successfully');
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    module: Module.TASKS,
    action: 'edit',
    requireProject: true,
    roles: ['ADMIN', 'STAFF']
  }
);

// PATCH /api/v1/tasks/bulk - Bulk update tasks
export const PATCH = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.TASKS, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const body = await request.json();
      const validatedData = bulkUpdateTasksSchema.parse(body);
      
      const results = [];
      
      for (const update of (validatedData as any).updates || []) {
        // Verify each task belongs to the project (repository will enforce this)
        const task = await repos.tasks.findUnique({
          where: { id: update.id }
        });
        
        if (!task) {
          results.push({
            id: update.id,
            success: false,
            error: 'Task not found or access denied'
          });
          continue;
        }
        
        try {
          const updated = await repos.tasks.update({
            where: { id: update.id },
            data: update.data
          });
          
          // Log status changes
          if (update.data.status && update.data.status !== task.status) {
            await prisma.taskActivity.create({
              data: {
                taskId: task.id,
                userId: auth.user.id,
                action: 'STATUS_CHANGE'
              }
            });
          }
          
          results.push({
            id: update.id,
            success: true,
            data: updated
          });
        } catch (error: any) {
          results.push({
            id: update.id,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      return successResponse(
        results,
        `Bulk update completed: ${successCount} succeeded, ${failureCount} failed`
      );
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    module: Module.TASKS,
    action: 'edit',
    requireProject: true,
    roles: ['ADMIN', 'STAFF']
  }
);

// Export runtime for Firebase Admin
export const runtime = 'nodejs';