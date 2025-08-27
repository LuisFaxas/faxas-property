'use client';

import { useState, useEffect } from 'react';
import { ContactCard } from '@/components/contacts/contact-card';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AssignTaskDialog } from '@/components/contacts/assign-task-dialog';
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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/app/contexts/AuthContext';
import { useContacts, useCreateContact, useProjects } from '@/hooks/use-api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Phone,
  Mail,
  Building,
  User,
  Users,
  UserPlus,
  Download,
  LayoutGrid,
  List,
  Filter,
  X,
  ClipboardList,
  Unlock,
  Clock,
  Lock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

// Form schema
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  category: z.enum(['SUBCONTRACTOR', 'SUPPLIER', 'CONSULTANT', 'INSPECTOR', 'CLIENT', 'OTHER']),
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'POTENTIAL', 'BLACKLISTED', 'FOLLOW_UP']),
  notes: z.string().optional(),
  projectId: z.string(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// Category badge component
function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    SUBCONTRACTOR: 'bg-blue-500/20 text-blue-500',
    SUPPLIER: 'bg-green-500/20 text-green-500',
    CONSULTANT: 'bg-purple-500/20 text-purple-500',
    INSPECTOR: 'bg-orange-500/20 text-orange-500',
    CLIENT: 'bg-yellow-500/20 text-yellow-500',
    OTHER: 'bg-gray-500/20 text-gray-500',
  };

  return (
    <Badge className={colors[category] || colors.OTHER}>
      {category}
    </Badge>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    ACTIVE: 'default',
    INACTIVE: 'secondary',
    POTENTIAL: 'outline',
    BLACKLISTED: 'destructive',
    FOLLOW_UP: 'default',
  };

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export default function AdminContactsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape) and (max-height: 430px)');
  const [isReady, setIsReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card'); // Default to card view for mobile
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Get default project ID
  const [projectId, setProjectId] = useState<string>('');

  // Wait for auth
  useEffect(() => {
    if (!authLoading && user) {
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);

  // Auto-switch to card view on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'list') {
      setViewMode('card');
    }
  }, [isMobile, viewMode]);

  // Form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      category: 'SUBCONTRACTOR',
      type: 'INDIVIDUAL',
      status: 'ACTIVE',
      notes: '',
      projectId: projectId || '',
    },
  });

  // Fetch data
  const { data: contactsData, isLoading: contactsLoading, refetch } = useContacts(
    { projectId, limit: 100 },
    isReady
  );
  
  // Fetch projects
  const { data: projectsData } = useProjects(isReady);
  
  // Set default projectId when projects are loaded
  useEffect(() => {
    if (projectsData && Array.isArray(projectsData) && projectsData.length > 0 && !projectId) {
      const defaultProjectId = projectsData[0].id;
      setProjectId(defaultProjectId);
      form.setValue('projectId', defaultProjectId);
    }
  }, [projectsData, projectId, form]);
  
  // Mutations
  const createMutation = useCreateContact();

  // Columns definition
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
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.type === 'COMPANY' ? (
            <Building className="h-4 w-4 text-white/40" />
          ) : (
            <User className="h-4 w-4 text-white/40" />
          )}
          <div>
            <p className="font-medium">{row.getValue('name')}</p>
            {row.original.company && (
              <p className="text-sm text-white/60">{row.original.company}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact Info',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3 text-white/40" />
              <span className="text-white/80">{row.original.email}</span>
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3 text-white/40" />
              <span className="text-white/80">{row.original.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => <CategoryBadge category={row.getValue('category')} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'tasks',
      header: 'Related Tasks',
      cell: ({ row }) => {
        const tasks = row.original.tasks || [];
        return (
          <span className="text-sm">
            {tasks.length > 0 ? `${tasks.length} tasks` : 'No tasks'}
          </span>
        );
      },
    },
    {
      accessorKey: 'lastContactDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Contact" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('lastContactDate');
        if (!date) return <span className="text-white/40">Never</span>;
        
        const lastContact = new Date(date as string);
        const daysAgo = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysAgo === 0) return 'Today';
        if (daysAgo === 1) return 'Yesterday';
        if (daysAgo < 7) return `${daysAgo} days ago`;
        if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
        return `${Math.floor(daysAgo / 30)} months ago`;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const contact = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(contact)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleInvite(contact)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite as Contractor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(contact)}
                className="text-red-500"
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
  const handleCreate = async (values: ContactFormValues) => {
    try {
      // Ensure we have a valid projectId
      const finalProjectId = values.projectId || projectId || 
        (projectsData && Array.isArray(projectsData) && projectsData.length > 0 ? projectsData[0].id : '');
      
      if (!finalProjectId) {
        toast({
          title: 'Error',
          description: 'No project available. Please create a project first.',
          variant: 'destructive',
        });
        return;
      }
      
      await createMutation.mutateAsync({
        ...values,
        projectId: finalProjectId,
      });
      
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
      
      setIsCreateOpen(false);
      form.reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        category: 'SUBCONTRACTOR',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        notes: '',
        projectId: finalProjectId,
      });
      refetch();
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const handleEdit = (contact: any) => {
    setSelectedContact(contact);
    form.reset({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      category: contact.category,
      type: contact.type,
      status: contact.status,
      notes: contact.notes || '',
      projectId: contact.projectId,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (values: ContactFormValues) => {
    if (!selectedContact) return;
    
    try {
      await apiClient.put(`/contacts/${selectedContact.id}`, values);
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
      setIsEditOpen(false);
      setSelectedContact(null);
      form.reset();
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update contact',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (contact: any) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact) return;
    
    try {
      const response = await apiClient.delete(`/contacts/${selectedContact.id}`);
      
      // Even if there's an audit log error, if the contact was deleted, we should update the UI
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedContact(null);
      
      // Always refetch to update the list
      setTimeout(() => {
        refetch();
      }, 100);
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Still try to refetch in case the delete actually succeeded
      setTimeout(() => {
        refetch();
      }, 500);
      
      toast({
        title: 'Error',
        description: error.error || error.message || 'Failed to delete contact',
        variant: 'destructive',
      });
    }
  };

  const handleInvite = async (contact: any) => {
    try {
      const response = await apiClient.post(`/contacts/${contact.id}/invite`, {
        expiryDays: 7,
        accessLevel: 'standard',
      });
      
      toast({
        title: 'Success',
        description: `Portal invitation sent to ${contact.name}`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.error || error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };
  
  // Get contacts array
  const contacts = Array.isArray(contactsData?.data) ? contactsData.data : Array.isArray(contactsData) ? contactsData : [];
  
  // Filter contacts based on active filters
  const filteredContacts = useMemo(() => {
    let filtered: any[] = contacts;
    
    if (activeFilters.includes('portal')) {
      filtered = filtered.filter((c: any) => c.portalStatus === 'ACTIVE');
    }
    if (activeFilters.includes('pending')) {
      filtered = filtered.filter((c: any) => c.portalStatus === 'INVITED');
    }
    if (activeFilters.includes('no-portal')) {
      filtered = filtered.filter((c: any) => !c.portalStatus || c.portalStatus === 'NONE');
    }
    if (activeFilters.includes('has-tasks')) {
      filtered = filtered.filter((c: any) => c._count?.assignedTasks > 0);
    }
    
    return filtered;
  }, [contacts, activeFilters]);

  const handleAssignTask = (contact: any) => {
    setSelectedContact(contact);
    setIsAssignTaskOpen(true);
  };
  
  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleExport = () => {
    // Implement CSV export
    const contacts = Array.isArray(contactsData) ? contactsData : [];
    const csv = [
      ['Name', 'Email', 'Phone', 'Company', 'Category', 'Status'],
      ...contacts.map((c: any) => [
        c.name,
        c.email || '',
        c.phone || '',
        c.company || '',
        c.category,
        c.status,
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    
    toast({
      title: 'Success',
      description: 'Contacts exported successfully',
    });
  };

  // Loading state
  if (contactsLoading || !isReady) {
    return (
      <PageShell 
        userRole={(userRole as "ADMIN" | "STAFF" | "CONTRACTOR" | "VIEWER") || 'VIEWER'} 
        userName={user?.displayName || 'User'} 
        userEmail={user?.email || ''}
      >
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Contacts Management</h1>
            <p className="text-white/60 mt-1 text-sm sm:text-base">Manage project contacts and contractors</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="sm:size-default"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button 
              className="bg-accent-500 hover:bg-accent-600"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-start gap-2">
          <span className="text-sm text-white/60 w-full sm:w-auto mb-2 sm:mb-0">Quick filters:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFilter('portal')}
            className={cn(
              'transition-all',
              activeFilters.includes('portal') && 'bg-blue-600 text-white border-blue-600'
            )}
          >
            <Unlock className="h-3 w-3 mr-1" />
            Has Portal
            {activeFilters.includes('portal') && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFilter('pending')}
            className={cn(
              'transition-all',
              activeFilters.includes('pending') && 'bg-yellow-600 text-white border-yellow-600'
            )}
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending Invites
            {activeFilters.includes('pending') && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFilter('no-portal')}
            className={cn(
              'transition-all',
              activeFilters.includes('no-portal') && 'bg-gray-600 text-white border-gray-600'
            )}
          >
            <Lock className="h-3 w-3 mr-1" />
            No Portal
            {activeFilters.includes('no-portal') && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFilter('has-tasks')}
            className={cn(
              'transition-all',
              activeFilters.includes('has-tasks') && 'bg-green-600 text-white border-green-600'
            )}
          >
            <ClipboardList className="h-3 w-3 mr-1" />
            Has Tasks
            {activeFilters.includes('has-tasks') && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Button>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters([])}
              className="text-white/60"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {filteredContacts.length} Contacts
          </h2>
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('card')}
              className={cn(
                'px-3 py-1.5',
                viewMode === 'card' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5',
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {/* Data Display - Card or List View */}
        {contactsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 min-h-[120px]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-2" />
                      <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeFilters.length > 0 ? 'No contacts match your filters' : 'No contacts yet'}
            </h3>
            <p className="text-white/60 mb-6 max-w-md">
              {activeFilters.length > 0 
                ? 'Try adjusting your filters or clearing them to see all contacts.'
                : 'Get started by adding your first contact to the project.'}
            </p>
            {activeFilters.length > 0 ? (
              <Button
                variant="outline"
                onClick={() => setActiveFilters([])}
              >
                Clear Filters
              </Button>
            ) : !isMobile ? (
              <Button
                className="bg-accent-500 hover:bg-accent-600"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            ) : null}
          </div>
        ) : viewMode === 'card' ? (
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            isLandscape && "grid-cols-2"
          )}>
            {filteredContacts.map((contact: any) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onInvite={handleInvite}
                onAssignTask={handleAssignTask}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-6">
            <DataTable
              columns={columns}
              data={filteredContacts}
              searchKey="name"
              searchPlaceholder="Search contacts..."
            />
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className={cn(
            "sm:max-w-[525px] bg-graphite-800 border-white/10",
            isMobile && "fixed inset-4 max-w-none h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
          )}>
            <DialogHeader>
              <DialogTitle className="text-white">Create New Contact</DialogTitle>
              <DialogDescription className="text-white/60">
                Add a new contact to the project. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contact name" 
                            className="bg-white/5 border-white/10 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Company</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Company name"
                            className="bg-white/5 border-white/10 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="email@example.com"
                            className="bg-white/5 border-white/10 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Phone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(555) 123-4567"
                            className="bg-white/5 border-white/10 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                            <SelectItem value="COMPANY">Company</SelectItem>
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
                        <FormLabel className="text-white">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SUBCONTRACTOR">Subcontractor</SelectItem>
                            <SelectItem value="SUPPLIER">Supplier</SelectItem>
                            <SelectItem value="CONSULTANT">Consultant</SelectItem>
                            <SelectItem value="INSPECTOR">Inspector</SelectItem>
                            <SelectItem value="CLIENT">Client</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="POTENTIAL">Potential</SelectItem>
                            <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                            <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <FormLabel className="text-white">Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes..."
                          className="bg-white/5 border-white/10 text-white resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-accent-500 hover:bg-accent-600">
                    Create Contact
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog - Similar to Create */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className={cn(
            "sm:max-w-[525px] bg-graphite-800 border-white/10",
            isMobile && "fixed inset-4 max-w-none h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
          )}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit Contact</DialogTitle>
              <DialogDescription className="text-white/60">
                Make changes to the contact. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                {/* Same form fields as Create */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contact name" 
                            className="bg-white/5 border-white/10 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Company</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Company name"
                            className="bg-white/5 border-white/10 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-accent-500 hover:bg-accent-600">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-graphite-800 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                This action cannot be undone. This will permanently delete the contact
                "{selectedContact?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assign Task Dialog */}
        {selectedContact && (
          <AssignTaskDialog
            isOpen={isAssignTaskOpen}
            onClose={() => {
              setIsAssignTaskOpen(false);
              setSelectedContact(null);
            }}
            contact={selectedContact}
            projectId={projectId}
          />
        )}
      </div>
    </PageShell>
  );
}