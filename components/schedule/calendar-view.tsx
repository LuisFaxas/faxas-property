'use client';

import { useMemo, useCallback } from 'react';
import {
  Calendar,
  momentLocalizer,
  Views,
  View,
  SlotInfo,
  Event as CalendarEvent,
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';

const localizer = momentLocalizer(moment);

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
}

interface CalendarViewProps {
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
  onSelectSlot?: (slotInfo: SlotInfo) => void;
  onEventDrop?: (args: {
    event: ScheduleEvent;
    start: Date;
    end: Date;
  }) => void;
  view?: View;
  onViewChange?: (view: View) => void;
  date?: Date;
  onNavigate?: (date: Date) => void;
}

// Event type colors matching the app's badge variants
const eventTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  WORK: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#93bbfc' },
  MEETING: { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7', text: '#c4a1f9' },
  SITE_VISIT: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e', text: '#86efac' },
  CALL: { bg: 'rgba(251, 146, 60, 0.2)', border: '#fb923c', text: '#fed7aa' },
  EMAIL_FOLLOWUP: { bg: 'rgba(156, 163, 175, 0.2)', border: '#9ca3af', text: '#d1d5db' },
};

// Custom event component
const CustomEvent = ({ event }: { event: any }) => {
  const colors = eventTypeColors[event.type] || eventTypeColors.WORK;
  const isCompleted = event.status === 'DONE';
  const isCanceled = event.status === 'CANCELED';
  
  return (
    <div
      className={cn(
        'h-full px-1 text-xs',
        isCompleted && 'opacity-60',
        isCanceled && 'line-through opacity-40'
      )}
      style={{
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      <div className="font-semibold truncate">{event.title}</div>
      {event.location && (
        <div className="text-[10px] opacity-80 truncate">{event.location}</div>
      )}
    </div>
  );
};

// Custom toolbar component - Mobile optimized
const CustomToolbar = (toolbar: any) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToToday = () => toolbar.onNavigate('TODAY');

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-white text-sm sm:text-lg font-semibold">
        {date.format('MMMM YYYY')}
      </span>
    );
  };

  // Mobile view icons
  const viewIcons: Record<string, JSX.Element> = {
    month: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    week: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2v20M10 2v20M14 2v20M18 2v20" />
      </svg>
    ),
    day: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    agenda: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  };

  return (
    <div className="mb-4 p-2 sm:p-4 bg-white/5 rounded-lg border border-white/10">
      {/* Mobile Layout - Stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Navigation Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToBack}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {label()}
            <button
              onClick={goToNext}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
          >
            Today
          </button>
        </div>
        {/* View Selection Row - Icon only on mobile */}
        <div className="flex items-center justify-center gap-1">
          {Object.values(Views).map((view) => (
            <button
              key={view}
              onClick={() => toolbar.onView(view)}
              className={cn(
                'p-2 rounded-md transition-colors',
                toolbar.view === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              )}
              title={view}
            >
              {viewIcons[view]}
            </button>
          ))}
        </div>
      </div>

      {/* Tablet/Desktop Layout - Original */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToBack}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {label()}
        </div>
        <div className="flex items-center gap-2">
          {Object.values(Views).map((view) => (
            <button
              key={view}
              onClick={() => toolbar.onView(view)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors capitalize',
                toolbar.view === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export function CalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  view = Views.MONTH,
  onViewChange,
  date = new Date(),
  onNavigate,
}: CalendarViewProps) {
  // Transform events to calendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      const startDate = event.start || event.startTime;
      const endDate = event.end || event.endTime;
      
      return {
        ...event,
        start: startDate ? new Date(startDate) : new Date(),
        end: endDate ? new Date(endDate) : (startDate ? new Date(startDate) : new Date()),
        resource: event,
      };
    });
  }, [events]);

  // Custom event style
  const eventStyleGetter = useCallback((event: any) => {
    const colors = eventTypeColors[event.type] || eventTypeColors.WORK;
    return {
      style: {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        borderRadius: '4px',
        border: `1px solid ${colors.border}`,
      },
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback(
    (event: any) => {
      onSelectEvent(event.resource || event);
    },
    [onSelectEvent]
  );

  // Handle drag and drop
  const handleEventDrop = useCallback(
    ({ event, start, end }: any) => {
      if (onEventDrop) {
        onEventDrop({
          event: event.resource || event,
          start,
          end,
        });
      }
    },
    [onEventDrop]
  );

  return (
    <div className="h-[400px] sm:h-[500px] lg:h-[700px] bg-gray-950 rounded-lg p-2 sm:p-4">
      <style jsx global>{`
        .rbc-calendar {
          background: transparent;
          color: white;
        }
        .rbc-toolbar button {
          color: white;
        }
        .rbc-toolbar button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .rbc-toolbar button.rbc-active {
          background-color: #3b82f6;
        }
        .rbc-month-view {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-day-bg {
          background: rgba(255, 255, 255, 0.02);
        }
        .rbc-off-range-bg {
          background: rgba(0, 0, 0, 0.3);
        }
        .rbc-today {
          background-color: rgba(59, 130, 246, 0.1);
        }
        .rbc-header {
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px;
          font-weight: 600;
        }
        .rbc-header + .rbc-header {
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-date-cell {
          padding: 4px;
          color: rgba(255, 255, 255, 0.7);
        }
        .rbc-now > button {
          color: #3b82f6;
          font-weight: bold;
        }
        .rbc-event {
          background-color: transparent !important;
          border: none !important;
        }
        .rbc-event-content {
          font-size: 11px;
        }
        .rbc-time-view {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-time-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-time-content {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-time-gutter {
          color: rgba(255, 255, 255, 0.5);
        }
        .rbc-allday-cell {
          background: rgba(255, 255, 255, 0.02);
        }
        .rbc-time-slot {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .rbc-current-time-indicator {
          background-color: #ef4444;
        }
        .rbc-agenda-view {
          color: white;
        }
        .rbc-agenda-view table {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-agenda-view td {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px;
        }
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        view={view}
        onView={onViewChange}
        date={date}
        onNavigate={onNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={onSelectSlot}
        onEventDrop={onEventDrop ? handleEventDrop : undefined}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent,
        }}
        draggableAccessor={() => true}
        selectable
        popup
        style={{ height: '100%' }}
      />
    </div>
  );
}