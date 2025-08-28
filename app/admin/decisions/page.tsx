'use client';

import { useState, useMemo } from 'react';
import { Plus, FileText, CheckCircle, XCircle, AlertCircle, Clock, Users, TrendingUp, MessageSquare, Gavel } from 'lucide-react';
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

// Mock data for decisions
const mockDecisions = [
  {
    id: '1',
    title: 'Kitchen Cabinet Material Selection',
    description: 'Choose between solid wood vs engineered wood for kitchen cabinets',
    category: 'MATERIAL',
    priority: 'HIGH',
    status: 'APPROVED',
    decision: 'Proceed with solid wood cabinets for durability and quality',
    rationale: 'Higher initial cost but better long-term value and customer satisfaction',
    impactCost: 3500,
    impactTime: 0,
    decisionMaker: 'John Smith',
    stakeholders: ['Client', 'Designer', 'Contractor'],
    dateRaised: new Date('2024-01-10'),
    dateDecided: new Date('2024-01-12'),
    relatedRisks: ['Material availability'],
    alternatives: [
      { option: 'Solid Wood', pros: 'Durable, premium look', cons: 'Higher cost', cost: 8500 },
      { option: 'Engineered Wood', pros: 'Cost-effective', cons: 'Less durable', cost: 5000 }
    ],
    notes: 'Client approved the additional cost for quality'
  },
  {
    id: '2',
    title: 'HVAC System Upgrade',
    description: 'Upgrade to energy-efficient HVAC system vs standard',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    status: 'PENDING',
    decision: null,
    rationale: null,
    impactCost: 5000,
    impactTime: 3,
    decisionMaker: null,
    stakeholders: ['Client', 'HVAC Contractor', 'Energy Consultant'],
    dateRaised: new Date('2024-01-20'),
    dateDecided: null,
    relatedRisks: ['Budget overrun', 'Installation delays'],
    alternatives: [
      { option: 'High-efficiency system', pros: 'Energy savings, rebates', cons: 'Higher upfront', cost: 12000 },
      { option: 'Standard system', pros: 'Lower cost', cons: 'Higher operating costs', cost: 7000 }
    ],
    notes: 'Awaiting energy audit results'
  },
  {
    id: '3',
    title: 'Foundation Reinforcement',
    description: 'Additional foundation reinforcement discovered necessary',
    category: 'STRUCTURAL',
    priority: 'CRITICAL',
    status: 'APPROVED',
    decision: 'Proceed with full reinforcement immediately',
    rationale: 'Critical for structural integrity and safety compliance',
    impactCost: 8000,
    impactTime: 5,
    decisionMaker: 'Sarah Engineer',
    stakeholders: ['Structural Engineer', 'City Inspector', 'Client'],
    dateRaised: new Date('2024-01-08'),
    dateDecided: new Date('2024-01-08'),
    relatedRisks: ['Structural failure', 'Code violations'],
    alternatives: [
      { option: 'Full reinforcement', pros: 'Complete safety', cons: 'Cost and time', cost: 8000 },
      { option: 'Partial reinforcement', pros: 'Lower cost', cons: 'Risk remains', cost: 4000 }
    ],
    notes: 'Emergency decision - safety critical'
  },
  {
    id: '4',
    title: 'Bathroom Layout Change',
    description: 'Client requested master bathroom layout modification',
    category: 'DESIGN',
    priority: 'LOW',
    status: 'REJECTED',
    decision: 'Keep original layout as planned',
    rationale: 'Changes would require major plumbing rework exceeding budget',
    impactCost: -6000,
    impactTime: -7,
    decisionMaker: 'Mike Manager',
    stakeholders: ['Client', 'Plumber', 'Designer'],
    dateRaised: new Date('2024-01-18'),
    dateDecided: new Date('2024-01-22'),
    relatedRisks: ['Client satisfaction'],
    alternatives: [
      { option: 'New layout', pros: 'Client preference', cons: 'Major rework', cost: 6000 },
      { option: 'Keep original', pros: 'On budget/schedule', cons: 'Client compromise', cost: 0 }
    ],
    notes: 'Client accepted after cost explanation'
  },
  {
    id: '5',
    title: 'Smart Home Integration',
    description: 'Add smart home wiring and systems',
    category: 'FEATURE',
    priority: 'MEDIUM',
    status: 'DEFERRED',
    decision: 'Defer to Phase 2 of project',
    rationale: 'Can be added post-construction without major disruption',
    impactCost: 0,
    impactTime: 0,
    decisionMaker: 'John Smith',
    stakeholders: ['Client', 'Electrician'],
    dateRaised: new Date('2024-01-15'),
    dateDecided: new Date('2024-01-20'),
    relatedRisks: [],
    alternatives: [
      { option: 'Install now', pros: 'Integrated solution', cons: 'Delays current work', cost: 4500 },
      { option: 'Install later', pros: 'No current impact', cons: 'Slightly higher cost later', cost: 5000 }
    ],
    notes: 'Pre-wiring completed for future installation'
  }
];

export default function AdminDecisionsPage() {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState(mockDecisions);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDecideOpen, setIsDecideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    impactCost: '',
    impactTime: '',
    stakeholders: '',
    relatedRisks: '',
    notes: '',
    alternatives: [
      { option: '', pros: '', cons: '', cost: '' }
    ]
  });

  const [decisionData, setDecisionData] = useState({
    decision: '',
    rationale: '',
    status: 'APPROVED'
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalDecisions = decisions.length;
    const pendingDecisions = decisions.filter(d => d.status === 'PENDING').length;
    const approvedDecisions = decisions.filter(d => d.status === 'APPROVED').length;
    const criticalDecisions = decisions.filter(d => d.priority === 'CRITICAL').length;
    const totalCostImpact = decisions
      .filter(d => d.status === 'APPROVED')
      .reduce((sum, d) => sum + (d.impactCost || 0), 0);
    const totalTimeImpact = decisions
      .filter(d => d.status === 'APPROVED')
      .reduce((sum, d) => sum + (d.impactTime || 0), 0);
    
    const decisionsByCategory = decisions.reduce((acc, decision) => {
      acc[decision.category] = (acc[decision.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDecisionTime = decisions
      .filter(d => d.dateDecided)
      .map(d => {
        const raised = d.dateRaised.getTime();
        const decided = d.dateDecided!.getTime();
        return (decided - raised) / (1000 * 60 * 60 * 24);
      })
      .reduce((sum, days, _, arr) => sum + days / arr.length, 0);

    return {
      totalDecisions,
      pendingDecisions,
      approvedDecisions,
      criticalDecisions,
      totalCostImpact,
      totalTimeImpact,
      decisionsByCategory,
      avgDecisionTime: Math.round(avgDecisionTime)
    };
  }, [decisions]);

  const handleCreate = () => {
    const newDecision = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: 'PENDING',
      decision: null,
      rationale: null,
      impactCost: parseFloat(formData.impactCost) || 0,
      impactTime: parseFloat(formData.impactTime) || 0,
      decisionMaker: null,
      stakeholders: formData.stakeholders.split(',').map(s => s.trim()).filter(Boolean),
      dateRaised: new Date(),
      dateDecided: null,
      relatedRisks: formData.relatedRisks.split(',').map(r => r.trim()).filter(Boolean),
      alternatives: formData.alternatives
        .filter(a => a.option)
        .map(a => ({
          ...a,
          cost: parseFloat(a.cost) || 0
        })),
      notes: formData.notes
    };

    setDecisions([...decisions, newDecision]);
    toast({
      title: 'Success',
      description: 'Decision item created successfully',
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedDecision) return;

    const updatedDecisions = decisions.map(d => {
      if (d.id === selectedDecision.id) {
        return {
          ...d,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          impactCost: parseFloat(formData.impactCost) || 0,
          impactTime: parseFloat(formData.impactTime) || 0,
          stakeholders: formData.stakeholders.split(',').map(s => s.trim()).filter(Boolean),
          relatedRisks: formData.relatedRisks.split(',').map(r => r.trim()).filter(Boolean),
          alternatives: formData.alternatives
            .filter(a => a.option)
            .map(a => ({
              ...a,
              cost: parseFloat(a.cost) || 0
            })),
          notes: formData.notes
        };
      }
      return d;
    });

    setDecisions(updatedDecisions);
    toast({
      title: 'Success',
      description: 'Decision updated successfully',
    });
    setIsEditOpen(false);
    setSelectedDecision(null);
    resetForm();
  };

  const handleDecide = () => {
    if (!selectedDecision) return;

    const updatedDecisions = decisions.map(d => {
      if (d.id === selectedDecision.id) {
        return {
          ...d,
          status: decisionData.status,
          decision: decisionData.decision,
          rationale: decisionData.rationale,
          decisionMaker: 'Current User',
          dateDecided: new Date()
        };
      }
      return d;
    });

    setDecisions(updatedDecisions);
    toast({
      title: 'Success',
      description: `Decision ${decisionData.status.toLowerCase()}`,
    });
    setIsDecideOpen(false);
    setSelectedDecision(null);
    resetDecisionData();
  };

  const handleDelete = () => {
    if (!selectedDecision) return;

    setDecisions(decisions.filter(d => d.id !== selectedDecision.id));
    toast({
      title: 'Success',
      description: 'Decision item deleted successfully',
    });
    setIsDeleteOpen(false);
    setSelectedDecision(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'TECHNICAL',
      priority: 'MEDIUM',
      impactCost: '',
      impactTime: '',
      stakeholders: '',
      relatedRisks: '',
      notes: '',
      alternatives: [
        { option: '', pros: '', cons: '', cost: '' }
      ]
    });
  };

  const resetDecisionData = () => {
    setDecisionData({
      decision: '',
      rationale: '',
      status: 'APPROVED'
    });
  };

  const openEditDialog = (decision: any) => {
    setSelectedDecision(decision);
    setFormData({
      title: decision.title,
      description: decision.description,
      category: decision.category,
      priority: decision.priority,
      impactCost: decision.impactCost.toString(),
      impactTime: decision.impactTime.toString(),
      stakeholders: decision.stakeholders.join(', '),
      relatedRisks: decision.relatedRisks.join(', '),
      notes: decision.notes,
      alternatives: decision.alternatives.length > 0 ? decision.alternatives : [{ option: '', pros: '', cons: '', cost: '' }]
    });
    setIsEditOpen(true);
  };

  const openDecideDialog = (decision: any) => {
    setSelectedDecision(decision);
    setIsDecideOpen(true);
  };

  const addAlternative = () => {
    setFormData({
      ...formData,
      alternatives: [...formData.alternatives, { option: '', pros: '', cons: '', cost: '' }]
    });
  };

  const updateAlternative = (index: number, field: string, value: string) => {
    const newAlternatives = [...formData.alternatives];
    newAlternatives[index] = { ...newAlternatives[index], [field]: value };
    setFormData({ ...formData, alternatives: newAlternatives });
  };

  const removeAlternative = (index: number) => {
    setFormData({
      ...formData,
      alternatives: formData.alternatives.filter((_, i) => i !== index)
    });
  };

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return decisions.filter(d => d.status === 'PENDING');
      case 'approved':
        return decisions.filter(d => d.status === 'APPROVED');
      case 'critical':
        return decisions.filter(d => d.priority === 'CRITICAL');
      default:
        return decisions;
    }
  }, [decisions, activeTab]);

  const columns: ColumnDef<any>[] = [
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
        <DataTableColumnHeader column={column} title="Decision" />
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
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const priority = row.getValue<string>('priority');
        return (
          <Badge
            variant={
              priority === 'CRITICAL' ? 'destructive' :
              priority === 'HIGH' ? 'destructive' :
              priority === 'MEDIUM' ? 'secondary' :
              'outline'
            }
          >
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>('status');
        return (
          <div className="flex items-center gap-2">
            {status === 'APPROVED' && <CheckCircle className="h-4 w-4 text-green-400" />}
            {status === 'REJECTED' && <XCircle className="h-4 w-4 text-red-400" />}
            {status === 'PENDING' && <Clock className="h-4 w-4 text-yellow-400" />}
            {status === 'DEFERRED' && <AlertCircle className="h-4 w-4 text-blue-400" />}
            <Badge
              variant={
                status === 'APPROVED' ? 'default' :
                status === 'PENDING' ? 'secondary' :
                status === 'DEFERRED' ? 'outline' :
                'destructive'
              }
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'impact',
      header: 'Impact',
      cell: ({ row }) => {
        const costImpact = row.original.impactCost;
        const timeImpact = row.original.impactTime;
        return (
          <div className="space-y-1">
            <div className={cn(
              "text-sm",
              costImpact > 0 ? "text-red-400" : costImpact < 0 ? "text-green-400" : "text-white/60"
            )}>
              {costImpact > 0 ? '+' : ''}{costImpact === 0 ? '-' : `$${Math.abs(costImpact).toLocaleString()}`}
            </div>
            <div className={cn(
              "text-sm",
              timeImpact > 0 ? "text-red-400" : timeImpact < 0 ? "text-green-400" : "text-white/60"
            )}>
              {timeImpact > 0 ? '+' : ''}{timeImpact === 0 ? '-' : `${Math.abs(timeImpact)} days`}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'stakeholders',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stakeholders" />
      ),
      cell: ({ row }) => {
        const stakeholders = row.getValue<string[]>('stakeholders');
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-white/40" />
            <span>{stakeholders.length}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'dateRaised',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Raised" />
      ),
      cell: ({ row }) => format(row.getValue<Date>('dateRaised'), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'decisionMaker',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Decided By" />
      ),
      cell: ({ row }) => row.getValue('decisionMaker') || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const decision = row.original;
        return (
          <div className="flex items-center gap-2">
            {decision.status === 'PENDING' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDecideDialog(decision)}
                className="text-green-400 hover:text-green-300"
              >
                Decide
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(decision)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDecision(decision);
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

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Decision Log</h1>
            <p className="text-white/60">Track and document project decisions</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Log Decision
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[825px] bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Log New Decision</DialogTitle>
                <DialogDescription className="text-white/60">
                  Document a decision that needs to be made
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Decision Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Material Selection"
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
                        <SelectItem value="DESIGN">Design</SelectItem>
                        <SelectItem value="MATERIAL">Material</SelectItem>
                        <SelectItem value="STRUCTURAL">Structural</SelectItem>
                        <SelectItem value="FINANCIAL">Financial</SelectItem>
                        <SelectItem value="SCHEDULE">Schedule</SelectItem>
                        <SelectItem value="FEATURE">Feature</SelectItem>
                        <SelectItem value="REGULATORY">Regulatory</SelectItem>
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
                    placeholder="Describe the decision that needs to be made..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Impact ($)</Label>
                    <Input
                      type="number"
                      value={formData.impactCost}
                      onChange={(e) => setFormData({ ...formData, impactCost: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Impact (days)</Label>
                    <Input
                      type="number"
                      value={formData.impactTime}
                      onChange={(e) => setFormData({ ...formData, impactTime: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Decision Alternatives</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAlternative}
                    >
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.alternatives.map((alt, index) => (
                      <div key={index} className="p-3 rounded-lg border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Option {index + 1}</span>
                          {formData.alternatives.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAlternative(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={alt.option}
                            onChange={(e) => updateAlternative(index, 'option', e.target.value)}
                            className="bg-white/5 border-white/10"
                            placeholder="Option name"
                          />
                          <Input
                            type="number"
                            value={alt.cost}
                            onChange={(e) => updateAlternative(index, 'cost', e.target.value)}
                            className="bg-white/5 border-white/10"
                            placeholder="Cost ($)"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={alt.pros}
                            onChange={(e) => updateAlternative(index, 'pros', e.target.value)}
                            className="bg-white/5 border-white/10"
                            placeholder="Pros"
                          />
                          <Input
                            value={alt.cons}
                            onChange={(e) => updateAlternative(index, 'cons', e.target.value)}
                            className="bg-white/5 border-white/10"
                            placeholder="Cons"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stakeholders (comma-separated)</Label>
                    <Input
                      value={formData.stakeholders}
                      onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Client, Contractor, Designer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Related Risks (comma-separated)</Label>
                    <Input
                      value={formData.relatedRisks}
                      onChange={(e) => setFormData({ ...formData, relatedRisks: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Budget overrun, Delays"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="Additional context or considerations..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Log Decision</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Decisions</CardTitle>
              <Gavel className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalDecisions}</div>
              <p className="text-xs text-white/60 mt-1">Logged decisions</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.pendingDecisions}</div>
              <p className="text-xs text-white/60 mt-1">Awaiting decision</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Cost Impact</CardTitle>
              <TrendingUp className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                metrics.totalCostImpact > 0 ? "text-red-400" : "text-green-400"
              )}>
                {metrics.totalCostImpact > 0 ? '+' : ''}${Math.abs(metrics.totalCostImpact).toLocaleString()}
              </div>
              <p className="text-xs text-white/60 mt-1">Budget impact</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Avg Decision Time</CardTitle>
              <Clock className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.avgDecisionTime} days</div>
              <p className="text-xs text-white/60 mt-1">Time to decide</p>
            </CardContent>
          </Card>
        </div>

        {/* Decision Categories */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Decision Categories</CardTitle>
            <CardDescription className="text-white/60">
              Distribution of decisions by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(metrics.decisionsByCategory).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-sm text-white/60">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="all">All Decisions</TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {metrics.pendingDecisions > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {metrics.pendingDecisions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="critical">
              Critical
              {metrics.criticalDecisions > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.criticalDecisions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  {activeTab === 'all' && 'All Decisions'}
                  {activeTab === 'pending' && 'Pending Decisions'}
                  {activeTab === 'approved' && 'Approved Decisions'}
                  {activeTab === 'critical' && 'Critical Decisions'}
                </CardTitle>
                <CardDescription className="text-white/60">
                  Track and manage project decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredData}
                  searchKey="title"
                  searchPlaceholder="Search decisions..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Make Decision Dialog */}
        <Dialog open={isDecideOpen} onOpenChange={setIsDecideOpen}>
          <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Make Decision</DialogTitle>
              <DialogDescription className="text-white/60">
                Document the decision for &quot;{selectedDecision?.title}&quot;
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedDecision?.alternatives && selectedDecision.alternatives.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Options</Label>
                  <div className="space-y-2 rounded-lg border border-white/10 p-3">
                    {selectedDecision.alternatives.map((alt: any, index: number) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{alt.option} - ${alt.cost}</div>
                        <div className="text-white/60">Pros: {alt.pros}</div>
                        <div className="text-white/60">Cons: {alt.cons}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Decision Status</Label>
                <Select
                  value={decisionData.status}
                  onValueChange={(value) => setDecisionData({ ...decisionData, status: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="DEFERRED">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Decision</Label>
                <Textarea
                  value={decisionData.decision}
                  onChange={(e) => setDecisionData({ ...decisionData, decision: e.target.value })}
                  className="bg-white/5 border-white/10"
                  placeholder="What was decided..."
                />
              </div>
              <div className="space-y-2">
                <Label>Rationale</Label>
                <Textarea
                  value={decisionData.rationale}
                  onChange={(e) => setDecisionData({ ...decisionData, rationale: e.target.value })}
                  className="bg-white/5 border-white/10"
                  placeholder="Why this decision was made..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDecideOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDecide}>Record Decision</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[825px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Edit Decision</DialogTitle>
              <DialogDescription className="text-white/60">
                Update decision details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Decision Title</Label>
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
                      <SelectItem value="DESIGN">Design</SelectItem>
                      <SelectItem value="MATERIAL">Material</SelectItem>
                      <SelectItem value="STRUCTURAL">Structural</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="SCHEDULE">Schedule</SelectItem>
                      <SelectItem value="FEATURE">Feature</SelectItem>
                      <SelectItem value="REGULATORY">Regulatory</SelectItem>
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
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cost Impact ($)</Label>
                  <Input
                    type="number"
                    value={formData.impactCost}
                    onChange={(e) => setFormData({ ...formData, impactCost: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Impact (days)</Label>
                  <Input
                    type="number"
                    value={formData.impactTime}
                    onChange={(e) => setFormData({ ...formData, impactTime: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update Decision</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-gray-900 text-white border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Decision</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete &quot;{selectedDecision?.title}&quot;? This will remove the decision history permanently.
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