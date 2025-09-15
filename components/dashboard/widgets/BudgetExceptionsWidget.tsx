'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProjects, useBudgetExceptions } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BudgetExceptionsWidget() {
  const { data: projects } = useProjects();
  const projectList = Array.isArray(projects) ? projects : (projects as any)?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const {
    data: exceptions,
    isLoading,
    error,
    refetch,
  } = useBudgetExceptions(projectId, !!projectId);

  // Normalize exceptions data
  const exceptionItems = useMemo(() => {
    if (!exceptions) return [];

    // Handle different response formats
    if (Array.isArray(exceptions)) {
      return exceptions;
    }

    // Check for data wrapper
    const items = (exceptions as any)?.data || (exceptions as any)?.items || [];
    return Array.isArray(items) ? items : [];
  }, [exceptions]);

  // Total count (may be in a wrapper or just array length)
  const totalCount = useMemo(() => {
    if (Array.isArray(exceptions)) {
      return exceptions.length;
    }
    return (exceptions as any)?.total || (exceptions as any)?.count || exceptionItems.length;
  }, [exceptions, exceptionItems]);

  // Format currency safely
  const formatCurrency = (amount?: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!num || isNaN(num)) return '$0';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format percentage
  const formatPercent = (value?: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!num || isNaN(num)) return '0%';
    return `${Math.round(num)}%`;
  };

  // Get color based on percentage over
  const getOverageColor = (percentOver?: number | string) => {
    const num = typeof percentOver === 'string' ? parseFloat(percentOver) : percentOver;
    if (!num || isNaN(num)) return 'text-white/60';

    if (num >= 20) return 'text-red-400';
    if (num >= 10) return 'text-orange-400';
    return 'text-yellow-400';
  };

  // Loading
  if (isLoading) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Budget Exceptions</h3>
          <TrendingUp className="h-4 w-4 text-white/40" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
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
          <h3 className="text-sm font-medium text-white">Budget Exceptions</h3>
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">Failed to load budget data</p>
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

  // Empty (good state)
  if (exceptionItems.length === 0) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Budget Exceptions</h3>
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        </div>
        <div className="py-4">
          <p className="text-sm text-white/60">Budget on track</p>
        </div>
      </Widget>
    );
  }

  // Content (max 3)
  const visible = exceptionItems.slice(0, 3);

  return (
    <Widget>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Budget Exceptions</h3>
        {totalCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {totalCount} {totalCount === 1 ? 'item' : 'items'} over
          </span>
        )}
      </div>

      <div className="space-y-1">
        {visible.map((item: any) => {
          const percentOver = item.percentOver || item.percentageOver ||
            (item.actualAmount && item.budgetAmount
              ? ((item.actualAmount - item.budgetAmount) / item.budgetAmount) * 100
              : 0);

          const label = `${item.name || item.title || 'Budget Item'} - ${formatPercent(percentOver)} over budget`;

          return (
            <Link
              key={item.id}
              href={`/admin/budget/${item.id}`}
              className={cn(
                'block -mx-2 rounded p-2',
                'min-h-[44px]',
                'hover:bg-white/5',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'motion-reduce:transition-none transition-colors'
              )}
              aria-label={label}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white truncate flex-1 mr-2">
                  {item.name || item.title || 'Budget Item'}
                </span>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-medium', getOverageColor(percentOver))}>
                    {formatPercent(percentOver)} over
                  </span>
                  <span className="text-xs text-white/60">
                    {formatCurrency(item.actualAmount || item.actual)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 text-right">
        <Link
          href="/admin/budget?filter=exceptions"
          className="text-xs text-white/60 hover:text-white motion-reduce:transition-none transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-1"
          aria-label="View all budget exceptions"
        >
          View all →
        </Link>
      </div>
    </Widget>
  );
}