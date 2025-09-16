'use client';

import { MobileCard } from '@/components/ui/mobile';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, CheckCircle, Edit, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: any;
  onEdit?: (event: any) => void;
  onComplete?: (event: any) => void;
  onDelete?: (event: any) => void;
  onTap?: (event: any) => void;
}

const eventTypeColors: Record<string, string> = {
  WORK: 'bg-blue-600',
  MEETING: 'bg-purple-600',
  SITE_VISIT: 'bg-green-600',
  CALL: 'bg-orange-600',
  EMAIL_FOLLOWUP: 'bg-gray-600',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  REQUESTED: 'bg-blue-500/20 text-blue-400',
  PLANNED: 'bg-green-500/20 text-green-400',
  DONE: 'bg-gray-500/20 text-gray-400',
  CANCELED: 'bg-red-500/20 text-red-400',
  RESCHEDULE_NEEDED: 'bg-orange-500/20 text-orange-400',
};

export function EventCard({
  event,
  onEdit,
  onComplete,
  onDelete,
  onTap,
}: EventCardProps) {
  const startDate = event.start || event.startTime ? new Date(event.start || event.startTime) : null;
  const endDate = event.end || event.endTime ? new Date(event.end || event.endTime) : null;
  
  return (
    <MobileCard
      onTap={() => onTap?.(event)}
      leftSwipeAction={
        event.status !== 'DONE' && onComplete
          ? {
              id: 'complete',
              label: 'Complete',
              color: 'green' as const,
              icon: CheckCircle,
              action: () => onComplete(event),
            }
          : undefined
      }
      rightSwipeAction={
        onEdit
          ? {
              id: 'edit',
              label: 'Edit',
              color: 'blue' as const,
              icon: Edit,
              action: () => onEdit(event),
            }
          : undefined
      }
      isDimmed={event.status === 'DONE' || event.status === 'CANCELED'}
      className="relative"
    >
      {/* Event Type Indicator */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
          eventTypeColors[event.type] || 'bg-gray-600'
        )}
      />
      
      <div className="pl-4 pr-3 py-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-white/60 line-clamp-1 mt-0.5">
                {event.description}
              </p>
            )}
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "flex-shrink-0 text-xs",
              statusColors[event.status]
            )}
          >
            {event.status?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-3 text-xs text-white/60">
          {startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(startDate, 'MMM d')}</span>
            </div>
          )}
          {startDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(startDate, 'h:mm a')}
                {endDate && ` - ${format(endDate, 'h:mm a')}`}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{event.location}</span>
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{event.attendees.length}</span>
            </div>
          )}
        </div>

        {/* Event Type Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className="text-xs border-white/20"
          >
            {event.type?.replace('_', ' ')}
          </Badge>
          {event.isRecurring && (
            <Badge variant="outline" className="text-xs border-white/20">
              Recurring
            </Badge>
          )}
        </div>
      </div>
    </MobileCard>
  );
}