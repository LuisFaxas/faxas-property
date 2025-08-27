'use client';

import React, { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Check,
  Trash2,
  Edit,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';

interface MobileTaskCardProps {
  task: any;
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  className?: string;
}

const statusConfig = {
  TODO: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'To Do' },
  IN_PROGRESS: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/20', label: 'In Progress' },
  BLOCKED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20', label: 'Blocked' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20', label: 'Completed' },
};

const priorityConfig = {
  LOW: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
  URGENT: { color: 'text-red-400', bg: 'bg-red-500/20' },
};

// Swipe configuration
const SWIPE_THRESHOLD = 80; // Minimum distance to reveal action buttons
const SWIPE_CONFIRM_THRESHOLD = 200; // Distance for auto-confirm (optional feature)
const ACTION_BUTTON_WIDTH = 80; // Width of revealed action button

export function MobileTaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  className,
}: MobileTaskCardProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeState, setSwipeState] = useState<'idle' | 'swiping' | 'revealed-left' | 'revealed-right'>('idle');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Clock;
  const statusStyle = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
  const priorityStyle = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const isCompleted = task.status === 'COMPLETED';

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
    setSwipeState('swiping');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    
    // Add resistance at the edges
    let adjustedDelta = deltaX;
    if (Math.abs(deltaX) > ACTION_BUTTON_WIDTH) {
      const excess = Math.abs(deltaX) - ACTION_BUTTON_WIDTH;
      const resistance = 0.3; // 30% of excess movement
      adjustedDelta = deltaX > 0 
        ? ACTION_BUTTON_WIDTH + (excess * resistance)
        : -(ACTION_BUTTON_WIDTH + (excess * resistance));
    }
    
    setCurrentX(adjustedDelta);
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;
    
    setIsDragging(false);
    
    // Determine final position based on swipe distance
    if (currentX > SWIPE_THRESHOLD) {
      // Swipe right - reveal complete button
      setCurrentX(ACTION_BUTTON_WIDTH);
      setSwipeState('revealed-right');
    } else if (currentX < -SWIPE_THRESHOLD) {
      // Swipe left - reveal delete button
      setCurrentX(-ACTION_BUTTON_WIDTH);
      setSwipeState('revealed-left');
    } else {
      // Snap back to center
      setCurrentX(0);
      setSwipeState('idle');
    }
  };

  // Reset swipe state
  const resetSwipe = () => {
    setCurrentX(0);
    setSwipeState('idle');
  };

  // Handle action button clicks
  const handleComplete = () => {
    if (onStatusChange) {
      onStatusChange(task.id, 'COMPLETED');
    }
    resetSwipe();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task);
    }
    resetSwipe();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
    setShowMoreMenu(false);
  };

  // More menu for desktop or as fallback
  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(!showMoreMenu);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background action buttons */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {/* Complete button (right swipe reveals) */}
        <Button
          onClick={handleComplete}
          disabled={isCompleted}
          className={cn(
            'h-full w-20 rounded-none bg-green-600 hover:bg-green-700 text-white',
            'transition-opacity duration-200',
            swipeState === 'revealed-right' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Check className="h-5 w-5" />
        </Button>
        
        {/* Delete button (left swipe reveals) */}
        <Button
          onClick={handleDelete}
          className={cn(
            'h-full w-20 rounded-none bg-red-600 hover:bg-red-700 text-white ml-auto',
            'transition-opacity duration-200',
            swipeState === 'revealed-left' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Main card content */}
      <div
        className={cn(
          'relative bg-graphite-800 backdrop-blur-sm rounded-lg',
          'border border-white/10',
          'min-h-[80px]', // Ensure minimum touch target height
          'transition-transform duration-200 ease-out',
          isDragging && 'transition-none', // Disable transition while dragging
          isCompleted && 'opacity-75'
        )}
        style={{
          transform: `translateX(${currentX}px)`,
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3 flex-1">
              <StatusIcon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', statusStyle.color)} />
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-medium text-white text-base leading-tight',
                  isCompleted && 'line-through text-white/60'
                )}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-white/60 line-clamp-2 mt-1">{task.description}</p>
                )}
              </div>
            </div>
            
            {/* More menu button (desktop or fallback) */}
            {!isMobile && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleMoreClick}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {/* Dropdown menu */}
                {showMoreMenu && (
                  <div className="absolute right-0 top-8 z-10 w-48 rounded-md bg-graphite-800 border border-white/10 shadow-lg">
                    <button
                      onClick={handleEdit}
                      className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-white/10"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                    {!isCompleted && (
                      <button
                        onClick={handleComplete}
                        className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-white/10"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Complete
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={cn('text-xs', statusStyle.bg, statusStyle.color)}>
              {statusStyle.label}
            </Badge>
            <Badge className={cn('text-xs', priorityStyle.bg, priorityStyle.color)}>
              {task.priority}
            </Badge>
            {isOverdue && (
              <Badge className="text-xs bg-red-500/20 text-red-400">
                Overdue
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-white/60">
            {task.assignedTo && (
              <span>Assigned to: {task.assignedTo.displayName || task.assignedTo.email?.split('@')[0]}</span>
            )}
            {task.dueDate && (
              <span className={cn(isOverdue && 'text-red-400')}>
                Due: {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Visual swipe indicators during drag */}
      {isDragging && (
        <>
          {currentX > 20 && !isCompleted && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className={cn(
                'flex items-center gap-2 text-green-500 transition-opacity',
                currentX > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-50'
              )}>
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            </div>
          )}
          {currentX < -20 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className={cn(
                'flex items-center gap-2 text-red-500 transition-opacity',
                currentX < -SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-50'
              )}>
                <span className="text-sm font-medium">Delete</span>
                <Trash2 className="h-5 w-5" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}