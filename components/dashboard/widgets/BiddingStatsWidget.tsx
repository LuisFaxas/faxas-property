'use client';

import { Widget } from '@/components/dashboard/Widget';
import { useAllRfps } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  FileText,
  TrendingUp,
  Clock,
  Award,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export function BiddingStatsWidget() {
  const router = useRouter();
  const { data: rfps, isLoading } = useAllRfps();

  // Calculate stats
  const stats = {
    total: rfps?.length || 0,
    active: rfps?.filter((r: any) => r.status === 'PUBLISHED').length || 0,
    pending: rfps?.filter((r: any) => r.status === 'DRAFT').length || 0,
    awarded: rfps?.filter((r: any) => r.status === 'AWARDED').length || 0,
    totalValue: rfps?.reduce((sum: number, r: any) => sum + (r.estimatedValue || 0), 0) || 0,
    dueSoon: rfps?.filter((r: any) => {
      if (!r.dueDate || r.status !== 'PUBLISHED') return false;
      const daysUntilDue = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    }).length || 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-500';
      case 'PUBLISHED': return 'bg-blue-500';
      case 'CLOSED': return 'bg-yellow-500';
      case 'AWARDED': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Widget className="lg:col-span-2">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget className="lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Bidding & RFPs</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/bidding')}
          className="text-white/60 hover:text-white"
        >
          View all
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.active}</div>
          <div className="text-xs text-white/60">Active RFPs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{stats.awarded}</div>
          <div className="text-xs text-white/60">Awarded</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            ${(stats.totalValue / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-white/60">Total Value</div>
        </div>
      </div>

      {/* Alert for RFPs due soon */}
      {stats.dueSoon > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
          <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-yellow-500 font-medium">{stats.dueSoon} RFP{stats.dueSoon !== 1 ? 's' : ''}</span>
            <span className="text-white/60"> due within 7 days</span>
          </div>
        </div>
      )}

      {/* Recent RFPs */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-white/60 mb-2">Recent Activity</div>
        {rfps && rfps.length > 0 ? (
          rfps.slice(0, 3).map((rfp: any) => (
            <div
              key={rfp.id}
              className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              onClick={() => router.push(`/admin/bidding/${rfp.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {rfp.title}
                </div>
                <div className="text-xs text-white/60">
                  {rfp._count?.bids || 0} bids · ${((rfp.estimatedValue || 0) / 1000).toFixed(0)}k
                </div>
              </div>
              <Badge className={`${getStatusColor(rfp.status)} text-white text-xs`}>
                {rfp.status}
              </Badge>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <FileText className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/60">No RFPs yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.push('/admin/bidding/new')}
            >
              Create First RFP
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push('/admin/bidding/new')}
        >
          <FileText className="h-4 w-4 mr-1" />
          New RFP
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push('/admin/vendors')}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Vendors
        </Button>
      </div>
    </Widget>
  );
}