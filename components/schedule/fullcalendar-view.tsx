'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import { EventApi, DateSelectArg, EventClickArg, EventChangeArg, CalendarApi } from '@fullcalendar/core';
import '@/styles/fullcalendar.css';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  CalendarDays,
  CalendarRange,
  List,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useResponsive } from '@/hooks/use-responsive';
import { useCalendarSwipe } from '@/hooks/use-swipe-gestures';
import { AdaptiveToolbar } from '@/components/ui/adaptive-toolbar';

interface ScheduleEvent {
  id: string;
  title: string;
  type: string;
  start?: string;
  startTime?: string;
  end?: string;
  endTime?: string;
  status: string;
  location?: string;
  attendees?: string[];
  description?: string;
  notes?: string;
  projectId?: string;
}

interface FullCalendarViewProps {
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
  onSelectSlot?: (start: Date, end: Date) => void;
  onEventDrop?: (event: ScheduleEvent, start: Date, end: Date) => void;
  onEventResize?: (event: ScheduleEvent, start: Date, end: Date) => void;
}

// Event type colors matching the app's theme
const eventTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  WORK: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  MEETING: { bg: '#a855f7', border: '#9333ea', text: '#ffffff' },
  SITE_VISIT: { bg: '#22c55e', border: '#16a34a', text: '#ffffff' },
  CALL: { bg: '#fb923c', border: '#f97316', text: '#ffffff' },
  EMAIL_FOLLOWUP: { bg: '#9ca3af', border: '#6b7280', text: '#ffffff' },
};

export function FullCalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  onEventResize,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [calendarTitle, setCalendarTitle] = useState('');
  const { 
    isMobile, 
    isTablet, 
    isSmallDesktop,
    isInCriticalZone,
    needsDropdownMenu,
    isCompact,
    isTouch,
    isPortrait,
    toolbarLayout,
    optimalCalendarView 
  } = useResponsive();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Component mounted state for client-side rendering
  useEffect(() => {
    setMounted(true);
    // Hide hint after 3 seconds
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Get responsive default view using enhanced responsive hook
  const getDefaultView = useCallback(() => {
    // Use the optimal view from responsive hook if mounted
    if (mounted && optimalCalendarView) {
      return optimalCalendarView;
    }
    // Fallback for SSR
    return 'dayGridMonth';
  }, [mounted, optimalCalendarView]);

  // Transform events to FullCalendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      const colors = eventTypeColors[event.type] || eventTypeColors.WORK;
      const start = event.start || event.startTime;
      const end = event.end || event.endTime;

      return {
        id: event.id,
        title: event.title,
        start: start ? new Date(start) : new Date(),
        end: end ? new Date(end) : undefined,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          ...event,
          type: event.type,
          location: event.location,
          description: event.description || event.notes,
          status: event.status,
          attendees: event.attendees,
        },
      };
    });
  }, [events]);

  // Handle calendar navigation
  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
    updateTitle(calendarApi);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
    updateTitle(calendarApi);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
    updateTitle(calendarApi);
  };

  const handleViewChange = useCallback((view: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.changeView(view);
    setCurrentView(view);
    updateTitle(calendarApi);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  const updateTitle = (calendarApi?: CalendarApi | null) => {
    if (calendarApi) {
      setCalendarTitle(calendarApi.view.title);
    }
  };

  // Handle date selection
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onSelectSlot) {
      onSelectSlot(selectInfo.start, selectInfo.end);
    }
  };

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps as ScheduleEvent;
    onSelectEvent({ ...event, id: clickInfo.event.id });
  };

  // Handle event drag
  const handleEventChange = (changeInfo: EventChangeArg) => {
    const event = changeInfo.event;
    const eventData = event.extendedProps as ScheduleEvent;
    
    if (changeInfo.oldEvent.start?.getTime() !== event.start?.getTime() ||
        changeInfo.oldEvent.end?.getTime() !== event.end?.getTime()) {
      if (onEventDrop && event.start) {
        onEventDrop(
          { ...eventData, id: event.id },
          event.start,
          event.end || event.start
        );
      }
    }
  };

  // Removed getCalendarHeight - using flexbox for dynamic sizing

  // Swipe gesture handlers for mobile navigation
  const handleViewCycle = useCallback((direction: 'up' | 'down') => {
    const views = ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek'];
    const currentIndex = views.indexOf(currentView);
    let newIndex;
    
    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : views.length - 1;
    } else {
      newIndex = currentIndex < views.length - 1 ? currentIndex + 1 : 0;
    }
    
    handleViewChange(views[newIndex]);
  }, [currentView, handleViewChange]);

  // Add swipe gestures for mobile
  const swipeHandlers = useCalendarSwipe(
    handlePrev,
    handleNext,
    isMobile ? handleViewCycle : undefined,
    {
      enabled: isTouch && !isTransitioning,
      preventScrollOnSwipe: true,
    }
  );

  // View options for calendar - renamed List to Agenda for clarity
  const viewOptions = useMemo(() => [
    { value: 'dayGridMonth', label: 'Month', shortLabel: 'Mo', icon: CalendarRange, tooltip: 'Month grid view' },
    { value: 'timeGridWeek', label: 'Week', shortLabel: 'Wk', icon: CalendarDays, tooltip: 'Week time grid' },
    { value: 'timeGridDay', label: 'Day', shortLabel: 'D', icon: Calendar, tooltip: 'Single day view' },
    { value: 'listWeek', label: 'Agenda', shortLabel: 'A', icon: List, tooltip: 'Weekly agenda list' },
  ], []);

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      updateTitle(calendarApi);
      // Set initial view based on device
      const defaultView = getDefaultView();
      if (defaultView !== currentView) {
        calendarApi.changeView(defaultView);
        setCurrentView(defaultView);
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full min-h-[400px] sm:min-h-[500px]">
      {/* Custom Toolbar */}
      <div className="mb-3 bg-white/5 rounded-lg border border-white/10 p-2 sm:p-3 flex-shrink-0">
        {/* Mobile Toolbar - Compact single-row layout */}
        {isMobile ? (
          <div className="flex items-center justify-between gap-1">
            {/* Left: Navigation */}
            <div className="flex items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrev}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleNext}
                className="h-7 w-7"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            {/* Center: Month/Year */}
            <h3 className="text-xs font-semibold text-white truncate flex-1 text-center px-2 min-w-0">
              {calendarTitle}
            </h3>
            
            {/* Right: Today and View */}
            <div className="flex items-center gap-0.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToday}
                className="h-7 text-xs px-1.5"
              >
                Today
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {viewOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleViewChange(option.value)}
                      className={cn(
                        "gap-2",
                        currentView === option.value && "bg-blue-600/20"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          /* Tablet and Desktop Toolbar */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToday}
                className="h-7 sm:h-8 text-xs sm:text-sm"
              >
                Today
              </Button>
              
              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePrev}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNext}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
              
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white ml-1 sm:ml-2 truncate">
                {calendarTitle}
              </h3>
            </div>
            
            {/* Smart responsive view selector - Correct logic: dropdown for smaller screens */}
            {(isTablet || isInCriticalZone || needsDropdownMenu || toolbarLayout === 'dropdown' || toolbarLayout === 'compact') ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 min-w-[120px] justify-between"
                  >
                    {viewOptions.find(o => o.value === currentView)?.icon && (
                      React.createElement(viewOptions.find(o => o.value === currentView)!.icon, {
                        className: "h-4 w-4"
                      })
                    )}
                    {viewOptions.find(o => o.value === currentView)?.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {viewOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleViewChange(option.value)}
                      className={cn(
                        "gap-2",
                        currentView === option.value && "bg-blue-600/20"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Full button layout - Only for large desktop screens (>1100px) */
              <div className="flex items-center gap-1 sm:gap-2">
                {viewOptions.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={currentView === option.value ? 'default' : 'ghost'}
                    onClick={() => handleViewChange(option.value)}
                    className={cn(
                      "h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3",
                      currentView === option.value
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <option.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FullCalendar Component with Swipe Support */}
      <div 
        {...swipeHandlers}
        className={cn(
          "flex-1 min-h-0 bg-gray-950 rounded-lg p-2 sm:p-3",
          "relative transition-opacity duration-300",
          isTransitioning && "opacity-70"
        )}
      >
        {/* Mobile interaction hints - fade out after 3 seconds */}
        {isMobile && isTouch && showHint && (
          <div className={cn(
            "absolute top-1 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none",
            "transition-opacity duration-500",
            !showHint && "opacity-0"
          )}>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5 text-[9px] text-white/60">
                <ChevronLeft className="h-2.5 w-2.5" />
                Swipe
                <ChevronRight className="h-2.5 w-2.5" />
              </div>
              <div className="bg-blue-600/80 rounded-full px-2 py-0.5 text-[9px] text-white animate-pulse">
                Hold date to add event
              </div>
            </div>
          </div>
        )}
        <div className="h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={getDefaultView()}
            headerToolbar={false} // We use our custom toolbar
            events={calendarEvents}
            editable={!isMobile} // Disable drag on mobile
            droppable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={isMobile ? 3 : true}
            eventDisplay="block"
            weekends={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventChange={handleEventChange}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            height="auto"
          // Mobile-specific options - balanced for swipe vs select
          eventLongPressDelay={300} // Reasonable delay for mobile
          selectLongPressDelay={500} // Hold 500ms to select, allows swipe navigation
          // Responsive options
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' },
              dayHeaderFormat: isMobile 
                ? { weekday: 'narrow' }
                : { weekday: 'short' },
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
              dayHeaderFormat: isMobile
                ? { weekday: 'short', month: 'numeric', day: 'numeric' }
                : { weekday: 'short', month: 'numeric', day: 'numeric' },
              slotMinTime: '06:00:00',
              slotMaxTime: '22:00:00',
            },
            timeGridDay: {
              titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
              slotMinTime: '06:00:00',
              slotMaxTime: '22:00:00',
            },
            listWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
              listDayFormat: { weekday: 'long', month: 'long', day: 'numeric' },
              listDaySideFormat: false,
              noEventsText: 'No events to display',
            },
          }}
          // Custom event rendering for mobile
          eventContent={(eventInfo) => {
            const isListView = eventInfo.view.type === 'listWeek';
            return (
              <div className={cn(
                'px-1.5 py-0.5 text-xs overflow-hidden',
                isListView && 'flex items-center gap-2'
              )}>
                <div className="font-medium truncate">{eventInfo.event.title}</div>
                {!isMobile && eventInfo.event.extendedProps.location && (
                  <div className="text-[10px] opacity-90 truncate">
                    {eventInfo.event.extendedProps.location}
                  </div>
                )}
              </div>
            );
          }}
            // Theming
            themeSystem="standard"
          />
        </div>
      </div>
    </div>
  );
}