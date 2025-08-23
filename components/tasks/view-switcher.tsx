'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  List,
  Kanban,
  Calendar,
  BarChart3,
  Table2,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export type TaskView = 'list' | 'kanban' | 'calendar' | 'timeline' | 'table';

interface ViewSwitcherProps {
  currentView: TaskView;
  onViewChange: (view: TaskView) => void;
  className?: string;
}

const viewOptions = [
  { value: 'list' as TaskView, label: 'List', icon: List },
  { value: 'kanban' as TaskView, label: 'Kanban', icon: Kanban },
  { value: 'calendar' as TaskView, label: 'Calendar', icon: Calendar },
  { value: 'timeline' as TaskView, label: 'Timeline', icon: BarChart3 },
  { value: 'table' as TaskView, label: 'Table', icon: Table2 },
];

export function ViewSwitcher({ currentView, onViewChange, className }: ViewSwitcherProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved view preference
    const savedView = localStorage.getItem('taskView') as TaskView;
    if (savedView && savedView !== currentView) {
      onViewChange(savedView);
    }
  }, []);

  const handleViewChange = (view: TaskView) => {
    onViewChange(view);
    localStorage.setItem('taskView', view);
  };

  const currentOption = viewOptions.find(opt => opt.value === currentView) || viewOptions[0];
  const CurrentIcon = currentOption.icon;

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Desktop View Switcher */}
      <div className={cn('hidden md:flex items-center gap-1 p-1 bg-graphite-800/50 rounded-lg backdrop-blur-sm border border-white/10', className)}>
        {viewOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.value;
          const isImplemented = ['list', 'kanban', 'table'].includes(option.value);
          
          return (
            <Button
              key={option.value}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => isImplemented && handleViewChange(option.value)}
              disabled={!isImplemented}
              className={cn(
                'gap-2 transition-all',
                isActive && 'bg-gold-500/20 text-gold-500 hover:bg-gold-500/30',
                !isImplemented && 'opacity-50 cursor-not-allowed'
              )}
              title={!isImplemented ? `${option.label} view coming soon` : option.label}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Mobile View Switcher */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-graphite-800/50 border-white/10"
            >
              <CurrentIcon className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">{currentOption.label}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-graphite-800 border-white/10">
            {viewOptions.map((option) => {
              const Icon = option.icon;
              const isActive = currentView === option.value;
              const isImplemented = ['list', 'kanban', 'table'].includes(option.value);
              
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => isImplemented && handleViewChange(option.value)}
                  disabled={!isImplemented}
                  className={cn(
                    'gap-2',
                    isActive && 'bg-gold-500/20 text-gold-500',
                    !isImplemented && 'opacity-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                  {!isImplemented && <span className="ml-auto text-xs">Soon</span>}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}