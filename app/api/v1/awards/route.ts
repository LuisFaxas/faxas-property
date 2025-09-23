// app/api/v1/awards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { createNotificationService } from '@/lib/services/notification.service';
import crypto from 'crypto';

// Validation schema for creating award with commitment
const createAwardSchema = z.object({
  bidId: z.string().cuid(),
  awardAmount: z.number().positive(),
  justification: z.string().min(10),
  commitmentType: z.enum(['PURCHASE_ORDER', 'CONTRACT', 'SUBCONTRACT']),
  contractTerms: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    paymentTerms: z.string(),
    retentionPercentage: z.number().min(0).max(100).optional(),
    liquidatedDamages: z.number().optional(),
    performanceBondRequired: z.boolean().optional(),
    insuranceRequired: z.boolean().optional()
  }),
  budgetAllocations: z.array(z.object({
    budgetItemId: z.string().cuid(),
    amount: z.number().positive(),
    percentage: z.number().min(0).max(100)
  })),
  approvals: z.array(z.object({
    approverName: z.string(),
    approverTitle: z.string(),
    approvedAt: z.string().datetime(),
    notes: z.string().optional()
  })).optional()
});

// GET /api/v1/awards
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF', 'VIEWER']);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const vendorId = searchParams.get('vendorId');
    const rfpId = searchParams.get('rfpId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};
    if (rfpId) where.rfpId = rfpId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    if (projectId) {
      where.rfp = { projectId };
    }

    // Get awards with related data
    const awards = await prisma.award.findMany({
      where,
      include: {
        bid: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                contactName: true,
                email: true
              }
            }
          }
        },
        rfp: {
          select: {
            id: true,
            title: true,
            projectId: true
          }
        },
        commitment: {
          select: {
            id: true,
            contractNumber: true,
            type: true,
            status: true,
            currentAmount: true
          }
        },
        awardedBy: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: {
        awardDate: 'desc'
      }
    });

    return successResponse(awards);
  } catch (error) {
    console.error('Error fetching awards:', error);
    return errorResponse(error);
  }
}

// POST /api/v1/awards - Create award and commitment atomically
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const body = await request.json();

    // Validate input
    const validatedData = createAwardSchema.parse(body);

    // Generate idempotency key for this transaction
    const idempotencyKey = crypto.randomBytes(16).toString('hex');

    // Get bid with all necessary relations
    const bid = await prisma.bid.findUnique({
      where: { id: validatedData.bidId },
      include: {
        vendor: true,
        rfp: {
          include: {
            project: true,
            items: true
          }
        },
        items: true,
        adjustments: {
          where: { isAccepted: true }
        }
      }
    });

    if (!bid) {
      return errorResponse('Bid not found', 404);
    }

    if (bid.status !== 'SUBMITTED') {
      return errorResponse('Only submitted bids can be awarded', 400);
    }

    // Check if bid is already awarded
    const existingAward = await prisma.award.findFirst({
      where: { bidId: validatedData.bidId }
    });

    if (existingAward) {
      return errorResponse('This bid has already been awarded', 409);
    }

    // Validate award amount matches bid amount (with tolerance)
    const bidAmount = new Decimal(bid.adjustedAmount);
    const awardAmount = new Decimal(validatedData.awardAmount);
    const tolerance = bidAmount.times(0.01); // 1% tolerance

    if (awardAmount.minus(bidAmount).abs().greaterThan(tolerance)) {
      return errorResponse(
        `Award amount must match bid amount. Bid: ${bidAmount.toFixed(2)}, Award: ${awardAmount.toFixed(2)}`,
        400
      );
    }

    // Validate budget allocations sum to award amount
    const allocationTotal = validatedData.budgetAllocations.reduce(
      (sum, alloc) => sum.plus(alloc.amount),
      new Decimal(0)
    );

    if (!allocationTotal.equals(awardAmount)) {
      return errorResponse(
        `Budget allocations (${allocationTotal.toFixed(2)}) must equal award amount (${awardAmount.toFixed(2)})`,
        400
      );
    }

    // Verify budget items exist and have sufficient available balance
    for (const allocation of validatedData.budgetAllocations) {
      const budgetItem = await prisma.budgetItem.findUnique({
        where: { id: allocation.budgetItemId },
        include: {
          _count: {
            select: { commitments: true }
          }
        }
      });

      if (!budgetItem) {
        return errorResponse(`Budget item ${allocation.budgetItemId} not found`, 404);
      }

      // Calculate committed amount for this budget item
      const commitments = await prisma.commitment.findMany({
        where: {
          budgetAllocations: {
            some: { budgetItemId: allocation.budgetItemId }
          },
          status: { in: ['DRAFT', 'ACTIVE'] }
        }
      });

      const committedAmount = commitments.reduce((sum, c) => {
        const alloc = (c.budgetAllocations as any[])?.find(
          a => a.budgetItemId === allocation.budgetItemId
        );
        return sum.plus(alloc?.amount || 0);
      }, new Decimal(0));

      const availableAmount = new Decimal(budgetItem.amount).minus(committedAmount);

      if (availableAmount.lessThan(allocation.amount)) {
        return errorResponse(
          `Insufficient budget in item ${budgetItem.name}. Available: ${availableAmount.toFixed(2)}, Requested: ${allocation.amount}`,
          400
        );
      }
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the award
      const award = await tx.award.create({
        data: {
          rfpId: bid.rfpId,
          bidId: validatedData.bidId,
          vendorId: bid.vendorId,
          awardAmount: validatedData.awardAmount,
          awardDate: new Date(),
          awardedById: authUser.uid,
          status: 'ACTIVE',
          justification: validatedData.justification,
          metadata: {
            approvals: validatedData.approvals,
            originalBidAmount: bid.totalAmount,
            adjustedBidAmount: bid.adjustedAmount
          }
        }
      });

      // 2. Update bid status
      await tx.bid.update({
        where: { id: validatedData.bidId },
        data: { status: 'AWARDED' }
      });

      // 3. Update other bids to UNSUCCESSFUL
      await tx.bid.updateMany({
        where: {
          rfpId: bid.rfpId,
          id: { not: validatedData.bidId },
          status: 'SUBMITTED'
        },
        data: { status: 'UNSUCCESSFUL' }
      });

      // 4. Generate contract number
      const contractNumber = `${validatedData.commitmentType === 'PURCHASE_ORDER' ? 'PO' : 'CO'}-${
        bid.rfp.project.code || 'PROJ'
      }-${Date.now().toString().slice(-6)}`;

      // 5. Create commitment
      const commitment = await tx.commitment.create({
        data: {
          projectId: bid.rfp.projectId,
          type: validatedData.commitmentType,
          contractNumber,
          status: 'DRAFT',
          vendorId: bid.vendorId,
          rfpId: bid.rfpId,
          awardId: award.id,
          originalAmount: validatedData.awardAmount,
          currentAmount: validatedData.awardAmount,
          committedAmount: 0,
          spentAmount: 0,
          retentionAmount: 0,
          startDate: new Date(validatedData.contractTerms.startDate),
          endDate: validatedData.contractTerms.endDate
            ? new Date(validatedData.contractTerms.endDate)
            : null,
          paymentTerms: validatedData.contractTerms.paymentTerms,
          retentionPercentage: validatedData.contractTerms.retentionPercentage || 0,
          idempotencyKey,
          budgetAllocations: validatedData.budgetAllocations,
          metadata: {
            contractTerms: validatedData.contractTerms,
            bidItems: bid.items.map(item => ({
              rfpItemId: item.rfpItemId,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            })),
            adjustments: bid.adjustments.map(adj => ({
              type: adj.type,
              label: adj.label,
              amount: adj.amount
            }))
          },
          createdById: authUser.uid,
          updatedById: authUser.uid
        }
      });

      // 6. Update RFP status if all items are awarded
      const unawarded = await tx.bid.count({
        where: {
          rfpId: bid.rfpId,
          status: 'SUBMITTED'
        }
      });

      if (unawarded === 0) {
        await tx.rfp.update({
          where: { id: bid.rfpId },
          data: { status: 'AWARDED' }
        });
      }

      // 7. Create budget transactions for tracking
      for (const allocation of validatedData.budgetAllocations) {
        await tx.budgetTransaction.create({
          data: {
            budgetItemId: allocation.budgetItemId,
            type: 'COMMITMENT',
            amount: -allocation.amount, // Negative for commitment
            description: `Commitment for ${bid.rfp.title}`,
            referenceType: 'COMMITMENT',
            referenceId: commitment.id,
            createdById: authUser.uid
          }
        });
      }

      return {
        award,
        commitment
      };
    });

    // Send notifications
    try {
      const notificationService = createNotificationService();

      // Notify winning vendor
      await notificationService.sendAwardNotification(
        bid.vendor.email,
        bid.vendor.name,
        bid.rfp.title,
        validatedData.awardAmount
      );

      // Notify unsuccessful bidders
      const unsuccessfulBids = await prisma.bid.findMany({
        where: {
          rfpId: bid.rfpId,
          status: 'UNSUCCESSFUL'
        },
        include: {
          vendor: true
        }
      });

      for (const unsuccessfulBid of unsuccessfulBids) {
        await notificationService.sendUnsuccessfulBidNotification(
          unsuccessfulBid.vendor.email,
          unsuccessfulBid.vendor.name,
          bid.rfp.title
        );
      }
    } catch (emailError) {
      console.error('Failed to send award notifications:', emailError);
    }

    return successResponse(
      result,
      'Bid awarded and commitment created successfully',
      201
    );
  } catch (error) {
    console.error('Error creating award:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid award data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}