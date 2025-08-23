'use client';

import { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

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

// Status badge component
function StatusBadge({ status }: { status: string }) {
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
}

// Priority badge component
function PriorityBadge({ priority }: { priority: string }) {
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
}

export default function AdminTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProject } = useProjectContext();
  const [isReady, setIsReady] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Get project ID from context
  const projectId = currentProject?.id || '';

  // Wait for auth
  useEffect(() => {
    if (!authLoading && user) {
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading, refetch } = useTasks(
    { projectId, limit: 100 },
    isReady
  );
  const { data: contactsData } = useContacts({ projectId }, isReady);
  
  // Mutations
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();


  // Form
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
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => <PriorityBadge priority={row.getValue('priority')} />,
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignee = row.getValue('assignedTo') as any;
        return assignee ? (
          <div className="text-sm">
            <p className="font-medium">{assignee.name || assignee.email}</p>
          </div>
        ) : (
          <span className="text-white/40">Unassigned</span>
        );
      },
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

  // Handlers
  const handleCreate = async (values: TaskFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        projectId: projectId || 'default',
      });
      setIsCreateOpen(false);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEdit = (task: any) => {
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
    
    try {
      await updateMutation.mutateAsync({
        id: selectedTask.id,
        ...values,
      });
      setIsEditOpen(false);
      setSelectedTask(null);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = (task: any) => {
    setSelectedTask(task);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTask) return;
    
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
    // Implement bulk delete
    toast({
      title: 'Info',
      description: `${selectedRows.length} tasks selected for deletion`,
    });
  };

  // Loading state
  if (tasksLoading || !isReady) {
    return (
      <PageShell 
        userRole={user?.role || 'VIEWER'} 
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

  const tasks = tasksData?.data || [];

  return (
    <PageShell 
      userRole={user?.role || 'VIEWER'} 
      userName={user?.displayName || 'User'} 
      userEmail={user?.email || ''}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Tasks Management</h1>
            <p className="text-white/60 mt-1">Manage and assign project tasks</p>
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
            <Button 
              className="bg-accent-500 hover:bg-accent-600"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-card p-6">
          <DataTable
            columns={columns}
            data={tasks}
            searchKey="title"
            searchPlaceholder="Search tasks..."
          />
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[525px] bg-graphite-800 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Task</DialogTitle>
              <DialogDescription className="text-white/60">
                Add a new task to the project. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-accent-500 hover:bg-accent-600">
                    Create Task
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[525px] bg-graphite-800 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Task</DialogTitle>
              <DialogDescription className="text-white/60">
                Make changes to the task. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
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
                This action cannot be undone. This will permanently delete the task
                "{selectedTask?.title}".
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
      </div>
    </PageShell>
  );
}