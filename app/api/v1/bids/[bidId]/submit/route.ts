// app/api/v1/bids/[bidId]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response-utils';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { createNotificationService } from '@/lib/services/notification.service';
import crypto from 'crypto';

const submitBidSchema = z.object({
  items: z.array(z.object({
    rfpItemId: z.string().cuid(),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    uom: z.string().optional(),
    notes: z.string().optional(),
    alternatePrice: z.number().min(0).optional()
  })),
  adjustments: z.array(z.object({
    type: z.enum(['ADD', 'DEDUCT', 'ALTERNATE', 'ALLOWANCE']),
    category: z.string(),
    label: z.string(),
    amount: z.number().min(0),
    description: z.string().optional(),
    isAccepted: z.boolean().optional()
  })).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number().optional()
  })).optional(),
  acknowledgments: z.object({
    reviewedScope: z.boolean(),
    acceptedTerms: z.boolean(),
    confirmedPricing: z.boolean()
  })
});

interface RouteParams {
  params: {
    bidId: string;
  };
}

// POST /api/v1/bids/[bidId]/submit
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { bidId } = params;
    const body = await request.json();

    // Validate input
    const validatedData = submitBidSchema.parse(body);

    // Verify all acknowledgments are true
    if (!validatedData.acknowledgments.reviewedScope ||
        !validatedData.acknowledgments.acceptedTerms ||
        !validatedData.acknowledgments.confirmedPricing) {
      return errorResponse('All acknowledgments must be confirmed before submission', 400);
    }

    // Get existing bid with all relations
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        vendor: true,
        rfp: {
          include: {
            items: true,
            project: true
          }
        }
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
        return errorResponse('Access denied to submit bids', 403);
      }
    }

    // Check if bid can be submitted
    if (bid.status !== 'DRAFT') {
      return errorResponse('Only draft bids can be submitted', 400);
    }

    if (bid.rfp.status !== 'PUBLISHED') {
      return errorResponse('RFP is not accepting submissions', 400);
    }

    const now = new Date();
    if (bid.rfp.dueDate && bid.rfp.dueDate < now) {
      return errorResponse('RFP submission deadline has passed', 400);
    }

    // Validate all RFP items are included
    const rfpItemIds = bid.rfp.items.map(item => item.id);
    const bidItemIds = validatedData.items.map(item => item.rfpItemId);
    const missingItems = rfpItemIds.filter(id => !bidItemIds.includes(id));

    if (missingItems.length > 0) {
      return errorResponse(
        `Missing bid items for RFP items: ${missingItems.join(', ')}`,
        400
      );
    }

    // Calculate totals using Decimal.js for precision
    let subtotal = new Decimal(0);
    const bidItems = [];

    for (const item of validatedData.items) {
      const rfpItem = bid.rfp.items.find(ri => ri.id === item.rfpItemId);
      if (!rfpItem) {
        return errorResponse(`Invalid RFP item: ${item.rfpItemId}`, 400);
      }

      // Validate total price matches unit price * quantity
      const expectedTotal = new Decimal(item.unitPrice).times(rfpItem.qty);
      const providedTotal = new Decimal(item.totalPrice);

      if (!expectedTotal.equals(providedTotal)) {
        return errorResponse(
          `Total price mismatch for item ${rfpItem.specCode}. Expected: ${expectedTotal.toFixed(2)}, Got: ${providedTotal.toFixed(2)}`,
          400
        );
      }

      subtotal = subtotal.plus(providedTotal);

      bidItems.push({
        bidId,
        rfpItemId: item.rfpItemId,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        uom: item.uom,
        notes: item.notes,
        alternatePrice: item.alternatePrice
      });
    }

    // Calculate adjustments
    let adjustmentTotal = new Decimal(0);
    const bidAdjustments = [];

    if (validatedData.adjustments) {
      for (let i = 0; i < validatedData.adjustments.length; i++) {
        const adj = validatedData.adjustments[i];
        const amount = new Decimal(adj.amount);

        if (adj.type === 'ADD' || adj.type === 'ALLOWANCE') {
          adjustmentTotal = adjustmentTotal.plus(amount);
        } else if (adj.type === 'DEDUCT') {
          adjustmentTotal = adjustmentTotal.minus(amount);
        }

        bidAdjustments.push({
          bidId,
          type: adj.type,
          category: adj.category,
          label: adj.label,
          amount: adj.amount,
          description: adj.description,
          isAccepted: adj.isAccepted !== false,
          sequenceOrder: i
        });
      }
    }

    const totalAmount = subtotal.toNumber();
    const adjustedAmount = subtotal.plus(adjustmentTotal).toNumber();

    // Generate submission hash for integrity
    const submissionData = JSON.stringify({
      bidId,
      items: bidItems,
      adjustments: bidAdjustments,
      totalAmount,
      adjustedAmount,
      timestamp: now.toISOString()
    });
    const submissionHash = crypto
      .createHash('sha256')
      .update(submissionData)
      .digest('hex');

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing items and adjustments
      await tx.bidItem.deleteMany({ where: { bidId } });
      await tx.bidAdjustment.deleteMany({ where: { bidId } });

      // Create new items
      await tx.bidItem.createMany({ data: bidItems });

      // Create adjustments if any
      if (bidAdjustments.length > 0) {
        await tx.bidAdjustment.createMany({ data: bidAdjustments });
      }

      // Update bid status and amounts
      const updatedBid = await tx.bid.update({
        where: { id: bidId },
        data: {
          status: 'SUBMITTED',
          submittedAt: now,
          submittedById: authUser.uid,
          totalAmount,
          adjustedAmount,
          notes: validatedData.notes,
          attachments: validatedData.attachments as any || [],
          submissionHash,
          metadata: {
            ...(bid.metadata as any || {}),
            acknowledgments: validatedData.acknowledgments,
            submittedFrom: request.headers.get('user-agent') || 'unknown',
            submittedIp: request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown'
          }
        },
        include: {
          vendor: true,
          rfp: {
            select: {
              id: true,
              title: true,
              bidOpeningDate: true
            }
          },
          items: true,
          adjustments: true
        }
      });

      return updatedBid;
    });

    // Send confirmation email
    try {
      const notificationService = createNotificationService();
      await notificationService.sendBidSubmissionConfirmation(
        bid.vendor.email,
        bid.vendor.name,
        bid.rfp.title,
        adjustedAmount,
        bid.rfp.bidOpeningDate || undefined
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the submission if email fails
    }

    return successResponse(
      result,
      'Bid submitted successfully',
      201
    );
  } catch (error) {
    console.error('Error submitting bid:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid bid submission data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}

// POST /api/v1/bids/[bidId]/withdraw
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { bidId } = params;

    // Get existing bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        vendor: true,
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

    // Check if bid can be withdrawn
    if (bid.status !== 'SUBMITTED') {
      return errorResponse('Only submitted bids can be withdrawn', 400);
    }

    if (bid.status === 'AWARDED') {
      return errorResponse('Cannot withdraw an awarded bid', 400);
    }

    const now = new Date();
    if (bid.rfp.bidOpeningDate && bid.rfp.bidOpeningDate <= now) {
      return errorResponse('Cannot withdraw bid after opening date', 400);
    }

    // Withdraw the bid
    const withdrawnBid = await prisma.bid.update({
      where: { id: bidId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: now,
        withdrawnById: authUser.uid,
        metadata: {
          ...(bid.metadata as any || {}),
          withdrawalReason: request.headers.get('x-withdrawal-reason') || 'Not specified',
          withdrawnFrom: request.headers.get('user-agent') || 'unknown'
        }
      }
    });

    // Send notification
    try {
      const notificationService = createNotificationService();
      await notificationService.sendBidWithdrawalConfirmation(
        bid.vendor.email,
        bid.vendor.name,
        bid.rfp.title
      );
    } catch (emailError) {
      console.error('Failed to send withdrawal email:', emailError);
    }

    return successResponse(withdrawnBid, 'Bid withdrawn successfully');
  } catch (error) {
    console.error('Error withdrawing bid:', error);
    return errorResponse(error);
  }
}