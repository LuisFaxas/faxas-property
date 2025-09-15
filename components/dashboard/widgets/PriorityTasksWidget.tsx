'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProjects, useTasks } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PriorityTasksWidget() {
  const { data: projects } = useProjects();
  const projectList = Array.isArray(projects) ? projects : (projects as any)?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const {
    data: tasks,
    isLoading,
    error,
    refetch,
  } = useTasks({ projectId }, !!projectId);

  // Filter and sort priority tasks
  const priorityTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter open tasks only
    const openTasks = tasks.filter(
      (t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    );

    // Separate overdue and high priority
    const overdue: any[] = [];
    const highPriority: any[] = [];

    openTasks.forEach((task: any) => {
      if (task.dueDate && new Date(task.dueDate) < today) {
        overdue.push({ ...task, isOverdue: true });
      } else if (task.priority === 'HIGH') {
        highPriority.push({ ...task, isOverdue: false });
      }
    });

    // Sort each group by due date (nearest first)
    const sortByDueDate = (a: any, b: any) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    };

    overdue.sort(sortByDueDate);
    highPriority.sort(sortByDueDate);

    // Combine: overdue first, then high priority
    return [...overdue, ...highPriority];
  }, [tasks]);

  // Format relative date
  const formatDueDate = (dateStr?: string, isOverdue?: boolean) => {
    if (!dateStr) return 'No due date';

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isOverdue) {
      return Math.abs(diffDays) === 1
        ? '1 day overdue'
        : `${Math.abs(diffDays)} days overdue`;
    }

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get priority badge color
  const getPriorityColor = (priority?: string, isOverdue?: boolean) => {
    if (isOverdue) return 'bg-red-500/20 text-red-400';
    const map: Record<string, string> = {
      HIGH: 'bg-orange-500/20 text-orange-400',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400',
      LOW: 'bg-white/10 text-white/60',
    };
    return map[priority || 'MEDIUM'] || map.MEDIUM;
  };

  // Loading
  if (isLoading) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Priority Tasks</h3>
          <AlertTriangle className="h-4 w-4 text-white/40" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Widget>
    );
  }

  // Error
  if (error) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Priority Tasks</h3>
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">Failed to load tasks</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1.5 text-xs focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </Widget>
    );
  }

  // Empty
  if (priorityTasks.length === 0) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Priority Tasks</h3>
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">No priority tasks</p>
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="h-8 text-xs focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/tasks/new">Add Task</Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Content (max 5)
  const visible = priorityTasks.slice(0, 5);

  return (
    <Widget>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Priority Tasks</h3>
        {priorityTasks.length > 5 && (
          <span className="text-xs text-white/60">{priorityTasks.length} tasks</span>
        )}
      </div>

      <div className="space-y-1">
        {visible.map((task: any) => {
          const label = `${task.title} - ${formatDueDate(task.dueDate, task.isOverdue)}`;

          return (
            <Link
              key={task.id}
              href={`/admin/tasks/${task.id}`}
              className={cn(
                'block -mx-2 rounded p-2',
                'min-h-[44px]',
                'hover:bg-white/5',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'motion-reduce:transition-none transition-colors'
              )}
              aria-label={label}
            >
              <div className="flex items-center gap-3">
                {task.isOverdue ? (
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span className="flex-1 text-sm text-white truncate">
                  {task.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">
                    {formatDueDate(task.dueDate, task.isOverdue)}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      getPriorityColor(task.priority, task.isOverdue)
                    )}
                  >
                    {task.isOverdue ? 'Overdue' : task.priority?.toLowerCase()}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 text-right">
        <Link
          href="/admin/tasks?filter=priority"
          className="text-xs text-white/60 hover:text-white motion-reduce:transition-none transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-1"
          aria-label="View all priority tasks"
        >
          View all →
        </Link>
      </div>
    </Widget>
  );
}