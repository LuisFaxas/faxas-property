'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  MoreVertical,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Check,
  Trash2,
  Edit,
  ChevronRight,
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
  const [showActions, setShowActions] = useState(false);

  const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Clock;
  const statusStyle = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
  const priorityStyle = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    const deltaX = e.touches[0].clientX - startX;
    setCurrentX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    if (currentX > 100) {
      // Swipe right - Mark as done
      onStatusChange?.(task.id, 'COMPLETED');
    } else if (currentX < -100) {
      // Swipe left - Show actions
      setShowActions(true);
    }
    
    setCurrentX(0);
    setIsDragging(false);
  };

  // Long press handler
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleLongPressStart = () => {
    if (!isMobile) return;
    const timer = setTimeout(() => {
      setShowActions(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden touch-pan-y',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      {/* Swipe indicators */}
      {isDragging && currentX > 50 && (
        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-start pl-4 z-0">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <span className="ml-2 text-green-500 font-medium">Complete</span>
        </div>
      )}
      {isDragging && currentX < -50 && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-4 z-0">
          <span className="mr-2 text-red-500 font-medium">Delete</span>
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
      )}

      {/* Main card content */}
      <div
        className={cn(
          'relative bg-graphite-800/50 backdrop-blur-sm rounded-lg',
          'border border-white/10 transition-all duration-200',
          'min-h-[80px]', // Ensure minimum touch target height
          isDragging && 'transition-none'
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
                <h3 className="font-medium text-white text-base leading-tight">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-white/60 line-clamp-2 mt-1">{task.description}</p>
                )}
              </div>
            </div>
            
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
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

        {/* Quick action buttons (mobile) */}
        {isMobile && showActions && (
          <div className="absolute inset-0 bg-graphite-900/95 backdrop-blur-sm flex items-center justify-center gap-4 rounded-lg">
            <Button
              size="sm"
              variant="ghost"
              className="h-12 w-12 rounded-full bg-blue-600/20 hover:bg-blue-600/30"
              onClick={() => {
                onEdit?.(task);
                setShowActions(false);
              }}
            >
              <Edit className="h-5 w-5 text-blue-400" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-12 w-12 rounded-full bg-green-600/20 hover:bg-green-600/30"
              onClick={() => {
                onStatusChange?.(task.id, 'COMPLETED');
                setShowActions(false);
              }}
            >
              <Check className="h-5 w-5 text-green-400" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-12 w-12 rounded-full bg-red-600/20 hover:bg-red-600/30"
              onClick={() => {
                onDelete?.(task);
                setShowActions(false);
              }}
            >
              <Trash2 className="h-5 w-5 text-red-400" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
              onClick={() => setShowActions(false)}
            >
              <XCircle className="h-5 w-5 text-white/60" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}