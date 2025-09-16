'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  X, 
  Calendar,
  Tag,
  Users,
  MapPin,
  Clock,
  Search,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  onFiltersChange: (filters: any) => void;
  className?: string;
}

const EVENT_TYPES = [
  { value: 'WORK', label: 'Work', color: 'bg-blue-600' },
  { value: 'MEETING', label: 'Meeting', color: 'bg-purple-600' },
  { value: 'SITE_VISIT', label: 'Site Visit', color: 'bg-green-600' },
  { value: 'CALL', label: 'Call', color: 'bg-orange-600' },
  { value: 'EMAIL_FOLLOWUP', label: 'Email Follow-up', color: 'bg-gray-600' },
];

const EVENT_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'RESCHEDULE_NEEDED', label: 'Needs Reschedule' },
];

const QUICK_FILTERS = [
  { value: 'today', label: 'Today', icon: Calendar },
  { value: 'tomorrow', label: 'Tomorrow', icon: Calendar },
  { value: 'this_week', label: 'This Week', icon: Calendar },
  { value: 'next_week', label: 'Next Week', icon: Calendar },
  { value: 'this_month', label: 'This Month', icon: Calendar },
];

export function FilterPanel({ onFiltersChange, className }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    search: '',
    types: [] as string[],
    statuses: [] as string[],
    dateRange: '',
    startDate: '',
    endDate: '',
    location: '',
    hasAttendees: false,
    isRecurring: false,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    handleFilterChange('types', newTypes);
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    handleFilterChange('statuses', newStatuses);
  };

  const handleQuickFilter = (filter: string) => {
    const today = new Date();
    let startDate = '';
    let endDate = '';

    switch (filter) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        startDate = endDate = tomorrow.toISOString().split('T')[0];
        break;
      case 'this_week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = weekEnd.toISOString().split('T')[0];
        break;
      case 'next_week':
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        startDate = nextWeekStart.toISOString().split('T')[0];
        endDate = nextWeekEnd.toISOString().split('T')[0];
        break;
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
    }

    setFilters(prev => ({
      ...prev,
      dateRange: filter,
      startDate,
      endDate,
    }));
    onFiltersChange({
      ...filters,
      dateRange: filter,
      startDate,
      endDate,
    });
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      types: [],
      statuses: [],
      dateRange: '',
      startDate: '',
      endDate: '',
      location: '',
      hasAttendees: false,
      isRecurring: false,
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    filters.types.length +
    filters.statuses.length +
    (filters.dateRange ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.hasAttendees ? 1 : 0) +
    (filters.isRecurring ? 1 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </Button>
          
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={filters.dateRange === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter(filter.value)}
            className="gap-2"
          >
            <filter.icon className="h-3 w-3" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
          {/* Event Types */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Event Types
            </Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.types.includes(type.value)}
                    onCheckedChange={() => toggleType(type.value)}
                  />
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", type.color)} />
                    <span className="text-sm">{type.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Event Statuses */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_STATUSES.map((status) => (
                <label
                  key={status.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.statuses.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <span className="text-sm">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  handleFilterChange('startDate', e.target.value);
                  handleFilterChange('dateRange', '');
                }}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  handleFilterChange('endDate', e.target.value);
                  handleFilterChange('dateRange', '');
                }}
                className="bg-white/5 border-white/10"
              />
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
              type="text"
              placeholder="Filter by location..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.hasAttendees}
                onCheckedChange={(checked) => handleFilterChange('hasAttendees', checked)}
              />
              <span className="text-sm flex items-center gap-1">
                <Users className="h-4 w-4" />
                Has Attendees
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.isRecurring}
                onCheckedChange={(checked) => handleFilterChange('isRecurring', checked)}
              />
              <span className="text-sm flex items-center gap-1">
                <RotateCcw className="h-4 w-4" />
                Recurring Events
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('search', '')}
              />
            </Badge>
          )}
          {filters.types.map((type) => {
            const typeInfo = EVENT_TYPES.find(t => t.value === type);
            return (
              <Badge key={type} variant="secondary" className="gap-1">
                <div className={cn("w-2 h-2 rounded-full", typeInfo?.color)} />
                {typeInfo?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleType(type)}
                />
              </Badge>
            );
          })}
          {filters.statuses.map((status) => {
            const statusInfo = EVENT_STATUSES.find(s => s.value === status);
            return (
              <Badge key={status} variant="secondary" className="gap-1">
                {statusInfo?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleStatus(status)}
                />
              </Badge>
            );
          })}
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              {QUICK_FILTERS.find(f => f.value === filters.dateRange)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  handleFilterChange('dateRange', '');
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}