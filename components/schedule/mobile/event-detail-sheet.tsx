'use client';

import { MobileDetailSheet, type DetailSection, type DetailAction } from '@/components/ui/mobile';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, User, FileText, Edit, Trash, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailSheetProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: any) => void;
  onDelete?: (event: any) => void;
  onComplete?: (event: any) => void;
  onCancel?: (event: any) => void;
}

export function EventDetailSheet({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
}: EventDetailSheetProps) {
  if (!event) return null;

  const startDate = event.start || event.startTime ? new Date(event.start || event.startTime) : null;
  const endDate = event.end || event.endTime ? new Date(event.end || event.endTime) : null;

  const sections: DetailSection[] = [
    {
      id: 'description',
      icon: FileText,
      label: 'Description',
      value: event.description || 'No description provided',
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: 'Schedule',
      value: (
        <div className="space-y-2">
          {startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
          )}
          {startDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/60" />
              <span>
                {format(startDate, 'h:mm a')}
                {endDate && ` - ${format(endDate, 'h:mm a')}`}
              </span>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (event.location) {
    sections.push({
      id: 'location',
      icon: MapPin,
      label: 'Location',
      value: event.location,
    });
  }

  if (event.attendees && event.attendees.length > 0) {
    sections.push({
      id: 'attendees',
      icon: Users,
      label: 'Attendees',
      value: (
        <div className="space-y-1">
          {event.attendees.map((attendee: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <User className="h-3 w-3 text-white/40" />
              <span className="text-sm">{attendee}</span>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (event.requestedBy) {
    sections.push({
      id: 'requestedBy',
      icon: User,
      label: 'Requested By',
      value: event.requestedBy,
    });
  }

  if (event.approvedBy) {
    sections.push({
      id: 'approvedBy',
      icon: User,
      label: 'Approved By',
      value: event.approvedBy,
    });
  }

  if (event.notes) {
    sections.push({
      id: 'notes',
      icon: FileText,
      label: 'Notes',
      value: event.notes,
    });
  }

  const actions: DetailAction[] = [];

  if (event.status !== 'DONE' && event.status !== 'CANCELED') {
    if (onComplete) {
      actions.push({
        id: 'complete',
        label: 'Mark Complete',
        icon: CheckCircle,
        variant: 'default',
        className: 'bg-green-600 hover:bg-green-700',
        onClick: () => {
          onComplete(event);
          onClose();
        },
      });
    }

    if (onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit Event',
        icon: Edit,
        variant: 'outline',
        onClick: () => {
          onEdit(event);
          onClose();
        },
      });
    }

    if (onCancel) {
      actions.push({
        id: 'cancel',
        label: 'Cancel Event',
        icon: XCircle,
        variant: 'outline',
        className: 'text-orange-400 border-orange-400/50 hover:bg-orange-400/10',
        onClick: () => {
          onCancel(event);
          onClose();
        },
      });
    }
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete Event',
      icon: Trash,
      variant: 'destructive',
      onClick: () => {
        onDelete(event);
        onClose();
      },
    });
  }

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
    <MobileDetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle={event.type?.replace('_', ' ')}
      statusBadge={{
        label: event.status?.replace('_', ' '),
        className: statusColors[event.status],
      }}
      headerIcon={{
        icon: Calendar,
        className: eventTypeColors[event.type],
      }}
      sections={sections}
      actions={actions}
    />
  );
}