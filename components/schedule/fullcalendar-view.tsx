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
  Plus,
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
  const { isMobile, isTablet, isSmallDesktop, isCompact } = useResponsive();
  const [isTouch, setIsTouch] = useState(false);

  // Detect touch capability
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Get responsive default view
  const getDefaultView = useCallback(() => {
    const width = window.innerWidth;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (width < 480) return 'dayGridMonth'; // Show month view on small mobile
    if (width < 768) return isPortrait ? 'dayGridMonth' : 'timeGridWeek';
    if (width < 1024) return 'timeGridWeek';
    return 'dayGridMonth';
  }, []);

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
  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
    updateTitle(calendarApi);
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
    updateTitle(calendarApi);
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
    updateTitle(calendarApi);
  };

  const handleViewChange = (view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.changeView(view);
    setCurrentView(view);
    updateTitle(calendarApi);
  };

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

  // Get calendar height based on device
  const getCalendarHeight = () => {
    if (isMobile) return 'calc(100vh - 400px)';
    if (isTablet) return 'calc(100vh - 350px)';
    return 'calc(100vh - 300px)';
  };

  // View options for different devices
  const viewOptions = isMobile ? [
    { value: 'dayGridMonth', label: 'Month', icon: CalendarRange },
    { value: 'timeGridWeek', label: 'Week', icon: CalendarDays },
    { value: 'timeGridDay', label: 'Day', icon: Calendar },
    { value: 'listWeek', label: 'List', icon: List },
  ] : [
    { value: 'dayGridMonth', label: 'Month', icon: CalendarRange },
    { value: 'timeGridWeek', label: 'Week', icon: CalendarDays },
    { value: 'timeGridDay', label: 'Day', icon: Calendar },
    { value: 'listWeek', label: 'List', icon: List },
  ];

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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Custom Toolbar */}
      <div className="mb-3 bg-white/5 rounded-lg border border-white/10 p-2 sm:p-3">
        {/* Mobile Toolbar */}
        {isMobile ? (
          <div className="space-y-2">
            {/* Top Row: Title and Today */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white truncate pr-2">{calendarTitle}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToday}
                className="h-7 text-[11px] px-2 shrink-0"
              >
                Today
              </Button>
            </div>
            
            {/* Bottom Row: Navigation and View */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
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
              
              <Select value={currentView} onValueChange={handleViewChange}>
                <SelectTrigger className="w-20 h-7 bg-white/10 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-1.5">
                        <option.icon className="h-3 w-3" />
                        <span className="text-[11px]">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          /* Desktop/Tablet Toolbar */
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
            
            {/* Use dropdown menu for small desktop screens (1024-1280px) */}
            {isSmallDesktop ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
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

      {/* FullCalendar Component */}
      <div 
        className="flex-1 bg-gray-950 rounded-lg p-2 sm:p-3 overflow-hidden"
        style={{ height: getCalendarHeight(), maxHeight: getCalendarHeight() }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={getDefaultView()}
          headerToolbar={false} // We use our custom toolbar
          events={calendarEvents}
          editable={!isMobile || !isTouch} // Disable drag on mobile touch
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={isMobile ? 2 : true}
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
          height="100%"
          contentHeight="auto"
          // Mobile-specific options
          eventLongPressDelay={500} // Long press for mobile
          selectLongPressDelay={500}
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
  );
}