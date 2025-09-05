'use client';

import React, { useState, useMemo } from 'react';
import { Plus, AlertTriangle, Shield, TrendingUp, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Risk } from '@/types';

// Mock data for now - will be replaced with API calls
const mockRisks = [
  {
    id: '1',
    title: 'Weather Delays',
    description: 'Potential delays due to hurricane season',
    category: 'ENVIRONMENTAL',
    probability: 'HIGH',
    impact: 'HIGH',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    owner: 'John Smith',
    identifiedDate: new Date('2024-01-10'),
    dueDate: new Date('2024-02-15'),
    mitigation: 'Schedule critical outdoor work before June. Have backup indoor tasks ready.',
    contingency: 'Add 2-week buffer to timeline for weather-related delays',
    cost: 15000,
    affectedAreas: ['Foundation', 'Roofing', 'Exterior'],
    lastReviewDate: new Date('2024-01-20')
  },
  {
    id: '2',
    title: 'Material Supply Chain',
    description: 'Shortage of specific materials may cause delays',
    category: 'SUPPLY',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    severity: 'MODERATE',
    status: 'MONITORING',
    owner: 'Jane Doe',
    identifiedDate: new Date('2024-01-12'),
    dueDate: new Date('2024-02-01'),
    mitigation: 'Order materials 4 weeks in advance. Maintain list of alternative suppliers.',
    contingency: 'Identify substitute materials that meet specifications',
    cost: 8000,
    affectedAreas: ['Kitchen', 'Bathrooms'],
    lastReviewDate: new Date('2024-01-22')
  },
  {
    id: '3',
    title: 'Permit Approval Delays',
    description: 'City permit office backlog may delay approvals',
    category: 'REGULATORY',
    probability: 'LOW',
    impact: 'HIGH',
    severity: 'MODERATE',
    status: 'MITIGATED',
    owner: 'Bob Manager',
    identifiedDate: new Date('2024-01-05'),
    dueDate: new Date('2024-01-25'),
    mitigation: 'Submit permits early with complete documentation. Follow up weekly.',
    contingency: 'Engage permit expediter if delays exceed 2 weeks',
    cost: 3000,
    affectedAreas: ['Electrical', 'Plumbing'],
    lastReviewDate: new Date('2024-01-18')
  },
  {
    id: '4',
    title: 'Subcontractor Availability',
    description: 'Key subcontractors may not be available when needed',
    category: 'RESOURCE',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    severity: 'MODERATE',
    status: 'ACTIVE',
    owner: 'Sarah Coordinator',
    identifiedDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-10'),
    mitigation: 'Book subcontractors 6 weeks in advance. Maintain backup contractor list.',
    contingency: 'Have vetted backup contractors ready for each trade',
    cost: 5000,
    affectedAreas: ['HVAC', 'Electrical', 'Plumbing'],
    lastReviewDate: new Date('2024-01-23')
  },
  {
    id: '5',
    title: 'Budget Overrun',
    description: 'Unexpected costs may exceed budget allocation',
    category: 'FINANCIAL',
    probability: 'LOW',
    impact: 'VERY_HIGH',
    severity: 'CRITICAL',
    status: 'MONITORING',
    owner: 'Mike Finance',
    identifiedDate: new Date('2024-01-08'),
    dueDate: new Date('2024-02-20'),
    mitigation: 'Maintain 10% contingency fund. Review budget weekly.',
    contingency: 'Prioritize essential work if budget constraints arise',
    cost: 25000,
    affectedAreas: ['Overall Project'],
    lastReviewDate: new Date('2024-01-24')
  }
];

export default function AdminRisksPage() {
  const { toast } = useToast();
  const [isLoading] = useState(false);
  const [risks, setRisks] = useState(mockRisks);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OPERATIONAL',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    status: 'ACTIVE',
    owner: '',
    dueDate: '',
    mitigation: '',
    contingency: '',
    cost: '',
    affectedAreas: ''
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRisks = risks.length;
    const activeRisks = risks.filter(r => r.status === 'ACTIVE').length;
    const criticalRisks = risks.filter(r => r.severity === 'CRITICAL').length;
    const mitigatedRisks = risks.filter(r => r.status === 'MITIGATED').length;
    const totalExposure = risks
      .filter(r => r.status === 'ACTIVE')
      .reduce((sum, r) => sum + r.cost, 0);
    
    const risksByCategory = risks.reduce((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRisks,
      activeRisks,
      criticalRisks,
      mitigatedRisks,
      totalExposure,
      risksByCategory
    };
  }, [risks]);

  // Calculate risk severity based on probability and impact
  const calculateSeverity = (probability: string, impact: string) => {
    const matrix: Record<string, Record<string, string>> = {
      LOW: { LOW: 'LOW', MEDIUM: 'LOW', HIGH: 'MODERATE', VERY_HIGH: 'MODERATE' },
      MEDIUM: { LOW: 'LOW', MEDIUM: 'MODERATE', HIGH: 'MODERATE', VERY_HIGH: 'CRITICAL' },
      HIGH: { LOW: 'MODERATE', MEDIUM: 'MODERATE', HIGH: 'CRITICAL', VERY_HIGH: 'CRITICAL' },
      VERY_HIGH: { LOW: 'MODERATE', MEDIUM: 'CRITICAL', HIGH: 'CRITICAL', VERY_HIGH: 'CRITICAL' }
    };
    return matrix[probability]?.[impact] || 'MODERATE';
  };

  const handleCreate = () => {
    const severity = calculateSeverity(formData.probability, formData.impact);
    const newRisk = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      probability: formData.probability,
      impact: formData.impact,
      severity,
      status: formData.status,
      owner: formData.owner,
      identifiedDate: new Date(),
      dueDate: formData.dueDate ? new Date(formData.dueDate) : new Date(),
      mitigation: formData.mitigation,
      contingency: formData.contingency,
      cost: parseFloat(formData.cost) || 0,
      affectedAreas: formData.affectedAreas.split(',').map(a => a.trim()).filter(Boolean),
      lastReviewDate: new Date()
    };

    setRisks([...risks, newRisk]);
    toast({
      title: 'Success',
      description: 'Risk assessment created successfully',
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedRisk) return;

    const severity = calculateSeverity(formData.probability, formData.impact);
    const updatedRisks = risks.map(r => {
      if (r.id === selectedRisk.id) {
        return {
          ...r,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          probability: formData.probability,
          impact: formData.impact,
          severity,
          status: formData.status,
          owner: formData.owner,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : r.dueDate,
          mitigation: formData.mitigation,
          contingency: formData.contingency,
          cost: parseFloat(formData.cost) || 0,
          affectedAreas: formData.affectedAreas.split(',').map(a => a.trim()).filter(Boolean),
          lastReviewDate: new Date()
        };
      }
      return r;
    });

    setRisks(updatedRisks);
    toast({
      title: 'Success',
      description: 'Risk assessment updated successfully',
    });
    setIsEditOpen(false);
    setSelectedRisk(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedRisk) return;

    setRisks(risks.filter(r => r.id !== selectedRisk.id));
    toast({
      title: 'Success',
      description: 'Risk assessment deleted successfully',
    });
    setIsDeleteOpen(false);
    setSelectedRisk(null);
  };

  const handleMitigate = (riskId: string) => {
    const updatedRisks = risks.map(r => {
      if (r.id === riskId) {
        return { ...r, status: 'MITIGATED' };
      }
      return r;
    });
    setRisks(updatedRisks);
    toast({
      title: 'Success',
      description: 'Risk marked as mitigated',
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'OPERATIONAL',
      probability: 'MEDIUM',
      impact: 'MEDIUM',
      status: 'ACTIVE',
      owner: '',
      dueDate: '',
      mitigation: '',
      contingency: '',
      cost: '',
      affectedAreas: ''
    });
  };

  const openEditDialog = (risk: Risk) => {
    setSelectedRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      probability: risk.probability,
      impact: risk.impact,
      status: risk.status,
      owner: risk.owner,
      dueDate: format(risk.dueDate, 'yyyy-MM-dd'),
      mitigation: risk.mitigation,
      contingency: risk.contingency,
      cost: risk.cost.toString(),
      affectedAreas: risk.affectedAreas.join(', ')
    });
    setIsEditOpen(true);
  };

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return risks.filter(r => r.status === 'ACTIVE');
      case 'critical':
        return risks.filter(r => r.severity === 'CRITICAL');
      case 'mitigated':
        return risks.filter(r => r.status === 'MITIGATED');
      case 'monitoring':
        return risks.filter(r => r.status === 'MONITORING');
      default:
        return risks;
    }
  }, [risks, activeTab]);

  const columns: ColumnDef<Risk>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Risk" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('title')}</div>
          <div className="text-sm text-white/60">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('category')}</Badge>
      ),
    },
    {
      accessorKey: 'probability',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Probability" />
      ),
      cell: ({ row }) => {
        const probability = row.getValue<string>('probability');
        return (
          <Badge
            variant={
              probability === 'VERY_HIGH' || probability === 'HIGH' ? 'destructive' :
              probability === 'MEDIUM' ? 'secondary' :
              'outline'
            }
          >
            {probability}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'impact',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Impact" />
      ),
      cell: ({ row }) => {
        const impact = row.getValue<string>('impact');
        return (
          <Badge
            variant={
              impact === 'VERY_HIGH' || impact === 'HIGH' ? 'destructive' :
              impact === 'MEDIUM' ? 'secondary' :
              'outline'
            }
          >
            {impact}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'severity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Severity" />
      ),
      cell: ({ row }) => {
        const severity = row.getValue<string>('severity');
        return (
          <div className="flex items-center gap-2">
            {severity === 'CRITICAL' && <AlertTriangle className="h-4 w-4 text-red-400" />}
            {severity === 'MODERATE' && <AlertCircle className="h-4 w-4 text-yellow-400" />}
            {severity === 'LOW' && <Shield className="h-4 w-4 text-green-400" />}
            <Badge
              variant={
                severity === 'CRITICAL' ? 'destructive' :
                severity === 'MODERATE' ? 'secondary' :
                'outline'
              }
            >
              {severity}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'cost',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Exposure" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${row.getValue<number>('cost').toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>('status');
        return (
          <Badge
            variant={
              status === 'MITIGATED' ? 'default' :
              status === 'MONITORING' ? 'secondary' :
              status === 'ACTIVE' ? 'destructive' :
              'outline'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'owner',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Owner" />
      ),
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Review Date" />
      ),
      cell: ({ row }) => format(row.getValue<Date>('dueDate'), 'MMM dd, yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const risk = row.original;
        return (
          <div className="flex items-center gap-2">
            {risk.status === 'ACTIVE' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMitigate(risk.id)}
                className="text-green-400 hover:text-green-300"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(risk)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRisk(risk);
                setIsDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Loading state  
  if (isLoading) {
    return (
      <PageShell>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Risk Management</h1>
            <p className="text-white/60">Identify, assess, and mitigate project risks</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Risk Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px] bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Create Risk Assessment</DialogTitle>
                <DialogDescription className="text-white/60">
                  Identify and document a new project risk
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Risk Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Weather Delays"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                        <SelectItem value="FINANCIAL">Financial</SelectItem>
                        <SelectItem value="OPERATIONAL">Operational</SelectItem>
                        <SelectItem value="ENVIRONMENTAL">Environmental</SelectItem>
                        <SelectItem value="REGULATORY">Regulatory</SelectItem>
                        <SelectItem value="SUPPLY">Supply Chain</SelectItem>
                        <SelectItem value="RESOURCE">Resource</SelectItem>
                        <SelectItem value="SAFETY">Safety</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="Describe the risk..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Probability</Label>
                    <Select
                      value={formData.probability}
                      onValueChange={(value) => setFormData({ ...formData, probability: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="VERY_HIGH">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Impact</Label>
                    <Select
                      value={formData.impact}
                      onValueChange={(value) => setFormData({ ...formData, impact: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="VERY_HIGH">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="MONITORING">Monitoring</SelectItem>
                        <SelectItem value="MITIGATED">Mitigated</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mitigation Strategy</Label>
                  <Textarea
                    value={formData.mitigation}
                    onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="How will this risk be mitigated?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contingency Plan</Label>
                  <Textarea
                    value={formData.contingency}
                    onChange={(e) => setFormData({ ...formData, contingency: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="What&apos;s the backup plan if this risk occurs?"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Risk Owner</Label>
                    <Input
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="Responsible person"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Review Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Financial Exposure</Label>
                    <Input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Affected Areas (comma-separated)</Label>
                  <Input
                    value={formData.affectedAreas}
                    onChange={(e) => setFormData({ ...formData, affectedAreas: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="e.g., Foundation, Roofing, Electrical"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Assessment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Risks</CardTitle>
              <Activity className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalRisks}</div>
              <p className="text-xs text-white/60 mt-1">Identified risks</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Active Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.activeRisks}</div>
              <p className="text-xs text-white/60 mt-1">Requiring attention</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Critical Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{metrics.criticalRisks}</div>
              <p className="text-xs text-white/60 mt-1">High severity</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Exposure</CardTitle>
              <TrendingUp className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${metrics.totalExposure.toLocaleString()}
              </div>
              <p className="text-xs text-white/60 mt-1">Financial impact</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Matrix */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Risk Matrix</CardTitle>
            <CardDescription className="text-white/60">
              Risk distribution by probability and impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              <div></div>
              <div className="text-center text-sm text-white/60">Low</div>
              <div className="text-center text-sm text-white/60">Medium</div>
              <div className="text-center text-sm text-white/60">High</div>
              <div className="text-center text-sm text-white/60">Very High</div>
              
              {['Very High', 'High', 'Medium', 'Low'].map(prob => (
                <React.Fragment key={prob}>
                  <div className="text-right text-sm text-white/60 pr-2">{prob}</div>
                  {['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].map(impact => {
                    const count = risks.filter(r => 
                      r.probability === prob.toUpperCase().replace(' ', '_') && 
                      r.impact === impact
                    ).length;
                    const severity = calculateSeverity(prob.toUpperCase().replace(' ', '_'), impact);
                    return (
                      <div
                        key={`${prob}-${impact}`}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-md font-bold",
                          severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          severity === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        )}
                      >
                        {count > 0 ? count : '-'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="all">All Risks</TabsTrigger>
            <TabsTrigger value="active">
              Active
              {metrics.activeRisks > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.activeRisks}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="critical">
              Critical
              {metrics.criticalRisks > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.criticalRisks}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="mitigated">Mitigated</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  {activeTab === 'all' && 'All Risk Assessments'}
                  {activeTab === 'active' && 'Active Risks'}
                  {activeTab === 'critical' && 'Critical Risks'}
                  {activeTab === 'monitoring' && 'Risks Under Monitoring'}
                  {activeTab === 'mitigated' && 'Mitigated Risks'}
                </CardTitle>
                <CardDescription className="text-white/60">
                  Manage and track project risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredData}
                  searchKey="title"
                  searchPlaceholder="Search risks..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[725px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Edit Risk Assessment</DialogTitle>
              <DialogDescription className="text-white/60">
                Update risk details and mitigation plans
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Risk Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNICAL">Technical</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="ENVIRONMENTAL">Environmental</SelectItem>
                      <SelectItem value="REGULATORY">Regulatory</SelectItem>
                      <SelectItem value="SUPPLY">Supply Chain</SelectItem>
                      <SelectItem value="RESOURCE">Resource</SelectItem>
                      <SelectItem value="SAFETY">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Probability</Label>
                  <Select
                    value={formData.probability}
                    onValueChange={(value) => setFormData({ ...formData, probability: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="VERY_HIGH">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Impact</Label>
                  <Select
                    value={formData.impact}
                    onValueChange={(value) => setFormData({ ...formData, impact: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="VERY_HIGH">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="MONITORING">Monitoring</SelectItem>
                      <SelectItem value="MITIGATED">Mitigated</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mitigation Strategy</Label>
                <Textarea
                  value={formData.mitigation}
                  onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Contingency Plan</Label>
                <Textarea
                  value={formData.contingency}
                  onChange={(e) => setFormData({ ...formData, contingency: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Risk Owner</Label>
                  <Input
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Financial Exposure</Label>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Affected Areas (comma-separated)</Label>
                <Input
                  value={formData.affectedAreas}
                  onChange={(e) => setFormData({ ...formData, affectedAreas: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update Assessment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-gray-900 text-white border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Risk Assessment</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete &quot;{selectedRisk?.title}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageShell>
  );
}