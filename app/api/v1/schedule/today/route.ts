import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

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
      startTime: {
        gte: today,
        lt: tomorrow
      },
      ...(projectId && { projectId })
    };
    
    // Contractors can only see their own requested events or approved events
    if (authUser.role === 'CONTRACTOR') {
      where.OR = [
        { requestedById: authUser.uid },
        { status: 'APPROVED' }
      ];
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
        requestedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    // Format events for dashboard display
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      time: new Date(event.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      type: event.type,
      status: event.status,
      location: event.location,
      attendees: event.attendees,
      requestedBy: event.requestedBy
    }));
    
    return successResponse(formattedEvents);
  } catch (error) {
    return errorResponse(error);
  }
}