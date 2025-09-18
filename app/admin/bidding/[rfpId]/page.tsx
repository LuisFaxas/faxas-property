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
  Edit,
  Send,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Package,
  Download,
  Eye,
  Award,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { LoadingState } from '@/components/ui/loading-state';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface PageProps {
  params: { rfpId: string };
}

export default function RfpDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch RFP details
  const { data: rfp, isLoading } = useQuery({
    queryKey: ['rfp', params.rfpId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/rfps/${params.rfpId}`);
      return response.data.data;
    }
  });

  // Fetch bids for this RFP
  const { data: bids } = useQuery({
    queryKey: ['bids', params.rfpId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/bids?rfpId=${params.rfpId}`);
      return response.data.data.bids;
    },
    enabled: !!params.rfpId
  });

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
  if (!rfp) return <div>RFP not found</div>;

  const canPublish = rfp.status === 'DRAFT' && rfp.items?.length > 0;
  const canCompare = rfp.status === 'PUBLISHED' && bids?.length > 0 &&
                     rfp.bidOpeningDate && new Date(rfp.bidOpeningDate) <= new Date();
  const canAward = canCompare && rfp.status !== 'AWARDED';

  return (
    <PageShell
      title={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/bidding')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span>{rfp.title}</span>
          <Badge className={`${getStatusColor(rfp.status)} text-white`}>
            {rfp.status}
          </Badge>
        </div>
      }
      description={rfp.description || 'No description provided'}
      action={
        rfp.status === 'DRAFT' ? {
          label: 'Edit RFP',
          onClick: () => router.push(`/admin/bidding/${params.rfpId}/edit`),
          icon: Edit
        } : undefined
      }
    >
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {canPublish && (
          <Button
            variant="default"
            onClick={() => {/* Publish RFP */}}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish RFP
          </Button>
        )}

        {rfp.status === 'PUBLISHED' && (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/bidding/${params.rfpId}/invite`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Invite Vendors
          </Button>
        )}

        {canCompare && (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/bidding/${params.rfpId}/compare`)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Compare Bids
          </Button>
        )}

        {canAward && (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/bidding/${params.rfpId}/award`)}
          >
            <Award className="h-4 w-4 mr-2" />
            Award Contract
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-lg font-semibold text-white">{rfp.items?.length || 0}</p>
                <p className="text-xs text-white/60">Line Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-lg font-semibold text-white">{rfp._count?.invitations || 0}</p>
                <p className="text-xs text-white/60">Invited</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-lg font-semibold text-white">{bids?.length || 0}</p>
                <p className="text-xs text-white/60">Bids</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-lg font-semibold text-white">
                  ${((rfp.estimatedValue || 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-white/60">Est. Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-white/5 overflow-x-auto mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items ({rfp.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({rfp._count?.invitations || 0})</TabsTrigger>
          <TabsTrigger value="bids">Bids ({bids?.length || 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Dates */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Key Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rfp.issueDate && (
                <div className="flex justify-between">
                  <span className="text-white/60">Issue Date</span>
                  <span className="text-white">
                    {format(new Date(rfp.issueDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              )}
              {rfp.dueDate && (
                <div className="flex justify-between">
                  <span className="text-white/60">Due Date</span>
                  <span className="text-white">
                    {format(new Date(rfp.dueDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              )}
              {rfp.bidOpeningDate && (
                <div className="flex justify-between">
                  <span className="text-white/60">Bid Opening</span>
                  <span className="text-white">
                    {format(new Date(rfp.bidOpeningDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              )}
              {rfp.preProposalDate && (
                <div className="flex justify-between">
                  <span className="text-white/60">Pre-Proposal Meeting</span>
                  <span className="text-white">
                    {format(new Date(rfp.preProposalDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          {rfp.requirements && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {rfp.requirements.bondRequired && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-white">
                        Bid Bond: {rfp.requirements.bidBondPercent}%
                      </span>
                    </li>
                  )}
                  {rfp.requirements.performanceBondRequired && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-white">
                        Performance Bond: {rfp.requirements.performanceBondPercent}%
                      </span>
                    </li>
                  )}
                  {rfp.requirements.insuranceRequired && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-white">Insurance Required</span>
                    </li>
                  )}
                  {rfp.requirements.prevailingWageRequired && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-white">Prevailing Wage Required</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {rfp.items?.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No items added yet</p>
                {rfp.status === 'DRAFT' && (
                  <Button
                    onClick={() => router.push(`/admin/bidding/${params.rfpId}/edit`)}
                    className="mt-4"
                    variant="outline"
                  >
                    Add Items
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="text-left p-4 text-white/60 font-medium">Code</th>
                        <th className="text-left p-4 text-white/60 font-medium">Description</th>
                        <th className="text-right p-4 text-white/60 font-medium">Qty</th>
                        <th className="text-left p-4 text-white/60 font-medium">Unit</th>
                        <th className="text-right p-4 text-white/60 font-medium">Est. Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfp.items?.map((item: any) => (
                        <tr key={item.id} className="border-b border-white/5">
                          <td className="p-4 text-white font-mono text-sm">{item.specCode}</td>
                          <td className="p-4 text-white">{item.description}</td>
                          <td className="p-4 text-white text-right">{item.qty}</td>
                          <td className="p-4 text-white">{item.uom}</td>
                          <td className="p-4 text-white text-right">
                            {item.estimatedUnitPrice ?
                              `$${(item.estimatedUnitPrice * item.qty).toFixed(2)}` :
                              '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          {rfp._count?.invitations === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No vendors invited yet</p>
                {rfp.status === 'PUBLISHED' && (
                  <Button
                    onClick={() => router.push(`/admin/bidding/${params.rfpId}/invite`)}
                    className="mt-4"
                    variant="outline"
                  >
                    Invite Vendors
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>Vendor invitations will be displayed here</div>
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-4">
          {bids?.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No bids received yet</p>
              </CardContent>
            </Card>
          ) : (
            bids?.map((bid: any) => (
              <Card key={bid.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{bid.vendor.name}</h4>
                    <Badge className={bid.status === 'SUBMITTED' ? 'bg-green-500' : 'bg-gray-500'}>
                      {bid.status}
                    </Badge>
                  </div>
                  {bid.totalAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Total Amount</span>
                      <span className="text-white font-medium">
                        ${bid.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {bid.submittedAt && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-white/60">Submitted</span>
                      <span className="text-white">
                        {format(new Date(bid.submittedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Document management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}