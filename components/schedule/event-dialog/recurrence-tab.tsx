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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Repeat, Calendar, Hash, CalendarDays } from 'lucide-react';
import type { EventFormData } from './index';

const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function RecurrenceTab() {
  const { watch, setValue, register } = useFormContext<EventFormData>();
  const isRecurring = watch('isRecurring');
  const recurrenceType = watch('recurrenceType');
  const recurrenceDaysOfWeek = watch('recurrenceDaysOfWeek') || [];
  const recurrenceInterval = watch('recurrenceInterval');

  const toggleWeekday = (day: number) => {
    const current = recurrenceDaysOfWeek || [];
    if (current.includes(day)) {
      setValue('recurrenceDaysOfWeek', current.filter(d => d !== day));
    } else {
      setValue('recurrenceDaysOfWeek', [...current, day].sort());
    }
  };

  const handleEndTypeChange = (type: 'never' | 'date' | 'occurrences') => {
    if (type === 'never') {
      setValue('recurrenceEndDate', undefined);
      setValue('recurrenceOccurrences', undefined);
    } else if (type === 'date') {
      setValue('recurrenceOccurrences', undefined);
    } else {
      setValue('recurrenceEndDate', undefined);
    }
  };

  const getEndType = (): 'never' | 'date' | 'occurrences' => {
    if (watch('recurrenceEndDate')) return 'date';
    if (watch('recurrenceOccurrences')) return 'occurrences';
    return 'never';
  };

  return (
    <div className="space-y-6">
      {/* Enable Recurrence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-blue-500" />
          <Label htmlFor="isRecurring" className="text-base font-medium">
            Recurring Event
          </Label>
        </div>
        <Switch
          id="isRecurring"
          checked={isRecurring}
          onCheckedChange={(checked) => setValue('isRecurring', checked)}
        />
      </div>

      {isRecurring && (
        <>
          {/* Recurrence Pattern */}
          <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="space-y-2">
              <Label htmlFor="recurrenceType" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Repeat Pattern
              </Label>
              <Select
                value={recurrenceType}
                onValueChange={(value: any) => setValue('recurrenceType', value)}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select recurrence pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval */}
            <div className="space-y-2">
              <Label htmlFor="recurrenceInterval" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Repeat Every
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="recurrenceInterval"
                  type="number"
                  min="1"
                  max="99"
                  value={recurrenceInterval}
                  onChange={(e) => setValue('recurrenceInterval', parseInt(e.target.value) || 1)}
                  className="w-20 bg-white/5 border-white/10"
                />
                <span className="text-white/60">
                  {recurrenceType === 'DAILY' && (recurrenceInterval === 1 ? 'day' : 'days')}
                  {recurrenceType === 'WEEKLY' && (recurrenceInterval === 1 ? 'week' : 'weeks')}
                  {recurrenceType === 'MONTHLY' && (recurrenceInterval === 1 ? 'month' : 'months')}
                  {recurrenceType === 'YEARLY' && (recurrenceInterval === 1 ? 'year' : 'years')}
                  {!recurrenceType && 'interval'}
                </span>
              </div>
            </div>

            {/* Weekly specific: Days of week */}
            {recurrenceType === 'WEEKLY' && (
              <div className="space-y-2">
                <Label>Repeat On</Label>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day.value} className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        className={`w-full py-2 px-1 text-xs rounded-md transition-colors ${
                          recurrenceDaysOfWeek.includes(day.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {day.short}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly specific options */}
            {recurrenceType === 'MONTHLY' && (
              <div className="space-y-2">
                <Label>Monthly Pattern</Label>
                <RadioGroup defaultValue="dayOfMonth">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dayOfMonth" id="dayOfMonth" />
                    <Label htmlFor="dayOfMonth" className="font-normal">
                      Same day of the month (e.g., 15th)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekday" id="weekday" />
                    <Label htmlFor="weekday" className="font-normal">
                      Same weekday (e.g., 3rd Tuesday)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Recurrence End */}
          <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              End Recurrence
            </Label>
            
            <RadioGroup value={getEndType()} onValueChange={handleEndTypeChange}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never" className="font-normal">
                    Never
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date" id="endDate" />
                  <Label htmlFor="endDate" className="font-normal flex-1">
                    <div className="flex items-center gap-2">
                      <span>On date:</span>
                      <Input
                        type="date"
                        {...register('recurrenceEndDate')}
                        disabled={getEndType() !== 'date'}
                        className="bg-white/5 border-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndTypeChange('date');
                        }}
                      />
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="occurrences" id="occurrences" />
                  <Label htmlFor="occurrences" className="font-normal flex-1">
                    <div className="flex items-center gap-2">
                      <span>After:</span>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={watch('recurrenceOccurrences') || ''}
                        onChange={(e) => setValue('recurrenceOccurrences', parseInt(e.target.value) || undefined)}
                        disabled={getEndType() !== 'occurrences'}
                        className="w-20 bg-white/5 border-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndTypeChange('occurrences');
                        }}
                      />
                      <span>occurrences</span>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Recurrence Summary */}
          <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-600/30">
            <p className="text-sm text-blue-400">
              <strong>Summary:</strong> Event will repeat{' '}
              {recurrenceType === 'DAILY' && `every ${recurrenceInterval} day${recurrenceInterval > 1 ? 's' : ''}`}
              {recurrenceType === 'WEEKLY' && (
                <>
                  every {recurrenceInterval} week{recurrenceInterval > 1 ? 's' : ''}
                  {recurrenceDaysOfWeek.length > 0 && (
                    <> on {recurrenceDaysOfWeek.map(d => WEEKDAYS.find(w => w.value === d)?.short).join(', ')}</>
                  )}
                </>
              )}
              {recurrenceType === 'MONTHLY' && `every ${recurrenceInterval} month${recurrenceInterval > 1 ? 's' : ''}`}
              {recurrenceType === 'YEARLY' && `every ${recurrenceInterval} year${recurrenceInterval > 1 ? 's' : ''}`}
              {getEndType() === 'date' && watch('recurrenceEndDate') && ` until ${new Date(watch('recurrenceEndDate')!).toLocaleDateString()}`}
              {getEndType() === 'occurrences' && watch('recurrenceOccurrences') && ` for ${watch('recurrenceOccurrences')} occurrences`}
              {getEndType() === 'never' && ' indefinitely'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}