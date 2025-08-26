'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useResponsive } from '@/hooks/use-responsive';

export interface ToolbarOption<T = any> {
  value: T;
  label: string;
  icon?: React.ElementType;
  shortLabel?: string; // Shorter label for compact views
  tooltip?: string;
}

interface AdaptiveToolbarProps<T = any> {
  options: ToolbarOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  dropdownAlign?: 'start' | 'center' | 'end';
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  forceMode?: 'buttons' | 'dropdown' | 'auto';
  maxVisibleButtons?: number;
  showIcons?: boolean;
  showLabels?: boolean;
}

/**
 * AdaptiveToolbar - A responsive toolbar that automatically switches between
 * buttons and dropdown based on available space and screen size.
 * 
 * This component is reusable across the entire application for any toolbar needs.
 */
export function AdaptiveToolbar<T = any>({
  options,
  value,
  onChange,
  label,
  className,
  dropdownAlign = 'end',
  buttonVariant = 'ghost',
  size = 'sm',
  forceMode = 'auto',
  maxVisibleButtons = 4,
  showIcons = true,
  showLabels = true,
}: AdaptiveToolbarProps<T>) {
  const { 
    isInCriticalZone, 
    needsDropdownMenu, 
    toolbarLayout,
    isMobile,
    isTablet,
    currentBreakpoint 
  } = useResponsive();

  // Determine whether to show dropdown or buttons
  const shouldUseDropdown = React.useMemo(() => {
    if (forceMode === 'dropdown') return true;
    if (forceMode === 'buttons') return false;
    
    // Auto mode logic
    if (isInCriticalZone) return true; // Always dropdown in critical zone
    if (needsDropdownMenu) return true;
    if (toolbarLayout === 'dropdown') return true;
    if (isMobile) return true;
    if (options.length > maxVisibleButtons) return true;
    
    return false;
  }, [
    forceMode, 
    isInCriticalZone, 
    needsDropdownMenu, 
    toolbarLayout, 
    isMobile, 
    options.length, 
    maxVisibleButtons
  ]);

  // Get the current selected option
  const currentOption = options.find(opt => opt.value === value);

  // Determine label display based on screen size
  const getButtonLabel = (option: ToolbarOption<T>) => {
    if (!showLabels) return null;
    if (isMobile && option.shortLabel) return option.shortLabel;
    if (isTablet && option.shortLabel) return option.shortLabel;
    return option.label;
  };

  // Render as dropdown menu
  if (shouldUseDropdown) {
    return (
      <div className={cn('adaptive-toolbar adaptive-toolbar-dropdown', className)}>
        {label && (
          <span className="text-sm text-white/60 mr-2">{label}</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={buttonVariant} 
              size={size}
              className={cn(
                'min-w-[120px] justify-between gap-2',
                'transition-all duration-200'
              )}
              aria-label={`Select ${label || 'option'}`}
            >
              {showIcons && currentOption?.icon && (
                <currentOption.icon className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {currentOption ? getButtonLabel(currentOption) : 'Select'}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align={dropdownAlign}
            className="min-w-[150px]"
          >
            {options.map((option) => (
              <DropdownMenuItem
                key={String(option.value)}
                onClick={() => onChange(option.value)}
                className={cn(
                  'gap-2 cursor-pointer',
                  value === option.value && 'bg-blue-600/20'
                )}
                title={option.tooltip}
              >
                {showIcons && option.icon && (
                  <option.icon className="h-4 w-4" />
                )}
                <span>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Render as button group
  const visibleOptions = options.slice(0, maxVisibleButtons);
  const overflowOptions = options.slice(maxVisibleButtons);
  
  return (
    <div className={cn(
      'adaptive-toolbar adaptive-toolbar-buttons',
      'flex items-center gap-1',
      className
    )}>
      {label && (
        <span className="text-sm text-white/60 mr-2">{label}</span>
      )}
      <div className="flex items-center gap-1">
        {visibleOptions.map((option) => (
          <Button
            key={String(option.value)}
            size={size}
            variant={value === option.value ? 'default' : buttonVariant}
            onClick={() => onChange(option.value)}
            className={cn(
              'transition-all duration-200',
              value === option.value
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10',
              // Hide labels on very compact layouts
              toolbarLayout === 'compact' && showLabels && 'gap-1'
            )}
            title={option.tooltip}
            aria-pressed={value === option.value}
            aria-label={option.label}
          >
            {showIcons && option.icon && (
              <option.icon className={cn(
                'h-3.5 w-3.5',
                size === 'default' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
            )}
            {showLabels && (
              <span className={cn(
                toolbarLayout === 'compact' && 'hidden lg:inline',
                isMobile && 'sr-only'
              )}>
                {getButtonLabel(option)}
              </span>
            )}
          </Button>
        ))}
        
        {/* Overflow menu for additional options */}
        {overflowOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={buttonVariant}
                size={size}
                className="px-2"
                aria-label="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflowOptions.map((option) => (
                <DropdownMenuItem
                  key={String(option.value)}
                  onClick={() => onChange(option.value)}
                  className={cn(
                    'gap-2 cursor-pointer',
                    value === option.value && 'bg-blue-600/20'
                  )}
                  title={option.tooltip}
                >
                  {showIcons && option.icon && (
                    <option.icon className="h-4 w-4" />
                  )}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Export types for reuse
export type { AdaptiveToolbarProps };