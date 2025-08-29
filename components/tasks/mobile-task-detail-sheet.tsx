'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Check,
  X,
  Calendar,
  User,
  MapPin,
  FileText,
  Hammer,
  Tag,
  ChevronLeft,
  Circle,
} from 'lucide-react';

interface MobileTaskDetailSheetProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  onStatusChange: (taskId: string, status: string) => void;
}

const statusConfig = {
  TODO: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'To Do' },
  IN_PROGRESS: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/20', label: 'In Progress' },
  BLOCKED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20', label: 'Blocked' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20', label: 'Completed' },
};

const priorityConfig = {
  LOW: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Low Priority' },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Medium Priority' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High Priority' },
  URGENT: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgent' },
};

export function MobileTaskDetailSheet({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: MobileTaskDetailSheetProps) {
  if (!task) return null;

  const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Clock;
  const statusStyle = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
  const priorityStyle = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const isCompleted = task.status === 'COMPLETED';

  const handleComplete = () => {
    onStatusChange(task.id, isCompleted ? 'TODO' : 'COMPLETED');
    setTimeout(() => onClose(), 300);
  };

  const handleDelete = () => {
    onDelete(task);
    onClose();
  };

  const handleEdit = () => {
    onEdit(task);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-graphite-900 border-t border-white/10 rounded-t-2xl overflow-hidden"
      >
        {/* Hidden title for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>{task.title}</SheetTitle>
        </SheetHeader>
        
        {/* Header with status icon */}
        <div className="sticky top-0 bg-graphite-900 z-10 pb-4 -mx-6 px-6 -mt-6 pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', statusStyle.bg)}>
                <StatusIcon className={cn('h-6 w-6', statusStyle.color)} />
              </div>
              <div>
                <h2 className={cn(
                  'text-lg font-semibold text-white',
                  isCompleted && 'line-through opacity-60'
                )}>
                  {task.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn('text-xs', statusStyle.bg, statusStyle.color)}>
                    {statusStyle.label}
                  </Badge>
                  <Badge className={cn('text-xs', priorityStyle.bg, priorityStyle.color)}>
                    {priorityStyle.label}
                  </Badge>
                  {isOverdue && (
                    <Badge className="text-xs bg-red-500/20 text-red-400">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white/60"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto pb-24 -mx-6 px-6">
          {/* Description */}
          {task.description && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-white/60" />
                <span className="text-sm font-medium text-white/80">Description</span>
              </div>
              <p className="text-sm text-white/70 bg-graphite-800/50 rounded-lg p-3">
                {task.description}
              </p>
            </div>
          )}

          {/* Task details */}
          <div className="space-y-4 mb-6">
            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/60">Due Date</span>
                </div>
                <span className={cn('text-sm font-medium', isOverdue ? 'text-red-400' : 'text-white')}>
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {/* Start date */}
            {task.startDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/60">Start Date</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {format(new Date(task.startDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {/* Assigned to */}
            {task.assignedTo && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/60">Assigned To</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {task.assignedTo.displayName || task.assignedTo.email?.split('@')[0]}
                </span>
              </div>
            )}

            {/* Location */}
            {task.location && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/60">Location</span>
                </div>
                <span className="text-sm font-medium text-white">{task.location}</span>
              </div>
            )}

            {/* Trade */}
            {task.trade && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hammer className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/60">Trade</span>
                </div>
                <span className="text-sm font-medium text-white">{task.trade}</span>
              </div>
            )}

            {/* Progress */}
            {task.progressPercentage !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Progress</span>
                  <span className="text-sm font-medium text-white">{task.progressPercentage}%</span>
                </div>
                <div className="w-full bg-graphite-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${task.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-white/60" />
                <span className="text-sm font-medium text-white/80">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs bg-white/5 text-white/70">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/80">Subtasks</span>
                <span className="text-xs text-white/60">
                  {task.subtasks.filter((st: any) => st.status === 'COMPLETED').length} of {task.subtasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {task.subtasks.map((subtask: any) => (
                  <div
                    key={subtask.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg bg-graphite-800/50',
                      subtask.status === 'COMPLETED' && 'opacity-60'
                    )}
                  >
                    {subtask.status === 'COMPLETED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-white/40" />
                    )}
                    <span className={cn(
                      'text-sm text-white',
                      subtask.status === 'COMPLETED' && 'line-through'
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-white/40 space-y-1">
            {task.createdAt && (
              <p>Created: {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}</p>
            )}
            {task.updatedAt && (
              <p>Updated: {format(new Date(task.updatedAt), 'MMM d, yyyy h:mm a')}</p>
            )}
          </div>
        </div>

        {/* Fixed action buttons */}
        <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              variant="outline"
              className="flex-1 h-12 bg-blue-600/20 border-blue-600/30 text-blue-400 hover:bg-blue-600/30"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </Button>
            <Button
              onClick={handleComplete}
              variant="outline"
              className={cn(
                'flex-1 h-12',
                isCompleted
                  ? 'bg-yellow-600/20 border-yellow-600/30 text-yellow-400 hover:bg-yellow-600/30'
                  : 'bg-green-600/20 border-green-600/30 text-green-400 hover:bg-green-600/30'
              )}
            >
              {isCompleted ? (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Mark Incomplete
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Task
                </>
              )}
            </Button>
          </div>
          <Button
            onClick={handleDelete}
            variant="outline"
            className="w-full h-12 bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/30"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Task
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}