import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ScheduleType, ScheduleStatus } from '@prisma/client';

const calendarEventSchema = z.object({
  googleEventId: z.string(),
  start: z.string(),
  end: z.string().optional(),
  title: z.string(),
  attendees: z.array(z.string()).optional(),
  projectId: z.string()
});

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { googleEventId, start, end, title, attendees, projectId } = calendarEventSchema.parse(body);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Determine event type based on title keywords
    let eventType: ScheduleType = 'MEETING';
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('site visit') || titleLower.includes('site walk')) {
      eventType = 'SITE_VISIT';
    } else if (titleLower.includes('call') || titleLower.includes('phone')) {
      eventType = 'CALL';
    } else if (titleLower.includes('work') || titleLower.includes('installation')) {
      eventType = 'WORK';
    }

    // Find related contacts if attendees provided
    const relatedContactIds: string[] = [];
    if (attendees && attendees.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          projectId,
          emails: {
            hasSome: attendees
          }
        }
      });
      relatedContactIds.push(...contacts.map(c => c.id));
    }

    // Find existing event
    const existing = await prisma.scheduleEvent.findFirst({
      where: { googleEventId }
    });

    // Upsert schedule event
    const scheduleEvent = existing
      ? await prisma.scheduleEvent.update({
          where: { id: existing.id },
          data: {
            title,
            start: new Date(start),
            end: end ? new Date(end) : undefined,
            relatedContactIds,
            status: 'PLANNED'
          }
        })
      : await prisma.scheduleEvent.create({
          data: {
            projectId,
            googleEventId,
            title,
            type: eventType,
            start: new Date(start),
            end: end ? new Date(end) : undefined,
            status: 'PLANNED' as ScheduleStatus,
            relatedContactIds
          }
        });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'CALENDAR_EVENT_SYNCED',
        entity: 'ScheduleEvent',
        entityId: scheduleEvent.id,
        meta: {
          googleEventId,
          title,
          start,
          end,
          attendees
        }
      }
    });

    return NextResponse.json({
      success: true,
      scheduleEventId: scheduleEvent.id,
      action: scheduleEvent.googleEventId === googleEventId ? 'updated' : 'created'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error processing calendar event webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';