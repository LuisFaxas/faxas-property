'use client';

import { useState, useEffect, useCallback } from 'react';
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
  useContacts,
  useProjects 
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
  Filter,
  Download,
  Upload,
  GitBranch,
  Paperclip,
  MessageSquare,
  MapPin,
  Shield,
  Zap,
  Milestone,
  Cloud,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

// Import new components
import { ViewSwitcher, TaskView } from '@/components/tasks/view-switcher';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskCard } from '@/components/tasks/task-card';

// Enhanced form schema with all new fields
const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']),
  assignedToId: z.string().optional(),
  projectId: z.string(),
  
  // New fields
  progressPercentage: z.number().min(0).max(100).optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  
  // Construction-specific
  isOnCriticalPath: z.boolean().optional(),
  isMilestone: z.boolean().optional(),
  location: z.string().optional(),
  trade: z.string().optional(),
  weatherDependent: z.boolean().optional(),
  requiresInspection: z.boolean().optional(),
  inspectionStatus: z.string().optional(),
  
  // Tags
  tags: z.array(z.string()).optional(),
  
  // Hierarchy
  parentTaskId: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Status badge component with new statuses
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; icon: any; color: string }> = {
    TODO: { variant: 'secondary', icon: Clock, color: 'text-gray-400' },
    IN_PROGRESS: { variant: 'default', icon: AlertCircle, color: 'text-blue-500' },
    IN_REVIEW: { variant: 'outline', icon: Shield, color: 'text-purple-500' },
    BLOCKED: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
    COMPLETED: { variant: 'outline', icon: CheckCircle, color: 'text-green-500' },
    CANCELLED: { variant: 'secondary', icon: XCircle, color: 'text-gray-500' },
  };

  const { variant, icon: Icon, color } = variants[status] || variants.TODO;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className={`h-3 w-3 ${color}`} />
      {status.replace('_', ' ')}
    </Badge>
  );
}

// Enhanced priority badge with CRITICAL level
function PriorityBadge({ priority }: { priority: string }) {
  const configs: Record<string, { bg: string; text: string; icon?: any }> = {
    LOW: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
    MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
    HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-500' },
    URGENT: { bg: 'bg-red-500/20', text: 'text-red-500', icon: AlertTriangle },
    CRITICAL: { bg: 'bg-red-600/30', text: 'text-red-600', icon: Zap },
  };

  const config = configs[priority] || configs.MEDIUM;
  const Icon = config.icon;

  return (
    <Badge className={`${config.bg} ${config.text} gap-1`}>
      {Icon && <Icon className="h-3 w-3" />}
      {priority}
    </Badge>
  );
}

export default function AdminTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const { selectedProject } = useProjectContext();
  const [isReady, setIsReady] = useState(false);
  const [currentView, setCurrentView] = useState<TaskView>('kanban');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Use project context
  const projectId = selectedProject?.id || '';

  // Wait for auth
  useEffect(() => {
    if (!authLoading && user) {
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);

  // Form with enhanced schema
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      startDate: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assignedToId: '',
      projectId: projectId || '',
      progressPercentage: 0,
      estimatedHours: undefined,
      actualHours: undefined,
      isOnCriticalPath: false,
      isMilestone: false,
      location: '',
      trade: '',
      weatherDependent: false,
      requiresInspection: false,
      inspectionStatus: '',
      tags: [],
      parentTaskId: '',
    },
  });

  // Fetch projects first
  const { data: projectsData } = useProjects(isReady);
  
  // Update form when project changes
  useEffect(() => {
    if (projectId) {
      form.setValue('projectId', projectId);
    }
  }, [projectId, form]);

  // Fetch data with enhanced query
  const { data: tasksData, isLoading: tasksLoading, refetch } = useTasks(
    { 
      projectId, 
      limit: 100,
      includeSubtasks: true,
      view: currentView 
    },
    isReady && !!projectId
  );
  
  const { data: contactsData } = useContacts({ projectId }, isReady && !!projectId);
  
  // Mutations
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();

  // Handle task status change (for Kanban drag-and-drop)
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: taskId,
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  }, [updateStatusMutation, refetch]);

  // Enhanced columns with new fields
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
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="flex items-center gap-2">
              <p className="font-medium">{row.getValue('title')}</p>
              {task.isMilestone && (
                <Milestone className="h-3 w-3 text-purple-400" />
              )}
              {task.isOnCriticalPath && (
                <Zap className="h-3 w-3 text-red-400" />
              )}
            </div>
            {task.description && (
              <p className="text-sm text-white/60 truncate">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
              {task._count?.subtasks > 0 && (
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {task.completedSubtasks || 0}/{task._count.subtasks}
                </span>
              )}
              {task._count?.attachments > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {task._count.attachments}
                </span>
              )}
              {task._count?.comments > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {task._count.comments}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'progressPercentage',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Progress" />
      ),
      cell: ({ row }) => {
        const progress = row.getValue('progressPercentage') as number;
        if (!progress) return <span className="text-white/40">-</span>;
        return (
          <div className="w-20">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2" />
              <span className="text-xs">{progress}%</span>
            </div>
          </div>
        );
      },
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
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const location = row.getValue('location') as string;
        const task = row.original;
        if (!location) return <span className="text-white/40">-</span>;
        return (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
            {task.latitude && task.longitude && (
              <span className="text-xs text-white/40">📍</span>
            )}
          </div>
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
        const task = row.original;
        if (!date) return <span className="text-white/40">No due date</span>;
        
        const dueDate = new Date(date as string);
        const isOverdue = dueDate < new Date() && task.status !== 'COMPLETED';
        
        return (
          <div className="text-sm">
            <span className={isOverdue ? 'text-red-500' : ''}>
              {format(dueDate, 'MMM dd, yyyy')}
            </span>
            {task.weatherDependent && (
              <Cloud className="h-3 w-3 text-sky-400 inline-block ml-1" />
            )}
          </div>
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
              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}>
                Start Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'COMPLETED')}>
                Complete Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(task)}
                className="text-red-400"
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

  // Create task handler with new fields
  const handleCreate = async (data: TaskFormValues) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Edit handler
  const handleEdit = (task: any) => {
    setSelectedTask(task);
    form.reset({
      ...task,
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
      startDate: task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd'T'HH:mm") : '',
      assignedToId: task.assignedToId || '',
      tags: task.tags || [],
    });
    setIsEditOpen(true);
  };

  // Update handler
  const handleUpdate = async (data: TaskFormValues) => {
    if (!selectedTask) return;
    
    try {
      await updateMutation.mutateAsync({
        ...data,
        id: selectedTask.id,
      });
      setIsEditOpen(false);
      setSelectedTask(null);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete handler
  const handleDelete = (task: any) => {
    setSelectedTask(task);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    await handleTaskStatusChange(taskId, status);
  };

  // Loading state
  if (!isReady || tasksLoading) {
    return (
      <PageShell>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  const tasks = tasksData || [];

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
            <p className="text-white/60 mt-1">
              Manage project tasks and track progress
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <ViewSwitcher 
              currentView={currentView} 
              onViewChange={setCurrentView}
            />
            
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-gold-500 hover:bg-gold-600 text-black gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        </div>

        {/* View Content */}
        {currentView === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onTaskMove={handleTaskStatusChange}
            onTaskEdit={handleEdit}
            onTaskDelete={handleDelete}
            onTaskSelect={(task) => handleEdit(task)}
          />
        ) : currentView === 'list' ? (
          <div className="space-y-3">
            {tasks.map((task: any) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onSelect={() => handleEdit(task)}
              />
            ))}
          </div>
        ) : (
          <DataTable columns={columns} data={tasks} />
        )}

        {/* Create Dialog - Enhanced with new fields */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="bg-graphite-900 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your project with all details.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Fields */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-graphite-800 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="bg-graphite-800 border-white/10" />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-graphite-800 border-white/10">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
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
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-graphite-800 border-white/10">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TODO">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            className="bg-graphite-800 border-white/10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            className="bg-graphite-800 border-white/10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Progress and Time Tracking */}
                  <FormField
                    control={form.control}
                    name="progressPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress %</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            className="bg-graphite-800 border-white/10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.5"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            className="bg-graphite-800 border-white/10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Construction Fields */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-graphite-800 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="trade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-graphite-800 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Checkboxes */}
                  <div className="md:col-span-2 space-y-3">
                    <FormField
                      control={form.control}
                      name="isMilestone"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">This is a milestone</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isOnCriticalPath"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">On critical path</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weatherDependent"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Weather dependent</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="requiresInspection"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Requires inspection</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog - Similar to Create but with populated values */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-graphite-900 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task details and progress.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
                {/* Same form fields as create dialog */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ... same fields as create ... */}
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Task'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-graphite-900 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
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