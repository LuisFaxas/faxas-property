import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/task';
import { Prisma } from '@prisma/client';

// GET /api/v1/tasks - List tasks with filters
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = taskQuerySchema.parse(searchParams);
    
    const where: Prisma.TaskWhereInput = {
      projectId: query.projectId,
      ...(query.status && { status: query.status }),
      ...(query.priority && { priority: query.priority }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ]
      })
    };
    
    // Contractors can only see their assigned tasks
    if (authUser.role === 'CONTRACTOR') {
      where.assignedToId = authUser.uid;
    }
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [
          { dueDate: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.task.count({ where })
    ]);
    
    return successResponse(
      tasks,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createTaskSchema.parse(body);
    
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority,
        status: data.status,
        assignedToId: data.assignedToId,
        projectId: data.projectId,
        relatedContacts: data.relatedContactIds ? {
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
        action: 'CREATE',
        entityType: 'TASK',
        entityId: task.id,
        metadata: {
          title: task.title,
          assignedTo: task.assignedToId
        }
      }
    });
    
    return successResponse(task, 'Task created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}