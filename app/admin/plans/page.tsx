'use client';

import { useState, useMemo } from 'react';
import { FileText, Download, Eye, Share2, CheckCircle, AlertCircle, Upload, Folder } from 'lucide-react';
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
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

// Mock data for now - will be replaced with API calls
const mockPlans = [
  {
    id: '1',
    name: 'Architectural Floor Plans - Rev 3',
    category: 'ARCHITECTURAL',
    version: '3.0',
    fileName: 'floor-plans-rev3.pdf',
    fileSize: 4567890,
    uploadedBy: 'John Architect',
    uploadedAt: new Date('2024-01-20'),
    status: 'APPROVED',
    description: 'Final approved floor plans with all revisions',
    tags: ['floor-plan', 'approved', 'final'],
    sharedWith: ['contractor@example.com', 'client@example.com'],
    downloadCount: 15,
    lastViewed: new Date('2024-01-25')
  },
  {
    id: '2',
    name: 'Electrical Layout',
    category: 'ELECTRICAL',
    version: '2.1',
    fileName: 'electrical-layout.dwg',
    fileSize: 2345678,
    uploadedBy: 'Jane Engineer',
    uploadedAt: new Date('2024-01-18'),
    status: 'UNDER_REVIEW',
    description: 'Electrical wiring and outlet placement',
    tags: ['electrical', 'review'],
    sharedWith: ['electrician@example.com'],
    downloadCount: 8,
    lastViewed: new Date('2024-01-24')
  },
  {
    id: '3',
    name: 'Plumbing Schematics',
    category: 'PLUMBING',
    version: '1.0',
    fileName: 'plumbing-layout.pdf',
    fileSize: 3456789,
    uploadedBy: 'Bob Plumber',
    uploadedAt: new Date('2024-01-15'),
    status: 'APPROVED',
    description: 'Complete plumbing system layout',
    tags: ['plumbing', 'approved'],
    sharedWith: ['plumber@example.com', 'contractor@example.com'],
    downloadCount: 12,
    lastViewed: new Date('2024-01-23')
  },
  {
    id: '4',
    name: 'Structural Calculations',
    category: 'STRUCTURAL',
    version: '2.0',
    fileName: 'structural-calcs.xlsx',
    fileSize: 1234567,
    uploadedBy: 'Sarah Structural',
    uploadedAt: new Date('2024-01-10'),
    status: 'APPROVED',
    description: 'Load calculations and beam sizing',
    tags: ['structural', 'calculations', 'approved'],
    sharedWith: ['engineer@example.com'],
    downloadCount: 5,
    lastViewed: new Date('2024-01-22')
  },
  {
    id: '5',
    name: 'Kitchen Design Renders',
    category: 'DESIGN',
    version: '1.2',
    fileName: 'kitchen-renders.zip',
    fileSize: 8901234,
    uploadedBy: 'Mike Designer',
    uploadedAt: new Date('2024-01-25'),
    status: 'DRAFT',
    description: '3D renders of kitchen design options',
    tags: ['kitchen', 'design', 'renders'],
    sharedWith: [],
    downloadCount: 3,
    lastViewed: new Date('2024-01-25')
  }
];

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [isLoading] = useState(false);
  const [plans, setPlans] = useState(mockPlans);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof mockPlans[0] | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'ARCHITECTURAL',
    version: '',
    description: '',
    tags: '',
    status: 'DRAFT',
    file: null as File | null
  });

  const [shareEmail, setShareEmail] = useState('');

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalPlans = plans.length;
    const approved = plans.filter(p => p.status === 'APPROVED').length;
    const underReview = plans.filter(p => p.status === 'UNDER_REVIEW').length;
    const totalSize = plans.reduce((sum, p) => sum + p.fileSize, 0);
    const totalDownloads = plans.reduce((sum, p) => sum + p.downloadCount, 0);
    const recentlyViewed = plans.filter(p => {
      const daysSinceView = (new Date().getTime() - p.lastViewed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceView <= 7;
    }).length;

    return {
      totalPlans,
      approved,
      underReview,
      totalSize,
      totalDownloads,
      recentlyViewed
    };
  }, [plans]);

  const handleUpload = () => {
    if (!formData.file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    const newPlan = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      version: formData.version,
      fileName: formData.file.name,
      fileSize: formData.file.size,
      uploadedBy: 'Current User',
      uploadedAt: new Date(),
      status: formData.status,
      description: formData.description,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      sharedWith: [],
      downloadCount: 0,
      lastViewed: new Date()
    };

    setPlans([...plans, newPlan]);
    toast({
      title: 'Success',
      description: 'Plan uploaded successfully',
    });
    setIsUploadOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedPlan) return;

    const updatedPlans = plans.map(p => {
      if (p.id === selectedPlan.id) {
        return {
          ...p,
          name: formData.name,
          category: formData.category,
          version: formData.version,
          description: formData.description,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          status: formData.status
        };
      }
      return p;
    });

    setPlans(updatedPlans);
    toast({
      title: 'Success',
      description: 'Plan updated successfully',
    });
    setIsEditOpen(false);
    setSelectedPlan(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedPlan) return;

    setPlans(plans.filter(p => p.id !== selectedPlan.id));
    toast({
      title: 'Success',
      description: 'Plan deleted successfully',
    });
    setIsDeleteOpen(false);
    setSelectedPlan(null);
  };

  const handleShare = () => {
    if (!selectedPlan || !shareEmail) return;

    const updatedPlans = plans.map(p => {
      if (p.id === selectedPlan.id) {
        return {
          ...p,
          sharedWith: [...p.sharedWith, shareEmail]
        };
      }
      return p;
    });

    setPlans(updatedPlans);
    toast({
      title: 'Success',
      description: `Plan shared with ${shareEmail}`,
    });
    setIsShareOpen(false);
    setShareEmail('');
    setSelectedPlan(null);
  };

  const handleDownload = (plan: typeof mockPlans[0]) => {
    // Update download count
    const updatedPlans = plans.map(p => {
      if (p.id === plan.id) {
        return { ...p, downloadCount: p.downloadCount + 1 };
      }
      return p;
    });
    setPlans(updatedPlans);

    toast({
      title: 'Download started',
      description: `Downloading ${plan.fileName}`,
    });
  };

  const handleView = (plan: typeof mockPlans[0]) => {
    // Update last viewed
    const updatedPlans = plans.map(p => {
      if (p.id === plan.id) {
        return { ...p, lastViewed: new Date() };
      }
      return p;
    });
    setPlans(updatedPlans);

    toast({
      title: 'Opening file',
      description: `Viewing ${plan.fileName}`,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'ARCHITECTURAL',
      version: '',
      description: '',
      tags: '',
      status: 'DRAFT',
      file: null
    });
  };

  const openEditDialog = (plan: typeof mockPlans[0]) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      category: plan.category,
      version: plan.version,
      description: plan.description,
      tags: plan.tags.join(', '),
      status: plan.status,
      file: null
    });
    setIsEditOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'approved':
        return plans.filter(p => p.status === 'APPROVED');
      case 'review':
        return plans.filter(p => p.status === 'UNDER_REVIEW');
      case 'draft':
        return plans.filter(p => p.status === 'DRAFT');
      case 'shared':
        return plans.filter(p => p.sharedWith.length > 0);
      default:
        return plans;
    }
  }, [plans, activeTab]);

  const columns: ColumnDef<typeof mockPlans[0]>[] = [
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
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Document" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-white/40" />
            <div>
              <div className="font-medium">{row.getValue('name')}</div>
              <div className="text-sm text-white/60">{row.original.fileName}</div>
            </div>
          </div>
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
      accessorKey: 'version',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Version" />
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('version')}</div>
      ),
    },
    {
      accessorKey: 'fileSize',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      cell: ({ row }) => formatFileSize(row.getValue('fileSize')),
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
              status === 'UNDER_REVIEW' ? 'secondary' :
              'outline'
            }
          >
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'uploadedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Uploaded" />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>('uploadedAt');
        return (
          <div>
            <div className="text-sm">{format(date, 'MMM dd, yyyy')}</div>
            <div className="text-xs text-white/60">by {row.original.uploadedBy}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'sharedWith',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Shared" />
      ),
      cell: ({ row }) => {
        const shared = row.getValue<string[]>('sharedWith');
        return shared.length > 0 ? (
          <div className="flex items-center gap-1">
            <Share2 className="h-4 w-4 text-white/40" />
            <span>{shared.length}</span>
          </div>
        ) : (
          <span className="text-white/40">-</span>
        );
      },
    },
    {
      accessorKey: 'downloadCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Downloads" />
      ),
      cell: ({ row }) => row.getValue('downloadCount'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(plan)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(plan)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPlan(plan);
                setIsShareOpen(true);
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(plan)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPlan(plan);
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
            <h1 className="text-3xl font-bold text-white">Plans & Documents</h1>
            <p className="text-white/60">Manage project blueprints and documentation</p>
          </div>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Upload New Plan</DialogTitle>
                <DialogDescription className="text-white/60">
                  Upload a new plan or document to the project
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input
                    type="file"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="bg-white/5 border-white/10"
                    accept=".pdf,.dwg,.dxf,.xlsx,.xls,.doc,.docx,.zip"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Floor Plans Rev 3"
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
                        <SelectItem value="ARCHITECTURAL">Architectural</SelectItem>
                        <SelectItem value="STRUCTURAL">Structural</SelectItem>
                        <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                        <SelectItem value="PLUMBING">Plumbing</SelectItem>
                        <SelectItem value="MECHANICAL">Mechanical</SelectItem>
                        <SelectItem value="DESIGN">Design</SelectItem>
                        <SelectItem value="PERMITS">Permits</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Version</Label>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., 1.0"
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
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="SUPERSEDED">Superseded</SelectItem>
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
                    placeholder="Brief description of the document..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="e.g., floor-plan, kitchen, approved"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Documents</CardTitle>
              <Folder className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalPlans}</div>
              <p className="text-xs text-white/60 mt-1">All uploaded plans</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.approved}</div>
              <p className="text-xs text-white/60 mt-1">Ready for use</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Under Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.underReview}</div>
              <p className="text-xs text-white/60 mt-1">Pending approval</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalDownloads}</div>
              <p className="text-xs text-white/60 mt-1">All time downloads</p>
            </CardContent>
          </Card>
        </div>

        {/* Storage Overview */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Storage Usage</CardTitle>
            <CardDescription className="text-white/60">
              Total storage used: {formatFileSize(metrics.totalSize)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {['ARCHITECTURAL', 'STRUCTURAL', 'ELECTRICAL', 'DESIGN'].map(category => {
                const categorySize = plans
                  .filter(p => p.category === category)
                  .reduce((sum, p) => sum + p.fileSize, 0);
                return (
                  <div key={category} className="text-center">
                    <div className="text-lg font-bold text-white">
                      {formatFileSize(categorySize)}
                    </div>
                    <div className="text-sm text-white/60">{category}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="all">All Plans</TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {metrics.approved > 0 && (
                <Badge variant="default" className="ml-2">
                  {metrics.approved}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="review">
              Under Review
              {metrics.underReview > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {metrics.underReview}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  {activeTab === 'all' && 'All Documents'}
                  {activeTab === 'approved' && 'Approved Documents'}
                  {activeTab === 'review' && 'Documents Under Review'}
                  {activeTab === 'draft' && 'Draft Documents'}
                  {activeTab === 'shared' && 'Shared Documents'}
                </CardTitle>
                <CardDescription className="text-white/60">
                  Manage project plans and documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredData}
                  searchKey="name"
                  searchPlaceholder="Search documents..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription className="text-white/60">
                Update document information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      <SelectItem value="ARCHITECTURAL">Architectural</SelectItem>
                      <SelectItem value="STRUCTURAL">Structural</SelectItem>
                      <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                      <SelectItem value="PLUMBING">Plumbing</SelectItem>
                      <SelectItem value="MECHANICAL">Mechanical</SelectItem>
                      <SelectItem value="DESIGN">Design</SelectItem>
                      <SelectItem value="PERMITS">Permits</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
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
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="SUPERSEDED">Superseded</SelectItem>
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
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Share Document</DialogTitle>
              <DialogDescription className="text-white/60">
                Share &quot;{selectedPlan?.name}&quot; with team members
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="bg-white/5 border-white/10"
                  placeholder="email@example.com"
                />
              </div>
              {selectedPlan?.sharedWith?.length > 0 && (
                <div className="space-y-2">
                  <Label>Currently Shared With:</Label>
                  <div className="space-y-1">
                    {selectedPlan.sharedWith.map((email: string) => (
                      <div key={email} className="text-sm text-white/60">{email}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShare}>Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-gray-900 text-white border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete &quot;{selectedPlan?.name}&quot;? This action cannot be undone.
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