'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProjects, useTodaySchedule } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TodayScheduleWidget() {
  const { data: projects } = useProjects();
  const projectList = Array.isArray(projects) ? projects : (projects as any)?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const {
    data: schedule,
    isLoading,
    error,
    refetch,
  } = useTodaySchedule(projectId, !!projectId);

  // Normalize schedule events (array | {items} | {data})
  const events = useMemo(() => {
    if (!schedule) return [];
    const raw =
      Array.isArray(schedule)
        ? schedule
        : (schedule as any)?.items
          ? (schedule as any).items
          : (schedule as any)?.data?.items
            ? (schedule as any).data.items
            : (schedule as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [schedule]);

  // Time formatter (memoized)
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    []
  );
  const formatTime = (iso?: string) => {
    if (!iso) return 'All day';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : timeFmt.format(d);
  };

  // Type badge classes (normalize to uppercase)
  const getTypeBadgeColor = (type?: string) => {
    const t = String(type || 'OTHER').toUpperCase();
    const map: Record<string, string> = {
      INSPECTION: 'bg-blue-500/20 text-blue-400',
      DELIVERY: 'bg-green-500/20 text-green-400',
      MEETING: 'bg-purple-500/20 text-purple-400',
      MILESTONE: 'bg-yellow-500/20 text-yellow-400',
      SITE: 'bg-emerald-500/20 text-emerald-400',
      OTHER: 'bg-white/10 text-white/60',
    };
    return map[t] || map.OTHER;
  };

  // Loading
  if (isLoading) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Today&apos;s Schedule</h3>
          <Calendar className="h-4 w-4 text-white/40" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
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
          <h3 className="text-sm font-medium text-white">Today&apos;s Schedule</h3>
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">Failed to load schedule</p>
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
  if (events.length === 0) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Today&apos;s Schedule</h3>
          <Calendar className="h-4 w-4 text-white/40" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">No events scheduled for today</p>
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="h-8 text-xs focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/schedule/new">Add Event</Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Content (max 5)
  const visible = events.slice(0, 5);

  return (
    <Widget>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Today&apos;s Schedule</h3>
        {events.length > 5 && (
          <span className="text-xs text-white/60">{events.length} events</span>
        )}
      </div>

      <div className="space-y-1">
        {visible.map((event: any) => {
          const href = event?.id
            ? `/admin/schedule/${event.id}`
            : `/admin/schedule?range=today`;
          const label = `${event?.title ?? 'Event'} at ${formatTime(event?.startTime)}${event?.type ? ` • ${String(event.type).toLowerCase()}` : ''}`;

          return (
            <Link
              key={event?.id ?? `${event?.title}-${event?.startTime}`}
              href={href}
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
                <span className="text-xs text-white/60 min-w-[48px]">
                  {formatTime(event?.startTime)}
                </span>
                <span className="flex-1 text-sm text-white truncate">
                  {event?.title ?? 'Untitled event'}
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    getTypeBadgeColor(event?.type)
                  )}
                >
                  {String(event?.type ?? 'other').toLowerCase()}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 text-right">
        <Link
          href="/admin/schedule?range=today"
          className="text-xs text-white/60 hover:text-white motion-reduce:transition-none transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-1"
          aria-label="View all of today's schedule"
        >
          View all →
        </Link>
      </div>
    </Widget>
  );
}