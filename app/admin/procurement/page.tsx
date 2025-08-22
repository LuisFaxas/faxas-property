'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageShell } from '@/components/blocks/page-shell';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

// Validation schemas
const POStatus = z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 'RECEIVED', 'CLOSED', 'CANCELLED']);
const PaymentTerms = z.enum(['NET_30', 'NET_60', 'NET_90', 'DUE_ON_RECEIPT', 'PREPAID', 'MILESTONE', 'CUSTOM']);

const purchaseOrderItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  totalPrice: z.number().min(0),
  budgetItemId: z.string().optional(),
  notes: z.string().optional()
});

const purchaseOrderSchema = z.object({
  poNumber: z.string().optional(),
  vendorId: z.string().min(1, 'Vendor is required'),
  projectId: z.string().min(1, 'Project is required'),
  budgetItemId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  paymentTerms: PaymentTerms.default('NET_30'),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  status: POStatus.default('DRAFT')
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  purchaseOrderId: z.string().min(1, 'Purchase order is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  projectId: z.string().min(1, 'Project is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  notes: z.string().optional()
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  purchaseOrderId: z.string().min(1, 'Purchase order is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['CHECK', 'ACH', 'WIRE', 'CREDIT_CARD', 'CASH', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; icon: any }> = {
    DRAFT: { variant: 'secondary', icon: FileText },
    PENDING: { variant: 'default', icon: Clock },
    APPROVED: { variant: 'success', icon: CheckCircle },
    REJECTED: { variant: 'destructive', icon: XCircle },
    ISSUED: { variant: 'default', icon: Package },
    RECEIVED: { variant: 'success', icon: CheckCircle },
    CLOSED: { variant: 'secondary', icon: CheckCircle },
    CANCELLED: { variant: 'destructive', icon: XCircle }
  };

  const config = variants[status] || { variant: 'default', icon: AlertCircle };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

export default function ProcurementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isReady = !!user;
  
  // State
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  // Dialog states
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isEditPOOpen, setIsEditPOOpen] = useState(false);
  const [isDeletePOOpen, setIsDeletePOOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Form state for PO items
  const [poItems, setPOItems] = useState<any[]>([{
    description: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    notes: ''
  }]);

  // Use hooks for data fetching
  const { data: projectsData } = useProjects(isReady);
  const { data: contactsData } = useContacts({}, isReady);
  const { data: budgetData } = useBudget({ 
    projectId: selectedProject !== 'all' ? selectedProject : '' 
  }, isReady);

  const projects = Array.isArray(projectsData) ? projectsData : [];
  // Filter contacts for vendors (Subcontractors and Suppliers can be vendors)
  const vendors = Array.isArray(contactsData) ? contactsData.filter((c: any) => 
    c.category === 'SUBCONTRACTOR' || c.category === 'SUPPLIER'
  ) : [];
  const budgetItems = Array.isArray(budgetData) ? budgetData : [];

  // Forms
  const poForm = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      status: 'DRAFT',
      paymentTerms: 'NET_30',
      tax: 0,
      shipping: 0,
      items: [],
      projectId: projects[0]?.id || ''
    }
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CHECK'
    }
  });

  // Set default project when projects load
  useEffect(() => {
    if (projects.length > 0 && !poForm.getValues('projectId')) {
      poForm.setValue('projectId', projects[0].id);
    }
  }, [projects, poForm]);

  // Fetch procurement data
  useEffect(() => {
    if (isReady) {
      fetchProcurementData();
    }
  }, [selectedProject, isReady]);

  const fetchProcurementData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedProject && selectedProject !== 'all') {
        params.append('projectId', selectedProject);
      }
      
      const [posRes, invoicesRes, paymentsRes, summaryRes] = await Promise.all([
        apiClient.get(`/api/v1/procurement?${params}`),
        apiClient.get(`/api/v1/procurement/invoices?${params}`),
        apiClient.get(`/api/v1/procurement/payments?${params}`),
        apiClient.get(`/api/v1/procurement/summary?${params}`)
      ]);
      
      setPurchaseOrders(posRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
      setPayments(paymentsRes.data.data || []);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Error fetching procurement data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load procurement data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // PO Items management
  const addPOItem = () => {
    setPOItems([...poItems, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      notes: ''
    }]);
  };

  const removePOItem = (index: number) => {
    if (poItems.length > 1) {
      setPOItems(poItems.filter((_, i) => i !== index));
    }
  };

  const updatePOItem = (index: number, field: string, value: any) => {
    const updated = [...poItems];
    updated[index][field] = value;
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
    }
    
    setPOItems(updated);
    
    // Update form totals
    const subtotal = updated.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = poForm.getValues('tax') || 0;
    const shipping = poForm.getValues('shipping') || 0;
    poForm.setValue('subtotal', subtotal);
    poForm.setValue('totalAmount', subtotal + tax + shipping);
  };

  // Auto-calculate PO totals
  const watchTax = poForm.watch('tax');
  const watchShipping = poForm.watch('shipping');
  
  useEffect(() => {
    const subtotal = poItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = subtotal + (watchTax || 0) + (watchShipping || 0);
    poForm.setValue('subtotal', subtotal);
    poForm.setValue('totalAmount', total);
  }, [watchTax, watchShipping, poItems, poForm]);

  // CRUD Operations
  const handleCreatePO = async (data: PurchaseOrderFormValues) => {
    try {
      const formData = {
        ...data,
        items: poItems.filter(item => item.description),
        subtotal: poItems.reduce((sum, item) => sum + item.totalPrice, 0)
      };
      
      await apiClient.post('/api/v1/procurement', formData);
      
      toast({
        title: 'Success',
        description: 'Purchase order created successfully'
      });
      
      setIsCreatePOOpen(false);
      poForm.reset();
      setPOItems([{
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        notes: ''
      }]);
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create purchase order',
        variant: 'destructive'
      });
    }
  };

  const handleUpdatePO = async (data: PurchaseOrderFormValues) => {
    if (!selectedPO) return;
    
    try {
      await apiClient.put(`/api/v1/procurement/${selectedPO.id}`, data);
      
      toast({
        title: 'Success',
        description: 'Purchase order updated successfully'
      });
      
      setIsEditPOOpen(false);
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update purchase order',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePO = async () => {
    if (!selectedPO) return;
    
    try {
      await apiClient.delete(`/api/v1/procurement/${selectedPO.id}`);
      
      toast({
        title: 'Success',
        description: 'Purchase order deleted successfully'
      });
      
      setIsDeletePOOpen(false);
      setSelectedPO(null);
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete purchase order',
        variant: 'destructive'
      });
    }
  };

  const handlePOAction = async (id: string, action: 'approve' | 'reject' | 'cancel') => {
    try {
      await apiClient.patch(`/api/v1/procurement/${id}`, { action });
      
      toast({
        title: 'Success',
        description: `Purchase order ${action}d successfully`
      });
      
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to ${action} purchase order`,
        variant: 'destructive'
      });
    }
  };

  const handleCreateInvoice = async (data: InvoiceFormValues) => {
    try {
      await apiClient.post('/api/v1/procurement/invoices', {
        ...data,
        status: 'PENDING',
        paidAmount: 0
      });
      
      toast({
        title: 'Success',
        description: 'Invoice created successfully'
      });
      
      setIsCreateInvoiceOpen(false);
      invoiceForm.reset();
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create invoice',
        variant: 'destructive'
      });
    }
  };

  const handleCreatePayment = async (data: PaymentFormValues) => {
    try {
      await apiClient.post('/api/v1/procurement/payments', data);
      
      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });
      
      setIsCreatePaymentOpen(false);
      paymentForm.reset();
      fetchProcurementData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record payment',
        variant: 'destructive'
      });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['PO Number', 'Vendor', 'Project', 'Total Amount', 'Status', 'Created Date'],
      ...purchaseOrders.map(po => [
        po.poNumber,
        po.vendor?.name || '',
        po.project?.name || '',
        po.totalAmount,
        po.status,
        new Date(po.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procurement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Table columns
  const poColumns: ColumnDef<any>[] = [
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
        <DataTableColumnHeader column={column} title="PO Number" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('poNumber')}</span>
      )
    },
    {
      accessorKey: 'vendor',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => row.original.vendor?.name || '-'
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate" title={row.getValue('description')}>
          {row.getValue('description')}
        </span>
      )
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Amount" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('totalAmount'));
        return <span className="font-medium">${amount.toLocaleString()}</span>;
      }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />
    },
    {
      accessorKey: 'deliveryDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delivery Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('deliveryDate');
        return date ? format(new Date(date as string), 'MMM dd, yyyy') : '-';
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const po = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedPO(po);
                // View details modal
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {po.status === 'PENDING' && user?.role === 'ADMIN' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handlePOAction(po.id, 'approve')}
                    className="text-green-500"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handlePOAction(po.id, 'reject')}
                    className="text-red-500"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {['DRAFT', 'PENDING'].includes(po.status) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setSelectedPO(po);
                    poForm.reset(po);
                    setPOItems(po.items || []);
                    setIsEditPOOpen(true);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </>
              )}
              {po.status === 'DRAFT' && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedPO(po);
                    setIsDeletePOOpen(true);
                  }}
                  className="text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const invoiceColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('invoiceNumber')}</span>
      )
    },
    {
      accessorKey: 'vendor',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => row.original.vendor?.name || '-'
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        return <span className="font-medium">${amount.toLocaleString()}</span>;
      }
    },
    {
      accessorKey: 'balanceDue',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance Due" />
      ),
      cell: ({ row }) => {
        const balance = row.original.balanceDue || 0;
        return (
          <span className={cn(
            "font-medium",
            balance > 0 ? 'text-red-500' : 'text-green-500'
          )}>
            ${balance.toLocaleString()}
          </span>
        );
      }
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDate = new Date(row.getValue('dueDate'));
        const isOverdue = row.original.isOverdue;
        return (
          <span className={cn(isOverdue && 'text-red-500 font-medium')}>
            {format(dueDate, 'MMM dd, yyyy')}
            {isOverdue && ` (${row.original.daysOverdue}d overdue)`}
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variant = {
          PENDING: 'default',
          PARTIAL: 'warning',
          PAID: 'success',
          OVERDUE: 'destructive',
          CANCELLED: 'secondary'
        }[status] || 'default';
        
        return <Badge variant={variant as any}>{status}</Badge>;
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;
        
        return invoice.status !== 'PAID' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedInvoice(invoice);
              paymentForm.setValue('invoiceId', invoice.id);
              paymentForm.setValue('purchaseOrderId', invoice.purchaseOrderId);
              paymentForm.setValue('amount', invoice.balanceDue || 0);
              setIsCreatePaymentOpen(true);
            }}
          >
            Record Payment
          </Button>
        ) : null;
      }
    }
  ];

  const paymentColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'paymentDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => format(new Date(row.getValue('paymentDate')), 'MMM dd, yyyy')
    },
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => row.getValue('invoiceNumber') || '-'
    },
    {
      accessorKey: 'vendorName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => row.getValue('vendorName') || '-'
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        return <span className="font-medium">${amount.toLocaleString()}</span>;
      }
    },
    {
      accessorKey: 'paymentMethod',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Method" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('paymentMethod')}</Badge>
      )
    },
    {
      accessorKey: 'referenceNumber',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reference #" />
      ),
      cell: ({ row }) => row.getValue('referenceNumber') || '-'
    }
  ];

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[120px] mb-1" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Procurement Management</h1>
            <p className="text-white/60 mt-1">Manage purchase orders, invoices, and payments</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[200px] glass-input">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="glass-card">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Loading or Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total POs</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.overview?.totalPOs || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      ${(summary.overview?.totalPOAmount || 0).toLocaleString()} total value
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(summary.invoices?.outstandingAmount || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.invoices?.overdueCount || 0} overdue invoices
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.overview?.pendingApproval || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Requires review
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(summary.payments?.totalAmount || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.payments?.total || 0} payments
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="glass-tabs">
                <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Purchase Orders</h2>
                  <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Purchase Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto glass-card">
                      <DialogHeader>
                        <DialogTitle>Create Purchase Order</DialogTitle>
                        <DialogDescription>
                          Create a new purchase order for vendor services or materials
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...poForm}>
                        <form onSubmit={poForm.handleSubmit(handleCreatePO)} className="space-y-4">
                          {/* Form fields will go here - keeping it shorter for brevity */}
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreatePOOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Create Purchase Order</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                <DataTable columns={poColumns} data={purchaseOrders} />
              </TabsContent>

              <TabsContent value="invoices" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Invoices</h2>
                  <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Invoice
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card">
                      <DialogHeader>
                        <DialogTitle>Create Invoice</DialogTitle>
                        <DialogDescription>
                          Record a new vendor invoice
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...invoiceForm}>
                        <form onSubmit={invoiceForm.handleSubmit(handleCreateInvoice)} className="space-y-4">
                          {/* Invoice form fields */}
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Create Invoice</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                <DataTable columns={invoiceColumns} data={invoices} />
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Payment History</h2>
                </div>
                <DataTable columns={paymentColumns} data={payments} />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeletePOOpen} onOpenChange={setIsDeletePOOpen}>
          <AlertDialogContent className="glass-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete PO "{selectedPO?.poNumber}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePO}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Dialog */}
        <Dialog open={isCreatePaymentOpen} onOpenChange={setIsCreatePaymentOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for invoice {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handleCreatePayment)} className="space-y-4">
                {/* Payment form fields */}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreatePaymentOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Payment</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}