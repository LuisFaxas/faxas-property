'use client';

import { useState, useEffect } from 'react';
import { KPICarousel } from '@/components/schedule/kpi-carousel';
import { ContactCard } from '@/components/contacts/contact-card';
import { MobileContactList } from '@/components/contacts/mobile-contact-list';
import { MobileContactDetailSheet } from '@/components/contacts/mobile-contact-detail-sheet';
import { MobileDialog } from '@/components/ui/mobile/dialog';
import { MobileFilterSheet } from '@/components/contacts/mobile-filter-sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AssignTaskDialog } from '@/components/contacts/assign-task-dialog';
import { PageShell } from '@/components/blocks/page-shell';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { Contact } from '@prisma/client';
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
  UserCheck,
  Download,
  LayoutGrid,
  List,
  Filter,
  Search,
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
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card'); // Default to card view for mobile
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get default project ID
  const [projectId, setProjectId] = useState<string>('');

  // Wait for auth
  useEffect(() => {
    if (!authLoading && user) {
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);

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
  const columns: ColumnDef<Contact>[] = [
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
          {row.original.company ? (
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
          {row.original.emails?.[0] && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3 text-white/40" />
              <span className="text-white/80">{row.original.emails[0]}</span>
            </div>
          )}
          {row.original.phones?.[0] && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3 text-white/40" />
              <span className="text-white/80">{row.original.phones[0]}</span>
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
        const tasks = (row.original as any).tasks || [];
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
    setIsSubmitting(true);
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
        setIsSubmitting(false);
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
      setIsSubmitting(false);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create contact';
      console.error('Error creating contact:', errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    form.reset({
      name: contact.name,
      email: contact.emails?.[0] || '',
      phone: contact.phones?.[0] || '',
      company: contact.company || '',
      category: contact.category as 'SUBCONTRACTOR' | 'SUPPLIER' | 'CONSULTANT' | 'INSPECTOR' | 'CLIENT' | 'OTHER',
      type: contact.company ? 'COMPANY' : 'INDIVIDUAL',
      status: contact.status as 'ACTIVE' | 'INACTIVE' | 'POTENTIAL' | 'BLACKLISTED' | 'FOLLOW_UP',
      notes: contact.notes || '',
      projectId: contact.projectId,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (values: ContactFormValues) => {
    if (!selectedContact) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.put(`/contacts/${selectedContact.id}`, values);
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
      setIsEditOpen(false);
      setSelectedContact(null);
      setIsSubmitting(false);
      form.reset();
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact) return;
    
    try {
      await apiClient.delete(`/contacts/${selectedContact.id}`);
      
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
      console.error('Delete error:', errorMessage);
      
      // Still try to refetch in case the delete actually succeeded
      setTimeout(() => {
        refetch();
      }, 500);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleInvite = async (contact: Contact) => {
    try {
      await apiClient.post(`/contacts/${contact.id}/invite`, {
        expiryDays: 7,
        accessLevel: 'standard',
      });
      
      toast({
        title: 'Success',
        description: `Portal invitation sent to ${contact.name}`,
      });
      
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  // Get contacts array
  const contacts: Contact[] = Array.isArray(contactsData?.data) ? contactsData.data : Array.isArray(contactsData) ? contactsData : [];
  
  // Filter contacts based on active filters and search
  const filteredContacts = useMemo(() => {
    let filtered: Contact[] = contacts;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((c: Contact) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          c.name?.toLowerCase().includes(searchLower) ||
          c.emails?.[0]?.toLowerCase().includes(searchLower) ||
          c.phones?.[0]?.toLowerCase().includes(searchLower) ||
          c.company?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Active filters
    if (activeFilters.includes('portal')) {
      filtered = filtered.filter((c: Contact & {portalStatus?: string}) => c.portalStatus === 'ACTIVE');
    }
    if (activeFilters.includes('pending')) {
      filtered = filtered.filter((c: Contact & {portalStatus?: string}) => c.portalStatus === 'INVITED');
    }
    if (activeFilters.includes('no-portal')) {
      filtered = filtered.filter((c: Contact & {portalStatus?: string}) => !c.portalStatus || c.portalStatus === 'NONE');
    }
    if (activeFilters.includes('has-tasks')) {
      filtered = filtered.filter((c: Contact & {_count?: {assignedTasks: number}}) => (c._count?.assignedTasks || 0) > 0);
    }
    
    return filtered;
  }, [contacts, activeFilters, searchQuery]);

  const handleAssignTask = (contact: Contact) => {
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

  const handleContactTap = (contact: Contact) => {
    if (isMobile) {
      setSelectedContact(contact);
      setIsDetailOpen(true);
    }
  };

  const handleExport = () => {
    // Implement CSV export
    const exportContacts = Array.isArray(contactsData) ? contactsData : [];
    const csv = [
      ['Name', 'Email', 'Phone', 'Company', 'Category', 'Status'],
      ...exportContacts.map((c: Contact) => [
        c.name,
        c.emails?.[0] || '',
        c.phones?.[0] || '',
        c.company || '',
        c.category || '',
        c.status || ''
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
        <div className={cn(
          "p-6 space-y-6",
          isMobile && "p-3 space-y-4"
        )}>
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32 sm:w-48 bg-white/10 animate-pulse" />
              <Skeleton className="h-4 w-48 sm:w-64 bg-white/5 animate-pulse" />
            </div>
            <Skeleton className="h-10 w-28 sm:w-32 bg-white/10 animate-pulse rounded-md" />
          </div>
          
          {/* KPI Cards Skeleton - Mobile */}
          {isMobile && (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[140px] bg-white/5 border border-white/10 rounded-lg p-3">
                  <Skeleton className="h-3 w-20 bg-white/5 animate-pulse mb-2" />
                  <Skeleton className="h-6 w-12 bg-white/10 animate-pulse mb-1" />
                  <Skeleton className="h-2 w-24 bg-white/5 animate-pulse" />
                </div>
              ))}
            </div>
          )}
          
          {/* Mobile View - Contact Cards Skeleton */}
          {isMobile ? (
            <div className="grid gap-3 grid-cols-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-2/3 bg-white/10 animate-pulse" />
                      <Skeleton className="h-3 w-full bg-white/5 animate-pulse" />
                      <Skeleton className="h-3 w-3/4 bg-white/5 animate-pulse" />
                    </div>
                    <Skeleton className="h-8 w-8 bg-white/10 animate-pulse rounded" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 bg-green-500/20 animate-pulse rounded-full" />
                    <Skeleton className="h-5 w-24 bg-blue-500/20 animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop View - Table Skeleton */
            <div className="space-y-4">
              {/* KPI Cards - Desktop */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <Skeleton className="h-4 w-24 bg-white/5 animate-pulse mb-3" />
                    <Skeleton className="h-8 w-16 bg-white/10 animate-pulse mb-1" />
                    <Skeleton className="h-3 w-32 bg-white/5 animate-pulse" />
                  </div>
                ))}
              </div>
              
              {/* Table Skeleton */}
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32 bg-white/10 animate-pulse" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24 bg-white/5 animate-pulse rounded" />
                      <Skeleton className="h-8 w-24 bg-white/5 animate-pulse rounded" />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="h-10 w-10 bg-white/10 animate-pulse rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-5 w-1/3 bg-white/10 animate-pulse" />
                          <Skeleton className="h-3 w-1/2 bg-white/5 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-20 bg-green-500/20 animate-pulse rounded-full" />
                        <Skeleton className="h-4 w-32 bg-white/5 animate-pulse" />
                        <Skeleton className="h-8 w-8 bg-white/10 animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell 
      userRole={(userRole as "ADMIN" | "STAFF" | "CONTRACTOR" | "VIEWER") || 'VIEWER'} 
      userName={user?.displayName || 'User'} 
      userEmail={user?.email || ''}
      pageTitle="Contacts"
      fabIcon={Plus}
      fabLabel="Add Contact"
      onFabClick={() => setIsCreateOpen(true)}
    >
      <div className={cn(
        "p-6 space-y-6 relative",
        isMobile && "p-3 space-y-3 pb-32" // Extra padding for fixed search bar
      )}>
        {/* Mobile Stats Carousel - Using KPICarousel like Schedule page */}
        {isMobile && (
          <KPICarousel
            cards={[
              {
                title: 'Total Contacts',
                value: contacts.length,
                subtitle: 'All contacts',
                icon: Users,
                iconColor: 'text-white/40',
              },
              {
                title: 'Portal Access',
                value: `${contacts.filter((c: Contact & {portalStatus?: string}) => c.portalStatus === 'ACTIVE').length}/${contacts.length}`,
                subtitle: 'Have access',
                icon: Unlock,
                iconColor: 'text-green-400',
              },
              {
                title: 'Pending Invites',
                value: contacts.filter((c: Contact & {portalStatus?: string}) => c.portalStatus === 'INVITED').length,
                subtitle: 'Awaiting response',
                icon: Clock,
                iconColor: 'text-yellow-400',
              },
              {
                title: 'Active',
                value: contacts.filter((c: Contact & {status?: string}) => c.status === 'ACTIVE').length,
                subtitle: 'Active contacts',
                icon: UserCheck,
                iconColor: 'text-green-400',
              },
              {
                title: 'Has Tasks',
                value: contacts.filter((c: Contact & {_count?: {assignedTasks: number}}) => (c._count?.assignedTasks || 0) > 0).length,
                subtitle: 'Assigned tasks',
                icon: ClipboardList,
                iconColor: 'text-blue-400',
              },
            ]}
            className="-mx-3"
          />
        )}

        {/* Mobile Fixed Bottom Search Bar with View Toggle */}
        {isMobile && (
          <div className="fixed bottom-16 left-0 right-0 z-40 p-3 bg-gray-900/95 backdrop-blur-sm border-t border-white/10">
            <div className="flex gap-2">
              {/* View Toggle - Integrated on left */}
              <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                <button 
                  onClick={() => setViewMode('card')}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === 'card' 
                      ? "bg-blue-600 text-white" 
                      : "text-white/60 hover:text-white"
                  )}
                  aria-label="Card view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === 'list' 
                      ? "bg-blue-600 text-white" 
                      : "text-white/60 hover:text-white"
                  )}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white h-10"
                />
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFilterSheetOpen(true)}
                className="relative h-10 w-10"
              >
                <Filter className="h-4 w-4" />
                {activeFilters.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-600">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
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
        )}

        {/* Quick Filters - Desktop Only */}
        {!isMobile && (
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
        )}

        {/* Desktop View Mode Toggle */}
        {!isMobile && (
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
        )}

        {/* Data Display - Card or List View */}
        <div className={cn(
          "flex-1",
          isMobile && "min-h-0"
        )}>
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
        ) : isMobile ? (
          // Mobile View - Card or List based on viewMode
          viewMode === 'card' ? (
            <MobileContactList
              contacts={filteredContacts as any}
              onInvite={handleInvite as any}
              onDelete={handleDelete as any}
              onTap={handleContactTap as any}
              showPortalProgress={false}
            />
          ) : (
            // Mobile List View - Compact list format
            <div className="space-y-1">
              {filteredContacts.map((contact: Contact & {portalStatus?: string; status?: string; category?: string}) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactTap(contact)}
                  className="bg-graphite-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{contact.name}</p>
                    <p className="text-xs text-white/60 truncate">
                      {contact.company || contact.category}
                      {contact.phones?.[0] && ` • ${contact.phones[0]}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {contact.portalStatus === 'ACTIVE' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Portal Active" />
                    )}
                    <Badge 
                      className={cn(
                        "text-xs shrink-0",
                        contact.status === 'active' && "bg-green-500/20 text-green-400 border-green-500/30",
                        contact.status === 'potential' && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                        contact.status === 'follow_up' && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                        contact.status === 'inactive' && "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      )}
                    >
                      {contact.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : viewMode === 'card' ? (
          // Desktop Card View
          <div className={cn(
            "grid gap-4",
            "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            isLandscape && "grid-cols-2"
          )}>
            {filteredContacts.map((contact: Contact) => (
              <ContactCard
                key={contact.id}
                contact={contact as any}
                onInvite={handleInvite as any}
                onAssignTask={handleAssignTask}
                onEdit={handleEdit as any}
                onDelete={handleDelete as any}
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
        </div>

        {/* Create Dialog - Use MobileDialog on mobile */}
        <MobileDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Create New Contact"
          description="Add a new contact to the project. Click save when you're done."
          size="md"
          showCloseButton={false}
          footer={
            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
                className={cn(
                  "border-white/10",
                  isMobile && "flex-1 h-12 text-base"
                )}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="create-contact-form"
                className={cn(
                  "bg-blue-600 hover:bg-blue-700",
                  isMobile && "flex-1 h-12 text-base"
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  'Create Contact'
                )}
              </Button>
            </div>
          }
        >
          <Form {...form}>
              <form id="create-contact-form" onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
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
              </form>
            </Form>
        </MobileDialog>

        {/* Edit Dialog - Use MobileDialog on mobile */}
        <MobileDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit Contact"
          description="Make changes to the contact. Click save when you're done."
          size="md"
          showCloseButton={false}
          footer={
            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
                className={cn(
                  "border-white/10",
                  isMobile && "flex-1 h-12 text-base"
                )}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="edit-contact-form"
                className={cn(
                  "bg-blue-600 hover:bg-blue-700",
                  isMobile && "flex-1 h-12 text-base"
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          }
        >
          <Form {...form}>
              <form id="edit-contact-form" onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
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
              </form>
            </Form>
        </MobileDialog>

        {/* Mobile Contact Detail Sheet */}
        {isMobile && selectedContact && (
          <MobileContactDetailSheet
            contact={selectedContact as any}
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedContact(null);
            }}
            onInvite={handleInvite as any}
            onEdit={handleEdit as any}
            onDelete={handleDelete as any}
            onAssignTask={handleAssignTask as any}
          />
        )}

        {/* Mobile Filter Sheet */}
        {isMobile && (
          <MobileFilterSheet
            open={isFilterSheetOpen}
            onOpenChange={setIsFilterSheetOpen}
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            onExportCSV={handleExport}
            filterCounts={{
              portal: contacts.filter((c: Contact & {portalStatus?: string}) => c.portalStatus === 'ACTIVE').length,
              pending: contacts.filter((c: Contact & {portalStatus?: string}) => c.portalStatus === 'INVITED').length,
              noPortal: contacts.filter((c: Contact & {portalStatus?: string}) => !c.portalStatus || c.portalStatus === 'NONE').length,
              hasTasks: contacts.filter((c: Contact & {_count?: {assignedTasks: number}}) => (c._count?.assignedTasks || 0) > 0).length,
              active: contacts.filter((c: Contact & {status?: string}) => c.status === 'ACTIVE').length,
              inactive: contacts.filter((c: Contact & {status?: string}) => c.status === 'INACTIVE').length,
              potential: contacts.filter((c: Contact & {status?: string}) => c.status === 'POTENTIAL').length,
              blacklisted: contacts.filter((c: Contact & {status?: string}) => c.status === 'BLACKLISTED').length,
              followUp: contacts.filter((c: Contact & {status?: string}) => c.status === 'FOLLOW_UP').length,
              subcontractor: contacts.filter((c: Contact & {category?: string}) => c.category === 'SUBCONTRACTOR').length,
              supplier: contacts.filter((c: Contact & {category?: string}) => c.category === 'SUPPLIER').length,
              consultant: contacts.filter((c: Contact & {category?: string}) => c.category === 'CONSULTANT').length,
              inspector: contacts.filter((c: Contact & {category?: string}) => c.category === 'INSPECTOR').length,
              client: contacts.filter((c: Contact & {category?: string}) => c.category === 'CLIENT').length,
              other: contacts.filter((c: Contact & {category?: string}) => c.category === 'OTHER').length,
            }}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-graphite-800 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                This action cannot be undone. This will permanently delete the contact
                &quot;{selectedContact?.name}&quot;.
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
            contact={selectedContact as any}
            projectId={projectId}
          />
        )}
      </div>
    </PageShell>
  );
}