// app/api/v1/rfps/[rfpId]/tabulation/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { errorResponse } from '@/lib/api/response';
import { BidTabulationService } from '@/lib/services/bid-tab.service';

interface RouteParams {
  params: Promise<{
    rfpId: string;
  }>;
}

// GET /api/v1/rfps/[rfpId]/tabulation/export
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { rfpId } = await params;

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

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';