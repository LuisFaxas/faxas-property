'use client';

import { useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProjects, useTasks, useTodaySchedule } from '@/hooks/use-api';
import { useWeather } from '@/hooks/use-weather';
import { Widget } from '@/components/dashboard/Widget';
import {
  Calendar, Clock, AlertCircle, CloudRain, Wind, Droplets,
  ThermometerSun, CheckCircle, AlertTriangle, XCircle,
  RefreshCw, MapPin, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function WelcomeWidget() {
  const { user } = useAuth();
  const { data: projects } = useProjects();

  // Get active project or fall back to first
  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  // Fetch data with proper guards
  const { data: tasks } = useTasks({ projectId }, !!projectId);
  const { data: todaySchedule } = useTodaySchedule(projectId, !!projectId);
  const {
    data: weather,
    isLoading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useWeather(projectId, !!projectId && !!activeProject?.address);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Format today's date
  const todayDate = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Calculate quick metrics client-side
  const metrics = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return { dueToday: 0, overdue: 0 };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

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

    return { dueToday, overdue };
  }, [tasks]);

  // Count today's events
  const scheduleData = (todaySchedule as any)?.data || todaySchedule;
  const todayEvents = Array.isArray(scheduleData)
    ? scheduleData.length
    : scheduleData?.items?.length || 0;

  // Get workability gradient classes
  const getWorkabilityClasses = (label?: string) => {
    switch (label) {
      case 'Good':
        return {
          gradient: 'from-[#0d2420] to-[#102b25]',
          pill: 'bg-[#8EE3C8]/20 text-[#8EE3C8] border-[#8EE3C8]/30',
          icon: CheckCircle,
          accent: 'text-[#8EE3C8]'
        };
      case 'Fair':
        return {
          gradient: 'from-[#2b2410] to-[#1f1a0c]',
          pill: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          accent: 'text-amber-400'
        };
      case 'Poor':
        return {
          gradient: 'from-[#2b1919] to-[#1f0e0e]',
          pill: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: XCircle,
          accent: 'text-red-400'
        };
      default:
        return {
          gradient: 'from-white/5 to-white/10',
          pill: 'bg-white/10 text-white/60 border-white/20',
          icon: CloudRain,
          accent: 'text-white/60'
        };
    }
  };

  const weatherData = (weather as any)?.data || weather;
  const workabilityStyle = getWorkabilityClasses(weatherData?.workability?.label);
  const WorkabilityIcon = workabilityStyle.icon;

  // Format best window time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Widget>
      <div className="space-y-4">
        {/* Greeting line */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            {greeting}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h2>
          <p className="text-sm text-white/60">
            {todayDate} • {activeProject ? activeProject.name.substring(0, 30) : 'No active project'}
            {activeProject?.name.length > 30 && '...'}
          </p>
        </div>

        {/* Weather Hero Block */}
        {activeProject?.address ? (
          <div className={cn(
            'relative overflow-hidden rounded-lg p-3 md:p-4 bg-gradient-to-br motion-reduce:transition-none transition-all duration-500',
            workabilityStyle.gradient
          )}>
            {weatherLoading ? (
              // Loading state
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : weatherError ? (
              // Error state
              <div className="space-y-2" role="status">
                <p className="text-sm text-white/60">Weather unavailable</p>
                <Button
                  onClick={() => refetchWeather()}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-white/60 hover:text-white"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : weatherData ? (
              // Weather data
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {/* Large temperature */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl md:text-4xl font-bold text-white">
                        {weatherData.current.tempF}°
                      </span>
                      <span className="text-base md:text-lg text-white/60">
                        {weatherData.current.text}
                      </span>
                    </div>

                    {/* Workability pill */}
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 mt-1.5 rounded-full border text-xs font-medium',
                        workabilityStyle.pill
                      )}
                      aria-live="polite"
                    >
                      <WorkabilityIcon className="h-3 w-3" />
                      {weatherData.workability.label}
                    </div>
                  </div>

                  {/* Micro stats */}
                  <div className="text-right space-y-0.5 text-[11px] md:text-xs">
                    <div className="flex items-center gap-1 text-white/60 justify-end">
                      <ThermometerSun className="h-3 w-3" />
                      <span>Feels {weatherData.current.apparentF}°</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60 justify-end">
                      <Wind className="h-3 w-3" />
                      <span>{weatherData.current.windMph} mph</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60 justify-end">
                      <Droplets className="h-3 w-3" />
                      <span>{weatherData.current.humidity}%</span>
                    </div>
                  </div>
                </div>

                {/* Status line */}
                <div className="text-xs text-white/80">
                  {weatherData.workability.label === 'Good' ? (
                    <>
                      <span className="font-medium">Good to work</span>
                      {weatherData.workability.bestWindow && (
                        <> • Best {formatTime(weatherData.workability.bestWindow.startISO)} - {formatTime(weatherData.workability.bestWindow.endISO)}</>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Caution</span>
                      {weatherData.workability.reasons.length > 0 && (
                        <> • {weatherData.workability.reasons.slice(0, 2).join('; ')}</>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          // Missing address banner
          <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-400">Add project address for weather</span>
            </div>
            {projectId && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-amber-400 hover:text-amber-300 motion-reduce:transition-none"
              >
                <Link href="/admin/settings">
                  Configure →
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Quick metrics - now interactive */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/admin/tasks?filter=dueToday"
            className="group text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-lg p-2 -m-2"
          >
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-1 rounded-lg bg-yellow-400/10 group-hover:bg-yellow-400/20 motion-reduce:transition-none transition-colors">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.dueToday}</p>
            <p className="text-xs text-white/60 group-hover:text-white/80">Due Today</p>
          </Link>

          <Link
            href="/admin/tasks?filter=overdue"
            className="group text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-lg p-2 -m-2"
          >
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-1 rounded-lg bg-red-400/10 group-hover:bg-red-400/20 motion-reduce:transition-none transition-colors">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.overdue}</p>
            <p className="text-xs text-white/60 group-hover:text-white/80">Overdue</p>
          </Link>

          <Link
            href="/admin/schedule?range=today"
            className="group text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-lg p-2 -m-2"
          >
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-1 rounded-lg bg-[#8EE3C8]/10 group-hover:bg-[#8EE3C8]/20 motion-reduce:transition-none transition-colors">
              <Calendar className="h-5 w-5 text-[#8EE3C8]" />
            </div>
            <p className="text-2xl font-bold text-white">{todayEvents}</p>
            <p className="text-xs text-white/60 group-hover:text-white/80">Events Today</p>
          </Link>
        </div>

        {/* Heads-up line */}
        <div className="text-xs text-white/60 text-center">
          {metrics.overdue > 0 ? (
            <span className="text-amber-400">Heads up: {metrics.overdue} overdue task{metrics.overdue !== 1 ? 's' : ''}</span>
          ) : todayEvents > 0 ? (
            <span>You have {todayEvents} event{todayEvents !== 1 ? 's' : ''} today</span>
          ) : (
            <span>You're clear for today</span>
          )}
        </div>
      </div>
    </Widget>
  );
}