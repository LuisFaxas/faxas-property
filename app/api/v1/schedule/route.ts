import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createScheduleEventSchema, scheduleQuerySchema } from '@/lib/validations/schedule';
import { Prisma } from '@prisma/client';

// GET /api/v1/schedule - List schedule events with filters
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = scheduleQuerySchema.parse(searchParams);
    
    const where: Prisma.ScheduleEventWhereInput = {
      projectId: query.projectId,
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
    if (authUser.role === 'CONTRACTOR') {
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
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/schedule - Create new schedule event
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const data = createScheduleEventSchema.parse(body);
    
    // Contractors can only create REQUESTED events
    if (authUser.role === 'CONTRACTOR') {
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
        projectId: data.projectId,
        requesterUserId: authUser.uid
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
        userId: authUser.uid,
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
  } catch (error) {
    return errorResponse(error);
  }
}