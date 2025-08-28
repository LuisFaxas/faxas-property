import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createScheduleEventSchema, scheduleQuerySchema } from '@/lib/validations/schedule';
import { Prisma, Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { sanitizeScheduleEvent, prepareScheduleEventForDb } from '@/lib/api/schedule-helpers';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';

// GET /api/v1/schedule - List schedule events with filters
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.SCHEDULE, 'read');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = scheduleQuerySchema.parse(searchParams);
    
    // Build where clause - projectId is automatically enforced by repository
    const where: any = {
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    };
    
    // Date filtering
    if (query.date) {
      const date = new Date(query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.start = {
        gte: date,
        lt: nextDay
      };
    } else if (query.startDate || query.endDate) {
      where.start = {};
      if (query.startDate) {
        where.start.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.start.lte = new Date(query.endDate);
      }
    }
    
    // Contractors can only see events for their projects with proper status
    const role = await Policy.getUserProjectRole(auth.user.id, projectId!);
    if (role === 'CONTRACTOR') {
      where.status = { in: ['PLANNED', 'DONE'] };
    }
    
    // Use scoped repository for data access
    const [events, total] = await Promise.all([
      repos.schedule.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          start: 'asc'
        }
      }),
      repos.schedule.count({ where })
    ]);
    
    // Apply rate limiting based on role
    const rateLimitTier = await Policy.getRateLimitTier(auth.user.id);
    
    return successResponse(
      events,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    module: Module.SCHEDULE,
    action: 'view',
    requireProject: true
  }
);

// POST /api/v1/schedule - Create new schedule event
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.SCHEDULE, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const body = await request.json();
      const data = createScheduleEventSchema.parse(body);
    
    // Contractors can only create REQUESTED events
    const role = await Policy.getUserProjectRole(auth.user.id, projectId!);
    if (role === 'CONTRACTOR') {
      data.status = 'REQUESTED';
    }
    
    // Create schedule event using scoped repository
    const event = await repos.schedule.create({
      data: {
        title: data.title,
        start: new Date(data.startTime),
        end: data.endTime ? new Date(data.endTime) : undefined,
        type: data.type,
        status: data.status || 'REQUESTED',
        notes: data.description,
        relatedContactIds: data.attendees || [],
        projectId: projectId!,  // Enforced by repository
        requesterUserId: auth.uid
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: auth.uid,
        action: 'CREATE',
        entity: 'SCHEDULE_EVENT',
        entityId: event.id,
        meta: {
          title: event.title,
          type: event.type,
          status: event.status
        }
      }
    });
    
    // Log policy decision for audit
    await Policy.logPolicyDecision(
      auth.user.id,
      projectId!,
      Module.SCHEDULE,
      'write',
      true,
      'Schedule event created successfully'
    );
    
    return successResponse(event, 'Schedule event created successfully');
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    module: Module.SCHEDULE,
    action: 'edit',
    requireProject: true
  }
);
// Export runtime for Firebase Admin
export const runtime = 'nodejs';
