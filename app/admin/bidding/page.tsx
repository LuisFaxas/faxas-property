'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  Users,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useAllRfps } from '@/hooks/use-api';
import { formatDistanceToNow, format } from 'date-fns';
import { LoadingState } from '@/components/ui/loading-state';

export default function BiddingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data, isLoading, error } = useAllRfps();

  const filteredRfps = data?.filter((rfp: any) => {
    const matchesSearch = rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rfp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || rfp.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: data?.length || 0,
    active: data?.filter((r: any) => r.status === 'PUBLISHED').length || 0,
    pending: data?.filter((r: any) => r.status === 'DRAFT').length || 0,
    awarded: data?.filter((r: any) => r.status === 'AWARDED').length || 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-500';
      case 'PUBLISHED': return 'bg-blue-500';
      case 'CLOSED': return 'bg-yellow-500';
      case 'AWARDED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <div>Error loading RFPs</div>;

  return (
    <PageShell pageTitle="Bidding & RFPs">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Action Button */}
        <div className="flex justify-end mb-6">
        <Button onClick={() => router.push('/admin/bidding/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New RFP
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-semibold text-white">{stats.total}</p>
                <p className="text-sm text-white/60">Total RFPs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-semibold text-white">{stats.active}</p>
                <p className="text-sm text-white/60">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-semibold text-white">{stats.pending}</p>
                <p className="text-sm text-white/60">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-semibold text-white">{stats.awarded}</p>
                <p className="text-sm text-white/60">Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search RFPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full justify-start bg-white/5 overflow-x-auto">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="DRAFT">Draft</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
            <TabsTrigger value="CLOSED">Closed</TabsTrigger>
            <TabsTrigger value="AWARDED">Awarded</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* RFP List */}
      <div className="space-y-4">
        {filteredRfps.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No RFPs found</p>
              <Button
                onClick={() => router.push('/admin/bidding/new')}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First RFP
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRfps.map((rfp: any) => (
            <Card
              key={rfp.id}
              className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => router.push(`/admin/bidding/${rfp.id}`)}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-white text-lg line-clamp-1">
                        {rfp.title}
                      </h3>
                      <Badge className={`${getStatusColor(rfp.status)} text-white`}>
                        {rfp.status}
                      </Badge>
                    </div>
                    {rfp.description && (
                      <p className="text-white/60 text-sm line-clamp-2 mb-3">
                        {rfp.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {rfp.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-white/40" />
                          <span className="text-white/60">
                            Due {formatDistanceToNow(new Date(rfp.dueDate), { addSuffix: true })}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-white/40" />
                        <span className="text-white/60">
                          {rfp._count?.invitations || 0} vendors invited
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-white/40" />
                        <span className="text-white/60">
                          {rfp._count?.bids || 0} bids received
                        </span>
                      </div>

                      {rfp.estimatedValue && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-white/40" />
                          <span className="text-white/60">
                            Est. ${(rfp.estimatedValue / 1000).toFixed(0)}k
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/40 flex-shrink-0 ml-4" />
                </div>

                {/* Quick Actions */}
                {rfp.status === 'PUBLISHED' && rfp._count?.bids > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/bidding/${rfp.id}/compare`);
                      }}
                    >
                      Compare Bids
                    </Button>
                    {rfp.bidOpeningDate && new Date(rfp.bidOpeningDate) <= new Date() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/bidding/${rfp.id}/award`);
                        }}
                      >
                        Award Contract
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
        </div>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={() => router.push('/admin/bidding/new')}
        >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}