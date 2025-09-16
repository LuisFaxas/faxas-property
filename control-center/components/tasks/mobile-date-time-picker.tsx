'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DatePicker } from '@/components/ui/date-picker';

interface MobileDateTimePickerProps {
  value?: string; // ISO string format
  onChange?: (datetime: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function MobileDateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  className,
  disabled,
  label
}: MobileDateTimePickerProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Parse the ISO string to date and time
  const parseDateTime = (isoString?: string) => {
    if (!isoString) return { date: undefined, time: '12:00' };
    try {
      const dt = new Date(isoString);
      const timeStr = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
      return { date: dt, time: timeStr };
    } catch {
      return { date: undefined, time: '12:00' };
    }
  };

  const initialValues = parseDateTime(value);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialValues.date);
  const [selectedTime, setSelectedTime] = useState(initialValues.time);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isTimeSheetOpen, setIsTimeSheetOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'time'>('date');

  // Combine date and time into ISO string
  const combineDateTime = (date?: Date, time?: string) => {
    if (!date || !time) return '';
    const [hours, minutes] = time.split(':');
    const combined = new Date(date);
    combined.setHours(parseInt(hours, 10));
    combined.setMinutes(parseInt(minutes, 10));
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined.toISOString();
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && isMobile) {
      // Move to time selection step on mobile - DON'T trigger onChange yet
      setStep('time');
    } else if (date && !isMobile) {
      // Update the value immediately on desktop
      const combined = combineDateTime(date, selectedTime);
      if (combined) onChange?.(combined);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    // On mobile, don't trigger onChange until confirm button is clicked
    if (!isMobile && selectedDate) {
      const combined = combineDateTime(selectedDate, time);
      if (combined) {
        onChange?.(combined);
      }
    }
  };

  const handleOpenSheet = () => {
    if (!disabled) {
      setIsDateSheetOpen(true);
      setStep('date');
    }
  };

  const formatDisplay = () => {
    if (selectedDate && selectedTime) {
      return `${format(selectedDate, 'MMM d, yyyy')} at ${selectedTime}`;
    }
    return placeholder;
  };

  // Generate time options (every 30 minutes)
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      timeOptions.push(timeStr);
    }
  }

  // Desktop: Use separate date and time inputs
  if (!isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && <label className="text-sm text-white">{label}</label>}
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            value={selectedDate}
            onChange={handleDateSelect}
            placeholder="Select date"
            disabled={disabled}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          />
          <div className="relative">
            <select
              value={selectedTime}
              onChange={(e) => handleTimeSelect(e.target.value)}
              disabled={disabled}
              className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white hover:bg-white/10 appearance-none cursor-pointer disabled:opacity-50"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time} className="bg-graphite-800">
                  {time}
                </option>
              ))}
            </select>
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  // Mobile: Use bottom sheet with steps
  return (
    <>
      <div className={cn("space-y-2", className)}>
        {label && <label className="text-sm text-white">{label}</label>}
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-12",
            "bg-white/5 border-white/10 text-white hover:bg-white/10",
            !selectedDate && "text-white/60"
          )}
          onClick={handleOpenSheet}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplay()}
        </Button>
      </div>

      <BottomSheet
        open={isDateSheetOpen}
        onOpenChange={setIsDateSheetOpen}
        title={step === 'date' ? 'Select Date' : 'Select Time'}
      >
        <div className="pb-6" onClick={(e) => e.stopPropagation()}>
          {step === 'date' ? (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md"
                classNames={{
                  day: "h-12 w-12 text-base", // Larger touch targets
                  caption_label: "text-base",
                  weekday: "text-base",
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-white/60 mb-4">
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                {timeOptions.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : "outline"}
                    className={cn(
                      "h-12 text-base",
                      selectedTime === time
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setStep('date')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    if (selectedDate && selectedTime) {
                      const combined = combineDateTime(selectedDate, selectedTime);
                      if (combined) {
                        onChange?.(combined);
                        setIsDateSheetOpen(false);
                        setStep('date');
                      }
                    }
                  }}
                  disabled={!selectedDate || !selectedTime}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}