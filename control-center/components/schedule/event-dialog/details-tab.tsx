'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, MapPin, FileText, Tag } from 'lucide-react';
import type { EventFormData } from './index';

const EVENT_TYPES = [
  { value: 'WORK', label: 'Work', color: 'bg-blue-600' },
  { value: 'MEETING', label: 'Meeting', color: 'bg-purple-600' },
  { value: 'SITE_VISIT', label: 'Site Visit', color: 'bg-green-600' },
  { value: 'CALL', label: 'Call', color: 'bg-orange-600' },
  { value: 'EMAIL_FOLLOWUP', label: 'Email Follow-up', color: 'bg-gray-600' },
];

const EVENT_STATUSES = [
  { value: 'PENDING', label: 'Pending Approval' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'DONE', label: 'Completed' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'RESCHEDULE_NEEDED', label: 'Reschedule Needed' },
];

export function DetailsTab() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<EventFormData>();
  const isAllDay = watch('isAllDay');

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Event Title *
        </Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="e.g., Weekly Team Meeting"
          className="bg-white/5 border-white/10"
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Type and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Event Type *
          </Label>
          <Select
            value={watch('type')}
            onValueChange={(value: any) => setValue('type', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch('status')}
            onValueChange={(value: any) => setValue('status', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* All Day Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="isAllDay" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          All Day Event
        </Label>
        <Switch
          id="isAllDay"
          checked={isAllDay}
          onCheckedChange={(checked) => setValue('isAllDay', checked)}
        />
      </div>

      {/* Date and Time */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date *
            </Label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate')}
              className="bg-white/5 border-white/10"
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          {!isAllDay && (
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
                className="bg-white/5 border-white/10"
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate')}
              className="bg-white/5 border-white/10"
            />
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate.message}</p>
            )}
          </div>

          {!isAllDay && (
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                className="bg-white/5 border-white/10"
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>
        <Input
          id="location"
          {...register('location')}
          placeholder="e.g., Conference Room A, Site Address"
          className="bg-white/5 border-white/10"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Add event details, agenda, or instructions..."
          className="bg-white/5 border-white/10 min-h-[100px]"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Private notes (not visible to attendees)..."
          className="bg-white/5 border-white/10 min-h-[80px]"
        />
      </div>
    </div>
  );
}