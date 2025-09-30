'use client';

import { useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProjects, useTasks, useTodaySchedule } from '@/hooks/use-api';
import { useWeather } from '@/hooks/use-weather';
import { Widget } from '@/components/dashboard/Widget';
import { WeatherIcon, mapWeatherCode, getTemperatureGradient } from '@/lib/weather-icons';
import {
  Calendar, MapPin, Loader2, RefreshCw, CheckCircle,
  Clock, ArrowRight, Activity, Droplets, Wind,
  Eye, Gauge, ThermometerSun, CloudRain, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

  // Calculate task completion
  const taskCompletion = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [tasks]);

  // Get today's schedule
  const scheduleData = (todaySchedule as any)?.data || todaySchedule;
  const todayEvents = Array.isArray(scheduleData) ? scheduleData : scheduleData?.items || [];
  const nextEvent = todayEvents[0];

  // Process weather data
  const weatherData = (weather as any)?.data || weather;
  const weatherCondition = weatherData?.current?.code
    ? mapWeatherCode(weatherData.current.code, weatherData.current.isDay)
    : 'unknown';

  // Get workability style
  const getWorkabilityStyle = (label?: string) => {
    switch (label) {
      case 'Good':
        return {
          badge: 'bg-[#8EE3C8]/20 text-[#8EE3C8] border-[#8EE3C8]/30',
          border: 'border-[#8EE3C8]/30',
          text: 'text-[#8EE3C8]'
        };
      case 'Fair':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          border: 'border-amber-500/30',
          text: 'text-amber-400'
        };
      case 'Poor':
        return {
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
          border: 'border-red-500/30',
          text: 'text-red-400'
        };
      default:
        return {
          badge: 'bg-white/10 text-white/60 border-white/20',
          border: 'border-white/20',
          text: 'text-white/60'
        };
    }
  };

  const workabilityStyle = getWorkabilityStyle(weatherData?.workability?.label);

  // Format time for schedule
  const formatEventTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get project status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-[#8EE3C8]/20 text-[#8EE3C8] border-[#8EE3C8]/30';
      case 'PLANNING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ON_HOLD': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'COMPLETED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <Widget className="space-y-4">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {greeting}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
            </h2>
            <p className="text-sm text-white/60 mt-0.5">{todayDate}</p>
          </div>
          {activeProject && (
            <Badge className={cn('text-xs', getStatusColor(activeProject.status))}>
              {activeProject.status}
            </Badge>
          )}
        </div>

        {activeProject && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{activeProject.name}</p>
              {activeProject.address && (
                <p className="text-xs text-white/60 truncate">{activeProject.address}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weather Section - Enhanced */}
      {activeProject?.address ? (
        <div className={cn(
          'relative overflow-hidden rounded-lg border p-4 transition-all duration-500',
          'bg-gradient-to-br',
          weatherData ? getTemperatureGradient(weatherData.current?.tempF) : 'from-white/5 to-white/10',
          workabilityStyle.border
        )}>
          {weatherLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : weatherError ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">Weather unavailable</p>
              <Button
                onClick={() => refetchWeather()}
                variant="ghost"
                size="sm"
                className="h-auto p-1"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          ) : weatherData ? (
            <div className="space-y-3">
              {/* Main Weather Display - Compact Layout */}
              <div className="flex items-center gap-4">
                {/* Weather Icon - Larger and prominent */}
                <div className="flex-shrink-0">
                  <WeatherIcon
                    condition={weatherCondition}
                    size="xl"
                    animated={true}
                    temperature={weatherData.current.tempF}
                  />
                </div>

                {/* Temperature & Condition */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white leading-none">
                      {Math.round(weatherData.current.tempF)}°
                    </span>
                    <span className="text-sm text-white/60 mb-1">
                      Feels {Math.round(weatherData.current.apparentF)}°
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mt-2">
                    {weatherData.current.text}
                  </p>
                </div>

                {/* Workability Badge */}
                <div className="flex-shrink-0">
                  <Badge className={cn('text-xs whitespace-nowrap', workabilityStyle.badge)}>
                    {weatherData.workability.label}
                  </Badge>
                  {weatherData.workability.label !== 'Good' && weatherData.workability.reasons?.length > 0 && (
                    <p className="text-xs text-white/60 mt-1 max-w-[100px] text-right">
                      {weatherData.workability.reasons[0].split('.')[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Weather Metrics - Horizontal Bar */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs font-medium text-white">{weatherData.current.windMph}</p>
                    <p className="text-xs text-white/40">mph</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs font-medium text-white">{weatherData.current.humidity}%</p>
                    <p className="text-xs text-white/40">Humidity</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs font-medium text-white">{weatherData.current.precipMm || 0}</p>
                    <p className="text-xs text-white/40">mm</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs font-medium text-white">{weatherData.current.visMiles || 10}</p>
                    <p className="text-xs text-white/40">mi</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        // No address configured
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
              className="h-auto py-1 px-2 text-xs"
            >
              <Link href="/admin/settings">Configure</Link>
            </Button>
          )}
        </div>
      )}

      {/* Project Quick Stats */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        {/* Task Progress */}
        <Link
          href="/admin/tasks"
          className="block space-y-2 p-3 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-white/60" />
              <span className="text-sm font-medium text-white">Task Progress</span>
            </div>
            <span className="text-sm text-white/60">
              {taskCompletion.completed}/{taskCompletion.total}
            </span>
          </div>
          <Progress
            value={taskCompletion.percentage}
            className="h-2"
          />
          <p className="text-xs text-white/60">
            {taskCompletion.percentage}% Complete
          </p>
        </Link>

        {/* Today's Schedule */}
        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <span className="text-sm font-medium text-white">Today's Schedule</span>
            </div>
            <Link
              href="/admin/schedule?range=today"
              className="text-xs text-[#8EE3C8] hover:text-[#8EE3C8]/80"
            >
              View all
              <ArrowRight className="inline h-3 w-3 ml-1" />
            </Link>
          </div>

          {nextEvent ? (
            <div className="space-y-1">
              <p className="text-sm text-white font-medium truncate">
                {nextEvent.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Clock className="h-3 w-3" />
                <span>
                  {formatEventTime(nextEvent.startTime)}
                  {nextEvent.endTime && ` - ${formatEventTime(nextEvent.endTime)}`}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/60">No events scheduled</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 h-9"
          >
            <Link href="/admin/tasks/new">
              New Task
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 h-9"
          >
            <Link href="/admin/schedule">
              Schedule
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 h-9"
          >
            <Link href="/admin/budget">
              Budget
            </Link>
          </Button>
        </div>
      </div>
    </Widget>
  );
}