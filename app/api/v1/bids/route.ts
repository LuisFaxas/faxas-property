// app/api/v1/bids/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';
import { Prisma, BidStatus } from '@prisma/client';
import { createNotificationService } from '@/lib/services/notification.service';

// Validation schemas
const createBidSchema = z.object({
  rfpId: z.string().cuid(),
  vendorId: z.string().cuid(),
  notes: z.string().optional(),
  alternates: z.array(z.object({
    description: z.string(),
    amount: z.number()
  })).optional()
});

const submitBidSchema = z.object({
  items: z.array(z.object({
    rfpItemId: z.string().cuid(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive(),
    uom: z.string().optional(),
    notes: z.string().optional(),
    alternatePrice: z.number().optional()
  })),
  adjustments: z.array(z.object({
    type: z.enum(['ADD', 'DEDUCT', 'ALTERNATE', 'ALLOWANCE']),
    category: z.string(),
    label: z.string(),
    amount: z.number(),
    description: z.string().optional()
  })).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string()
  })).optional()
});

// GET /api/v1/bids
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const rfpId = searchParams.get('rfpId');
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status') as BidStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let where: Prisma.BidWhereInput = {};

    if (authUser.role === 'CONTRACTOR') {
      // Contractors can only see their own vendor's bids
      const vendorUsers = await prisma.vendorUser.findMany({
        where: {
          userId: authUser.uid,
          isActive: true
        },
        select: { vendorId: true }
      });

      const vendorIds = vendorUsers.map(vu => vu.vendorId);
      where.vendorId = { in: vendorIds };
    }

    // Apply filters
    if (rfpId) where.rfpId = rfpId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    // Get bids with pagination
    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true
            }
          },
          rfp: {
            select: {
              id: true,
              title: true,
              status: true,
              bidOpeningDate: true
            }
          },
          _count: {
            select: {
              items: true,
              adjustments: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' },
          { submittedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.bid.count({ where })
    ]);

    // Mask bid amounts if bids are not opened yet
    const now = new Date();
    const maskedBids = bids.map(bid => {
      const isOpened = bid.rfp.bidOpeningDate && bid.rfp.bidOpeningDate <= now;
      const canViewAmount = authUser.role !== 'CONTRACTOR' || bid.vendorId === vendorId;

      if (!isOpened && !canViewAmount) {
        return {
          ...bid,
          totalAmount: null,
          adjustedAmount: null
        };
      }
      return bid;
    });

    return successResponse({
      bids: maskedBids,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return errorResponse(error);
  }
}

// POST /api/v1/bids (Create draft bid)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = createBidSchema.parse(body);

    // Verify access to vendor
    if (authUser.role === 'CONTRACTOR') {
      const hasAccess = await prisma.vendorUser.findFirst({
        where: {
          vendorId: validatedData.vendorId,
          userId: authUser.uid,
          isActive: true,
          permissions: {
            path: ['canSubmitBids'],
            equals: true
          }
        }
      });

      if (!hasAccess) {
        return errorResponse('Access denied to submit bids for this vendor', 403);
      }
    } else {
      // Admin/Staff can create bids for any vendor
      const canCreate = await requireRole(['ADMIN', 'STAFF']);
    }

    // Check if RFP is accepting bids
    const rfp = await prisma.rfp.findUnique({
      where: { id: validatedData.rfpId },
      include: {
        invitations: {
          where: { vendorId: validatedData.vendorId }
        }
      }
    });

    if (!rfp) {
      return errorResponse('RFP not found', 404);
    }

    if (rfp.status !== 'PUBLISHED') {
      return errorResponse('RFP is not accepting bids', 400);
    }

    // Check if vendor is invited
    if (rfp.invitations.length === 0) {
      return errorResponse('Vendor is not invited to this RFP', 403);
    }

    // Check for existing bid
    const existingBid = await prisma.bid.findFirst({
      where: {
        rfpId: validatedData.rfpId,
        vendorId: validatedData.vendorId
      }
    });

    if (existingBid) {
      return errorResponse('A bid already exists for this vendor and RFP', 409);
    }

    // Create draft bid
    const bid = await prisma.bid.create({
      data: {
        rfpId: validatedData.rfpId,
        vendorId: validatedData.vendorId,
        status: 'DRAFT',
        submittedById: authUser.uid,
        notes: validatedData.notes,
        totalAmount: 0,
        adjustedAmount: 0
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

    return successResponse(bid, 'Draft bid created successfully', 201);
  } catch (error) {
    console.error('Error creating bid:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid bid data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}