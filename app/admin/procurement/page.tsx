'use client';

import { useState, useMemo } from 'react';
import { Plus, Package, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Truck, FileText, DollarSign } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

// Mock data for now - will be replaced with API calls
const mockProcurements = [
  {
    id: '1',
    itemName: 'Kitchen Cabinets',
    category: 'MATERIALS',
    quantity: 12,
    unit: 'units',
    estimatedCost: 8500,
    actualCost: 8200,
    vendor: 'CabinetPro Solutions',
    status: 'ORDERED',
    orderDate: new Date('2024-01-15'),
    deliveryDate: new Date('2024-02-01'),
    poNumber: 'PO-2024-001',
    notes: 'White shaker style cabinets',
    approvedBy: 'John Smith',
    tracking: 'TRK123456'
  },
  {
    id: '2',
    itemName: 'Hardwood Flooring',
    category: 'MATERIALS',
    quantity: 850,
    unit: 'sq ft',
    estimatedCost: 4250,
    actualCost: null,
    vendor: 'FloorMasters Inc',
    status: 'PENDING',
    orderDate: null,
    deliveryDate: new Date('2024-02-15'),
    poNumber: null,
    notes: 'Oak flooring for living areas',
    approvedBy: null,
    tracking: null
  },
  {
    id: '3',
    itemName: 'Plumbing Fixtures',
    category: 'FIXTURES',
    quantity: 8,
    unit: 'sets',
    estimatedCost: 3200,
    actualCost: 3150,
    vendor: 'PlumbPerfect',
    status: 'DELIVERED',
    orderDate: new Date('2024-01-10'),
    deliveryDate: new Date('2024-01-25'),
    poNumber: 'PO-2024-002',
    notes: 'Bathroom and kitchen fixtures',
    approvedBy: 'John Smith',
    tracking: 'TRK789012'
  },
  {
    id: '4',
    itemName: 'Electrical Panel',
    category: 'EQUIPMENT',
    quantity: 1,
    unit: 'unit',
    estimatedCost: 1800,
    actualCost: null,
    vendor: 'ElectricSupply Co',
    status: 'APPROVED',
    orderDate: null,
    deliveryDate: new Date('2024-02-05'),
    poNumber: null,
    notes: '200 amp main panel upgrade',
    approvedBy: 'Jane Doe',
    tracking: null
  }
];

export default function AdminProcurementPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [procurements, setProcurements] = useState(mockProcurements);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'MATERIALS',
    quantity: '',
    unit: '',
    estimatedCost: '',
    actualCost: '',
    vendor: '',
    status: 'PENDING',
    orderDate: '',
    deliveryDate: '',
    poNumber: '',
    notes: '',
    approvedBy: '',
    tracking: ''
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalItems = procurements.length;
    const pendingApproval = procurements.filter(p => p.status === 'PENDING').length;
    const inTransit = procurements.filter(p => p.status === 'ORDERED').length;
    const delivered = procurements.filter(p => p.status === 'DELIVERED').length;
    const totalEstimated = procurements.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);
    const totalActual = procurements.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    const savings = totalEstimated - totalActual;

    return {
      totalItems,
      pendingApproval,
      inTransit,
      delivered,
      totalEstimated,
      totalActual,
      savings
    };
  }, [procurements]);

  const handleCreate = () => {
    const newItem = {
      id: Date.now().toString(),
      itemName: formData.itemName,
      category: formData.category,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      estimatedCost: parseFloat(formData.estimatedCost),
      actualCost: formData.actualCost ? parseFloat(formData.actualCost) : null,
      vendor: formData.vendor,
      status: formData.status,
      orderDate: formData.orderDate ? new Date(formData.orderDate) : null,
      deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : null,
      poNumber: formData.poNumber || null,
      notes: formData.notes,
      approvedBy: formData.approvedBy || null,
      tracking: formData.tracking || null
    };

    setProcurements([...procurements, newItem]);
    toast({
      title: 'Success',
      description: 'Procurement item created successfully',
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedItem) return;

    const updatedProcurements = procurements.map(p => {
      if (p.id === selectedItem.id) {
        return {
          ...p,
          itemName: formData.itemName,
          category: formData.category,
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
          estimatedCost: parseFloat(formData.estimatedCost),
          actualCost: formData.actualCost ? parseFloat(formData.actualCost) : null,
          vendor: formData.vendor,
          status: formData.status,
          orderDate: formData.orderDate ? new Date(formData.orderDate) : null,
          deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : null,
          poNumber: formData.poNumber || null,
          notes: formData.notes,
          approvedBy: formData.approvedBy || null,
          tracking: formData.tracking || null
        };
      }
      return p;
    });

    setProcurements(updatedProcurements);
    toast({
      title: 'Success',
      description: 'Procurement item updated successfully',
    });
    setIsEditOpen(false);
    setSelectedItem(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedItem) return;

    setProcurements(procurements.filter(p => p.id !== selectedItem.id));
    toast({
      title: 'Success',
      description: 'Procurement item deleted successfully',
    });
    setIsDeleteOpen(false);
    setSelectedItem(null);
  };

  const handleApprove = (itemId: string) => {
    const updatedProcurements = procurements.map(p => {
      if (p.id === itemId) {
        return { ...p, status: 'APPROVED', approvedBy: 'Current User' };
      }
      return p;
    });
    setProcurements(updatedProcurements);
    toast({
      title: 'Success',
      description: 'Item approved successfully',
    });
  };

  const handleReject = (itemId: string) => {
    const updatedProcurements = procurements.map(p => {
      if (p.id === itemId) {
        return { ...p, status: 'REJECTED' };
      }
      return p;
    });
    setProcurements(updatedProcurements);
    toast({
      title: 'Success',
      description: 'Item rejected',
    });
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      category: 'MATERIALS',
      quantity: '',
      unit: '',
      estimatedCost: '',
      actualCost: '',
      vendor: '',
      status: 'PENDING',
      orderDate: '',
      deliveryDate: '',
      poNumber: '',
      notes: '',
      approvedBy: '',
      tracking: ''
    });
  };

  const openEditDialog = (item: any) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      estimatedCost: item.estimatedCost.toString(),
      actualCost: item.actualCost?.toString() || '',
      vendor: item.vendor,
      status: item.status,
      orderDate: item.orderDate ? format(item.orderDate, 'yyyy-MM-dd') : '',
      deliveryDate: item.deliveryDate ? format(item.deliveryDate, 'yyyy-MM-dd') : '',
      poNumber: item.poNumber || '',
      notes: item.notes || '',
      approvedBy: item.approvedBy || '',
      tracking: item.tracking || ''
    });
    setIsEditOpen(true);
  };

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return procurements.filter(p => p.status === 'PENDING');
      case 'approved':
        return procurements.filter(p => p.status === 'APPROVED');
      case 'ordered':
        return procurements.filter(p => p.status === 'ORDERED');
      case 'delivered':
        return procurements.filter(p => p.status === 'DELIVERED');
      default:
        return procurements;
    }
  }, [procurements, activeTab]);

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
      accessorKey: 'itemName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Item" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('itemName')}</div>
          {row.original.notes && (
            <div className="text-sm text-white/60">{row.original.notes}</div>
          )}
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
      accessorKey: 'quantity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quantity" />
      ),
      cell: ({ row }) => (
        <div>
          {row.getValue('quantity')} {row.original.unit}
        </div>
      ),
    },
    {
      accessorKey: 'estimatedCost',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Est. Cost" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${row.getValue<number>('estimatedCost').toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'actualCost',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actual Cost" />
      ),
      cell: ({ row }) => {
        const cost = row.getValue<number | null>('actualCost');
        return (
          <div className="text-right font-medium">
            {cost ? `$${cost.toLocaleString()}` : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'vendor',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
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
              status === 'DELIVERED' ? 'default' :
              status === 'ORDERED' ? 'secondary' :
              status === 'APPROVED' ? 'outline' :
              status === 'REJECTED' ? 'destructive' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'deliveryDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delivery" />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>('deliveryDate');
        return date ? format(date, 'MMM dd, yyyy') : '-';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            {item.status === 'PENDING' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApprove(item.id)}
                  className="text-green-400 hover:text-green-300"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(item.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(item)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
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
            <h1 className="text-3xl font-bold text-white">Procurement Management</h1>
            <p className="text-white/60">Track and manage material orders and deliveries</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Procurement Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px] bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Create Procurement Item</DialogTitle>
                <DialogDescription className="text-white/60">
                  Add a new procurement order
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Kitchen Cabinets"
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
                        <SelectItem value="MATERIALS">Materials</SelectItem>
                        <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                        <SelectItem value="FIXTURES">Fixtures</SelectItem>
                        <SelectItem value="TOOLS">Tools</SelectItem>
                        <SelectItem value="SUPPLIES">Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., units, sq ft"
                    />
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
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="ORDERED">Ordered</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Cost</Label>
                    <Input
                      type="number"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Cost</Label>
                    <Input
                      type="number"
                      value={formData.actualCost}
                      onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="Vendor name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Delivery</Label>
                    <Input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PO Number</Label>
                    <Input
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="PO-2024-XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking Number</Label>
                    <Input
                      value={formData.tracking}
                      onChange={(e) => setFormData({ ...formData, tracking: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="Tracking number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="Additional notes..."
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

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Items</CardTitle>
              <Package className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalItems}</div>
              <p className="text-xs text-white/60 mt-1">Active procurement items</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.pendingApproval}</div>
              <p className="text-xs text-white/60 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.inTransit}</div>
              <p className="text-xs text-white/60 mt-1">Orders in transit</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                metrics.savings >= 0 ? "text-green-400" : "text-red-400"
              )}>
                ${Math.abs(metrics.savings).toLocaleString()}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {metrics.savings >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Procurement Pipeline */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Procurement Pipeline</CardTitle>
            <CardDescription className="text-white/60">
              Track items through the procurement process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{metrics.pendingApproval}</div>
                <div className="text-sm text-white/60 mt-1">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {procurements.filter(p => p.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-white/60 mt-1">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{metrics.inTransit}</div>
                <div className="text-sm text-white/60 mt-1">Ordered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{metrics.delivered}</div>
                <div className="text-sm text-white/60 mt-1">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {procurements.filter(p => p.status === 'REJECTED').length}
                </div>
                <div className="text-sm text-white/60 mt-1">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {metrics.pendingApproval > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.pendingApproval}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="ordered">Ordered</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  {activeTab === 'all' && 'All Procurement Items'}
                  {activeTab === 'pending' && 'Pending Approvals'}
                  {activeTab === 'approved' && 'Approved Items'}
                  {activeTab === 'ordered' && 'Ordered Items'}
                  {activeTab === 'delivered' && 'Delivered Items'}
                </CardTitle>
                <CardDescription className="text-white/60">
                  Manage procurement orders and deliveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredData}
                  searchKey="itemName"
                  searchPlaceholder="Search items..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[725px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Edit Procurement Item</DialogTitle>
              <DialogDescription className="text-white/60">
                Update procurement order details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
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
                      <SelectItem value="MATERIALS">Materials</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="FIXTURES">Fixtures</SelectItem>
                      <SelectItem value="TOOLS">Tools</SelectItem>
                      <SelectItem value="SUPPLIES">Supplies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="ORDERED">Ordered</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Cost</Label>
                  <Input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Cost</Label>
                  <Input
                    type="number"
                    value={formData.actualCost}
                    onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tracking Number</Label>
                  <Input
                    value={formData.tracking}
                    onChange={(e) => setFormData({ ...formData, tracking: e.target.value })}
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
              <Button onClick={handleEdit}>Update Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-gray-900 text-white border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Procurement Item</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete "{selectedItem?.itemName}"? This action cannot be undone.
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