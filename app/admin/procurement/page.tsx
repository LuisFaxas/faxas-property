'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageShell } from '@/components/blocks/page-shell';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useProjects, useBudget, useContacts } from '@/hooks/use-api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  FileText, 
  DollarSign, 
  Package, 
  Clock, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Truck,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Upload,
  RefreshCw,
  BarChart3,
  ShoppingCart,
  Layers,
  Tag,
  Building2,
  Users,
  FileSpreadsheet,
  Send,
  Archive,
  Star,
  AlertTriangle,
  Zap,
  Target,
  Activity,
  CreditCard,
  Receipt,
  Banknote,
  Paperclip,
  Hash
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { createProcurementSchema } from '@/lib/validations/procurement';

// Common disciplines
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
  'Mechanical',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Fire Protection',
  'Landscaping'
];

// Project phases
const PHASES = [
  'Pre-Construction',
  'Foundation',
  'Framing',
  'Roofing',
  'Exterior',
  'MEP Rough-in',
  'Insulation',
  'Drywall',
  'Flooring',
  'Interior Finish',
  'Landscaping',
  'Final Inspection',
  'Closeout'
];

// Common units
const UNITS = [
  'EA', 'PC', 'SET', 'BOX', 'CASE',
  'SF', 'SY', 'LF', 'CF', 'CY',
  'TON', 'LB', 'GAL', 'BAG',
  'HOUR', 'DAY', 'WEEK', 'MONTH'
];

// Status configuration
const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
  QUOTED: { label: 'Quoted', color: 'bg-blue-500', icon: DollarSign },
  APPROVED: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
  ORDERED: { label: 'Ordered', color: 'bg-purple-500', icon: ShoppingCart },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-500', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-500', icon: Package },
  INSTALLED: { label: 'Installed', color: 'bg-emerald-500', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle }
};

// Priority configuration
const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-slate-500', icon: ChevronDown },
  MEDIUM: { label: 'Medium', color: 'bg-blue-500', icon: Target },
  HIGH: { label: 'High', color: 'bg-orange-500', icon: AlertCircle },
  URGENT: { label: 'Urgent', color: 'bg-red-500', icon: AlertTriangle },
  CRITICAL: { label: 'Critical', color: 'bg-red-600', icon: Zap }
};

export default function ProcurementPage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  
  // State management
  const [procurements, setProcurements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('requiredBy');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  // Form setup
  const form = useForm({
    resolver: zodResolver(createProcurementSchema),
    defaultValues: {
      projectId: '',
      materialItem: '',
      description: '',
      quantity: 1,
      unit: 'EA',
      unitPrice: 0,
      totalCost: 0,
      discipline: '',
      phase: '',
      category: 'MATERIALS',
      requiredBy: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      leadTimeDays: 7,
      supplierId: '',
      orderStatus: 'DRAFT',
      priority: 'MEDIUM',
      eta: '',
      notes: '',
      budgetItemId: '',
      attachments: [],
      tags: []
    }
  });
  
  // Watch form fields for calculations
  const watchQuantity = form?.watch('quantity');
  const watchUnitPrice = form?.watch('unitPrice');
  
  useEffect(() => {
    if (watchQuantity && watchUnitPrice) {
      form.setValue('totalCost', watchQuantity * watchUnitPrice);
    }
  }, [watchQuantity, watchUnitPrice, form]);
  
  // Fetch data hooks
  const { data: projectsData } = useProjects(isAuthenticated);
  const { data: contactsData } = useContacts(isAuthenticated);
  const { data: budgetData } = useBudget({ projectId: selectedProject }, isAuthenticated && !!selectedProject);
  
  // Filter suppliers from contacts
  const suppliers = useMemo(() => {
    if (!contactsData || !Array.isArray(contactsData)) return [];
    return contactsData.filter((c: any) => 
      c.category === 'SUBCONTRACTOR' || c.category === 'SUPPLIER'
    );
  }, [contactsData]);
  
  // Fetch procurement data
  const fetchProcurementData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(selectedProject && selectedProject !== 'all' && { projectId: selectedProject }),
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus && filterStatus !== 'all' && { orderStatus: filterStatus }),
        ...(filterPriority && filterPriority !== 'all' && { priority: filterPriority }),
        ...(filterCategory && filterCategory !== 'all' && { category: filterCategory }),
        ...(filterSupplier && filterSupplier !== 'all' && { supplierId: filterSupplier }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      });
      
      const [procRes, summaryRes] = await Promise.all([
        apiClient.get(`/procurement?${params}`).catch(err => {
          console.error('Error fetching procurement:', err);
          return { data: { data: [], meta: { total: 0 } } };
        }),
        apiClient.get(`/procurement/summary?${selectedProject && selectedProject !== 'all' ? `projectId=${selectedProject}` : ''}`).catch(err => {
          console.error('Error fetching summary:', err);
          return { data: { data: null } };
        })
      ]);
      
      setProcurements(procRes?.data?.data || []);
      setTotalItems(procRes?.data?.meta?.total || 0);
      setSummary(summaryRes?.data?.data);
    } catch (error: any) {
      console.error('Error fetching procurement data:', error.response?.data || error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load procurement data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, searchQuery, filterStatus, filterPriority, filterCategory, filterSupplier, 
      sortBy, sortOrder, currentPage, pageSize, toast]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchProcurementData();
    }
  }, [isAuthenticated, fetchProcurementData]);
  
  // Set default project
  useEffect(() => {
    if (projectsData && Array.isArray(projectsData) && projectsData.length > 0 && !selectedProject) {
      const defaultProjectId = projectsData[0].id;
      setSelectedProject(defaultProjectId);
      form.setValue('projectId', defaultProjectId);
    }
  }, [projectsData, selectedProject, form]);
  
  // Handle form submission - Add
  const onSubmitAdd = async (values: any) => {
    try {
      // Clean up values - convert 'none' to null for optional fields
      const cleanedValues = {
        ...values,
        supplierId: values.supplierId === 'none' ? null : values.supplierId,
        budgetItemId: values.budgetItemId === 'none' ? null : values.budgetItemId
      };
      await apiClient.post('/procurement', cleanedValues);
      toast({
        title: 'Success',
        description: 'Procurement item created successfully'
      });
      setShowAddDialog(false);
      form.reset();
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create procurement item',
        variant: 'destructive'
      });
    }
  };
  
  // Handle form submission - Edit
  const onSubmitEdit = async (values: any) => {
    if (!selectedItem) return;
    
    try {
      // Clean up values - convert 'none' to null for optional fields
      const cleanedValues = {
        ...values,
        supplierId: values.supplierId === 'none' ? null : values.supplierId,
        budgetItemId: values.budgetItemId === 'none' ? null : values.budgetItemId
      };
      await apiClient.put(`/procurement/${selectedItem.id}`, cleanedValues);
      toast({
        title: 'Success',
        description: 'Procurement item updated successfully'
      });
      setShowEditDialog(false);
      setSelectedItem(null);
      form.reset();
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update procurement item',
        variant: 'destructive'
      });
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      await apiClient.delete(`/procurement/${selectedItem.id}`);
      toast({
        title: 'Success',
        description: 'Procurement item deleted successfully'
      });
      setShowDeleteDialog(false);
      setSelectedItem(null);
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete procurement item',
        variant: 'destructive'
      });
    }
  };
  
  // Handle status update
  const handleStatusUpdate = async (id: string, newStatus: string, additionalData?: any) => {
    try {
      await apiClient.patch(`/procurement/${id}`, {
        status: newStatus,
        ...additionalData
      });
      toast({
        title: 'Success',
        description: `Status updated to ${newStatus}`
      });
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update status',
        variant: 'destructive'
      });
    }
  };
  
  // Handle bulk operations
  const handleBulkOperation = async (operation: string, data?: any) => {
    if (selectedItems.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select items first',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await apiClient.post('/procurement/bulk', {
        ids: selectedItems,
        operation,
        data
      });
      toast({
        title: 'Success',
        description: `Bulk ${operation} completed successfully`
      });
      setSelectedItems([]);
      setShowBulkDialog(false);
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Bulk operation failed',
        variant: 'destructive'
      });
    }
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    const Icon = config?.icon || FileText;
    
    return (
      <Badge className={cn('gap-1', config?.color)}>
        <Icon className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };
  
  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
    const Icon = config?.icon || Target;
    
    return (
      <Badge variant="outline" className={cn('gap-1 border-0', config?.color, 'bg-opacity-20')}>
        <Icon className="h-3 w-3" />
        {config?.label || priority}
      </Badge>
    );
  };
  
  // Table columns definition
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
      accessorKey: 'poNumber',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PO #" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm">
            {row.original.poNumber || 'N/A'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'materialItem',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Item" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">{row.original.materialItem}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground truncate">
              {row.original.description}
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {row.original.discipline}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {row.original.phase}
            </Badge>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Qty" />
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">
            {row.original.quantity} {row.original.unit}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'totalCost',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Cost" />
      ),
      cell: ({ row }) => {
        const amount = row.original.totalCost || 0;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
        
        return (
          <div className="text-right">
            <div className="font-medium">{formatted}</div>
            {row.original.unitPrice && (
              <div className="text-xs text-muted-foreground">
                @ ${row.original.unitPrice}/{row.original.unit}
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'supplier',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Supplier" />
      ),
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        if (!supplier) return <span className="text-muted-foreground">Not assigned</span>;
        
        return (
          <div>
            <div className="font-medium">{supplier.name}</div>
            {supplier.company && (
              <div className="text-sm text-muted-foreground">{supplier.company}</div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'requiredBy',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Required By" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.requiredBy);
        const daysUntil = row.original.daysUntilRequired;
        const isOverdue = row.original.isOverdue;
        
        return (
          <div className={cn('flex items-center gap-2', isOverdue && 'text-red-600')}>
            <Calendar className="h-3 w-3" />
            <div>
              <div className="font-medium">{format(date, 'MMM d, yyyy')}</div>
              <div className="text-xs text-muted-foreground">
                {isOverdue ? (
                  <span className="text-red-600">Overdue by {Math.abs(daysUntil)} days</span>
                ) : (
                  <span>{daysUntil} days remaining</span>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />
    },
    {
      accessorKey: 'orderStatus',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.orderStatus} />
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => {
                setSelectedItem(item);
                setShowDetailsDialog(true);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Activity className="mr-2 h-4 w-4" />
                  Update Status
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {item.orderStatus === 'DRAFT' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'QUOTED')}>
                      Request Quote
                    </DropdownMenuItem>
                  )}
                  {item.orderStatus === 'QUOTED' && (
                    <>
                      <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'APPROVED')}>
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'REJECTED')}>
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {item.orderStatus === 'APPROVED' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'ORDERED')}>
                      Place Order
                    </DropdownMenuItem>
                  )}
                  {item.orderStatus === 'ORDERED' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'SHIPPED')}>
                      Mark as Shipped
                    </DropdownMenuItem>
                  )}
                  {item.orderStatus === 'SHIPPED' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'DELIVERED')}>
                      Mark as Delivered
                    </DropdownMenuItem>
                  )}
                  {item.orderStatus === 'DELIVERED' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'INSTALLED')}>
                      Mark as Installed
                    </DropdownMenuItem>
                  )}
                  {item.canCancel && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate(item.id, 'CANCELLED')}
                      className="text-red-600"
                    >
                      Cancel Order
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              {item.canEdit && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedItem(item);
                    form.reset({
                      projectId: item.projectId,
                      materialItem: item.materialItem,
                      description: item.description || '',
                      quantity: item.quantity,
                      unit: item.unit || 'EA',
                      unitPrice: item.unitPrice || 0,
                      totalCost: item.totalCost || 0,
                      discipline: item.discipline,
                      phase: item.phase,
                      category: item.category || 'MATERIALS',
                      requiredBy: format(new Date(item.requiredBy), 'yyyy-MM-dd'),
                      leadTimeDays: item.leadTimeDays,
                      supplierId: item.supplierId || '',
                      orderStatus: item.orderStatus,
                      priority: item.priority || 'MEDIUM',
                      eta: item.eta ? format(new Date(item.eta), 'yyyy-MM-dd') : '',
                      notes: item.notes || '',
                      budgetItemId: item.budgetItemId || '',
                      attachments: item.attachments || [],
                      tags: item.tags || []
                    });
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              
              {item.canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Paperclip className="mr-2 h-4 w-4" />
                Attachments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];
  
  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    if (!summary) return null;
    
    const totalValue = procurements.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const overdueCount = procurements.filter(item => item.isOverdue).length;
    const pendingApproval = procurements.filter(item => item.needsApproval).length;
    const thisMonthSpend = procurements
      .filter(item => {
        const date = new Date(item.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
    
    return {
      totalValue,
      overdueCount,
      pendingApproval,
      thisMonthSpend,
      totalItems: summary.total || 0,
      activeSuppliers: new Set(procurements.map(p => p.supplierId).filter(Boolean)).size
    };
  }, [procurements, summary]);
  
  if (authLoading) {
    return (
      <PageShell>
        <div className="p-6">
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PageShell>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please sign in to view procurement data
              </p>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }
  
  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Procurement Management</h1>
              <p className="text-muted-foreground">
                Manage purchase orders, track deliveries, and control procurement spend
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchProcurementData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Procurement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Procurement Item</DialogTitle>
                    <DialogDescription>
                      Add a new material or service procurement request
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-6">
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="budget">Budget</TabsTrigger>
                          <TabsTrigger value="tracking">Tracking</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="projectId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.isArray(projectsData) && projectsData.map((project: any) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="priority"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Priority</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                                        <SelectItem key={value} value={value}>
                                          <div className="flex items-center gap-2">
                                            <config.icon className="h-4 w-4" />
                                            {config.label}
                                          </div>
                                        </SelectItem>
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
                            name="materialItem"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Material/Service Item *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Concrete Mix, Steel Beams, Labor Services" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Detailed specifications, requirements, or notes"
                                    rows={3}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="quantity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity *</FormLabel>
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
                              name="unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {UNITS.map(unit => (
                                        <SelectItem key={unit} value={unit}>
                                          {unit}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="unitPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Price</FormLabel>
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
                          </div>
                          
                          {(form?.watch('totalCost') || 0) > 0 && (
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Total Cost:</span>
                                <span className="text-2xl font-bold">
                                  ${(form?.watch('totalCost') || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="details" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="discipline"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Discipline *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select discipline" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {DISCIPLINES.map(disc => (
                                        <SelectItem key={disc} value={disc}>
                                          {disc}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="phase"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phase *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select phase" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {PHASES.map(phase => (
                                        <SelectItem key={phase} value={phase}>
                                          {phase}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
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
                                      <SelectItem value="MATERIALS">Materials</SelectItem>
                                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                      <SelectItem value="TOOLS">Tools</SelectItem>
                                      <SelectItem value="SAFETY">Safety</SelectItem>
                                      <SelectItem value="CONSUMABLES">Consumables</SelectItem>
                                      <SelectItem value="SERVICES">Services</SelectItem>
                                      <SelectItem value="RENTAL">Rental</SelectItem>
                                      <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="supplierId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preferred Supplier</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="none">None</SelectItem>
                                      {suppliers.map((supplier: any) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                          {supplier.name} {supplier.company && `- ${supplier.company}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="requiredBy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Required By Date *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field}
                                      value={field.value instanceof Date 
                                        ? format(field.value, 'yyyy-MM-dd')
                                        : field.value || ''
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="leadTimeDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Lead Time (days) *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Typical delivery time for this item
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="budget" className="space-y-4">
                          <FormField
                            control={form.control}
                            name="budgetItemId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link to Budget Item</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select budget item" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {(Array.isArray(budgetData) ? budgetData : budgetData?.data || []).map((item: any) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.item} - {item.discipline} 
                                        (${Number(item.estTotal).toFixed(2)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Link to track against budget allocation
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {form?.watch('budgetItemId') && budgetData && (
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                              {(() => {
                                const budgetItem = (Array.isArray(budgetData) ? budgetData : budgetData?.data || []).find(
                                  (b: any) => b.id === form?.watch('budgetItemId')
                                );
                                if (!budgetItem) return null;
                                
                                const remaining = Number(budgetItem.estTotal) - Number(budgetItem.committedTotal);
                                const willExceed = (form?.watch('totalCost') || 0) > remaining;
                                
                                return (
                                  <>
                                    <div className="flex justify-between text-sm">
                                      <span>Budget Allocated:</span>
                                      <span>${Number(budgetItem.estTotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>Already Committed:</span>
                                      <span>${Number(budgetItem.committedTotal).toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-medium">
                                      <span>Remaining Budget:</span>
                                      <span className={cn(willExceed && 'text-red-600')}>
                                        ${remaining.toFixed(2)}
                                      </span>
                                    </div>
                                    {willExceed && (
                                      <div className="text-sm text-red-600 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        This order will exceed the budget by $
                                        {((form?.watch('totalCost') || 0) - remaining).toFixed(2)}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="tracking" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="orderStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Initial Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                                        <SelectItem key={value} value={value}>
                                          <div className="flex items-center gap-2">
                                            <config.icon className="h-4 w-4" />
                                            {config.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="eta"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estimated Arrival</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field}
                                      value={field.value instanceof Date 
                                        ? format(field.value, 'yyyy-MM-dd')
                                        : field.value || ''
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Special instructions, delivery notes, etc."
                                    rows={4}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-2">
                            <Label>Attachments</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center">
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                              <p className="mt-2 text-sm text-muted-foreground">
                                Drag and drop files here, or click to browse
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Procurement</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Filters Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items, PO numbers, suppliers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {Array.isArray(projectsData) && projectsData.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>
                      Overdue Items
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Needs Approval
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Has Attachments
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Clear Filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* KPI Cards */}
        {kpiMetrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${kpiMetrics.totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {kpiMetrics.totalItems} items
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${kpiMetrics.thisMonthSpend.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current month spend
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiMetrics.pendingApproval}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {kpiMetrics.overdueCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Past required date
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.statusBreakdown?.ordered || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiMetrics.activeSuppliers}</div>
                <p className="text-xs text-muted-foreground">
                  Active suppliers
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              Items
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approvals
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Current procurement status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary?.statusBreakdown && Object.entries(summary.statusBreakdown).map(([status, count]: [string, any]) => {
                      const config = STATUS_CONFIG[status.toUpperCase() as keyof typeof STATUS_CONFIG];
                      const percentage = (count / summary.total) * 100;
                      
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {config && <config.icon className="h-4 w-4" />}
                              <span className="capitalize">{status}</span>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest procurement updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] overflow-y-auto">
                    <div className="space-y-4">
                      {summary?.recentItems?.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="p-2 bg-muted rounded-lg">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {item.materialItem}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.project?.name} • {format(new Date(item.createdAt), 'MMM d, yyyy')}
                            </p>
                            <StatusBadge status={item.orderStatus} />
                          </div>
                          <div className="text-sm font-medium">
                            ${item.totalCost ? Number(item.totalCost).toFixed(2) : '0.00'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Procurement Items</CardTitle>
                    <CardDescription>
                      Manage all procurement requests and purchase orders
                    </CardDescription>
                  </div>
                  {selectedItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedItems.length} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkDialog(true)}
                      >
                        Bulk Actions
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={procurements}
                    searchKey="materialItem"
                    searchPlaceholder="Search items..."
                    onRowSelectionChange={(rows) => {
                      setSelectedItems(rows.map(r => r.original.id));
                    }}
                  />
                )}
              </CardContent>
              {totalItems > pageSize && (
                <CardFooter className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage * pageSize >= totalItems}
                    >
                      Next
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Spend by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Chart visualization would go here
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Chart visualization would go here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Items requiring approval before processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {procurements
                    .filter(item => item.needsApproval)
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{item.materialItem}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} • ${Number(item.totalCost).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  {procurements.filter(item => item.needsApproval).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No items pending approval
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Procurement Item</DialogTitle>
              <DialogDescription>
                Update procurement details
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-6">
                {/* Same form content as Add Dialog */}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Item</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Procurement Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedItem?.materialItem}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Bulk Operations Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Operations</DialogTitle>
              <DialogDescription>
                Apply action to {selectedItems.length} selected items
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleBulkOperation('approve')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve All
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleBulkOperation('updateStatus', { status: 'ORDERED' })}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Mark as Ordered
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleBulkOperation('assignSupplier')}
              >
                <Users className="mr-2 h-4 w-4" />
                Assign Supplier
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleBulkOperation('updatePriority', { priority: 'HIGH' })}
              >
                <Zap className="mr-2 h-4 w-4" />
                Set High Priority
              </Button>
              
              <Separator />
              
              <Button
                className="w-full justify-start"
                variant="destructive"
                onClick={() => handleBulkOperation('delete')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}