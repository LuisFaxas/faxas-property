'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { DetailsTab } from './details-tab';
import { AttendeesTab } from './attendees-tab';
import { RecurrenceTab } from './recurrence-tab';
import { NotificationsTab } from './notifications-tab';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Event validation schema
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['CALL', 'MEETING', 'SITE_VISIT', 'WORK', 'EMAIL_FOLLOWUP']),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.string().min(1, 'End date is required'),
  endTime: z.string().min(1, 'End time is required'),
  isAllDay: z.boolean(),
  timezone: z.string(),
  status: z.enum(['PENDING', 'REQUESTED', 'PLANNED', 'DONE', 'CANCELED', 'RESCHEDULE_NEEDED']),
  attendees: z.array(z.string()),
  notes: z.string().optional(),
  // Recurrence fields
  isRecurring: z.boolean(),
  recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']).optional(),
  recurrenceInterval: z.number().min(1),
  recurrenceDaysOfWeek: z.array(z.number()).optional(),
  recurrenceEndDate: z.string().optional(),
  recurrenceOccurrences: z.number().optional(),
  // Notification fields
  sendReminders: z.boolean(),
  reminderMinutes: z.number(),
  sendInvites: z.boolean(),
});

export type EventFormData = z.infer<typeof eventSchema>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any; // Existing event for editing
  projectId: string;
  onSave: (data: EventFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  projectId,
  onSave,
  isSubmitting = false,
}: EventDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  
  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      type: 'MEETING',
      description: '',
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: new Date().toISOString().split('T')[0],
      endTime: '10:00',
      isAllDay: false,
      timezone: 'America/New_York',
      status: 'PLANNED',
      attendees: [],
      notes: '',
      isRecurring: false,
      recurrenceInterval: 1,
      sendReminders: true,
      reminderMinutes: 15,
      sendInvites: false,
    },
  });

  // Load event data when editing
  useEffect(() => {
    if (event) {
      // Parse event data and set form values
      const startDate = event.start ? new Date(event.start) : new Date();
      const endDate = event.end ? new Date(event.end) : new Date();
      
      methods.reset({
        title: event.title || '',
        type: event.type || 'MEETING',
        description: event.description || '',
        location: event.location || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        isAllDay: event.isAllDay || false,
        timezone: event.timezone || 'America/New_York',
        status: event.status || 'PLANNED',
        attendees: event.attendees || [],
        notes: event.notes || '',
        isRecurring: !!event.recurringEventId,
        sendReminders: true,
        reminderMinutes: 15,
        sendInvites: false,
      });
    } else {
      methods.reset();
    }
  }, [event, methods]);

  const handleSubmit = async (data: EventFormData) => {
    try {
      await onSave(data);
      onOpenChange(false);
      methods.reset();
      setActiveTab('details');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    methods.reset();
    setActiveTab('details');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {event 
              ? 'Update the event details below'
              : 'Fill in the details to create a new calendar event'}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="attendees">Attendees</TabsTrigger>
                <TabsTrigger value="recurrence">Recurrence</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-1">
                <TabsContent value="details" className="mt-4">
                  <DetailsTab />
                </TabsContent>

                <TabsContent value="attendees" className="mt-4">
                  <AttendeesTab projectId={projectId} />
                </TabsContent>

                <TabsContent value="recurrence" className="mt-4">
                  <RecurrenceTab />
                </TabsContent>

                <TabsContent value="notifications" className="mt-4">
                  <NotificationsTab />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  event ? 'Update Event' : 'Create Event'
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}