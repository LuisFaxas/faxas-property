'use client';

import { useState } from 'react';
import { useAwardBid } from '@/hooks/use-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Award,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Bid {
  id: string;
  vendor: {
    id: string;
    name: string;
    email?: string;
  };
  totalAmount: number;
  submittedAt?: string;
  status: string;
  notes?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    storagePath: string;
  }>;
}

interface BidTabulationProps {
  rfp: {
    id: string;
    title: string;
    estimatedValue?: number;
    status: string;
  };
  bids: Bid[];
  projectId?: string;
  onAward?: (bidId: string) => void;
  onViewDetails?: (bidId: string) => void;
  onDownloadAttachment?: (attachmentId: string) => void;
}

export function BidTabulation({
  rfp,
  bids,
  projectId,
  onAward,
  onViewDetails,
  onDownloadAttachment
}: BidTabulationProps) {
  const [sortBy, setSortBy] = useState<'amount' | 'vendor' | 'date'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const awardBidMutation = useAwardBid();

  const handleAward = (bidId: string) => {
    if (onAward) {
      onAward(bidId);
    } else {
      // Use the mutation directly
      awardBidMutation.mutate({ bidId, rfpId: rfp.id });
    }
  };

  // Calculate statistics
  const validBids = bids.filter(b => b.status === 'SUBMITTED' && b.totalAmount);
  const lowestBid = validBids.length > 0
    ? Math.min(...validBids.map(b => b.totalAmount))
    : 0;
  const highestBid = validBids.length > 0
    ? Math.max(...validBids.map(b => b.totalAmount))
    : 0;
  const averageBid = validBids.length > 0
    ? validBids.reduce((sum, b) => sum + b.totalAmount, 0) / validBids.length
    : 0;

  // Sort bids
  const sortedBids = [...bids].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'amount':
        comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
        break;
      case 'vendor':
        comparison = a.vendor.name.localeCompare(b.vendor.name);
        break;
      case 'date':
        comparison = new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (newSortBy: 'amount' | 'vendor' | 'date') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Submitted</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Draft</Badge>;
      case 'INVITED':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Invited</Badge>;
      case 'AWARDED':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Awarded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAmountIndicator = (amount: number) => {
    if (amount === lowestBid) {
      return (
        <span className="text-green-400 text-xs ml-2">
          <TrendingDown className="h-3 w-3 inline" /> Lowest
        </span>
      );
    }
    if (amount === highestBid) {
      return (
        <span className="text-red-400 text-xs ml-2">
          <TrendingUp className="h-3 w-3 inline" /> Highest
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60">Total Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{validBids.length}</p>
            <p className="text-xs text-white/40 mt-1">
              {bids.length - validBids.length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60">Lowest Bid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              ${lowestBid.toLocaleString()}
            </p>
            {rfp.estimatedValue && (
              <p className="text-xs text-white/40 mt-1">
                {((lowestBid / rfp.estimatedValue) * 100).toFixed(0)}% of estimate
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60">Average Bid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ${averageBid.toLocaleString()}
            </p>
            {rfp.estimatedValue && (
              <p className="text-xs text-white/40 mt-1">
                {((averageBid / rfp.estimatedValue) * 100).toFixed(0)}% of estimate
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60">Spread</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ${(highestBid - lowestBid).toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {lowestBid > 0 ? (((highestBid - lowestBid) / lowestBid) * 100).toFixed(0) : 0}% variance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bid Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bid Comparison</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Rank</TableHead>
                <TableHead
                  className="text-white/60 cursor-pointer hover:text-white"
                  onClick={() => handleSort('vendor')}
                >
                  Vendor {sortBy === 'vendor' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="text-white/60 cursor-pointer hover:text-white"
                  onClick={() => handleSort('amount')}
                >
                  Bid Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead
                  className="text-white/60 cursor-pointer hover:text-white"
                  onClick={() => handleSort('date')}
                >
                  Submitted {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-white/60">Attachments</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBids.map((bid, index) => (
                <TableRow key={bid.id} className="border-white/10">
                  <TableCell>
                    {bid.totalAmount && bid.status === 'SUBMITTED' ? (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        bid.totalAmount === lowestBid && "bg-green-500/20 text-green-400",
                        bid.totalAmount !== lowestBid && "bg-white/10 text-white/60"
                      )}>
                        {sortedBids.filter(b => b.status === 'SUBMITTED' && b.totalAmount)
                          .sort((a, b) => a.totalAmount - b.totalAmount)
                          .findIndex(b => b.id === bid.id) + 1}
                      </div>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{bid.vendor.name}</p>
                      {bid.vendor.email && (
                        <p className="text-xs text-white/40">{bid.vendor.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {bid.totalAmount ? (
                      <div className="flex items-center">
                        <span className="font-semibold text-white">
                          ${bid.totalAmount.toLocaleString()}
                        </span>
                        {getAmountIndicator(bid.totalAmount)}
                      </div>
                    ) : (
                      <span className="text-white/40">Not submitted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(bid.status)}
                  </TableCell>
                  <TableCell>
                    {bid.submittedAt ? (
                      <div>
                        <p className="text-sm text-white">
                          {format(new Date(bid.submittedAt), 'MMM d')}
                        </p>
                        <p className="text-xs text-white/40">
                          {format(new Date(bid.submittedAt), 'h:mm a')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {bid.attachments && bid.attachments.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadAttachment?.(bid.attachments![0].id)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {bid.attachments.length}
                      </Button>
                    ) : (
                      <span className="text-white/40">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails?.(bid.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {bid.status === 'SUBMITTED' && rfp.status !== 'AWARDED' && (
                          <DropdownMenuItem
                            onClick={() => handleAward(bid.id)}
                            className="text-green-400"
                          >
                            <Award className="mr-2 h-4 w-4" />
                            Award Contract
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
          <span>Lowest bid</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <span>Submitted</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <span>Requires review</span>
        </div>
      </div>
    </div>
  );
}