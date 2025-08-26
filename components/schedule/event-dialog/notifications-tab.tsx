'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, Clock, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { EventFormData } from './index';

const REMINDER_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];

export function NotificationsTab() {
  const { watch, setValue, register } = useFormContext<EventFormData>();
  const sendReminders = watch('sendReminders');
  const sendInvites = watch('sendInvites');
  const reminderMinutes = watch('reminderMinutes');
  const attendees = watch('attendees') || [];

  return (
    <div className="space-y-6">
      {/* Email Invitations */}
      <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-500" />
            <Label htmlFor="sendInvites" className="text-base font-medium">
              Send Email Invitations
            </Label>
          </div>
          <Switch
            id="sendInvites"
            checked={sendInvites}
            onCheckedChange={(checked) => setValue('sendInvites', checked)}
            disabled={attendees.length === 0}
          />
        </div>

        {attendees.length === 0 && (
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              Add attendees in the Attendees tab to enable email invitations
            </AlertDescription>
          </Alert>
        )}

        {sendInvites && attendees.length > 0 && (
          <div className="space-y-3 pl-7">
            <p className="text-sm text-white/60">
              Email invitations will be sent to {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} when the event is created.
            </p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-white/40" />
              <span className="text-sm text-white/40">
                Invitations include event details and calendar attachment
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reminders */}
      <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <Label htmlFor="sendReminders" className="text-base font-medium">
              Event Reminders
            </Label>
          </div>
          <Switch
            id="sendReminders"
            checked={sendReminders}
            onCheckedChange={(checked) => setValue('sendReminders', checked)}
          />
        </div>

        {sendReminders && (
          <div className="space-y-4 pl-7">
            <div className="space-y-2">
              <Label htmlFor="reminderMinutes" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Remind Me
              </Label>
              <Select
                value={reminderMinutes?.toString()}
                onValueChange={(value) => setValue('reminderMinutes', parseInt(value))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-white/60">
                You'll receive a reminder notification before the event starts.
              </p>
              {attendees.length > 0 && (
                <p className="text-sm text-white/40">
                  Attendees will also receive reminders if they have email invitations enabled.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings Info */}
      <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-600/30">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-blue-300 font-medium">
              Notification Preferences
            </p>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• In-app notifications are always enabled for scheduled events</li>
              <li>• Email reminders require valid email addresses for attendees</li>
              <li>• Calendar invitations will be sent as .ics attachments</li>
              <li>• Recurring events will have reminders for each occurrence</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}