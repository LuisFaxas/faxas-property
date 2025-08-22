import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateScheduleEventSchema } from '@/lib/validations/schedule';

// GET /api/v1/schedule/[id] - Get single schedule event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth();
    
    const event = await prisma.scheduleEvent.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!event) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    // Contractors can only view REQUESTED events or events they're related to
    if (authUser.role === 'CONTRACTOR') {
      const isRelated = event.requesterUserId === authUser.uid || 
                       event.relatedContactIds.includes(authUser.uid);
      if (!isRelated && event.status !== 'REQUESTED') {
        throw new ApiError(403, 'Access denied');
      }
    }
    
    return successResponse(event);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/v1/schedule/[id] - Update schedule event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = updateScheduleEventSchema.parse({ ...body, id: params.id });
    
    const existingEvent = await prisma.scheduleEvent.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEvent) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    const event = await prisma.scheduleEvent.update({
      where: { id: params.id },
      data: {
        title: data.title,
        start: data.startTime ? new Date(data.startTime) : undefined,
        end: data.endTime ? new Date(data.endTime) : undefined,
        type: data.type,
        status: data.status,
        notes: data.description,
        location: data.location,
        relatedContactIds: data.attendees || undefined,
        projectId: data.projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE',
        entity: 'SCHEDULE_EVENT',
        entityId: event.id,
        meta: {
          changes: {
            from: existingEvent,
            to: event
          }
        }
      }
    });
    
    return successResponse(event, 'Schedule event updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/v1/schedule/[id] - Delete schedule event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    
    const event = await prisma.scheduleEvent.findUnique({
      where: { id: params.id }
    });
    
    if (!event) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    await prisma.scheduleEvent.delete({
      where: { id: params.id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entity: 'SCHEDULE_EVENT',
        entityId: params.id,
        meta: {
          deletedEvent: event
        }
      }
    });
    
    return successResponse(null, 'Schedule event deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/v1/schedule/[id]/approve - Approve or reject schedule event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    
    const existingEvent = await prisma.scheduleEvent.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEvent) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    if (existingEvent.status !== 'REQUESTED') {
      throw new ApiError(400, 'Only requested events can be approved or rejected');
    }
    
    const newStatus = body.approved ? 'PLANNED' : 'CANCELED';
    
    const event = await prisma.scheduleEvent.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        approverUserId: authUser.uid,
        notes: body.notes ? `${existingEvent.notes}\n\nApproval Note: ${body.notes}` : existingEvent.notes
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: body.approved ? 'APPROVE' : 'REJECT',
        entity: 'SCHEDULE_EVENT',
        entityId: event.id,
        meta: {
          previousStatus: existingEvent.status,
          newStatus: newStatus,
          notes: body.notes
        }
      }
    });
    
    return successResponse(event, `Schedule event ${body.approved ? 'approved' : 'rejected'} successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}