'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface MobileCalendarViewProps {
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
  onAddEvent: (date: Date) => void;
}

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  WORK: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  MEETING: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  SITE_VISIT: { bg: 'bg-green-500/20', text: 'text-green-400' },
  CALL: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  EMAIL_FOLLOWUP: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

export function MobileCalendarView({ events, onSelectEvent, onAddEvent }: MobileCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.start || event.startTime || '');
      return isSameDay(eventDate, selectedDate);
    }).sort((a, b) => {
      const dateA = new Date(a.start || a.startTime || '');
      const dateB = new Date(b.start || b.startTime || '');
      return dateA.getTime() - dateB.getTime();
    });
  }, [events, selectedDate]);

  // Get events for the current month (for calendar dots)
  const monthEvents = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    return events.filter((event) => {
      const eventDate = new Date(event.start || event.startTime || '');
      return eventDate >= start && eventDate <= end;
    });
  }, [events, selectedDate]);

  // Get dates with events for calendar highlighting
  const datesWithEvents = useMemo(() => {
    const dates = new Set<string>();
    monthEvents.forEach((event) => {
      const eventDate = new Date(event.start || event.startTime || '');
      dates.add(format(eventDate, 'yyyy-MM-dd'));
    });
    return dates;
  }, [monthEvents]);

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  return (
    <div className="space-y-4">
      {/* Mobile Header with Date Navigation */}
      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousDay}
          className="p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <button
          onClick={() => setViewMode(viewMode === 'calendar' ? 'agenda' : 'calendar')}
          className="flex flex-col items-center px-4 py-1"
        >
          <span className="text-lg font-bold text-white">
            {format(selectedDate, 'EEEE')}
          </span>
          <span className="text-sm text-white/60">
            {format(selectedDate, 'MMM d, yyyy')}
          </span>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextDay}
          className="p-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar or Agenda View */}
      {viewMode === 'calendar' ? (
        <Card className="bg-white/5 border-white/10 p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md"
            modifiers={{
              hasEvents: (date) => datesWithEvents.has(format(date, 'yyyy-MM-dd'))
            }}
            modifiersStyles={{
              hasEvents: { 
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: '#3b82f6',
                textUnderlineOffset: '2px'
              }
            }}
          />
        </Card>
      ) : (
        <Card className="bg-white/5 border-white/10">
          <ScrollArea className="h-[300px] p-4">
            <div className="space-y-2">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayEvents = events.filter((event) => {
                  const eventDate = new Date(event.start || event.startTime || '');
                  return isSameDay(eventDate, date);
                });

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      isSameDay(date, selectedDate)
                        ? 'bg-blue-500/20 border border-blue-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">
                          {format(date, 'EEEE')}
                        </p>
                        <p className="text-xs text-white/60">
                          {format(date, 'MMM d')}
                        </p>
                      </div>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Events for Selected Date */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/60">
            {selectedDateEvents.length === 0
              ? 'No events'
              : `${selectedDateEvents.length} event${selectedDateEvents.length > 1 ? 's' : ''}`}
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddEvent(selectedDate)}
            className="text-blue-400 hover:text-blue-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {selectedDateEvents.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-8 text-center">
            <CalendarIcon className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm">No events scheduled</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddEvent(selectedDate)}
              className="mt-4"
            >
              Add Event
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {selectedDateEvents.map((event) => {
              const colors = eventTypeColors[event.type] || eventTypeColors.WORK;
              const isExpanded = expandedEvent === event.id;
              const eventStart = new Date(event.start || event.startTime || '');
              const eventEnd = event.end || event.endTime ? new Date(event.end || event.endTime || '') : null;

              return (
                <Card
                  key={event.id}
                  className="bg-white/5 border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => toggleEventExpansion(event.id)}
                    className="w-full text-left p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn('w-1 h-4 rounded-full', colors.bg)} />
                          <h4 className="font-medium text-white truncate">
                            {event.title}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-white/60">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(eventStart, 'h:mm a')}
                            {eventEnd && ` - ${format(eventEnd, 'h:mm a')}`}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs', colors.text, colors.bg)}
                        >
                          {event.type.replace('_', ' ')}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-white/40" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/40" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                      {event.description && (
                        <p className="text-sm text-white/80">{event.description}</p>
                      )}
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Users className="h-3 w-3" />
                          <span>{event.attendees.join(', ')}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-400 hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}