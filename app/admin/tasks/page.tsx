'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/blocks/page-shell';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DataTable } from '@/components/ui/data-table';
import { TaskCard } from '@/components/tasks/task-card';
import { MobileTaskCard } from '@/components/tasks/mobile-task-card';
import { MobileListView } from '@/components/tasks/mobile-list-view';
import { MobileDateTimePicker } from '@/components/tasks/mobile-date-time-picker';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { MobileDialog } from '@/components/ui/mobile/dialog';
import { TaskFilterBar } from '@/components/tasks/task-filter-bar';
import { FilterBottomSheet } from '@/components/tasks/filter-bottom-sheet';
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
import { useProjectContext } from '@/app/contexts/ProjectContext';
import { 
  useTasks, 
  useCreateTask, 
  useUpdateTask, 
  useUpdateTaskStatus,
  useDeleteTask,
  useBulkDeleteTasks 
} from '@/hooks/use-api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  LayoutGrid,
  List,
  ClipboardList,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
  };
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// Form schema
const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED']),
  assignedToId: z.string().optional(),
  projectId: z.string(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Component starts here
export default function AdminTasksPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { currentProject } = useProjectContext();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [isReady, setIsReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showCompleted, setShowCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showCompletedTasks');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  const projectId = currentProject?.id || '';
  
  // Form setup
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      projectId: projectId || '',
    },
  });
  
  // API hooks - only fetch tasks if we have a projectId
  const { data: tasksData, isLoading: tasksLoading, refetch } = useTasks(
    { projectId, limit: 100 },
    isReady && !!projectId  // Only fetch when ready AND we have a project
  );
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteMutation = useDeleteTask();
  const bulkDeleteMutation = useBulkDeleteTasks();
  
  // Wait for auth
  useEffect(() => {
    if (!authLoading && user) {
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);

  // Update form projectId when project changes
  useEffect(() => {
    if (projectId) {
      form.setValue('projectId', projectId);
    }
  }, [projectId, form]);

  // Save showCompleted preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showCompletedTasks', JSON.stringify(showCompleted));
    }
  }, [showCompleted]);
  
  // Extract and filter tasks
  const filteredTasks = useMemo(() => {
    // Extract tasks from response
    const tasks = Array.isArray(tasksData) ? tasksData : tasksData?.data || [];
    let filtered = [...tasks];
    
    // Enhanced search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task: Task) => {
        // Search in title and description
        if (task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in assignee name
        if (task.assignedTo?.name?.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in priority
        if (task.priority.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in status
        const statusText = task.status.replace(/_/g, ' ').toLowerCase();
        if (statusText.includes(query)) {
          return true;
        }
        
        // Search for date-related terms
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          if (query === 'today' && dueDate.toDateString() === today.toDateString()) {
            return true;
          }
          if (query === 'tomorrow' && dueDate.toDateString() === tomorrow.toDateString()) {
            return true;
          }
          if (query === 'overdue' && dueDate < today) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    return filtered;
  }, [tasksData, searchQuery, statusFilter, priorityFilter]);
  
  // Handlers
  const handleCreate = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    const taskData = {
      ...values,
      projectId: projectId || values.projectId,
      // Clean up empty date string - API expects undefined or valid ISO datetime
      dueDate: values.dueDate || undefined,
    };
    try {
      await createMutation.mutateAsync(taskData);
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      setIsCreateOpen(false);
      form.reset();
      await refetch();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (task: Task) => {
    setSelectedTask(task);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    deleteMutation.mutate(
      { id: selectedTask.id, projectId },
      {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedTask(null);
          refetch();
          setIsSubmitting(false);
        },
        onError: () => {
          setIsSubmitting(false);
        }
      }
    );
  };
  
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    form.reset({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
      priority: task.priority,
      status: task.status,
      assignedToId: task.assignedToId || '',
      projectId: task.projectId,
    });
    setIsEditOpen(true);
  };
  
  const handleUpdate = async (values: TaskFormValues) => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        id: selectedTask.id,
        ...values,
        // Clean up empty date string - API expects undefined or valid ISO datetime
        dueDate: values.dueDate || undefined,
      });
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
      setIsEditOpen(false);
      setSelectedTask(null);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStatusUpdate = async (taskId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: taskId, status });
      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Please select tasks to delete',
        variant: 'destructive',
      });
      return;
    }
    setIsBulkDeleteOpen(true);
  };
  
  const handleConfirmBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await bulkDeleteMutation.mutateAsync({
        taskIds: selectedRows,
        projectId
      });
      setSelectedRows([]);
      setIsBulkDeleteOpen(false);
      refetch();
    } catch (error) {
      console.error('Bulk delete error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
      TODO: { variant: 'secondary', icon: Clock },
      IN_PROGRESS: { variant: 'default', icon: AlertCircle },
      IN_REVIEW: { variant: 'default', icon: AlertCircle },
      BLOCKED: { variant: 'destructive', icon: XCircle },
      COMPLETED: { variant: 'outline', icon: CheckCircle },
    };
    const { variant, icon: Icon } = variants[status] || variants.TODO;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };
  
  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-500/20 text-blue-500',
      MEDIUM: 'bg-yellow-500/20 text-yellow-500',
      HIGH: 'bg-orange-500/20 text-orange-500',
      URGENT: 'bg-red-500/20 text-red-500',
    };
    return (
      <Badge className={colors[priority] || colors.MEDIUM}>
        {priority}
      </Badge>
    );
  };
  
  // Table columns
  const columns: ColumnDef<Task>[] = [
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
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <p className="font-medium">{row.getValue('title')}</p>
          {row.original.description && (
            <p className="text-sm text-white/60 truncate">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => <PriorityBadge priority={row.getValue('priority')} />,
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('dueDate');
        if (!date) return <span className="text-white/40">No due date</span>;
        const dueDate = new Date(date as string);
        const isOverdue = dueDate < new Date() && row.original.status !== 'COMPLETED';
        return (
          <span className={isOverdue ? 'text-red-500' : ''}>
            {format(dueDate, 'MMM dd, yyyy')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const task = row.original;
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
              <DropdownMenuItem onClick={() => handleEdit(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                disabled={task.status === 'IN_PROGRESS'}
              >
                Start Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusUpdate(task.id, 'IN_REVIEW')}
                disabled={task.status === 'IN_REVIEW'}
              >
                Mark for Review
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}
                disabled={task.status === 'COMPLETED'}
              >
                Mark as Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(task)}
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
  
  // No project selected state
  if (!projectId) {
    return (
      <PageShell 
        pageTitle="Tasks"
        userRole={(userRole || 'VIEWER') as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'} 
        userName={user?.displayName || 'User'} 
        userEmail={user?.email || ''}
      >
        <div className="p-6">
          <div className="glass-card p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">No Project Selected</h2>
            <p className="text-white/60">Please select a project from the project selector to view tasks.</p>
          </div>
        </div>
      </PageShell>
    );
  }
  
  // Loading state
  if (tasksLoading || !isReady) {
    return (
      <PageShell 
        pageTitle="Tasks"
        userRole={(userRole || 'VIEWER') as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'} 
        userName={user?.displayName || 'User'} 
        userEmail={user?.email || ''}
        fabIcon={Plus}
        fabLabel="Add Task"
        onFabClick={() => setIsCreateOpen(true)}
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
          
          {/* Filter Bar Skeleton */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 bg-white/5 animate-pulse rounded" />
              <Skeleton className="h-8 w-24 bg-white/10 animate-pulse rounded-full" />
            </div>
            <Skeleton className="h-10 w-32 sm:w-40 bg-white/10 animate-pulse rounded-md" />
          </div>
          
          {/* Mobile View - Card Grid Skeleton */}
          {isMobile ? (
            <div className="grid gap-3 grid-cols-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 bg-white/10 animate-pulse" />
                    <Skeleton className="h-3 w-full bg-white/5 animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 bg-blue-500/20 animate-pulse rounded-full" />
                    <Skeleton className="h-5 w-20 bg-amber-500/20 animate-pulse rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-4 w-24 bg-white/5 animate-pulse" />
                    <Skeleton className="h-8 w-8 bg-white/10 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop View - Table Skeleton */
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
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="h-4 w-4 bg-white/10 animate-pulse rounded" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-5 w-2/3 bg-white/10 animate-pulse" />
                        <Skeleton className="h-3 w-1/2 bg-white/5 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-20 bg-blue-500/20 animate-pulse rounded-full" />
                      <Skeleton className="h-6 w-24 bg-green-500/20 animate-pulse rounded-full" />
                      <Skeleton className="h-4 w-20 bg-white/5 animate-pulse" />
                      <Skeleton className="h-8 w-8 bg-white/10 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }
  
  // Main render
  return (
    <PageShell 
      pageTitle="Tasks"
      userRole={userRole as 'VIEWER' | 'ADMIN' | 'STAFF' | 'CONTRACTOR' | undefined} 
      userName={user?.displayName || 'User'} 
      userEmail={user?.email || ''}
      fabIcon={Plus}
      fabLabel="Add Task"
      onFabClick={() => setIsCreateOpen(true)}
    >
      <div className={cn(
        "p-6 space-y-6",
        isMobile && "p-3 space-y-4"
      )}>

        {/* Desktop Bulk Actions */}
        {!isMobile && selectedRows.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
            >
              Delete ({selectedRows.length})
            </Button>
          </div>
        )}
        
        {/* Desktop view toggle */}
        {!isMobile && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
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
        
        {/* Main content area */}
        <div className={cn(
          "flex-1",
          isMobile && "pb-28" // Add padding for search bar + FAB clearance on mobile
        )}>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-white/20 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No tasks yet
              </h3>
              <p className="text-white/60 mb-6 max-w-md">
                Get started by creating your first task to track your project progress.
              </p>
              {!isMobile && (
                <Button
                  className="bg-accent-500 hover:bg-accent-600"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
              )}
            </div>
          ) : viewMode === 'card' ? (
            <div>
              {/* Progress and Toggle */}
              {filteredTasks.length > 0 && (
                <div className="bg-graphite-800/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-white/80">
                        <span className="font-medium text-green-400">
                          {filteredTasks.filter((t: Task) => t.status === 'COMPLETED').length}
                        </span>
                        <span className="text-white/60"> of </span>
                        <span className="font-medium">{filteredTasks.length}</span>
                        <span className="text-white/60"> tasks completed</span>
                      </div>
                    </div>
                    {filteredTasks.filter((t: Task) => t.status === 'COMPLETED').length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="border-white/20 text-white/60 hover:text-white hover:bg-white/10"
                      >
                        {showCompleted ? 'Hide' : 'Show'} Completed
                      </Button>
                    )}
                  </div>
                  {/* Progress bar */}
                  {filteredTasks.length > 0 && (
                    <div className="mt-3 w-full bg-graphite-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(filteredTasks.filter((t: Task) => t.status === 'COMPLETED').length / filteredTasks.length) * 100}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Active Tasks */}
              {filteredTasks.filter((t: Task) => t.status !== 'COMPLETED').length > 0 && (
                <div className={cn(
                  "grid gap-4",
                  isMobile
                    ? "grid-cols-1 pb-4"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                )}>
                  {filteredTasks.filter((t: Task) => t.status !== 'COMPLETED').map((task: Task) => (
                    isMobile ? (
                      <MobileTaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => handleEdit(task)}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusUpdate}
                      />
                    ) : (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => handleEdit(task)}
                        onDelete={handleDelete}
                        onStatusChange={(taskId: string, status: string) => {
                          updateMutation.mutate(
                            { id: taskId, status },
                            { 
                              onSuccess: () => {
                                queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
                              }
                            }
                          );
                        }}
                      />
                    )
                  ))}
                </div>
              )}
              
              {/* Completed Tasks Section */}
              {showCompleted && filteredTasks.filter((t: Task) => t.status === 'COMPLETED').length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Completed Tasks
                  </h3>
                  <div className={cn(
                    "grid gap-4",
                    isMobile
                      ? "grid-cols-1 pb-4"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  )}>
                    {filteredTasks.filter((t: Task) => t.status === 'COMPLETED').map((task: Task) => (
                      isMobile ? (
                        <MobileTaskCard
                          key={task.id}
                          task={task}
                          onEdit={() => handleEdit(task)}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusUpdate}
                        />
                      ) : (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={() => handleEdit(task)}
                          onDelete={handleDelete}
                          onStatusChange={(taskId: string, status: string) => {
                            updateMutation.mutate(
                              { id: taskId, status },
                              { 
                                onSuccess: () => {
                                  queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
                                }
                              }
                            );
                          }}
                        />
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            isMobile ? (
              <MobileListView
                tasks={filteredTasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusUpdate}
              />
            ) : (
              <div className="glass-card p-6">
                <DataTable
                  columns={columns}
                  data={filteredTasks}
                  searchKey="title"
                  searchPlaceholder="Search tasks..."
                />
              </div>
            )
          )}
        </div>

        {/* Filter Bottom Sheet for Mobile */}
        {isMobile && (
          <FilterBottomSheet
            open={isFilterSheetOpen}
            onOpenChange={setIsFilterSheetOpen}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
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
                  placeholder="Search tasks..."
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
                {(statusFilter !== 'all' || priorityFilter !== 'all') && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-600">
                    {[statusFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Create Dialog */}
        <MobileDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
          title="Create New Task"
          description={!isMobile ? "Add a new task to the project. Click save when you're done." : undefined}
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
                form="create-task-form"
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
                  'Create Task'
                )}
              </Button>
            </div>
          }
        >
          <Form {...form}>
            <form 
              id="create-task-form"
              onSubmit={form.handleSubmit(handleCreate)} 
              className="space-y-4"
            >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter task title" 
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter task description"
                          className="bg-white/5 border-white/10 text-white resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
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
                            <SelectTrigger className={cn(
                              "bg-white/5 border-white/10 text-white",
                              isMobile && "min-h-[48px] text-base"
                            )}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TODO">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Due Date</FormLabel>
                      <FormControl>
                        <MobileDateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select date and time"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </form>
          </Form>
        </MobileDialog>

        {/* Edit Dialog */}
        <MobileDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit Task"
          description={!isMobile ? "Make changes to the task. Click save when you're done." : undefined}
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
                form="edit-task-form"
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
            <form id="edit-task-form" onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter task title" 
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter task description"
                          className="bg-white/5 border-white/10 text-white resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TODO">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Due Date</FormLabel>
                      <FormControl>
                        <MobileDateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select date and time"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </form>
          </Form>
        </MobileDialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-graphite-800 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                This action cannot be undone. This will permanently delete the task
                {selectedTask?.title && ` "${selectedTask.title}"`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10" disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600"
                disabled={isSubmitting}
              >
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

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
          <AlertDialogContent className="bg-graphite-800 border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Multiple Tasks</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete {selectedRows.length} selected task{selectedRows.length !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10" disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmBulkDelete}
                className="bg-red-500 hover:bg-red-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  `Delete ${selectedRows.length} Task${selectedRows.length !== 1 ? 's' : ''}`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageShell>
  );
}