'use client';

import React, { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MobileTaskDetailSheet } from './mobile-task-detail-sheet';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Check,
  Trash2,
  MoreVertical,
  Edit,
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
const SWIPE_THRESHOLD = 60; // Minimum distance to trigger action
const DELETE_BUTTON_WIDTH = 80; // Width of delete button
const COMPLETE_THRESHOLD = 100; // Distance to trigger complete

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
  const [swipeState, setSwipeState] = useState<'idle' | 'swiping' | 'completing' | 'uncompleting' | 'deleting'>('idle');
  const [showDetailSheet, setShowDetailSheet] = useState(false);
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
    
    // Right swipe (complete) - allow more distance with resistance
    if (deltaX > 0) {
      const resistance = deltaX > COMPLETE_THRESHOLD ? 0.3 : 1;
      const adjustedDelta = deltaX > COMPLETE_THRESHOLD 
        ? COMPLETE_THRESHOLD + (deltaX - COMPLETE_THRESHOLD) * resistance
        : deltaX;
      setCurrentX(Math.min(adjustedDelta, COMPLETE_THRESHOLD * 1.5));
    }
    // Left swipe (delete) - limit to button width
    else if (deltaX < 0) {
      const resistance = Math.abs(deltaX) > DELETE_BUTTON_WIDTH ? 0.3 : 1;
      const adjustedDelta = Math.abs(deltaX) > DELETE_BUTTON_WIDTH
        ? -(DELETE_BUTTON_WIDTH + (Math.abs(deltaX) - DELETE_BUTTON_WIDTH) * resistance)
        : deltaX;
      setCurrentX(Math.max(adjustedDelta, -DELETE_BUTTON_WIDTH * 1.5));
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;
    
    setIsDragging(false);
    
    // Right swipe - complete/uncomplete based on current status
    if (currentX > COMPLETE_THRESHOLD) {
      if (isCompleted) {
        // Uncomplete task
        setSwipeState('uncompleting');
        setCurrentX(COMPLETE_THRESHOLD);
        setTimeout(() => {
          if (onStatusChange) {
            onStatusChange(task.id, 'TODO');
          }
          resetSwipe();
        }, 200);
      } else {
        // Complete task
        setSwipeState('completing');
        setCurrentX(COMPLETE_THRESHOLD);
        setTimeout(() => {
          if (onStatusChange) {
            onStatusChange(task.id, 'COMPLETED');
          }
          resetSwipe();
        }, 200);
      }
    }
    // Left swipe - delete immediately
    else if (currentX < -COMPLETE_THRESHOLD) {
      setSwipeState('deleting');
      setCurrentX(-COMPLETE_THRESHOLD);
      setTimeout(() => {
        if (onDelete) {
          onDelete(task);
        }
        resetSwipe();
      }, 200);
    }
    // Snap back to center if swipe was too small
    else {
      resetSwipe();
    }
  };

  // Reset swipe state
  const resetSwipe = () => {
    setCurrentX(0);
    setSwipeState('idle');
  };


  // Handle card tap
  const handleCardTap = (e: React.MouseEvent) => {
    // Don't open if clicking on buttons or swiping
    if ((e.target as HTMLElement).closest('button') || swipeState !== 'idle') return;
    setShowDetailSheet(true);
  };

  // More menu for desktop
  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(!showMoreMenu);
  };

  return (
    <>
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
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Right swipe - Complete/Uncomplete action background */}
          {currentX > 20 && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-start px-4",
              isCompleted 
                ? "bg-gradient-to-r from-yellow-600 to-yellow-500" 
                : "bg-gradient-to-r from-green-600 to-green-500"
            )}>
              {isCompleted ? (
                <>
                  <XCircle className="h-6 w-6 text-white" />
                  <span className="ml-3 text-white font-medium">Uncomplete</span>
                </>
              ) : (
                <>
                  <Check className="h-6 w-6 text-white" />
                  <span className="ml-3 text-white font-medium">Complete</span>
                </>
              )}
            </div>
          )}
          
          {/* Left swipe - Delete action background */}
          {currentX < -20 && (
            <div className="absolute inset-0 bg-gradient-to-l from-red-600 to-red-500 flex items-center justify-end px-4">
              <span className="mr-3 text-white font-medium">Delete</span>
              <Trash2 className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Main card content */}
        <div
          className={cn(
            'relative bg-graphite-800 backdrop-blur-sm rounded-lg',
            'border border-white/10',
            'min-h-[80px]',
            'transition-all duration-200 ease-out',
            isDragging && 'transition-none',
            isCompleted && !isDragging && !swipeState.includes('ing') && 'opacity-75',
            swipeState === 'completing' && 'scale-95',
            swipeState === 'uncompleting' && 'scale-95',
            swipeState === 'deleting' && 'scale-95',
            isMobile && 'cursor-pointer'
          )}
          style={{
            transform: `translateX(${currentX}px)`,
          }}
          onClick={handleCardTap}
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
                  {task.description && !isMobile && (
                    <p className="text-sm text-white/60 line-clamp-2 mt-1">{task.description}</p>
                  )}
                </div>
              </div>
              
              {/* Desktop more menu */}
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
                  
                  {showMoreMenu && (
                    <div className="absolute right-0 top-8 z-10 w-48 rounded-md bg-graphite-800 border border-white/10 shadow-lg">
                      <button
                        onClick={() => {
                          if (onEdit) onEdit(task);
                          setShowMoreMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-white/10"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (onStatusChange) {
                            onStatusChange(task.id, isCompleted ? 'TODO' : 'COMPLETED');
                          }
                          setShowMoreMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-white/10"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {isCompleted ? 'Mark Incomplete' : 'Complete'}
                      </button>
                      <button
                        onClick={() => {
                          if (onDelete) onDelete(task);
                          setShowMoreMenu(false);
                        }}
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
                <span>Assigned: {task.assignedTo.displayName || task.assignedTo.email?.split('@')[0]}</span>
              )}
              {task.dueDate && (
                <span className={cn(isOverdue && 'text-red-400')}>
                  Due: {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Task Detail Sheet */}
      {isMobile && (
        <MobileTaskDetailSheet
          task={task}
          isOpen={showDetailSheet}
          onClose={() => setShowDetailSheet(false)}
          onEdit={onEdit || (() => {})}
          onDelete={onDelete || (() => {})}
          onStatusChange={onStatusChange || (() => {})}
        />
      )}
    </>
  );
}