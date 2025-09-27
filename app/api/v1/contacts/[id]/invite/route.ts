import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

// Schema for invite request
const inviteSchema = z.object({
  expiryDays: z.number().min(1).max(90).default(7),
  message: z.string().optional(),
  accessLevel: z.enum(['view-only', 'standard', 'full-access']).default('standard'),
});

// POST /api/v1/contacts/[id]/invite - Send portal invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = inviteSchema.parse(body);

    // Get contact
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!contact) {
      return errorResponse('Contact not found', 404);
    }

    // Check if contact already has portal access
    if (contact.portalStatus === 'ACTIVE') {
      return errorResponse('Contact already has portal access', 400);
    }

    // Check if contact has email
    if (!contact.emails || contact.emails.length === 0) {
      return errorResponse('Contact has no email address', 400);
    }

    // Generate secure invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date();
    inviteExpiry.setDate(inviteExpiry.getDate() + data.expiryDays);

    // Update contact with invite details
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        portalStatus: 'INVITED',
        inviteToken,
        inviteExpiry,
        lastActivityAt: new Date(),
      }
    });

    // Prepare email content
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${inviteToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited to ${contact.project.name} Portal</h2>
        <p>Hi ${contact.name},</p>
        <p>You've been invited to access the project portal for ${contact.project.name}.</p>
        ${data.message ? `<p><strong>Message from admin:</strong> ${data.message}</p>` : ''}
        <p>Click the link below to set up your account:</p>
        <div style="margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background-color: #3B82F6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This invitation expires in ${data.expiryDays} days.
          If you have any questions, please contact the project administrator.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${inviteUrl}
        </p>
      </div>
    `;

    // Send invitation email
    try {
      await sendEmail({
        to: contact.emails[0],
        subject: `Invitation to ${contact.project.name} Portal`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Revert the invitation status
      await prisma.contact.update({
        where: { id },
        data: {
          portalStatus: 'NONE',
          inviteToken: null,
          inviteExpiry: null,
        }
      });
      return errorResponse('Failed to send invitation email', 500);
    }

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'INVITE_SENT',
        entity: 'CONTACT',
        entityId: id,
        meta: {
          contactName: contact.name,
          expiryDays: data.expiryDays,
          accessLevel: data.accessLevel,
        }
      }
    });

    return successResponse(
      {
        ...updatedContact,
        inviteUrl // Include for testing/preview
      },
      'Invitation sent successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/v1/contacts/[id]/invite - Cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole(['ADMIN', 'STAFF']);

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        portalStatus: 'NONE',
        inviteToken: null,
        inviteExpiry: null,
      }
    });

    return successResponse(contact, 'Invitation cancelled');
  } catch (error) {
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';