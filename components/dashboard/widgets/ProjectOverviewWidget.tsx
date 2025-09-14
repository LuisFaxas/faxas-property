'use client';

import { useProjects, useTasks, useTodaySchedule, useBudgetSummary } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Calendar, MapPin, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo } from 'react';
import { fmtPercentSafe, widthPercent, toNum } from '@/lib/ui/format';

export function ProjectOverviewWidget({ showBudget = false }: { showBudget?: boolean }) {
  const { data: projects, isLoading, error } = useProjects();

  // Get the first active project or fall back to first project
  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  // Always call hooks, but conditionally enable them
  const { data: tasks } = useTasks({ projectId }, !!projectId);
  const { data: todaySchedule } = useTodaySchedule(projectId, !!projectId);
  const { data: budgetSummary } = useBudgetSummary(projectId, !!projectId);

  const taskStats = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return { total: 0, completed: 0, overdue: 0 };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      return dueDate && dueDate < today;
    }).length;
    
    return { total: tasks.length, completed, overdue };
  }, [tasks]);

  // Early return if no projectId to prevent undefined in Link href
  if (!isLoading && !projectId) {
    return (
      <Widget>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Project Overview</h2>
          <p className="text-sm text-white/60">No active project</p>
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/projects">
              View projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Widget>
    );
  }

  if (isLoading) {
    return (
      <Widget>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Widget>
    );
  }

  if (error) {
    return (
      <Widget>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Project Overview</h2>
          <p className="text-sm text-white/60">Failed to load project</p>
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/projects">
              View projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Handle todaySchedule shape (could be array or object with items)
  const scheduleData = (todaySchedule as any)?.data || todaySchedule;
  const scheduleEvents = Array.isArray(scheduleData) ? scheduleData : scheduleData?.items || [];
  const nextEvent = scheduleEvents[0];
  
  const budgetData = (budgetSummary as any)?.data || budgetSummary;
  const totalBudget = toNum(budgetData?.totalBudget);
  const totalSpent = toNum(budgetData?.totalSpent);

  return (
    <Widget>
      <Link 
        href={`/admin/projects/${projectId}`}
        className="block space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg motion-reduce:transition-none"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{activeProject.name}</h2>
            {activeProject.address && (
              <p className="text-sm text-white/60 truncate" title={activeProject.address}>
                <MapPin className="inline h-3 w-3 mr-1" />
                {activeProject.address}
              </p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0 ml-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-white/60 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Tasks
            </p>
            <p className="text-lg font-semibold text-white">
              {taskStats.completed}/{taskStats.total}
            </p>
            {taskStats.overdue > 0 && (
              <p className="text-xs text-yellow-400">{taskStats.overdue} overdue</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-white/60 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Today
            </p>
            {nextEvent ? (
              <>
                <p className="text-sm font-medium text-white truncate">{nextEvent.title}</p>
                <p className="text-xs text-white/60">
                  {new Date(nextEvent.startTime).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-white/60">No events today</p>
            )}
          </div>
        </div>

        {showBudget && budgetSummary && totalBudget !== null && totalBudget > 0 && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Budget</span>
              <span className="text-white">{fmtPercentSafe(totalSpent, totalBudget)} used</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full motion-reduce:transition-none transition-all duration-500 ${
                  (totalSpent !== null && totalBudget > 0 && totalSpent / totalBudget > 0.9) ? 'bg-red-400' :
                  (totalSpent !== null && totalBudget > 0 && totalSpent / totalBudget > 0.75) ? 'bg-yellow-400' :
                  'bg-[#8EE3C8]'
                }`}
                style={{ width: widthPercent(totalSpent, totalBudget) }}
              />
            </div>
          </div>
        )}

        {activeProject.status && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-white/60">
              Status: <span className="text-[#8EE3C8]">{activeProject.status}</span>
            </span>
            <Clock className="h-3 w-3 text-white/40" />
          </div>
        )}
      </Link>
    </Widget>
  );
}