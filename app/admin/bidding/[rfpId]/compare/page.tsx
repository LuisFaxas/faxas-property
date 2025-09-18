'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/blocks/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  Award,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  DollarSign,
  Calculator,
  FileSpreadsheet
} from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PageProps {
  params: { rfpId: string };
}

export default function BidComparisonPage({ params }: PageProps) {
  const router = useRouter();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [showDiscrepancies, setShowDiscrepancies] = useState(false);

  // Fetch bid tabulation data
  const { data: tabulation, isLoading } = useQuery({
    queryKey: ['bid-tabulation', params.rfpId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/rfps/${params.rfpId}/tabulation`);
      return response.data.data;
    }
  });

  // Export to CSV
  const handleExport = async () => {
    try {
      const response = await apiClient.get(
        `/api/v1/rfps/${params.rfpId}/tabulation/export`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bid-comparison-${params.rfpId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!tabulation) return <div>No bid data available</div>;

  const { rfp, vendors, items, totals, adjustedTotals, rankings, scopeGaps, lowestBidder } = tabulation;

  return (
    <PageShell
      title={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/bidding/${params.rfpId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span>Bid Comparison: {rfp.title}</span>
        </div>
      }
      description={`Comparing ${vendors.length} bids · ${items.length} items`}
      action={{
        label: 'Export CSV',
        onClick: handleExport,
        icon: Download
      }}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Lowest Bidder Card */}
        {lowestBidder && (
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-white/60">Lowest Bidder</p>
                  <p className="font-semibold text-white">{lowestBidder.vendorName}</p>
                  <p className="text-xl font-bold text-green-500">
                    ${lowestBidder.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bid Range Card */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm text-white/60">Bid Range</p>
                <p className="font-semibold text-white">
                  ${Math.min(...Object.values(adjustedTotals)).toLocaleString()}
                  {' - '}
                  ${Math.max(...Object.values(adjustedTotals)).toLocaleString()}
                </p>
                <p className="text-sm text-white/60">
                  Spread: ${(Math.max(...Object.values(adjustedTotals)) -
                           Math.min(...Object.values(adjustedTotals))).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discrepancies Card */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm text-white/60">Scope Gaps</p>
                <p className="text-xl font-bold text-white">
                  {Object.keys(scopeGaps).length}
                </p>
                <p className="text-sm text-white/60">vendors with discrepancies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Vendor Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankings.map((rank: any) => {
              const vendor = vendors.find((v: any) => v.id === rank.vendorId);
              return (
                <div
                  key={rank.vendorId}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedVendorId === rank.vendorId
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  onClick={() => setSelectedVendorId(rank.vendorId)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full
                      ${rank.rank === 1 ? 'bg-green-500' :
                        rank.rank === 2 ? 'bg-blue-500' :
                        rank.rank === 3 ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                      <span className="text-white font-bold text-sm">#{rank.rank}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{vendor?.name}</p>
                      <p className="text-sm text-white/60">
                        Submitted {new Date(vendor?.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      ${rank.total.toLocaleString()}
                    </p>
                    {scopeGaps[rank.vendorId] && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        {scopeGaps[rank.vendorId].length} gaps
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Award Button */}
          {lowestBidder && (
            <Button
              className="w-full mt-4"
              onClick={() => router.push(`/admin/bidding/${params.rfpId}/award?vendorId=${lowestBidder.vendorId}`)}
            >
              <Award className="h-4 w-4 mr-2" />
              Proceed to Award
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Line Item Comparison</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscrepancies(!showDiscrepancies)}
            >
              {showDiscrepancies ? 'Show All' : 'Show Discrepancies Only'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-gray-900 z-10">Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  {vendors.map((vendor: any) => (
                    <TableHead key={vendor.id} className="text-right min-w-[120px]">
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-xs text-white/60">
                          Rank #{rankings.find((r: any) => r.vendorId === vendor.id)?.rank}
                        </p>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items
                  .filter((item: any) => {
                    if (!showDiscrepancies) return true;
                    return Object.values(item.bids).some((bid: any) => bid?.hasDiscrepancy);
                  })
                  .map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="sticky left-0 bg-gray-900 z-10">
                        <div>
                          <p className="font-mono text-sm text-white/60">{item.specCode}</p>
                          <p className="text-sm text-white">{item.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-white">{item.qty}</TableCell>
                      <TableCell className="text-white">{item.uom}</TableCell>
                      {vendors.map((vendor: any) => {
                        const bid = item.bids[vendor.id];
                        if (!bid) {
                          return (
                            <TableCell key={vendor.id} className="text-center">
                              <X className="h-4 w-4 text-red-500 mx-auto" />
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={vendor.id} className="text-right">
                            <div>
                              <p className="font-medium text-white">
                                ${bid.totalPrice.toLocaleString()}
                              </p>
                              <p className="text-xs text-white/60">
                                ${bid.unitPrice}/unit
                              </p>
                              {bid.hasDiscrepancy && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">
                                  {bid.notes}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}

                {/* Subtotal Row */}
                <TableRow className="border-t-2 border-white/20">
                  <TableCell className="sticky left-0 bg-gray-900 z-10 font-bold text-white">
                    SUBTOTAL
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  {vendors.map((vendor: any) => (
                    <TableCell key={vendor.id} className="text-right font-bold text-white">
                      ${totals[vendor.id]?.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Adjustments Row */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-gray-900 z-10 font-bold text-white">
                    ADJUSTMENTS
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  {vendors.map((vendor: any) => {
                    const adjustment = (adjustedTotals[vendor.id] || 0) - (totals[vendor.id] || 0);
                    return (
                      <TableCell key={vendor.id} className="text-right">
                        <span className={adjustment >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {adjustment >= 0 ? '+' : ''}${Math.abs(adjustment).toLocaleString()}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Total Row */}
                <TableRow className="border-t-2 border-white/20 bg-white/5">
                  <TableCell className="sticky left-0 bg-gray-800 z-10 font-bold text-white">
                    TOTAL
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  {vendors.map((vendor: any) => {
                    const isLowest = vendor.id === lowestBidder?.vendorId;
                    return (
                      <TableCell key={vendor.id} className="text-right">
                        <div className={isLowest ? 'text-green-500' : 'text-white'}>
                          <p className="text-xl font-bold">
                            ${adjustedTotals[vendor.id]?.toLocaleString()}
                          </p>
                          {isLowest && (
                            <Badge className="bg-green-500 text-white mt-1">
                              LOWEST
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}