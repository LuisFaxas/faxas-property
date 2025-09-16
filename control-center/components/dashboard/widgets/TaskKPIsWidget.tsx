'use client';

import { useProjects, useTasks } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { CheckCircle, AlertCircle, Clock, ListTodo, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo } from 'react';

export function TaskKPIsWidget() {
  const { data: projects } = useProjects();
  
  // Get the first active project or fall back to first project
  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;
  
  const { data: tasks, isLoading, error } = useTasks({ projectId }, !!projectId);

  const kpis = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return {
        dueToday: 0,
        overdue: 0,
        completed7d: 0,
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
    
    const total = tasks.length;
    
    return {
      dueToday,
      overdue,
      completed7d,
      total
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <Widget className="lg:col-span-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Widget>
    );
  }

  if (error || !projectId) {
    return (
      <Widget className="lg:col-span-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Task Overview</h2>
          <p className="text-sm text-white/60">No tasks yet</p>
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/tasks/new">
              Create first task
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Widget>
    );
  }

  const kpiCards = [
    {
      label: 'Due Today',
      value: kpis.dueToday,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      filter: 'dueToday'
    },
    {
      label: 'Overdue',
      value: kpis.overdue,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      filter: 'overdue'
    },
    {
      label: 'Completed',
      value: kpis.completed7d,
      icon: CheckCircle,
      color: 'text-[#8EE3C8]',
      bgColor: 'bg-[#8EE3C8]/10',
      filter: 'completed7d',
      subtitle: 'Last 7 days'
    },
    {
      label: 'Total Tasks',
      value: kpis.total,
      icon: ListTodo,
      color: 'text-white',
      bgColor: 'bg-white/10',
      filter: 'all'
    }
  ];

  return (
    <Widget className="lg:col-span-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.filter}
              href={`/admin/tasks?filter=${kpi.filter}`}
              aria-label={`Open tasks filtered by ${kpi.label}`}
              className="block space-y-2 p-3 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className={`text-2xl font-bold ${kpi.color}`}>
                  {kpi.value}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/60">{kpi.label}</p>
                {kpi.subtitle && (
                  <p className="text-xs text-white/40">{kpi.subtitle}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Widget>
  );
}