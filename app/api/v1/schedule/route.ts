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
      ...(query.requestedById && { requestedById: query.requestedById })
    };
    
    // Date filtering
    if (query.date) {
      const date = new Date(query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.startTime = {
        gte: date,
        lt: nextDay
      };
    } else if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) {
        where.startTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.startTime.lte = new Date(query.endDate);
      }
    }
    
    // Contractors can only see their own requested events or approved events
    if (authUser.role === 'CONTRACTOR') {
      where.OR = [
        { requestedById: authUser.uid },
        { status: 'APPROVED' }
      ];
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
          requestedBy: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          startTime: 'asc'
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
      data.requestedById = authUser.uid;
    }
    
    const event = await prisma.scheduleEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        type: data.type,
        status: data.status,
        location: data.location,
        attendees: data.attendees || [],
        projectId: data.projectId,
        requestedById: data.requestedById || authUser.uid
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        requestedBy: {
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
        action: 'CREATE',
        entityType: 'SCHEDULE_EVENT',
        entityId: event.id,
        metadata: {
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