import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { approveScheduleEventSchema } from '@/lib/validations/schedule';

// PATCH /api/v1/schedule/[id]/approve - Approve or reject schedule request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = approveScheduleEventSchema.parse(body);
    
    const existingEvent = await prisma.scheduleEvent.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEvent) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    if (existingEvent.status !== 'REQUESTED') {
      throw new ApiError(400, 'Only requested events can be approved or rejected');
    }
    
    const newStatus = data.approved ? 'PLANNED' : 'CANCELED';
    
    const event = await prisma.scheduleEvent.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        notes: data.notes
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
        action: data.approved ? 'APPROVE' : 'REJECT',
        entity: 'SCHEDULE_EVENT',
        entityId: event.id,
        meta: {
          from: existingEvent.status,
          to: newStatus,
          notes: data.notes
        }
      }
    });
    
    const message = data.approved 
      ? 'Schedule event approved successfully'
      : 'Schedule event rejected';
    
    return successResponse(event, message);
  } catch (error) {
    return errorResponse(error);
  }
}