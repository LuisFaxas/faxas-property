// app/api/v1/bids/[bidId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { updateBidSchema } from '@/lib/validations/bids';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

interface RouteParams {
  params: Promise<{
    bidId: string;
  }>;
}

// GET /api/v1/bids/[bidId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { bidId } = await params;

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        vendor: true,
        rfp: {
          include: {
            items: {
              orderBy: { specCode: 'asc' }
            }
          }
        },
        items: {
          orderBy: { createdAt: 'asc' }
        },
        adjustments: {
          orderBy: { sequenceOrder: 'asc' }
        },
        submittedBy: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    if (!bid) {
      return errorResponse('Bid not found', 404);
    }

    // Check access for contractors
    if (authUser.role === 'CONTRACTOR') {
      const hasAccess = await prisma.vendorUser.findFirst({
        where: {
          vendorId: bid.vendorId,
          userId: authUser.uid,
          isActive: true
        }
      });

      if (!hasAccess) {
        return errorResponse('Access denied', 403);
      }
    }

    // Mask amounts if bid is sealed and user is a competitor
    const now = new Date();
    const isOpened = bid.rfp.bidOpeningDate && bid.rfp.bidOpeningDate <= now;
    const isOwnBid = authUser.role === 'CONTRACTOR' && bid.submittedById === authUser.uid;

    if (!isOpened && !isOwnBid && authUser.role === 'CONTRACTOR') {
      // Hide competitor bid details before opening
      return successResponse({
        ...bid,
        items: [],
        adjustments: [],
        totalAmount: null,
        adjustedAmount: null,
        notes: null
      });
    }

    return successResponse(bid);
  } catch (error) {
    console.error('Error fetching bid:', error);
    return errorResponse(error);
  }
}

// PUT /api/v1/bids/[bidId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { bidId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateBidSchema.parse(body);

    // Get existing bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        rfp: true
      }
    });

    if (!bid) {
      return errorResponse('Bid not found', 404);
    }

    // Check permissions
    if (authUser.role === 'CONTRACTOR') {
      const hasAccess = await prisma.vendorUser.findFirst({
        where: {
          vendorId: bid.vendorId,
          userId: authUser.uid,
          isActive: true,
          permissions: {
            path: ['canSubmitBids'],
            equals: true
          }
        }
      });

      if (!hasAccess) {
        return errorResponse('Access denied', 403);
      }
    }

    // Check if bid can be edited
    if (bid.status === 'SUBMITTED') {
      return errorResponse('Cannot edit a submitted bid', 400);
    }

    if (bid.rfp.status !== 'PUBLISHED') {
      return errorResponse('RFP is not accepting bid updates', 400);
    }

    // Update bid
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rfp: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return successResponse(updatedBid, 'Bid updated successfully');
  } catch (error) {
    console.error('Error updating bid:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid bid data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}

// PATCH /api/v1/bids/[bidId] - Update bid amount and notes
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check - per docs/04-auth-security.md
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { bidId } = await params;

    // Get project ID from header - per docs/02-api-inventory.md
    const projectId = request.headers.get('x-project-id');
    if (!projectId) {
      return errorResponse({ message: 'Project ID required' }, 400);
    }

    const body = await request.json();
    const validatedData = updateBidSchema.parse(body);

    // Get existing bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        rfp: true,
        vendor: true
      }
    });

    if (!bid) {
      return errorResponse({ message: 'Bid not found' }, 404);
    }

    // Verify bid belongs to project
    if (bid.rfp.projectId !== projectId) {
      return errorResponse({ message: 'Bid not found in project' }, 404);
    }

    // Update bid
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: {
        totalAmount: validatedData.totalAmount !== undefined
          ? new Decimal(validatedData.totalAmount)
          : undefined,
        notes: validatedData.notes,
        status: validatedData.status,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rfp: {
          select: {
            id: true,
            title: true
          }
        },
        attachments: true
      }
    });

    return successResponse(updatedBid, 'Bid updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse({ message: 'Validation error', details: error.issues }, 400);
    }
    return errorResponse(error);
  }
}

// DELETE /api/v1/bids/[bidId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { bidId } = await params;

    // Get existing bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId }
    });

    if (!bid) {
      return errorResponse('Bid not found', 404);
    }

    // Check permissions
    if (authUser.role === 'CONTRACTOR') {
      const hasAccess = await prisma.vendorUser.findFirst({
        where: {
          vendorId: bid.vendorId,
          userId: authUser.uid,
          isActive: true,
          permissions: {
            path: ['canSubmitBids'],
            equals: true
          }
        }
      });

      if (!hasAccess) {
        return errorResponse('Access denied', 403);
      }
    } else {
      await requireRole(['ADMIN']);
    }

    // Check if bid can be deleted
    if (bid.status === 'SUBMITTED') {
      return errorResponse('Cannot delete a submitted bid. Withdraw it instead.', 400);
    }

    if (bid.status === 'AWARDED') {
      return errorResponse('Cannot delete an awarded bid', 400);
    }

    // Delete bid and related items
    await prisma.$transaction([
      prisma.bidItem.deleteMany({ where: { bidId } }),
      prisma.bidAdjustment.deleteMany({ where: { bidId } }),
      prisma.bid.delete({ where: { id: bidId } })
    ]);

    return successResponse(null, 'Bid deleted successfully');
  } catch (error) {
    console.error('Error deleting bid:', error);
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';