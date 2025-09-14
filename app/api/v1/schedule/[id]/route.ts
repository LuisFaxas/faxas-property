import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateScheduleEventSchema } from '@/lib/validations/schedule';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Module } from '@prisma/client';

// Helper to resolve projectId from schedule event
async function resolveScheduleProject(req: NextRequest, ctx: any): Promise<string | null> {
  const { params } = ctx;
  const { id } = await params;
  const event = await prisma.scheduleEvent.findUnique({
    where: { id },
    select: { projectId: true }
  });
  return event?.projectId || null;
}

// GET /api/v1/schedule/[id] - Get single schedule event
export const GET = withAuth(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }, security: SecurityContext) => {
    const { auth, projectId } = security;
    const { params } = ctx;
    const { id } = await params;
    
    const event = await prisma.scheduleEvent.findUnique({
      where: { id },
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
    
    // Verify project access
    if (projectId && event.projectId !== projectId) {
      throw new ApiError(403, 'Event belongs to different project');
    }
    
    // Contractors can only view REQUESTED events or events they're related to
    if (auth.role === 'CONTRACTOR') {
      const isRelated = event.requesterUserId === auth.uid || 
                       event.relatedContactIds.includes(auth.uid);
      if (!isRelated && event.status !== 'REQUESTED') {
        throw new ApiError(403, 'Access denied');
      }
    }
    
    return successResponse(event);
  },
  {
    module: Module.SCHEDULE,
    action: 'view',
    resolveProjectId: resolveScheduleProject
  }
);

// PUT /api/v1/schedule/[id] - Update schedule event
export const PUT = withAuth(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }, security: SecurityContext) => {
    const { auth, projectId } = security;
    const { params } = ctx;
    const { id } = await params;
    const body = await request.json();
    const data = updateScheduleEventSchema.parse({ ...body, id });
    
    const existingEvent = await prisma.scheduleEvent.findUnique({
      where: { id }
    });
    
    if (!existingEvent) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    // Verify event belongs to project
    if (projectId && existingEvent.projectId !== projectId) {
      throw new ApiError(403, 'Event belongs to different project');
    }
    
    const event = await prisma.scheduleEvent.update({
      where: { id },
      data: {
        title: data.title,
        start: data.startTime ? new Date(data.startTime) : undefined,
        end: data.endTime ? new Date(data.endTime) : undefined,
        type: data.type as any,
        status: data.status,
        notes: data.description,
        relatedContactIds: data.attendees || undefined
        // Don't allow changing projectId
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
        userId: auth.uid,
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
  },
  {
    module: Module.SCHEDULE,
    action: 'edit',
    resolveProjectId: resolveScheduleProject
  }
);

// DELETE /api/v1/schedule/[id] - Delete schedule event
export const DELETE = withAuth(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }, security: SecurityContext) => {
    const { auth, projectId } = security;
    const { params } = ctx;
    const { id } = await params;
    
    const event = await prisma.scheduleEvent.findUnique({
      where: { id }
    });
    
    if (!event) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    // Verify event belongs to project
    if (projectId && event.projectId !== projectId) {
      throw new ApiError(403, 'Event belongs to different project');
    }
    
    await prisma.scheduleEvent.delete({
      where: { id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: auth.uid,
        action: 'DELETE',
        entity: 'SCHEDULE_EVENT',
        entityId: id,
        meta: {
          deletedEvent: event
        }
      }
    });
    
    return successResponse(null, 'Schedule event deleted successfully');
  },
  {
    roles: ['ADMIN'],
    module: Module.SCHEDULE,
    action: 'edit',
    resolveProjectId: resolveScheduleProject
  }
);

// PATCH /api/v1/schedule/[id]/approve - Approve or reject schedule event
export const PATCH = withAuth(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }, security: SecurityContext) => {
    const { auth, projectId } = security;
    const { params } = ctx;
    const { id } = await params;
    const body = await request.json();
    
    const existingEvent = await prisma.scheduleEvent.findUnique({
      where: { id }
    });
    
    if (!existingEvent) {
      throw new ApiError(404, 'Schedule event not found');
    }
    
    // Verify event belongs to project
    if (projectId && existingEvent.projectId !== projectId) {
      throw new ApiError(403, 'Event belongs to different project');
    }
    
    if (existingEvent.status !== 'REQUESTED') {
      throw new ApiError(400, 'Only requested events can be approved or rejected');
    }
    
    const newStatus = body.approved ? 'PLANNED' : 'CANCELED';
    
    const event = await prisma.scheduleEvent.update({
      where: { id },
      data: {
        status: newStatus,
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
        userId: auth.uid,
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
  },
  {
    roles: ['ADMIN', 'STAFF'],
    module: Module.SCHEDULE,
    action: 'approve',
    resolveProjectId: resolveScheduleProject
  }
);
// Export runtime for Firebase Admin
export const runtime = 'nodejs';
