'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Check,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

interface MobileListViewProps {
  tasks: any[];
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  className?: string;
}

const statusConfig = {
  TODO: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  IN_PROGRESS: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  BLOCKED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
  DONE: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
};

const priorityConfig = {
  LOW: { color: 'text-blue-400' },
  MEDIUM: { color: 'text-yellow-400' },
  HIGH: { color: 'text-orange-400' },
  URGENT: { color: 'text-red-400' },
};

export function MobileListView({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  className
}: MobileListViewProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [swipedTask, setSwipedTask] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
    setSwipedTask(taskId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    setCurrentX(Math.max(-150, Math.min(150, deltaX))); // Limit swipe distance
  };

  const handleTouchEnd = (task: any) => {
    if (currentX > 100) {
      // Swipe right - Mark as done
      onStatusChange?.(task.id, 'DONE');
    } else if (currentX < -100) {
      // Swipe left - Show delete
      onDelete?.(task);
    }
    
    setCurrentX(0);
    setIsDragging(false);
    setSwipedTask(null);
  };

  const handleRowClick = (taskId: string, e: React.MouseEvent) => {
    // Don't expand if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-white/40 mb-4">No tasks found</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {tasks.map((task) => {
        const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Clock;
        const statusStyle = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
        const priorityStyle = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
        const isExpanded = expandedTask === task.id;
        const isSwiped = swipedTask === task.id;
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

        return (
          <div
            key={task.id}
            className="relative overflow-hidden rounded-lg"
            onTouchStart={(e) => handleTouchStart(e, task.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(task)}
          >
            {/* Swipe backgrounds */}
            {isDragging && isSwiped && currentX > 50 && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-start pl-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-2 text-green-500 text-sm font-medium">Complete</span>
              </div>
            )}
            {isDragging && isSwiped && currentX < -50 && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-4">
                <span className="mr-2 text-red-500 text-sm font-medium">Delete</span>
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
            )}

            {/* Main row content */}
            <div
              className={cn(
                "relative bg-graphite-800/50 backdrop-blur-sm",
                "border border-white/10 transition-all duration-200",
                "min-h-[72px] cursor-pointer",
                isExpanded && "border-blue-500/30",
                isDragging && isSwiped && "transition-none"
              )}
              style={{
                transform: isSwiped && isDragging ? `translateX(${currentX}px)` : 'translateX(0)',
              }}
              onClick={(e) => handleRowClick(task.id, e)}
            >
              <div className="p-3">
                {/* Main row */}
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <StatusIcon className={cn('h-5 w-5 flex-shrink-0', statusStyle.color)} />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-xs', priorityStyle.color)}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className={cn('text-xs', isOverdue ? 'text-red-400' : 'text-white/60')}>
                            {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        </>
                      )}
                      {task.assignedTo && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-xs text-white/60">
                            {task.assignedTo.displayName || task.assignedTo.email?.split('@')[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white/60 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(task);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-white/40 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    {/* Description */}
                    {task.description && (
                      <p className="text-sm text-white/70">{task.description}</p>
                    )}
                    
                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={cn('text-xs', statusStyle.bg, statusStyle.color)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {isOverdue && (
                        <Badge className="text-xs bg-red-500/20 text-red-400">
                          Overdue
                        </Badge>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2">
                      {task.status !== 'DONE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 bg-green-600/20 border-green-600/30 text-green-400 hover:bg-green-600/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange?.(task.id, 'DONE');
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(task);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}