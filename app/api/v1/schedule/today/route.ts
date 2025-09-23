import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { sanitizeScheduleEvent } from '@/lib/api/schedule-helpers';

// GET /api/v1/schedule/today - Get today's schedule events
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const where: any = {
      start: {
        gte: today,
        lt: tomorrow
      },
      ...(projectId && { projectId })
    };
    
    // Contractors can only see events for their projects with proper status
    if (authUser.role === 'CONTRACTOR') {
      where.status = { in: ['PLANNED', 'DONE'] };
    }
    
    const events = await prisma.scheduleEvent.findMany({
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
      orderBy: {
        start: 'asc'
      }
    });
    
    // Sanitize events to add missing fields and format for dashboard
    const formattedEvents = events.map(event => {
      const sanitized = sanitizeScheduleEvent(event);
      return {
        id: sanitized.id,
        title: sanitized.title,
        time: new Date(sanitized.start).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        type: sanitized.type,
        status: sanitized.status,
        location: sanitized.location || null,
        description: sanitized.description || null,
        attendees: sanitized.attendees || [],
        relatedContactIds: sanitized.relatedContactIds
      };
    });
    
    return successResponse(formattedEvents);
  } catch (error) {
    return errorResponse(error);
  }
}