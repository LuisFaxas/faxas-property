import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { bidAttachmentSchema } from '@/lib/validations/bids';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    bidId: string;
  }>;
}

// GET /api/v1/bids/[bidId]/attachments - List bid attachments
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check - per docs/04-auth-security.md
    const authUser = await requireRole(['ADMIN', 'STAFF', 'CONTRACTOR']);
    const { bidId } = await params;

    // Get project ID from header
    const projectId = request.headers.get('x-project-id');
    if (!projectId) {
      return errorResponse({ message: 'Project ID required' }, 400);
    }

    // Verify bid exists and belongs to project
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        rfp: {
          select: { projectId: true }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!bid || bid.rfp.projectId !== projectId) {
      return errorResponse({ message: 'Bid not found' }, 404);
    }

    return successResponse(bid.attachments);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/bids/[bidId]/attachments - Add attachment metadata after signed upload
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check - per docs/04-auth-security.md requireRole pattern
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { bidId } = await params;

    // Get project ID from header - per docs/02-api-inventory.md
    const projectId = request.headers.get('x-project-id');
    if (!projectId) {
      return errorResponse({ message: 'Project ID required' }, 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const data = bidAttachmentSchema.parse(body);

    // Verify bid exists and belongs to project
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        rfp: {
          select: { projectId: true }
        }
      }
    });

    if (!bid || bid.rfp.projectId !== projectId) {
      return errorResponse({ message: 'Bid not found' }, 404);
    }

    // Create attachment record
    const attachment = await prisma.bidAttachment.create({
      data: {
        bidId: bidId,
        fileName: data.fileName,
        storagePath: data.storagePath, // Firebase Storage path from signed upload
        contentType: data.contentType,
        size: data.size,
      }
    });

    // Return response per SOT envelope - docs/02-api-inventory.md
    return successResponse(attachment, 'Attachment added successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse({ message: 'Validation error', details: error.issues }, 400);
    }
    return errorResponse(error);
  }
}

// DELETE /api/v1/bids/[bidId]/attachments/[attachmentId] would go here if needed