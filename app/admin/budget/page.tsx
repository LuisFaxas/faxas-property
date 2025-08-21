'use client';

import { useState, useMemo } from 'react';
import { Plus, Download, AlertCircle, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useBudget, useBudgetSummary } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

export default function AdminBudgetPage() {
  const { toast } = useToast();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    item: '',
    description: '',
    budgetAmount: '',
    actualSpent: '',
    vendor: '',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    invoiceNumber: '',
    dueDate: '',
    notes: ''
  });

  // Fetch budget data
  const { data: budgetItems, isLoading, refetch } = useBudget();
  const { data: summary } = useBudgetSummary();

  // Calculate metrics
  const metrics = useMemo(() => {
    const defaultMetrics = {
      totalBudget: 0,
      totalSpent: 0,
      remaining: 0,
      percentSpent: 0,
      overBudgetItems: 0,
      pendingPayments: 0
    };

    if (!summary) return defaultMetrics;

    const pendingPayments = Array.isArray(budgetItems) 
      ? budgetItems.filter((item: any) => 
          item.paymentStatus === 'PENDING' && item.actualSpent > 0
        ).reduce((sum: number, item: any) => sum + item.actualSpent, 0)
      : 0;

    return {
      totalBudget: summary.totalBudget || 0,
      totalSpent: summary.totalSpent || 0,
      remaining: summary.remaining || 0,
      percentSpent: summary.percentSpent || 0,
      overBudgetItems: summary.exceptionsCount || 0,
      pendingPayments
    };
  }, [summary, budgetItems]);

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/v1/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budgetAmount: parseFloat(formData.budgetAmount),
          actualSpent: parseFloat(formData.actualSpent) || 0,
          dueDate: formData.dueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create budget item');

      toast({
        title: 'Success',
        description: 'Budget item created successfully',
      });

      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create budget item',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/v1/budget/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budgetAmount: parseFloat(formData.budgetAmount),
          actualSpent: parseFloat(formData.actualSpent) || 0,
          dueDate: formData.dueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update budget item');

      toast({
        title: 'Success',
        description: 'Budget item updated successfully',
      });

      setIsEditOpen(false);
      setSelectedItem(null);
      resetForm();
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update budget item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/v1/budget/${selectedItem.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete budget item');

      toast({
        title: 'Success',
        description: 'Budget item deleted successfully',
      });

      setIsDeleteOpen(false);
      setSelectedItem(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete budget item',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    if (!budgetItems || budgetItems.length === 0) {
      toast({
        title: 'No data',
        description: 'No budget items to export',
        variant: 'destructive',
      });
      return;
    }

    const csv = [
      ['Category', 'Item', 'Description', 'Budget Amount', 'Actual Spent', 'Variance', 'Status', 'Payment Status', 'Vendor', 'Invoice #', 'Due Date'],
      ...budgetItems.map((item: any) => [
        item.category,
        item.item,
        item.description || '',
        item.budgetAmount,
        item.actualSpent || 0,
        item.budgetAmount - (item.actualSpent || 0),
        item.status,
        item.paymentStatus,
        item.vendor || '',
        item.invoiceNumber || '',
        item.dueDate ? new Date(item.dueDate).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const resetForm = () => {
    setFormData({
      category: '',
      item: '',
      description: '',
      budgetAmount: '',
      actualSpent: '',
      vendor: '',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      invoiceNumber: '',
      dueDate: '',
      notes: ''
    });
  };

  const openEditDialog = (item: any) => {
    setSelectedItem(item);
    setFormData({
      category: item.category,
      item: item.item,
      description: item.description || '',
      budgetAmount: item.budgetAmount.toString(),
      actualSpent: item.actualSpent?.toString() || '0',
      vendor: item.vendor || '',
      status: item.status,
      paymentStatus: item.paymentStatus,
      invoiceNumber: item.invoiceNumber || '',
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
      notes: item.notes || ''
    });
    setIsEditOpen(true);
  };

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
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('category')}</div>
      ),
    },
    {
      accessorKey: 'item',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Item" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('item')}</div>
          {row.original.description && (
            <div className="text-sm text-white/60">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'budgetAmount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Budget" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${row.getValue<number>('budgetAmount').toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'actualSpent',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Spent" />
      ),
      cell: ({ row }) => {
        const spent = row.getValue<number>('actualSpent') || 0;
        return (
          <div className="text-right font-medium">
            ${spent.toLocaleString()}
          </div>
        );
      },
    },
    {
      id: 'variance',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Variance" />
      ),
      cell: ({ row }) => {
        const budget = row.original.budgetAmount;
        const spent = row.original.actualSpent || 0;
        const variance = budget - spent;
        const isOver = variance < 0;

        return (
          <div className={cn(
            "text-right font-medium flex items-center justify-end gap-1",
            isOver ? "text-red-400" : "text-green-400"
          )}>
            {isOver ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            ${Math.abs(variance).toLocaleString()}
          </div>
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
          <Badge
            variant={
              status === 'APPROVED' ? 'default' :
              status === 'IN_PROGRESS' ? 'secondary' :
              status === 'COMPLETED' ? 'outline' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>('paymentStatus');
        return (
          <Badge
            variant={
              status === 'PAID' ? 'default' :
              status === 'PARTIAL' ? 'secondary' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedItem(row.original);
              setIsDeleteOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Budget Management</h1>
            <p className="text-white/60">Track expenses and manage project budget</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Budget Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
                <DialogHeader>
                  <DialogTitle>Add Budget Item</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Create a new budget line item
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MATERIALS">Materials</SelectItem>
                          <SelectItem value="LABOR">Labor</SelectItem>
                          <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                          <SelectItem value="PERMITS">Permits</SelectItem>
                          <SelectItem value="PROFESSIONAL">Professional Services</SelectItem>
                          <SelectItem value="CONTINGENCY">Contingency</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input
                        value={formData.item}
                        onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="e.g., Kitchen Cabinets"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="Detailed description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Budget Amount</Label>
                      <Input
                        type="number"
                        value={formData.budgetAmount}
                        onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Actual Spent</Label>
                      <Input
                        type="number"
                        value={formData.actualSpent}
                        onChange={(e) => setFormData({ ...formData, actualSpent: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <Select
                        value={formData.paymentStatus}
                        onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PARTIAL">Partial</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Input
                        value={formData.vendor}
                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="Vendor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Number</Label>
                      <Input
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className="bg-white/5 border-white/10"
                        placeholder="INV-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${(metrics.totalBudget || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${(metrics.totalSpent || 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {(metrics.percentSpent || 0).toFixed(1)}% of budget
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Remaining</CardTitle>
              <TrendingDown className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                metrics.remaining >= 0 ? "text-green-400" : "text-red-400"
              )}>
                ${Math.abs(metrics.remaining || 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {metrics.remaining < 0 ? 'Over budget' : 'Under budget'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Pending Payments</CardTitle>
              <FileText className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${(metrics.pendingPayments || 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/60 mt-1">
                Awaiting payment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Budget Progress</CardTitle>
            <CardDescription className="text-white/60">
              Overall project budget utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Spent</span>
                <span className="text-white font-medium">
                  ${(metrics.totalSpent || 0).toLocaleString()} / ${(metrics.totalBudget || 0).toLocaleString()}
                </span>
              </div>
              <Progress 
                value={metrics.percentSpent || 0} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>0%</span>
                <span>{(metrics.percentSpent || 0).toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exceptions">
              Exceptions 
              {metrics.overBudgetItems > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.overBudgetItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments">Pending Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">All Budget Items</CardTitle>
                <CardDescription className="text-white/60">
                  Complete list of budget line items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={Array.isArray(budgetItems) ? budgetItems : []}
                  searchKey="item"
                  searchPlaceholder="Search items..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  Budget Exceptions
                </CardTitle>
                <CardDescription className="text-white/60">
                  Items that are over budget or require attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={Array.isArray(budgetItems) 
                    ? budgetItems.filter((item: any) => {
                        const variance = item.budgetAmount - (item.actualSpent || 0);
                        return variance < 0;
                      })
                    : []}
                  searchKey="item"
                  searchPlaceholder="Search exceptions..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Pending Payments</CardTitle>
                <CardDescription className="text-white/60">
                  Items awaiting payment processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={Array.isArray(budgetItems)
                    ? budgetItems.filter((item: any) => 
                        item.paymentStatus === 'PENDING' && item.actualSpent > 0
                      )
                    : []}
                  searchKey="item"
                  searchPlaceholder="Search pending payments..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Edit Budget Item</DialogTitle>
              <DialogDescription className="text-white/60">
                Update budget line item details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATERIALS">Materials</SelectItem>
                      <SelectItem value="LABOR">Labor</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="PERMITS">Permits</SelectItem>
                      <SelectItem value="PROFESSIONAL">Professional Services</SelectItem>
                      <SelectItem value="CONTINGENCY">Contingency</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="e.g., Kitchen Cabinets"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border-white/10"
                  placeholder="Detailed description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Amount</Label>
                  <Input
                    type="number"
                    value={formData.budgetAmount}
                    onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Spent</Label>
                  <Input
                    type="number"
                    value={formData.actualSpent}
                    onChange={(e) => setFormData({ ...formData, actualSpent: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="Vendor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="INV-001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-gray-900 text-white border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Budget Item</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete "{selectedItem?.item}"? This action cannot be undone.
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