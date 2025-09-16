'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface EventFormData {
  title: string;
  type: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: string;
  attendees: string;
  requestedBy: string;
  approvedBy: string;
}

interface EventFormProps {
  formData: EventFormData;
  onChange: (data: EventFormData) => void;
}

export function EventForm({ formData, onChange }: EventFormProps) {
  const updateField = (field: keyof EventFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Event Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="e.g., Site Inspection"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Event Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => updateField('type', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CALL">Call</SelectItem>
              <SelectItem value="MEETING">Meeting</SelectItem>
              <SelectItem value="SITE_VISIT">Site Visit</SelectItem>
              <SelectItem value="WORK">Work</SelectItem>
              <SelectItem value="EMAIL_FOLLOWUP">Email Followup</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="bg-white/5 border-white/10"
          placeholder="Event details..."
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) => updateField('startTime', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) => updateField('endTime', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="bg-white/5 border-white/10"
            placeholder="e.g., Main Site"
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField('status', value)}
          >
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending Approval</SelectItem>
              <SelectItem value="REQUESTED">Requested</SelectItem>
              <SelectItem value="PLANNED">Planned</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="CANCELED">Canceled</SelectItem>
              <SelectItem value="RESCHEDULE_NEEDED">Reschedule Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attendees (comma-separated)</Label>
        <Input
          value={formData.attendees}
          onChange={(e) => updateField('attendees', e.target.value)}
          className="bg-white/5 border-white/10 text-white"
          placeholder="John Doe, Jane Smith"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Requested By</Label>
          <Input
            value={formData.requestedBy}
            onChange={(e) => updateField('requestedBy', e.target.value)}
            className="bg-white/5 border-white/10"
            placeholder="Name"
          />
        </div>
        <div className="space-y-2">
          <Label>Approved By</Label>
          <Input
            value={formData.approvedBy}
            onChange={(e) => updateField('approvedBy', e.target.value)}
            className="bg-white/5 border-white/10"
            placeholder="Name"
          />
        </div>
      </div>
    </div>
  );
}