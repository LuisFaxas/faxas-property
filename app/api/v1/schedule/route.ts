import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createScheduleEventSchema, scheduleQuerySchema } from '@/lib/validations/schedule';
import { Prisma, Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { sanitizeScheduleEvent, prepareScheduleEventForDb } from '@/lib/api/schedule-helpers';

// GET /api/v1/schedule - List schedule events with filters
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    const { auth, projectId } = security;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = scheduleQuerySchema.parse(searchParams);
    
    const where: Prisma.ScheduleEventWhereInput = {
      projectId: projectId!,  // Use projectId from security context
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      // Remove requestedById filter as field doesn't exist
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
    if (auth.role === 'CONTRACTOR') {
      where.status = { in: ['PLANNED', 'DONE'] };
    }
    
    const [events, total] = await Promise.all([
      prisma.scheduleEvent.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          // Remove requestedBy as it doesn't exist in schema
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          start: 'asc'
        }
      }),
      prisma.scheduleEvent.count({ where })
    ]);
    
    return successResponse(
      events,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
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
    const { auth, projectId } = security;
    const body = await request.json();
    console.log('Schedule POST body:', body);
    const data = createScheduleEventSchema.parse(body);
    
    // Contractors can only create REQUESTED events
    if (auth.role === 'CONTRACTOR') {
      data.status = 'REQUESTED';
    }
    
    const event = await prisma.scheduleEvent.create({
      data: {
        title: data.title,
        start: new Date(data.startTime),
        end: data.endTime ? new Date(data.endTime) : undefined,
        type: data.type,
        status: data.status || 'REQUESTED',
        notes: data.description,
        relatedContactIds: data.attendees || [],
        projectId: projectId!,  // Use projectId from security context
        requesterUserId: auth.uid
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        // Remove requestedBy as it doesn't exist in schema
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
    
    return successResponse(event, 'Schedule event created successfully');
  },
  {
    module: Module.SCHEDULE,
    action: 'edit',
    requireProject: true
  }
);