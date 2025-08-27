'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MobileTaskDetailSheet } from './mobile-task-detail-sheet';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface MobileListViewProps {
  tasks: any[];
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
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(() => {
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showCompletedTasks');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Separate active and completed tasks
  const activeTasks = tasks.filter(task => task.status !== 'COMPLETED');
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED');

  // Save preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showCompletedTasks', JSON.stringify(showCompletedTasks));
    }
  }, [showCompletedTasks]);

  const handleCheckboxChange = (task: any, checked: boolean) => {
    if (onStatusChange) {
      onStatusChange(task.id, checked ? 'COMPLETED' : 'TODO');
    }
  };

  const handleRowClick = (task: any) => {
    setSelectedTask(task);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-white/40 mb-4">No tasks found</div>
      </div>
    );
  }

  const renderTask = (task: any) => {
    const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Clock;
    const statusStyle = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
    const priorityStyle = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
    const isCompleted = task.status === 'COMPLETED';

    return (
      <div
        key={task.id}
        className={cn(
          "relative bg-graphite-800/50 backdrop-blur-sm rounded-lg",
          "border border-white/10 transition-all duration-200",
          "min-h-[60px] cursor-pointer hover:bg-graphite-800/70",
          isCompleted && "opacity-60"
        )}
        onClick={() => handleRowClick(task)}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Checkbox */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0"
            >
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => handleCheckboxChange(task, checked as boolean)}
                className={cn(
                  "h-5 w-5 border-white/30",
                  isCompleted && "border-green-500 bg-green-500"
                )}
              />
            </div>
            
            {/* Status Icon */}
            <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusStyle.color)} />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-medium text-white text-sm",
                isCompleted && "line-through text-white/60"
              )}>
                {task.title}
              </div>
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {/* Progress and Toggle */}
        {(activeTasks.length > 0 || completedTasks.length > 0) && (
          <div className="bg-graphite-800/30 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Progress info */}
                <div className="text-sm text-white/80">
                  {completedTasks.length > 0 ? (
                    <>
                      <span className="font-medium text-green-400">{completedTasks.length}</span>
                      <span className="text-white/60"> of </span>
                      <span className="font-medium">{tasks.length}</span>
                      <span className="text-white/60"> tasks completed</span>
                    </>
                  ) : (
                    <span className="text-white/60">No completed tasks</span>
                  )}
                </div>
                {/* Progress bar */}
                {tasks.length > 0 && (
                  <div className="mt-2 w-full bg-graphite-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              
              {/* Toggle button */}
              {completedTasks.length > 0 && (
                <button
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className={cn(
                    "ml-4 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    "border border-white/20",
                    showCompletedTasks 
                      ? "bg-white/10 text-white" 
                      : "bg-transparent text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {showCompletedTasks ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div className="space-y-2">
            {activeTasks.map(renderTask)}
          </div>
        )}

        {/* Completed Tasks Section */}
        {showCompletedTasks && completedTasks.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-white/60">Completed</span>
            </div>
            <div className="space-y-2">
              {completedTasks.map(renderTask)}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Sheet */}
      <MobileTaskDetailSheet
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => {
          setSelectedTask(null);
          if (onEdit) onEdit(task);
        }}
        onDelete={(task) => {
          setSelectedTask(null);
          if (onDelete) onDelete(task);
        }}
        onStatusChange={(taskId, status) => {
          if (onStatusChange) onStatusChange(taskId, status);
          // Update the selected task if it's still open
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask({ ...selectedTask, status });
          }
        }}
      />
    </>
  );
}