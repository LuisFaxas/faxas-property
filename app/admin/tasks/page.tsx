'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/blocks/page-shell';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DataTable } from '@/components/ui/data-table';
import { TaskCard } from '@/components/tasks/task-card';
import { MobileTaskCard } from '@/components/tasks/mobile-task-card';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { MobileTaskDialog } from '@/components/tasks/mobile-task-dialog';
import { TaskFilterBar } from '@/components/tasks/task-filter-bar';
import { FilterBottomSheet } from '@/components/tasks/filter-bottom-sheet';
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
  useContacts 
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
  Filter,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignedToId?: string;
  assignedTo?: any;
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
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']),
  assignedToId: z.string().optional(),
  projectId: z.string(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Component starts here
export default function AdminTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProject } = useProjectContext();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape) and (max-height: 430px)');
  
  const [isReady, setIsReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
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
      projectId: projectId || 'default',
    },
  });
  
  // API hooks
  const { data: tasksData, isLoading: tasksLoading, refetch } = useTasks(
    { projectId, limit: 100 },
    isReady
  );
  const { data: contactsData } = useContacts({ projectId }, isReady);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  
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
  
  const tasks = tasksData?.data || [];
  
  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
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
  }, [tasks, searchQuery, statusFilter, priorityFilter]);
  
  // Handlers
  const handleCreate = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        ...values,
        projectId: projectId || 'default',
      });
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      setIsCreateOpen(false);
      form.reset();
      refetch();
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
    try {
      await apiClient.delete(`/tasks/${selectedTask.id}`);
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedTask(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
  
  const handleBulkDelete = async () => {
    toast({
      title: 'Info',
      description: `${selectedRows.length} tasks selected for deletion`,
    });
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      TODO: { variant: 'secondary', icon: Clock },
      IN_PROGRESS: { variant: 'default', icon: AlertCircle },
      BLOCKED: { variant: 'destructive', icon: XCircle },
      DONE: { variant: 'outline', icon: CheckCircle },
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
        const isOverdue = dueDate < new Date() && row.original.status !== 'DONE';
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
                onClick={() => handleStatusUpdate(task.id, 'DONE')}
                disabled={task.status === 'DONE'}
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
  
  // Loading state
  if (tasksLoading || !isReady) {
    return (
      <PageShell 
        pageTitle="Tasks"
        userRole={user?.role || 'VIEWER'} 
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {Array.from({ length: isMobile ? 3 : 6 }, (_, i) => i + 1).map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }
  
  // Main render
  return (
    <PageShell 
      pageTitle="Tasks"
      userRole={user?.role || 'VIEWER'} 
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
        {/* Mobile Header with View Toggle */}
        {isMobile && (
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">Tasks</h1>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 rounded-full p-0.5">
                <button 
                  onClick={() => setViewMode('card')}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    viewMode === 'card' && "bg-blue-600"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    viewMode === 'list' && "bg-blue-600"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Tasks Management</h1>
              <p className="text-white/60 mt-1 text-sm sm:text-base">Manage and assign project tasks</p>
            </div>
            <div className="flex gap-2">
              {selectedRows.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                >
                  Delete ({selectedRows.length})
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Mobile Filter Bar */}
        {isMobile && (
          <TaskFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
            taskCount={filteredTasks.length}
            className="-mx-3 mb-3"
          />
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
          isMobile && "pb-20" // Add padding for FAB clearance on mobile
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
            <div className={cn(
              "grid gap-4",
              isMobile
                ? "grid-cols-1 pb-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            )}>
              {filteredTasks.map((task: Task) => (
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
          ) : (
            <div className="glass-card p-6">
              <DataTable
                columns={columns}
                data={filteredTasks}
                searchKey="title"
                searchPlaceholder="Search tasks..."
                onRowSelectionChange={(rows) => {
                  const selectedIds = rows.map((row: any) => row.id);
                  setSelectedRows(selectedIds);
                }}
              />
            </div>
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

        {/* Create Dialog */}
        <MobileTaskDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
          title="Create New Task"
          description={!isMobile ? "Add a new task to the project. Click save when you're done." : undefined}
          footer={
            <div className={cn(
              "flex gap-3",
              isMobile && "flex-row"
            )}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
                className={cn(
                  "border-white/20 text-white hover:bg-white/10",
                  isMobile && "flex-1 h-12 text-base"
                )}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
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
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                            <SelectItem value="DONE">Done</SelectItem>
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
                        <Input 
                          type="datetime-local"
                          className={cn(
                            "bg-white/5 border-white/10 text-white",
                            isMobile && "min-h-[48px] text-base"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </form>
          </Form>
        </MobileTaskDialog>

        {/* Edit Dialog */}
        <MobileTaskDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit Task"
          description={!isMobile ? "Make changes to the task. Click save when you're done." : undefined}
          footer={
            <div className={cn(
              "flex gap-3",
              isMobile && "flex-row"
            )}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
                className={cn(
                  "border-white/20 text-white hover:bg-white/10",
                  isMobile && "flex-1 h-12 text-base"
                )}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
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
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
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
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                            <SelectItem value="DONE">Done</SelectItem>
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
                        <Input 
                          type="datetime-local"
                          className="bg-white/5 border-white/10 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </form>
          </Form>
        </MobileTaskDialog>

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
      </div>
    </PageShell>
  );
}