// lib/services/bid-tab.service.ts
import { Decimal } from 'decimal.js';
import { prisma } from '@/lib/prisma';
import type { Bid, BidItem, BidAdjustment, RfpItem, UnitOfMeasure } from '@prisma/client';

interface NormalizedBidItem {
  rfpItemId: string;
  vendorId: string;
  originalQty: Decimal;
  originalUnit: UnitOfMeasure;
  originalUnitPrice: Decimal;
  normalizedQty: Decimal;
  normalizedUnit: UnitOfMeasure;
  normalizedUnitPrice: Decimal;
  totalPrice: Decimal;
  hasDiscrepancy: boolean;
  notes?: string;
}

interface BidComparison {
  rfpItems: RfpItem[];
  vendors: Array<{
    id: string;
    name: string;
    bid: Bid;
  }>;
  matrix: Map<string, Map<string, NormalizedBidItem>>;
  adjustments: Map<string, BidAdjustment[]>;
  totals: Map<string, Decimal>;
  adjustedTotals: Map<string, Decimal>;
  rankings: Array<{ vendorId: string; rank: number; total: Decimal }>;
}

export class BidTabulationService {
  // Unit conversion factors (to base units)
  private static readonly UOM_CONVERSIONS: Record<string, Record<string, number>> = {
    // Length conversions (base: LF)
    LF: { LF: 1, FT: 1, IN: 0.0833, YD: 3, M: 3.28084 },
    // Area conversions (base: SF)
    SF: { SF: 1, SY: 9, M2: 10.7639 },
    // Volume conversions (base: CF)
    CF: { CF: 1, CY: 27, M3: 35.3147 },
    // Weight conversions (base: LB)
    LB: { LB: 1, TON: 2000, KG: 2.20462 },
    // Volume liquid (base: GAL)
    GAL: { GAL: 1, L: 0.264172 },
    // Time conversions (base: HR)
    HR: { HR: 1, DAY: 8, WK: 40 }, // Assuming 8-hour workday
    // No conversion needed
    EA: { EA: 1 },
    LS: { LS: 1 },
    LOT: { LOT: 1 }
  };

  /**
   * Generate bid comparison matrix for an RFP
   */
  static async generateComparison(rfpId: string): Promise<BidComparison> {
    // Fetch RFP with items and submitted bids
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
      include: {
        items: {
          orderBy: { specCode: 'asc' }
        },
        bids: {
          where: { status: 'SUBMITTED' },
          include: {
            vendor: true,
            items: true,
            adjustments: {
              orderBy: { sequenceOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!rfp) throw new Error('RFP not found');

    const comparison: BidComparison = {
      rfpItems: rfp.items,
      vendors: rfp.bids.map(bid => ({
        id: bid.vendorId,
        name: bid.vendor.name,
        bid
      })),
      matrix: new Map(),
      adjustments: new Map(),
      totals: new Map(),
      adjustedTotals: new Map(),
      rankings: []
    };

    // Build the comparison matrix
    for (const bid of rfp.bids) {
      const vendorItems = new Map<string, NormalizedBidItem>();
      let vendorTotal = new Decimal(0);

      for (const rfpItem of rfp.items) {
        const bidItem = bid.items.find(bi => bi.rfpItemId === rfpItem.id);

        if (bidItem) {
          const normalized = this.normalizeBidItem(rfpItem, bidItem);
          vendorItems.set(rfpItem.id, normalized);
          vendorTotal = vendorTotal.plus(normalized.totalPrice);
        } else {
          // Missing item - flag as discrepancy
          vendorItems.set(rfpItem.id, {
            rfpItemId: rfpItem.id,
            vendorId: bid.vendorId,
            originalQty: new Decimal(0),
            originalUnit: rfpItem.uom,
            originalUnitPrice: new Decimal(0),
            normalizedQty: new Decimal(0),
            normalizedUnit: rfpItem.uom,
            normalizedUnitPrice: new Decimal(0),
            totalPrice: new Decimal(0),
            hasDiscrepancy: true,
            notes: 'Item not included in bid'
          });
        }
      }

      comparison.matrix.set(bid.vendorId, vendorItems);
      comparison.totals.set(bid.vendorId, vendorTotal);

      // Apply adjustments
      const adjustments = (bid as any).adjustments || [];
      comparison.adjustments.set(bid.vendorId, adjustments);

      let adjustedTotal = vendorTotal;
      for (const adj of adjustments) {
        if (adj.isAccepted) {
          if (adj.type === 'ADD' || adj.type === 'ALLOWANCE') {
            adjustedTotal = adjustedTotal.plus(adj.amount);
          } else if (adj.type === 'DEDUCT') {
            adjustedTotal = adjustedTotal.minus(adj.amount);
          }
        }
      }
      comparison.adjustedTotals.set(bid.vendorId, adjustedTotal);
    }

    // Calculate rankings
    const rankings = Array.from(comparison.adjustedTotals.entries())
      .sort((a, b) => a[1].comparedTo(b[1]))
      .map((entry, index) => ({
        vendorId: entry[0],
        rank: index + 1,
        total: entry[1]
      }));

    comparison.rankings = rankings;

    return comparison;
  }

  /**
   * Normalize bid item quantities and prices for comparison
   */
  private static normalizeBidItem(
    rfpItem: RfpItem,
    bidItem: BidItem & { uom?: UnitOfMeasure }
  ): NormalizedBidItem {
    const rfpQty = new Decimal(rfpItem.qty.toString());
    const bidUnitPrice = new Decimal(bidItem.unitPrice.toString());
    const bidTotalPrice = new Decimal(bidItem.totalPrice.toString());

    // Use the bid item's UoM if provided, otherwise assume it matches RFP
    const bidUom = bidItem.uom || rfpItem.uom;

    // Check if units match
    if (rfpItem.uom === bidUom) {
      // Direct comparison possible
      return {
        rfpItemId: rfpItem.id,
        vendorId: bidItem.bidId,
        originalQty: rfpQty,
        originalUnit: rfpItem.uom,
        originalUnitPrice: bidUnitPrice,
        normalizedQty: rfpQty,
        normalizedUnit: rfpItem.uom,
        normalizedUnitPrice: bidUnitPrice,
        totalPrice: bidTotalPrice,
        hasDiscrepancy: false
      };
    }

    // Need to convert units
    const conversionFactor = this.getConversionFactor(bidUom, rfpItem.uom);

    if (conversionFactor) {
      const normalizedUnitPrice = bidUnitPrice.times(conversionFactor);
      return {
        rfpItemId: rfpItem.id,
        vendorId: bidItem.bidId,
        originalQty: rfpQty,
        originalUnit: bidUom,
        originalUnitPrice: bidUnitPrice,
        normalizedQty: rfpQty,
        normalizedUnit: rfpItem.uom,
        normalizedUnitPrice,
        totalPrice: normalizedUnitPrice.times(rfpQty),
        hasDiscrepancy: false,
        notes: `Converted from ${bidUom} to ${rfpItem.uom}`
      };
    }

    // Cannot convert - flag discrepancy
    return {
      rfpItemId: rfpItem.id,
      vendorId: bidItem.bidId,
      originalQty: rfpQty,
      originalUnit: bidUom,
      originalUnitPrice: bidUnitPrice,
      normalizedQty: rfpQty,
      normalizedUnit: rfpItem.uom,
      normalizedUnitPrice: bidUnitPrice,
      totalPrice: bidTotalPrice,
      hasDiscrepancy: true,
      notes: `Unit mismatch: ${bidUom} vs ${rfpItem.uom}`
    };
  }

  /**
   * Get conversion factor between units of measure
   */
  private static getConversionFactor(
    fromUnit: UnitOfMeasure,
    toUnit: UnitOfMeasure
  ): number | null {
    // Find the base category for each unit
    for (const [, conversions] of Object.entries(this.UOM_CONVERSIONS)) {
      if (conversions[fromUnit] && conversions[toUnit]) {
        // Both units are in the same category
        return conversions[fromUnit] / conversions[toUnit];
      }
    }
    return null; // Cannot convert between these units
  }

  /**
   * Identify scope gaps and discrepancies
   */
  static identifyScopeGaps(comparison: BidComparison): Map<string, string[]> {
    const gaps = new Map<string, string[]>();

    for (const [vendorId, items] of comparison.matrix) {
      const vendorGaps: string[] = [];

      for (const [itemId, normalized] of items) {
        if (normalized.hasDiscrepancy) {
          const rfpItem = comparison.rfpItems.find(i => i.id === itemId);
          vendorGaps.push(
            `${rfpItem?.specCode}: ${normalized.notes || 'Discrepancy'}`
          );
        }
      }

      if (vendorGaps.length > 0) {
        gaps.set(vendorId, vendorGaps);
      }
    }

    return gaps;
  }

  /**
   * Apply leveling adjustments (plugs) to align scopes
   */
  static async applyLevelingAdjustments(
    bidId: string,
    adjustments: Array<{
      type: 'ADD' | 'DEDUCT' | 'ALTERNATE' | 'ALLOWANCE' | 'PLUG' | 'NORMALIZATION';
      category: string;
      label: string;
      amount: number;
      description?: string;
    }>
  ): Promise<void> {
    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing adjustments of type PLUG or NORMALIZATION
      await tx.bidAdjustment.deleteMany({
        where: {
          bidId,
          type: { in: ['PLUG', 'NORMALIZATION'] }
        }
      });

      // Create new adjustments
      await tx.bidAdjustment.createMany({
        data: adjustments.map((adj, index) => ({
          bidId,
          type: adj.type,
          category: adj.category,
          label: adj.label,
          description: adj.description,
          amount: adj.amount,
          isAccepted: true,
          sequenceOrder: index
        }))
      });
    });
  }

  /**
   * Calculate lowest responsible bidder
   */
  static getLowestResponsibleBidder(
    comparison: BidComparison,
    excludeVendorIds: string[] = []
  ): { vendorId: string; total: Decimal } | null {
    const eligibleRankings = comparison.rankings.filter(
      r => !excludeVendorIds.includes(r.vendorId)
    );

    if (eligibleRankings.length === 0) {
      return null;
    }

    const lowest = eligibleRankings[0];
    return {
      vendorId: lowest.vendorId,
      total: lowest.total
    };
  }

  /**
   * Export comparison to CSV format
   */
  static exportToCSV(comparison: BidComparison): string {
    const headers = ['Item Code', 'Description', 'Qty', 'Unit'];
    const vendorHeaders = comparison.vendors.map(v => v.name);
    headers.push(...vendorHeaders);

    const rows: string[][] = [headers];

    // Add item rows
    for (const rfpItem of comparison.rfpItems) {
      const row = [
        rfpItem.specCode,
        rfpItem.description,
        rfpItem.qty.toString(),
        rfpItem.uom
      ];

      for (const vendor of comparison.vendors) {
        const vendorItems = comparison.matrix.get(vendor.id);
        const item = vendorItems?.get(rfpItem.id);
        if (item) {
          row.push(item.totalPrice.toFixed(2));
        } else {
          row.push('N/A');
        }
      }

      rows.push(row);
    }

    // Add totals row
    const totalsRow = ['', 'SUBTOTAL', '', ''];
    for (const vendor of comparison.vendors) {
      const total = comparison.totals.get(vendor.id);
      totalsRow.push(total?.toFixed(2) || '0.00');
    }
    rows.push(totalsRow);

    // Add adjustments
    const adjustmentsRow = ['', 'ADJUSTMENTS', '', ''];
    for (const vendor of comparison.vendors) {
      const vendorTotal = comparison.totals.get(vendor.id) || new Decimal(0);
      const adjustedTotal = comparison.adjustedTotals.get(vendor.id) || new Decimal(0);
      const adjustmentAmount = adjustedTotal.minus(vendorTotal);
      adjustmentsRow.push(adjustmentAmount.toFixed(2));
    }
    rows.push(adjustmentsRow);

    // Add final totals
    const finalRow = ['', 'TOTAL', '', ''];
    for (const vendor of comparison.vendors) {
      const total = comparison.adjustedTotals.get(vendor.id);
      finalRow.push(total?.toFixed(2) || '0.00');
    }
    rows.push(finalRow);

    // Convert to CSV string
    return rows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}