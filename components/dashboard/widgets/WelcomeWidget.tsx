'use client';

import { useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProjects } from '@/hooks/use-api';
import { useWeather } from '@/hooks/use-weather';
import { Widget } from '@/components/dashboard/Widget';
import { WeatherIcon, mapWMOCode } from '@/lib/weather-icons';
import {
  MapPin, Loader2, RefreshCw, Droplets, Wind,
  CloudRain, Info, Thermometer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function WelcomeWidget() {
  const { user } = useAuth();
  const { data: projects } = useProjects();

  // Get active project or fall back to first
  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  // Fetch weather data
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

  // Process weather data
  const weatherData = (weather as any)?.data || weather;
  const weatherCondition = weatherData?.current?.code !== undefined
    ? mapWMOCode(weatherData.current.code, weatherData.current.isDay ?? true)
    : 'unknown';

  // Get workability style
  const getWorkabilityStyle = (label?: string) => {
    switch (label) {
      case 'Good':
        return {
          badge: 'bg-[#8EE3C8]/20 text-[#8EE3C8] border-[#8EE3C8]/30',
          border: 'border-[#8EE3C8]/30',
          text: 'text-[#8EE3C8]',
          background: 'bg-[#8EE3C8]/5' // Very subtle teal background
        };
      case 'Fair':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          background: 'bg-amber-500/8' // Subtle amber background
        };
      case 'Poor':
        return {
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
          border: 'border-red-500/30',
          text: 'text-red-400',
          background: 'bg-red-500/10' // Subtle red background
        };
      default:
        return {
          badge: 'bg-white/10 text-white/60 border-white/20',
          border: 'border-white/20',
          text: 'text-white/60',
          background: 'bg-white/5'
        };
    }
  };

  const workabilityStyle = getWorkabilityStyle(weatherData?.workability?.label);

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
          // Background color based on workability conditions
          workabilityStyle.background,
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

              {/* Workability Message */}
              <div className={cn('flex items-center gap-2 p-2 rounded-md',
                weatherData.workability.label === 'Good' ? 'bg-[#8EE3C8]/10' :
                weatherData.workability.label === 'Fair' ? 'bg-amber-500/10' : 'bg-red-500/10'
              )}>
                <Info className={cn('h-4 w-4 flex-shrink-0', workabilityStyle.text)} />
                <p className={cn('text-xs', workabilityStyle.text)}>
                  {weatherData.workability.label === 'Good' && 'Safe to work. '}
                  {weatherData.workability.label === 'Fair' && 'Proceed with caution. '}
                  {weatherData.workability.label === 'Poor' && 'Not recommended. '}
                  {weatherData.workability.reasons.length > 0 && weatherData.workability.reasons.join('. ')}
                </p>
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
                    <p className="text-xs font-medium text-white">{weatherData.current.precipProbability}%</p>
                    <p className="text-xs text-white/40">Rain</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-white/40" />
                  <div>
                    <p className="text-xs font-medium text-white">{weatherData.today.highF}° / {weatherData.today.lowF}°</p>
                    <p className="text-xs text-white/40">High/Low</p>
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
    </Widget>
  );
}