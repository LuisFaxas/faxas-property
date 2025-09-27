import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { awardBidSchema } from '@/lib/validations/bids';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

interface RouteParams {
  params: Promise<{
    bidId: string;
  }>;
}

// POST /api/v1/bids/[bidId]/award - Award bid and create commitment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check - per docs/04-auth-security.md requireRole for admin operations
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { bidId } = await params;

    // Get project ID from header - per docs/02-api-inventory.md project scoping
    const projectId = request.headers.get('x-project-id');
    if (!projectId) {
      return errorResponse({ message: 'Project ID required' }, 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const data = awardBidSchema.parse(body);

    // Get bid with all necessary relations
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        rfp: {
          include: {
            project: true
          }
        },
        vendor: true,
        attachments: true
      }
    });

    if (!bid) {
      return errorResponse({ message: 'Bid not found' }, 404);
    }

    // Verify bid belongs to project
    if (bid.rfp.projectId !== projectId) {
      return errorResponse({ message: 'Bid not found in project' }, 404);
    }

    // Check if bid can be awarded
    if (bid.status !== 'SUBMITTED') {
      return errorResponse({ message: 'Only submitted bids can be awarded' }, 400);
    }

    // Check if RFP already has an award
    const existingAward = await prisma.award.findUnique({
      where: { rfpId: bid.rfpId }
    });

    if (existingAward) {
      return errorResponse({ message: 'RFP already has an awarded bid' }, 400);
    }

    // Perform award in transaction - creates commitment and updates budget
    const result = await prisma.$transaction(async (tx) => {
      // Create award record
      const award = await tx.award.create({
        data: {
          rfpId: bid.rfpId,
          winningBidId: bidId,
          awardedBy: authUser.uid,
          awardedAt: new Date(),
          totalAwardAmount: bid.totalAmount,
          memo: data.commitmentNotes
        }
      });

      // Create commitment - need to get a work package ID first
      let workPackage = await tx.workPackage.findFirst({
        where: { projectId: projectId },
        orderBy: { createdAt: 'asc' }
      });

      if (!workPackage) {
        // Create a default work package if none exists
        workPackage = await tx.workPackage.create({
          data: {
            projectId: projectId,
            code: 'GEN-001',
            name: 'General',
            description: 'General work package',
            estimatedAmount: new Decimal(0),
            csiDivision: '01',
            discipline: 'General Conditions',
            createdAt: new Date()
          }
        });
      }

      const commitment = await tx.commitment.create({
        data: {
          projectId: projectId,
          rfpId: bid.rfpId,
          bidId: bidId,
          vendorId: bid.vendorId,
          awardId: award.id,
          type: 'CONTRACT',
          contractNumber: `C-${bid.rfp.title.slice(0, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          workPackageId: workPackage.id,
          originalAmount: bid.totalAmount || new Decimal(0),
          currentAmount: bid.totalAmount || new Decimal(0),
          paidToDate: new Decimal(0),
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: authUser.uid,
          notes: data.commitmentNotes,
          idempotencyKey: `award-${bidId}-${Date.now()}`
        }
      });

      // Update budget item if specified
      let budgetUpdate = null;
      if (data.budgetItemId) {
        const budgetItem = await tx.budgetItem.findUnique({
          where: { id: data.budgetItemId }
        });

        if (budgetItem && budgetItem.projectId === projectId) {
          // Add bid amount to committed total
          const newCommittedTotal = new Decimal(budgetItem.committedTotal).plus(
            bid.totalAmount || new Decimal(0)
          );

          budgetUpdate = await tx.budgetItem.update({
            where: { id: data.budgetItemId },
            data: {
              committedTotal: newCommittedTotal,
              status: newCommittedTotal.gte(budgetItem.estTotal) ? 'COMMITTED' : budgetItem.status
            }
          });
        }
      }

      // Update RFP status to closed
      await tx.rfp.update({
        where: { id: bid.rfpId },
        data: { status: 'CLOSED' }
      });

      // Get updated budget summary for response
      const budgetSummary = await tx.budgetItem.aggregate({
        where: { projectId: projectId },
        _sum: {
          estTotal: true,
          committedTotal: true,
          paidToDate: true
        }
      });

      return {
        award,
        commitment,
        budgetUpdate,
        budgetSummary
      };
    });

    // Return response with updated budget snapshot - per SOT response envelope
    return successResponse({
      award: result.award,
      commitment: result.commitment,
      budgetItem: result.budgetUpdate,
      budgetSummary: {
        totalBudget: result.budgetSummary._sum.estTotal || new Decimal(0),
        totalCommitted: result.budgetSummary._sum.committedTotal || new Decimal(0),
        totalPaid: result.budgetSummary._sum.paidToDate || new Decimal(0),
      }
    }, 'Bid awarded and commitment created successfully');

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse({ message: 'Validation error', details: error.issues }, 400);
    }
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';