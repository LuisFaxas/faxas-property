'use client';

import { useProjects, useTasks, useTodaySchedule } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { CheckCircle, AlertCircle, Clock, ListTodo, Calendar, TrendingUp, Activity, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export function TaskKPIsWidget() {
  const { data: projects } = useProjects();

  // Get the first active project or fall back to first project
  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const { data: tasks, isLoading, error } = useTasks({ projectId }, !!projectId);
  const { data: todaySchedule } = useTodaySchedule(projectId, !!projectId);

  const kpis = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return {
        dueToday: 0,
        overdue: 0,
        eventsToday: 0,
        completed7d: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
        total: 0
      };
    }

    // Set up date boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Calculate KPIs
    const dueToday = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      const open = t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      return open && d >= startOfToday && d <= endOfToday;
    }).length;

    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      const open = t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      return open && d < startOfToday;
    }).length;

    const completed7d = tasks.filter(t => {
      if (t.status !== 'COMPLETED' || !t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d >= sevenDaysAgo;
    }).length;

    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const notStarted = tasks.filter(t => t.status === 'NOT_STARTED').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const total = tasks.length;

    // Count today's events
    const scheduleData = (todaySchedule as any)?.data || todaySchedule;
    const eventsToday = Array.isArray(scheduleData)
      ? scheduleData.length
      : scheduleData?.items?.length || 0;

    return {
      dueToday,
      overdue,
      eventsToday,
      completed7d,
      inProgress,
      notStarted,
      blocked,
      total
    };
  }, [tasks, todaySchedule]);

  if (isLoading) {
    return (
      <Widget>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </Widget>
    );
  }

  if (error || !projectId) {
    return (
      <Widget>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Task Overview</h2>
          <p className="text-sm text-white/60">No tasks yet</p>
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full sm:w-auto"
          >
            <Link href="/admin/tasks/new">
              Create first task
            </Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Primary metrics (from old WelcomeWidget)
  const primaryMetrics = [
    {
      label: 'Due Today',
      value: kpis.dueToday,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/20',
      filter: 'dueToday'
    },
    {
      label: 'Overdue',
      value: kpis.overdue,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      filter: 'overdue'
    },
    {
      label: 'Events Today',
      value: kpis.eventsToday,
      icon: Calendar,
      color: 'text-[#8EE3C8]',
      bgColor: 'bg-[#8EE3C8]/10',
      borderColor: 'border-[#8EE3C8]/20',
      filter: 'today',
      href: '/admin/schedule?range=today'
    },
    {
      label: 'Completed',
      value: kpis.completed7d,
      icon: CheckCircle,
      color: 'text-[#8EE3C8]',
      bgColor: 'bg-[#8EE3C8]/10',
      borderColor: 'border-[#8EE3C8]/20',
      filter: 'completed7d',
      subtitle: 'Last 7 days'
    }
  ];

  // Secondary metrics (task status breakdown)
  const statusMetrics = [
    {
      label: 'In Progress',
      value: kpis.inProgress,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      filter: 'inProgress'
    },
    {
      label: 'Not Started',
      value: kpis.notStarted,
      icon: Target,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20',
      filter: 'notStarted'
    },
    {
      label: 'Blocked',
      value: kpis.blocked,
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/20',
      filter: 'blocked'
    },
    {
      label: 'Total Tasks',
      value: kpis.total,
      icon: ListTodo,
      color: 'text-white',
      bgColor: 'bg-white/10',
      borderColor: 'border-white/20',
      filter: 'all'
    }
  ];

  return (
    <Widget>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Task Overview</h2>
          <Link
            href="/admin/tasks"
            className="text-xs text-[#8EE3C8] hover:text-[#8EE3C8]/80"
          >
            View all tasks →
          </Link>
        </div>

        {/* Primary Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {primaryMetrics.map((metric) => {
            const Icon = metric.icon;
            const Component = metric.href ? 'a' : Link;
            const props = metric.href
              ? { href: metric.href }
              : { href: `/admin/tasks?filter=${metric.filter}` };

            return (
              <Component
                key={metric.filter}
                {...props}
                className={cn(
                  "block p-3 rounded-lg border transition-all hover:scale-[1.02] hover:shadow-lg",
                  metric.borderColor,
                  metric.bgColor,
                  "hover:bg-white/5"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <span className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </span>
                </div>
                <p className="text-xs text-white/60">{metric.label}</p>
                {metric.subtitle && (
                  <p className="text-xs text-white/40 mt-0.5">{metric.subtitle}</p>
                )}
              </Component>
            );
          })}
        </div>

        {/* Status Breakdown Row */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-white/60 mb-3">Status Breakdown</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statusMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Link
                  key={metric.filter}
                  href={`/admin/tasks?filter=${metric.filter}`}
                  className={cn(
                    "block p-3 rounded-lg border transition-all hover:scale-[1.02]",
                    metric.borderColor,
                    "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                    <span className={`text-xl font-bold ${metric.color}`}>
                      {metric.value}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-2">{metric.label}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Insights */}
        {(kpis.overdue > 0 || kpis.blocked > 0) && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-white/60 mb-2">Requires Attention</p>
            <div className="space-y-2">
              {kpis.overdue > 0 && (
                <Link
                  href="/admin/tasks?filter=overdue"
                  className="flex items-center justify-between p-2 rounded bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs text-red-400">
                      {kpis.overdue} overdue task{kpis.overdue !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-red-400">Review →</span>
                </Link>
              )}
              {kpis.blocked > 0 && (
                <Link
                  href="/admin/tasks?filter=blocked"
                  className="flex items-center justify-between p-2 rounded bg-orange-400/10 border border-orange-400/20 hover:bg-orange-400/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-xs text-orange-400">
                      {kpis.blocked} blocked task{kpis.blocked !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-orange-400">Unblock →</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
}