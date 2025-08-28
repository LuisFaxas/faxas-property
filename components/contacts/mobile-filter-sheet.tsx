'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Filter,
  X,
  Users,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Clock,
  ClipboardList,
  Building,
  User as UserIcon,
  Download,
} from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  onExportCSV?: () => void;
  filterCounts?: {
    portal?: number;
    pending?: number;
    noPortal?: number;
    hasTasks?: number;
    active?: number;
    inactive?: number;
    potential?: number;
    blacklisted?: number;
    followUp?: number;
    subcontractor?: number;
    supplier?: number;
    consultant?: number;
    inspector?: number;
    client?: number;
    other?: number;
  };
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  activeFilters,
  onFiltersChange,
  onExportCSV,
  filterCounts = {},
}: MobileFilterSheetProps) {
  const [tempFilters, setTempFilters] = useState<string[]>(activeFilters);

  const handleToggleFilter = (filterId: string) => {
    setTempFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(f => f !== filterId);
      }
      return [...prev, filterId];
    });
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setTempFilters([]);
  };

  const handleCancel = () => {
    setTempFilters(activeFilters);
    onOpenChange(false);
  };

  const portalFilters: FilterOption[] = [
    {
      id: 'portal',
      label: 'Has Portal Access',
      icon: <Unlock className="h-4 w-4 text-green-500" />,
      count: filterCounts.portal,
    },
    {
      id: 'pending',
      label: 'Pending Invites',
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      count: filterCounts.pending,
    },
    {
      id: 'no-portal',
      label: 'No Portal Access',
      icon: <Lock className="h-4 w-4 text-gray-500" />,
      count: filterCounts.noPortal,
    },
  ];

  const statusFilters: FilterOption[] = [
    {
      id: 'active',
      label: 'Active',
      icon: <UserCheck className="h-4 w-4 text-green-500" />,
      count: filterCounts.active,
    },
    {
      id: 'inactive',
      label: 'Inactive',
      icon: <UserX className="h-4 w-4 text-gray-500" />,
      count: filterCounts.inactive,
    },
    {
      id: 'potential',
      label: 'Potential',
      icon: <Users className="h-4 w-4 text-blue-500" />,
      count: filterCounts.potential,
    },
    {
      id: 'blacklisted',
      label: 'Blacklisted',
      icon: <UserX className="h-4 w-4 text-red-500" />,
      count: filterCounts.blacklisted,
    },
    {
      id: 'follow-up',
      label: 'Follow Up',
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      count: filterCounts.followUp,
    },
  ];

  const categoryFilters: FilterOption[] = [
    {
      id: 'subcontractor',
      label: 'Subcontractor',
      count: filterCounts.subcontractor,
    },
    {
      id: 'supplier',
      label: 'Supplier',
      count: filterCounts.supplier,
    },
    {
      id: 'consultant',
      label: 'Consultant',
      count: filterCounts.consultant,
    },
    {
      id: 'inspector',
      label: 'Inspector',
      count: filterCounts.inspector,
    },
    {
      id: 'client',
      label: 'Client',
      count: filterCounts.client,
    },
    {
      id: 'other',
      label: 'Other',
      count: filterCounts.other,
    },
  ];

  const otherFilters: FilterOption[] = [
    {
      id: 'has-tasks',
      label: 'Has Tasks',
      icon: <ClipboardList className="h-4 w-4 text-blue-500" />,
      count: filterCounts.hasTasks,
    },
    {
      id: 'company',
      label: 'Companies Only',
      icon: <Building className="h-4 w-4 text-purple-500" />,
    },
    {
      id: 'individual',
      label: 'Individuals Only',
      icon: <UserIcon className="h-4 w-4 text-purple-500" />,
    },
  ];

  const renderFilterGroup = (title: string, filters: FilterOption[]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/80">{title}</h3>
      <div className="space-y-2">
        {filters.map(filter => (
          <label
            key={filter.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
              tempFilters.includes(filter.id)
                ? "bg-blue-600/20 border-blue-600/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={tempFilters.includes(filter.id)}
                onCheckedChange={() => handleToggleFilter(filter.id)}
                className="border-white/40"
              />
              <div className="flex items-center gap-2">
                {filter.icon}
                <span className="text-sm text-white">{filter.label}</span>
              </div>
            </div>
            {filter.count !== undefined && filter.count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            )}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-gray-900 border-t border-white/10 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-white text-xl flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Contacts
              </SheetTitle>
              <SheetDescription className="text-white/60">
                {tempFilters.length} {tempFilters.length === 1 ? 'filter' : 'filters'} selected
              </SheetDescription>
            </div>
            {tempFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-white/60 hover:text-white"
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Filter Options */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Active Filters Display */}
          {tempFilters.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/80">Active Filters</h3>
              <div className="flex flex-wrap gap-2">
                {tempFilters.map(filterId => {
                  // Find the filter label
                  const allFilters = [...portalFilters, ...statusFilters, ...categoryFilters, ...otherFilters];
                  const filter = allFilters.find(f => f.id === filterId);
                  
                  return (
                    <Badge 
                      key={filterId}
                      className="bg-blue-600/20 text-blue-400 border-blue-600/50 cursor-pointer"
                      onClick={() => handleToggleFilter(filterId)}
                    >
                      {filter?.label || filterId}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portal Access Filters */}
          {renderFilterGroup('Portal Access', portalFilters)}

          {/* Status Filters */}
          {renderFilterGroup('Status', statusFilters)}

          {/* Category Filters */}
          {renderFilterGroup('Category', categoryFilters)}

          {/* Other Filters */}
          {renderFilterGroup('Other', otherFilters)}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          {/* Export Button */}
          {onExportCSV && (
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                onExportCSV();
                onOpenChange(false);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Contacts as CSV
            </Button>
          )}
          
          {/* Filter Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleApply}
            >
              Apply Filters
              {tempFilters.length > 0 && (
                <Badge className="ml-2 bg-white/20 text-white">
                  {tempFilters.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}