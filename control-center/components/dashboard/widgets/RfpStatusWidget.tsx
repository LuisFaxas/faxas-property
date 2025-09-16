'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProjects, useRfps } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RfpStatusWidget() {
  const { data: projects } = useProjects();
  const projectList = Array.isArray(projects) ? projects : (projects as any)?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const {
    data: rfps,
    isLoading,
    error,
    refetch,
  } = useRfps(projectId || '', { limit: 20 }, !!projectId);

  // Normalize RFP data
  const rfpList = useMemo(() => {
    if (!rfps) return [];
    return Array.isArray(rfps)
      ? rfps
      : (rfps as any)?.data || (rfps as any)?.items || [];
  }, [rfps]);

  // Calculate status counts and urgent RFPs
  const { statusCounts, urgentRfps } = useMemo(() => {
    const counts: Record<string, number> = {
      DRAFT: 0,
      PUBLISHED: 0,
      CLOSED: 0,
      AWARDED: 0,
    };

    const urgent: any[] = [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    rfpList.forEach((rfp: any) => {
      const status = (rfp.status || 'DRAFT').toUpperCase();
      counts[status] = (counts[status] || 0) + 1;

      // Check if urgent (due within 7 days and not closed/awarded)
      if (rfp.dueDate && (status === 'PUBLISHED' || status === 'OPEN')) {
        const dueDate = new Date(rfp.dueDate);
        if (dueDate <= sevenDaysFromNow && dueDate >= now) {
          urgent.push({
            ...rfp,
            daysUntilDue: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }
      }
    });

    // Sort urgent by due date
    urgent.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return { statusCounts: counts, urgentRfps: urgent };
  }, [rfpList]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-white/10 text-white/60',
      PUBLISHED: 'bg-blue-500/20 text-blue-400',
      OPEN: 'bg-blue-500/20 text-blue-400',
      CLOSED: 'bg-orange-500/20 text-orange-400',
      AWARDED: 'bg-green-500/20 text-green-400',
    };
    return map[status.toUpperCase()] || map.DRAFT;
  };

  // Format due date
  const formatDueDate = (rfp: any) => {
    if (!rfp.daysUntilDue) return '';
    if (rfp.daysUntilDue === 1) return 'Due tomorrow';
    if (rfp.daysUntilDue <= 3) return `${rfp.daysUntilDue} days`;
    return `${rfp.daysUntilDue}d`;
  };

  // Loading
  if (isLoading) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">RFP Status</h3>
          <FileText className="h-4 w-4 text-white/40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
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
          <h3 className="text-sm font-medium text-white">RFP Status</h3>
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">Failed to load RFPs</p>
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
  if (rfpList.length === 0) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">RFP Status</h3>
          <FileText className="h-4 w-4 text-white/40" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">No active RFPs</p>
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="h-8 text-xs focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/rfp/new">Create RFP</Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Content
  return (
    <Widget>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">RFP Status</h3>
        {urgentRfps.length > 0 && (
          <Clock className="h-4 w-4 text-orange-400" />
        )}
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {Object.entries(statusCounts).map(([status, count]) => {
          if (count === 0) return null;
          return (
            <Link
              key={status}
              href={`/admin/rfp?status=${status}`}
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                getStatusColor(status),
                'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/20',
                'motion-reduce:transition-none transition-opacity'
              )}
              aria-label={`${count} ${status.toLowerCase()} RFPs`}
            >
              {status.toLowerCase()} ({count})
            </Link>
          );
        })}
      </div>

      {/* Urgent RFPs or recent list */}
      <div className="space-y-1">
        {urgentRfps.length > 0 ? (
          <>
            <div className="text-[10px] uppercase tracking-wider text-orange-400/60 mb-1">
              Due Soon
            </div>
            {urgentRfps.slice(0, 3).map((rfp: any) => (
              <Link
                key={rfp.id}
                href={`/admin/rfp/${rfp.id}`}
                className={cn(
                  'block -mx-2 rounded p-2',
                  'min-h-[44px]',
                  'hover:bg-white/5',
                  'focus:outline-none focus:ring-2 focus:ring-white/20',
                  'motion-reduce:transition-none transition-colors'
                )}
                aria-label={`${rfp.title} - ${formatDueDate(rfp)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white truncate flex-1">
                    {rfp.title}
                  </span>
                  <span className="text-xs text-orange-400">
                    {formatDueDate(rfp)}
                  </span>
                </div>
              </Link>
            ))}
          </>
        ) : (
          // Show recent RFPs if no urgent ones
          rfpList.slice(0, 3).map((rfp: any) => (
            <Link
              key={rfp.id}
              href={`/admin/rfp/${rfp.id}`}
              className={cn(
                'block -mx-2 rounded p-2',
                'min-h-[44px]',
                'hover:bg-white/5',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'motion-reduce:transition-none transition-colors'
              )}
              aria-label={`${rfp.title} - ${rfp.status?.toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white truncate flex-1">
                  {rfp.title}
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  getStatusColor(rfp.status || 'DRAFT')
                )}>
                  {(rfp.status || 'draft').toLowerCase()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-3 text-right">
        <Link
          href="/admin/rfp"
          className="text-xs text-white/60 hover:text-white motion-reduce:transition-none transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-1"
          aria-label="View all RFPs"
        >
          View all →
        </Link>
      </div>
    </Widget>
  );
}