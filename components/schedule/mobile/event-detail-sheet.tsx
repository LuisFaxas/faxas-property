'use client';

import { AppSheet } from '@/components/ui/app-sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, User, FileText, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventDetailSheetProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: any) => void;
  onDelete?: (event: any) => void;
}

export function EventDetailSheet({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: EventDetailSheetProps) {
  if (!event) return null;

  const startDate = event.start || event.startTime ? new Date(event.start || event.startTime) : null;
  const endDate = event.end || event.endTime ? new Date(event.end || event.endTime) : null;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    REQUESTED: 'bg-blue-500/20 text-blue-400',
    PLANNED: 'bg-green-500/20 text-green-400',
    DONE: 'bg-gray-500/20 text-gray-400',
    CANCELED: 'bg-red-500/20 text-red-400',
    RESCHEDULE_NEEDED: 'bg-orange-500/20 text-orange-400',
  };

  const eventTypeColors: Record<string, string> = {
    WORK: 'bg-blue-600',
    MEETING: 'bg-purple-600',
    SITE_VISIT: 'bg-green-600',
    CALL: 'bg-orange-600',
    EMAIL_FOLLOWUP: 'bg-gray-600',
  };

  return (
    <AppSheet
      open={isOpen}
      onOpenChange={onClose}
      mode="detail"
      fit="content"
      title={event.title}
      description={event.type?.replace('_', ' ')}
      footer={
        <div className="flex gap-2">
          {onEdit && (
            <Button
              onClick={() => {
                onEdit(event);
                onClose();
              }}
              variant="outline"
              className="flex-1 h-12 bg-blue-600/20 border-blue-600/30 text-blue-400 hover:bg-blue-600/30"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => {
                onDelete(event);
                onClose();
              }}
              variant="outline"
              className="flex-1 h-12 bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/30"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', eventTypeColors[event.type])}>
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <Badge className={cn('text-sm', statusColors[event.status])}>
            {event.status?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Description */}
        {event.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/60">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Description</span>
            </div>
            <p className="text-white/80">{event.description}</p>
          </div>
        )}

        {/* Schedule */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/60">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Schedule</span>
          </div>
          {startDate && (
            <div className="space-y-1">
              <p className="text-white/80">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="h-4 w-4" />
                <span>
                  {format(startDate, 'h:mm a')}
                  {endDate && ` - ${format(endDate, 'h:mm a')}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/60">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-white/80">{event.location}</p>
          </div>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/60">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Attendees ({event.attendees.length})</span>
            </div>
            <div className="space-y-1">
              {event.attendees.map((attendee: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-white/60">
                  <User className="h-3 w-3" />
                  <span className="text-sm">{attendee}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/60">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <p className="text-white/80 text-sm">{event.notes}</p>
          </div>
        )}
      </div>
    </AppSheet>
  );
}