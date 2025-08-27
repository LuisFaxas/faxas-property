'use client';

import React from 'react';
import { Search, Filter, X, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onOpenFilterSheet: () => void;
  taskCount: number;
  className?: string;
}

const QUICK_FILTERS = [
  { id: 'my-tasks', label: 'My Tasks', icon: CheckCircle },
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'high-priority', label: 'High Priority', icon: AlertCircle },
  { id: 'in-progress', label: 'In Progress', icon: Clock },
];

export function TaskFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onOpenFilterSheet,
  taskCount,
  className
}: FilterBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  
  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onPriorityFilterChange('all');
    setIsSearchExpanded(false);
  };

  const handleQuickFilter = (filterId: string) => {
    switch (filterId) {
      case 'today':
        // This would filter by today's date
        break;
      case 'high-priority':
        onPriorityFilterChange('HIGH');
        break;
      case 'in-progress':
        onStatusFilterChange('IN_PROGRESS');
        break;
      case 'my-tasks':
        // This would filter by assigned to current user
        break;
    }
  };

  return (
    <div className={cn(
      "sticky top-0 z-30 bg-graphite-900/95 backdrop-blur-sm border-b border-white/10",
      className
    )}>
      <div className="px-3 py-2">
        {/* Search and Filter Row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Search */}
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300",
            isSearchExpanded ? "flex-1" : "flex-none"
          )}>
            {isSearchExpanded ? (
              <div className="flex-1 flex items-center gap-2">
                <Search className="h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="flex-1 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/60 hover:text-white"
                  onClick={() => {
                    setIsSearchExpanded(false);
                    onSearchChange('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/60 hover:text-white"
                onClick={() => setIsSearchExpanded(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Task Count */}
          {!isSearchExpanded && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm text-white/60">
                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          )}

          {/* Filter Button */}
          <Button
            variant={activeFilterCount > 0 ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9 gap-2",
              activeFilterCount > 0 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "text-white/60 hover:text-white"
            )}
            onClick={onOpenFilterSheet}
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge className="h-5 px-1.5 bg-white/20 text-white border-0">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Quick Filters / Active Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Show active filters if any */}
          {(statusFilter !== 'all' || priorityFilter !== 'all') ? (
            <>
              {statusFilter !== 'all' && (
                <Badge 
                  className="bg-blue-600/20 text-blue-400 border-blue-600/30 gap-1 pr-1"
                >
                  Status: {statusFilter.replace('_', ' ')}
                  <button
                    onClick={() => onStatusFilterChange('all')}
                    className="ml-1 hover:text-blue-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {priorityFilter !== 'all' && (
                <Badge 
                  className="bg-orange-600/20 text-orange-400 border-orange-600/30 gap-1 pr-1"
                >
                  Priority: {priorityFilter}
                  <button
                    onClick={() => onPriorityFilterChange('all')}
                    className="ml-1 hover:text-orange-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(statusFilter !== 'all' || priorityFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-white/60 hover:text-white"
                  onClick={handleClearFilters}
                >
                  Clear all
                </Button>
              )}
            </>
          ) : (
            /* Show quick filter presets when no active filters */
            <>
              {QUICK_FILTERS.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.id}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-white/60 hover:text-white hover:bg-white/10 whitespace-nowrap"
                    onClick={() => handleQuickFilter(filter.id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {filter.label}
                  </Button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}