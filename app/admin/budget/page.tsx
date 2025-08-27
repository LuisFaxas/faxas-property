'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Plus, Download, AlertCircle, TrendingUp, TrendingDown, DollarSign, FileText, Edit, Trash, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useBudget, useBudgetSummary, useProjects } from '@/hooks/use-api';
import { useAuth } from '@/app/contexts/AuthContext';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ColumnDef } from '@tanstack/react-table';

// Form schema - matching the validation schema
const budgetItemSchema = z.object({
  discipline: z.string().min(1, 'Discipline is required'),
  category: z.string().min(1, 'Category is required'),
  item: z.string().min(1, 'Item name is required'),
  unit: z.string().optional(),
  qty: z.number().min(0, 'Quantity must be positive'),
  estUnitCost: z.number().min(0, 'Unit cost must be positive'),
  estTotal: z.number().min(0, 'Total must be positive'),
  committedTotal: z.number().min(0, 'Committed total must be positive'),
  paidToDate: z.number().min(0, 'Paid amount must be positive'),
  vendorContactId: z.string().optional(),
  status: z.enum(['BUDGETED', 'COMMITTED', 'PAID']),
  projectId: z.string()
});

type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;

// Common disciplines and categories
const DISCIPLINES = [
  'General Conditions',
  'Site Work',
  'Concrete',
  'Masonry',
  'Metals',
  'Wood & Plastics',
  'Thermal & Moisture',
  'Doors & Windows',
  'Finishes',
  'Specialties',
  'Equipment',
  'Furnishings',
  'Mechanical',
  'Electrical',
  'Plumbing'
];

const CATEGORIES = [
  'Labor',
  'Materials',
  'Equipment',
  'Subcontractor',
  'Permits',
  'Insurance',
  'Overhead',
  'Contingency'
];

export default function AdminBudgetPage() {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const isReady = !!user;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape) and (max-height: 430px)');
  
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [projectId, setProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card'); // Default to card for mobile
  
  // Form
  const form = useForm<BudgetItemFormValues>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: {
      discipline: '',
      category: '',
      item: '',
      unit: '',
      qty: 1,
      estUnitCost: 0,
      estTotal: 0,
      committedTotal: 0,
      paidToDate: 0,
      vendorContactId: '',
      status: 'BUDGETED',
      projectId: ''
    }
  });
  
  // Fetch data
  const { data: budgetData, isLoading, refetch } = useBudget({ projectId }, isReady);
  const { data: summary } = useBudgetSummary(projectId, isReady);
  const { data: projectsData } = useProjects(isReady);
  
  // Set default projectId
  useEffect(() => {
    if (projectsData && Array.isArray(projectsData) && projectsData.length > 0 && !projectId) {
      const defaultProjectId = projectsData[0].id;
      setProjectId(defaultProjectId);
      form.setValue('projectId', defaultProjectId);
    }
  }, [projectsData, projectId, form]);
  
  // Auto-calculate totals
  const watchQty = form.watch('qty');
  const watchUnitCost = form.watch('estUnitCost');
  
  useEffect(() => {
    const total = watchQty * watchUnitCost;
    form.setValue('estTotal', total);
  }, [watchQty, watchUnitCost, form]);
  
  // Auto-switch to card view on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'table') {
      setViewMode('card');
    }
  }, [isMobile, viewMode]);
  
  const budgetItems = Array.isArray(budgetData) ? budgetData : [];
  
  // Calculate metrics
  const metrics = useMemo(() => {
    if (!summary) {
      return {
        totalBudget: 0,
        totalCommitted: 0,
        totalPaid: 0,
        remaining: 0,
        variance: 0,
        percentSpent: 0,
        overBudgetCount: 0
      };
    }
    
    const data = summary?.data || summary;
    return {
      totalBudget: data?.totalBudget || 0,
      totalCommitted: data?.totalCommitted || 0,
      totalPaid: data?.totalPaid || 0,
      remaining: data?.remainingBudget || 0,
      variance: data?.totalVariance || 0,
      percentSpent: data?.spendRate || 0,
      overBudgetCount: data?.overBudgetCount || 0
    };
  }, [summary]);
  
  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'discipline',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Discipline" />
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
    },
    {
      accessorKey: 'item',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Item" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">
          {row.getValue('item')}
        </div>
      ),
    },
    {
      accessorKey: 'estTotal',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Budget" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('estTotal'));
        return (
          <div className="font-medium">
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        );
      },
    },
    {
      accessorKey: 'committedTotal',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Committed" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('committedTotal'));
        return (
          <div>
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        );
      },
    },
    {
      accessorKey: 'paidToDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Paid" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('paidToDate'));
        return (
          <div>
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        );
      },
    },
    {
      accessorKey: 'varianceAmount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Variance" />
      ),
      cell: ({ row }) => {
        const variance = row.original.varianceAmount || 0;
        const isOverBudget = variance > 0;
        
        return (
          <div className={cn(
            'font-medium',
            isOverBudget ? 'text-red-500' : 'text-green-500'
          )}>
            {isOverBudget ? '+' : ''}${Math.abs(variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {row.original.variancePercent && (
              <span className="text-xs ml-1">
                ({Math.abs(row.original.variancePercent).toFixed(1)}%)
              </span>
            )}
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
              status === 'PAID' ? 'default' :
              status === 'COMMITTED' ? 'secondary' :
              'outline'
            }
          >
            {status}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(item)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  // Handlers
  const handleCreate = async (values: BudgetItemFormValues) => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/budget', {
        ...values,
        projectId: projectId || values.projectId
      });
      
      toast({
        title: 'Success',
        description: 'Budget item created successfully',
      });
      
      setIsCreateOpen(false);
      form.reset();
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create budget item',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    form.reset({
      discipline: item.discipline,
      category: item.category,
      item: item.item,
      unit: item.unit || '',
      qty: Number(item.qty),
      estUnitCost: Number(item.estUnitCost),
      estTotal: Number(item.estTotal),
      committedTotal: Number(item.committedTotal),
      paidToDate: Number(item.paidToDate),
      vendorContactId: item.vendorContactId || '',
      status: item.status,
      projectId: item.projectId
    });
    setIsEditOpen(true);
  };
  
  const handleUpdate = async (values: BudgetItemFormValues) => {
    if (!selectedItem) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.put(`/budget/${selectedItem.id}`, values);
      
      toast({
        title: 'Success',
        description: 'Budget item updated successfully',
      });
      
      setIsEditOpen(false);
      setSelectedItem(null);
      form.reset();
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update budget item',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/budget/${selectedItem.id}`);
      
      toast({
        title: 'Success',
        description: 'Budget item deleted successfully',
      });
      
      setIsDeleteOpen(false);
      setSelectedItem(null);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete budget item',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleExport = () => {
    const csv = [
      ['Discipline', 'Category', 'Item', 'Unit', 'Qty', 'Unit Cost', 'Budget', 'Committed', 'Paid', 'Variance', 'Status'],
      ...budgetItems.map((item: any) => [
        item.discipline,
        item.category,
        item.item,
        item.unit || '',
        item.qty,
        item.estUnitCost,
        item.estTotal,
        item.committedTotal,
        item.paidToDate,
        item.varianceAmount || 0,
        item.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget.csv';
    a.click();
  };
  
  if (isLoading) {
    return (
      <PageShell 
        userRole={(userRole as "ADMIN" | "STAFF" | "CONTRACTOR" | "VIEWER") || 'VIEWER'} 
        userName={user?.displayName || 'User'} 
        userEmail={user?.email || ''}
      >
        <div className="p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          {/* KPI Cards Skeleton */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-80" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>
    );
  }
  
  return (
    <PageShell 
      userRole={(userRole as "ADMIN" | "STAFF" | "CONTRACTOR" | "VIEWER") || 'VIEWER'} 
      userName={user?.displayName || 'User'} 
      userEmail={user?.email || ''}
    >
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalBudget.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Approved budget
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Committed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalCommitted.toLocaleString()}
              </div>
              <Progress value={(metrics.totalCommitted / metrics.totalBudget) * 100} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid to Date</CardTitle>
              {metrics.variance < 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalPaid.toLocaleString()}
              </div>
              <div className={cn(
                'text-xs',
                metrics.variance < 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {metrics.variance < 0 ? 'Under' : 'Over'} by ${Math.abs(metrics.variance).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overBudgetCount}</div>
              <p className="text-xs text-muted-foreground">
                Items over budget
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <TabsList className="w-full lg:w-auto overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Budget Items</TabsTrigger>
              <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" className="sm:size-default" onClick={handleExport}>
                <Download className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="sm:size-default">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add Item</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Budget Item</DialogTitle>
                    <DialogDescription>
                      Create a new budget line item
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="discipline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discipline</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select discipline" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DISCIPLINES.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CATEGORIES.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="item"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Description</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter item description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., SF, LF" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="qty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="estUnitCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Cost</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="estTotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field} 
                                  disabled
                                  className="bg-muted"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="committedTotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Committed Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="paidToDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paid to Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="BUDGETED">Budgeted</SelectItem>
                                  <SelectItem value="COMMITTED">Committed</SelectItem>
                                  <SelectItem value="PAID">Paid</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Creating...
                            </>
                          ) : (
                            'Create Item'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <TabsContent value="overview" className="space-y-4">
            {summary?.data?.disciplineBreakdown && (
              <Card>
                <CardHeader>
                  <CardTitle>Budget by Discipline</CardTitle>
                  <CardDescription>
                    Breakdown of budget allocation across disciplines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(summary.data.disciplineBreakdown).map(([discipline, data]: [string, any]) => (
                      <div key={discipline} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{discipline}</span>
                          <span className="text-sm text-muted-foreground">
                            ${data.budget.toLocaleString()} budget
                          </span>
                        </div>
                        <Progress 
                          value={(data.paid / data.budget) * 100} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>${data.paid.toLocaleString()} spent</span>
                          <span>{((data.paid / data.budget) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="items">
            {budgetItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No budget items yet</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Start tracking your project budget by adding your first line item.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Budget Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <DataTable
                    columns={columns}
                    data={budgetItems}
                    searchKey="item"
                    searchPlaceholder="Search items..."
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="exceptions">
            <Card>
              <CardHeader>
                <CardTitle>Over Budget Items</CardTitle>
                <CardDescription>
                  Items that have exceeded their budgeted amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.data?.topOverBudgetItems && summary.data.topOverBudgetItems.length > 0 ? (
                  <div className="space-y-4">
                    {summary.data.topOverBudgetItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.discipline} - {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-500">
                            +${item.variance.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.variancePercent.toFixed(1)}% over budget
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items are over budget</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Budget Item</DialogTitle>
              <DialogDescription>
                Update budget line item details
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discipline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discipline</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DISCIPLINES.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estUnitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Cost</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="committedTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Committed Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paidToDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paid to Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BUDGETED">Budgeted</SelectItem>
                            <SelectItem value="COMMITTED">Committed</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Updating...
                      </>
                    ) : (
                      'Update Item'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Budget Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedItem?.item}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageShell>
  );
}