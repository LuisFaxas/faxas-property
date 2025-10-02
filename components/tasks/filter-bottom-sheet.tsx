'use client';

import React from 'react';
import { AppSheet } from '@/components/ui/app-sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  AlertCircle, 
  XCircle, 
  CheckCircle,
  Circle,
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  Minus
} from 'lucide-react';

interface FilterBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onApply?: () => void;
  onReset?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', icon: Circle, color: 'text-white/60' },
  { value: 'TODO', label: 'To Do', icon: Clock, color: 'text-yellow-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: AlertCircle, color: 'text-blue-500' },
  { value: 'BLOCKED', label: 'Blocked', icon: XCircle, color: 'text-red-500' },
  { value: 'DONE', label: 'Done', icon: CheckCircle, color: 'text-green-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities', icon: Minus, color: 'text-white/60' },
  { value: 'LOW', label: 'Low', icon: ArrowRight, color: 'text-blue-500' },
  { value: 'MEDIUM', label: 'Medium', icon: ArrowUpRight, color: 'text-yellow-500' },
  { value: 'HIGH', label: 'High', icon: ArrowUp, color: 'text-orange-500' },
  { value: 'URGENT', label: 'Urgent', icon: ArrowUp, color: 'text-red-500' },
];

export function FilterBottomSheet({
  open,
  onOpenChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onApply,
  onReset
}: FilterBottomSheetProps) {
  const [tempStatusFilter, setTempStatusFilter] = React.useState(statusFilter);
  const [tempPriorityFilter, setTempPriorityFilter] = React.useState(priorityFilter);

  React.useEffect(() => {
    if (open) {
      setTempStatusFilter(statusFilter);
      setTempPriorityFilter(priorityFilter);
    }
  }, [open, statusFilter, priorityFilter]);

  const handleApply = () => {
    onStatusFilterChange(tempStatusFilter);
    onPriorityFilterChange(tempPriorityFilter);
    onApply?.();
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempStatusFilter('all');
    setTempPriorityFilter('all');
    onStatusFilterChange('all');
    onPriorityFilterChange('all');
    onReset?.();
  };

  const hasActiveFilters = tempStatusFilter !== 'all' || tempPriorityFilter !== 'all';

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      mode="detail"
      fit="content"
      title="Filter Tasks"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 text-base border-white/20 text-white hover:bg-white/10" onClick={handleReset} disabled={!hasActiveFilters}>
            Reset
          </Button>
          <Button className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Filter */}
        <div>
          <Label className="text-base font-semibold text-white mb-3 block">
            Status
          </Label>
          <RadioGroup 
            value={tempStatusFilter} 
            onValueChange={setTempStatusFilter}
            className="space-y-2"
          >
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                    "hover:bg-white/5 active:scale-[0.98]",
                    tempStatusFilter === option.value && "bg-white/10"
                  )}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    className="border-white/30 text-blue-600"
                  />
                  <Icon className={cn("h-5 w-5", option.color)} />
                  <span className="text-white">{option.label}</span>
                </label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Priority Filter */}
        <div>
          <Label className="text-base font-semibold text-white mb-3 block">
            Priority
          </Label>
          <RadioGroup 
            value={tempPriorityFilter} 
            onValueChange={setTempPriorityFilter}
            className="space-y-2"
          >
            {PRIORITY_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                    "hover:bg-white/5 active:scale-[0.98]",
                    tempPriorityFilter === option.value && "bg-white/10"
                  )}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    className="border-white/30 text-blue-600"
                  />
                  <Icon className={cn("h-5 w-5", option.color)} />
                  <span className="text-white">{option.label}</span>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      </div>
    </AppSheet>
  );
}