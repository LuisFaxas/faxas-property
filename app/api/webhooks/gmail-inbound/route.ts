import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const gmailInboundSchema = z.object({
  from: z.string(),
  senderEmail: z.string().email(),
  subject: z.string(),
  snippet: z.string(),
  receivedAt: z.string(),
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
    const { from, senderEmail, subject, snippet, receivedAt, projectId } = gmailInboundSchema.parse(body);

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

    // Upsert contact
    let contact = await prisma.contact.findFirst({
      where: {
        projectId,
        emails: { has: senderEmail }
      }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          projectId,
          name: from,
          emails: [senderEmail],
          phones: [],
          category: 'referral_source',
          status: 'new'
        }
      });
    }

    // Create schedule event for email follow-up
    const scheduleEvent = await prisma.scheduleEvent.create({
      data: {
        projectId,
        title: `Follow up: ${subject}`,
        type: 'EMAIL_FOLLOWUP',
        start: new Date(receivedAt),
        status: 'PLANNED',
        notes: snippet,
        relatedContactIds: [contact.id],
        replied: false
      }
    });

    // Create task for replying
    const task = await prisma.task.create({
      data: {
        projectId,
        title: `Reply to: ${from} - ${subject}`,
        description: `Email received at ${receivedAt}\n\nSnippet: ${snippet}`,
        status: 'new',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        relatedContactIds: [contact.id]
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'EMAIL_RECEIVED',
        entity: 'Contact',
        entityId: contact.id,
        meta: {
          from,
          senderEmail,
          subject,
          taskId: task.id,
          scheduleEventId: scheduleEvent.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      scheduleEventId: scheduleEvent.id,
      taskId: task.id
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing Gmail inbound webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}