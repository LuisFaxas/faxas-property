// app/api/v1/rfps/[rfpId]/tabulation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response-utils';
import { BidTabulationService } from '@/lib/services/bid-tab.service';
import { z } from 'zod';

interface RouteParams {
  params: {
    rfpId: string;
  };
}

// GET /api/v1/rfps/[rfpId]/tabulation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF', 'VIEWER']);
    const { rfpId } = params;

    // Check if RFP exists
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        title: true,
        status: true,
        bidOpeningDate: true,
        _count: {
          select: {
            bids: {
              where: { status: 'SUBMITTED' }
            }
          }
        }
      }
    });

    if (!rfp) {
      return errorResponse('RFP not found', 404);
    }

    // Check if bids can be viewed (after opening date)
    const now = new Date();
    if (rfp.bidOpeningDate && rfp.bidOpeningDate > now) {
      return errorResponse('Bids cannot be tabulated before opening date', 403);
    }

    if (rfp._count.bids === 0) {
      return errorResponse('No submitted bids to tabulate', 404);
    }

    // Generate comparison using the service
    const comparison = await BidTabulationService.generateComparison(rfpId);

    // Identify scope gaps
    const scopeGaps = BidTabulationService.identifyScopeGaps(comparison);

    // Get lowest responsible bidder
    const lowestBidder = BidTabulationService.getLowestResponsibleBidder(comparison);

    // Format response for API
    const response = {
      rfp: {
        id: rfp.id,
        title: rfp.title,
        status: rfp.status,
        bidCount: rfp._count.bids
      },
      vendors: comparison.vendors.map(v => ({
        id: v.id,
        name: v.name,
        bidId: v.bid.id,
        status: v.bid.status,
        submittedAt: v.bid.submittedAt
      })),
      items: comparison.rfpItems.map(item => {
        const itemBids: any = {};

        for (const vendor of comparison.vendors) {
          const vendorItems = comparison.matrix.get(vendor.id);
          const bidItem = vendorItems?.get(item.id);

          itemBids[vendor.id] = bidItem ? {
            unitPrice: bidItem.originalUnitPrice.toNumber(),
            totalPrice: bidItem.totalPrice.toNumber(),
            hasDiscrepancy: bidItem.hasDiscrepancy,
            notes: bidItem.notes
          } : null;
        }

        return {
          id: item.id,
          specCode: item.specCode,
          description: item.description,
          qty: item.qty,
          uom: item.uom,
          bids: itemBids
        };
      }),
      adjustments: Object.fromEntries(
        Array.from(comparison.adjustments.entries()).map(([vendorId, adjs]) => [
          vendorId,
          adjs.map(adj => ({
            type: adj.type,
            label: adj.label,
            amount: adj.amount,
            isAccepted: adj.isAccepted
          }))
        ])
      ),
      totals: Object.fromEntries(
        Array.from(comparison.totals.entries()).map(([vendorId, total]) => [
          vendorId,
          total.toNumber()
        ])
      ),
      adjustedTotals: Object.fromEntries(
        Array.from(comparison.adjustedTotals.entries()).map(([vendorId, total]) => [
          vendorId,
          total.toNumber()
        ])
      ),
      rankings: comparison.rankings.map(r => ({
        vendorId: r.vendorId,
        vendorName: comparison.vendors.find(v => v.id === r.vendorId)?.name,
        rank: r.rank,
        total: r.total.toNumber()
      })),
      scopeGaps: Object.fromEntries(scopeGaps),
      lowestBidder: lowestBidder ? {
        vendorId: lowestBidder.vendorId,
        vendorName: comparison.vendors.find(v => v.id === lowestBidder.vendorId)?.name,
        total: lowestBidder.total.toNumber()
      } : null
    };

    return successResponse(response);
  } catch (error) {
    console.error('Error generating bid tabulation:', error);
    return errorResponse(error);
  }
}

// POST /api/v1/rfps/[rfpId]/tabulation/leveling
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { rfpId } = params;
    const body = await request.json();

    const levelingSchema = z.object({
      bidId: z.string().cuid(),
      adjustments: z.array(z.object({
        type: z.enum(['ADD', 'DEDUCT', 'ALTERNATE', 'ALLOWANCE', 'PLUG', 'NORMALIZATION']),
        category: z.string(),
        label: z.string(),
        amount: z.number().min(0),
        description: z.string().optional()
      }))
    });

    // Validate input
    const validatedData = levelingSchema.parse(body);

    // Verify bid exists and belongs to this RFP
    const bid = await prisma.bid.findFirst({
      where: {
        id: validatedData.bidId,
        rfpId
      }
    });

    if (!bid) {
      return errorResponse('Bid not found or does not belong to this RFP', 404);
    }

    // Apply leveling adjustments
    await BidTabulationService.applyLevelingAdjustments(
      validatedData.bidId,
      validatedData.adjustments
    );

    // Regenerate comparison with new adjustments
    const comparison = await BidTabulationService.generateComparison(rfpId);

    return successResponse({
      message: 'Leveling adjustments applied successfully',
      newTotal: comparison.adjustedTotals.get(bid.vendorId)?.toNumber(),
      newRank: comparison.rankings.find(r => r.vendorId === bid.vendorId)?.rank
    });
  } catch (error) {
    console.error('Error applying leveling adjustments:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid leveling data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}

// GET /api/v1/rfps/[rfpId]/tabulation/export
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { rfpId } = params;

    // Check if RFP exists
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        title: true,
        bidOpeningDate: true
      }
    });

    if (!rfp) {
      return errorResponse('RFP not found', 404);
    }

    // Check if bids can be exported (after opening date)
    const now = new Date();
    if (rfp.bidOpeningDate && rfp.bidOpeningDate > now) {
      return errorResponse('Bids cannot be exported before opening date', 403);
    }

    // Generate comparison and export to CSV
    const comparison = await BidTabulationService.generateComparison(rfpId);
    const csv = BidTabulationService.exportToCSV(comparison);

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bid-tabulation-${rfp.title.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting bid tabulation:', error);
    return errorResponse(error);
  }
}