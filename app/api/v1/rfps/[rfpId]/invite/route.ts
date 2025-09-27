import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { inviteToRfpSchema } from '@/lib/validations/rfp';
import { ensureVendorForContact } from '@/lib/api/vendor-helpers';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    rfpId: string;
  }>;
}

// POST /api/v1/rfps/[rfpId]/invite - Invite contacts to bid on RFP
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check - per docs/04-auth-security.md requireRole pattern
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { rfpId } = await params;

    // Get project ID from x-project-id header - per docs/02-api-inventory.md
    const projectId = request.headers.get('x-project-id');
    if (!projectId) {
      return errorResponse({ message: 'Project ID required' }, 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const data = inviteToRfpSchema.parse(body);

    // Verify RFP exists and belongs to project
    const rfp = await prisma.rfp.findFirst({
      where: {
        id: rfpId,
        projectId: projectId,
      }
    });

    if (!rfp) {
      return errorResponse({ message: 'RFP not found' }, 404);
    }

    // Process invitations for each contact
    const results = [];
    const errors = [];

    for (const contactId of data.contactIds) {
      try {
        // Ensure vendor exists for contact - using helper from lib/api/vendor-helpers.ts
        const vendorId = await ensureVendorForContact(contactId);

        // Check if invitation already exists
        const existingInvitation = await prisma.bidInvitation.findUnique({
          where: {
            rfpId_vendorId: {
              rfpId: rfpId,
              vendorId: vendorId,
            }
          }
        });

        if (existingInvitation) {
          results.push({
            contactId,
            vendorId,
            status: 'already_invited',
            invitationId: existingInvitation.id
          });
          continue;
        }

        // Create invitation and placeholder bid in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create bid invitation
          const invitation = await tx.bidInvitation.create({
            data: {
              rfpId: rfpId,
              vendorId: vendorId,
              contactId: contactId,
              token: crypto.randomUUID(),
              expiresAt: data.dueAt ? new Date(data.dueAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
              status: 'SENT',
              emailSentAt: new Date(),
            }
          });

          // Check if bid already exists
          const existingBid = await tx.bid.findUnique({
            where: {
              rfpId_vendorId: {
                rfpId: rfpId,
                vendorId: vendorId,
              }
            }
          });

          let bid = existingBid;
          if (!bid) {
            // Create placeholder bid
            bid = await tx.bid.create({
              data: {
                rfpId: rfpId,
                vendorId: vendorId,
                status: 'DRAFT',
                notes: data.message || null,
              }
            });
          }

          return { invitation, bid };
        });

        results.push({
          contactId,
          vendorId,
          status: 'invited',
          invitationId: result.invitation.id,
          bidId: result.bid.id
        });

      } catch (error) {
        console.error(`Failed to invite contact ${contactId}:`, error);
        errors.push({
          contactId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Return response per SOT response envelope - docs/02-api-inventory.md
    return successResponse({
      rfpId,
      invited: results.filter(r => r.status === 'invited'),
      alreadyInvited: results.filter(r => r.status === 'already_invited'),
      errors
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse({ message: 'Validation error', details: error.errors }, 400);
    }
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';