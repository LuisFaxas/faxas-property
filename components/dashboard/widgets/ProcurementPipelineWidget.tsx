'use client';

import Link from 'next/link';
import { useProjects, useProcurementSummary } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProcurementPipelineWidget() {
  const { data: projects } = useProjects();
  const projectList = Array.isArray(projects) ? projects : (projects as any)?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useProcurementSummary(projectId, !!projectId);

  // Pipeline stages configuration
  const stages = [
    { key: 'QUOTED', label: 'Quoted', color: 'bg-blue-500/20 text-blue-400' },
    { key: 'ORDERED', label: 'Ordered', color: 'bg-yellow-500/20 text-yellow-400' },
    { key: 'DELIVERED', label: 'Delivered', color: 'bg-purple-500/20 text-purple-400' },
    { key: 'INSTALLED', label: 'Installed', color: 'bg-green-500/20 text-green-400' },
  ] as const;

  // Calculate total items
  const totalItems = summary
    ? Object.values(summary.totals).reduce((sum, count) => sum + count, 0)
    : 0;

  // Loading
  if (isLoading) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Procurement Pipeline</h3>
          <Package className="h-4 w-4 text-white/40" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-1">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 flex-1" />
            ))}
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </Widget>
    );
  }

  // Error
  if (error) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Procurement Pipeline</h3>
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">Failed to load pipeline</p>
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
  if (totalItems === 0) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Procurement Pipeline</h3>
          <Package className="h-4 w-4 text-white/40" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">No procurement items</p>
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="h-8 text-xs focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/procurement/new">Add Item</Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Content
  return (
    <Widget>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Procurement Pipeline</h3>
        {summary?.overdue > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {summary.overdue} overdue
          </span>
        )}
      </div>

      {/* Pipeline stages */}
      <div className="flex items-center justify-between gap-1 mb-3">
        {stages.map((stage, index) => {
          const count = summary?.totals[stage.key] || 0;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <Link
                href={`/admin/procurement?status=${stage.key}`}
                className={cn(
                  'flex-1 relative group',
                  'focus:outline-none focus:ring-2 focus:ring-white/20 rounded',
                  'motion-reduce:transition-none transition-colors'
                )}
                aria-label={`${stage.label}: ${count} items`}
              >
                <div
                  className={cn(
                    'p-2 text-center rounded',
                    'min-h-[48px] flex flex-col items-center justify-center',
                    'hover:bg-white/5',
                    count > 0 ? stage.color : 'bg-white/5 text-white/40'
                  )}
                >
                  <div className="text-base font-semibold">{count}</div>
                  <div className="text-[10px] uppercase tracking-wider">
                    {stage.label}
                  </div>
                </div>
              </Link>
              {!isLast && (
                <ArrowRight className="h-3 w-3 text-white/20 mx-0.5 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Recent items if available */}
      {summary?.recent && summary.recent.length > 0 && (
        <div className="space-y-1 mb-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
            Recent
          </div>
          {summary.recent.slice(0, 2).map((item) => (
            <Link
              key={item.id}
              href={`/admin/procurement/${item.id}`}
              className={cn(
                'block -mx-2 rounded px-2 py-1',
                'hover:bg-white/5',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'motion-reduce:transition-none transition-colors'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-white truncate flex-1">
                  {item.title}
                </span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded ml-2',
                  stages.find(s => s.key === item.stage)?.color || 'bg-white/10 text-white/60'
                )}>
                  {item.stage?.toLowerCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-right">
        <Link
          href="/admin/procurement"
          className="text-xs text-white/60 hover:text-white motion-reduce:transition-none transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-1"
          aria-label="View all procurement items"
        >
          View all →
        </Link>
      </div>
    </Widget>
  );
}