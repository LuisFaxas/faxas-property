'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  MoreVertical,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Paperclip,
  MessageSquare,
  Users,
  MapPin,
  Cloud,
  Flag,
  Milestone,
  GitBranch,
  Camera,
  Edit,
  Trash,
  ChevronRight,
  AlertTriangle,
  Zap,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: any;
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  onSelect?: (taskId: string) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  className?: string;
}

const statusConfig = {
  TODO: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' },
  IN_PROGRESS: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  IN_REVIEW: { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/20' },
  BLOCKED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
  CANCELLED: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/20' },
};

const priorityConfig = {
  LOW: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: null },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: null },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
  URGENT: { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle },
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-600/30', icon: Zap },
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onSelect,
  isSelected,
  isDragging,
  className,
}: TaskCardProps) {
  const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Clock;
  const statusStyle = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
  const priorityStyle = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
  const PriorityIcon = priorityStyle.icon;

  // Calculate if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  // Format counts
  const subtaskCount = task._count?.subtasks || 0;
  const completedSubtasks = task.completedSubtasks || 0;
  const attachmentCount = task._count?.attachments || 0;
  const photoCount = task._count?.photos || 0;
  const commentCount = task._count?.comments || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative bg-graphite-800/50 backdrop-blur-sm rounded-lg p-4',
        'border border-white/10 hover:border-white/20 transition-all duration-200',
        'hover:shadow-lg hover:shadow-black/50',
        isSelected && 'ring-2 ring-gold-500/50 border-gold-500/50',
        isDragging && 'opacity-50 cursor-grabbing',
        className
      )}
      onClick={() => onSelect?.(task.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1">
          <StatusIcon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', statusStyle.color)} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate pr-2">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-white/60 line-clamp-2 mt-1">{task.description}</p>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-graphite-800 border-white/10">
            <DropdownMenuItem onClick={() => onEdit?.(task)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={() => onStatusChange?.(task.id, 'TODO')}
              disabled={task.status === 'TODO'}
            >
              Set as Todo
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange?.(task.id, 'IN_PROGRESS')}
              disabled={task.status === 'IN_PROGRESS'}
            >
              Set as In Progress
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange?.(task.id, 'COMPLETED')}
              disabled={task.status === 'COMPLETED'}
            >
              Mark Complete
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={() => onDelete?.(task)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Bar */}
      {task.progressPercentage > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>Progress</span>
            <span>{task.progressPercentage}%</span>
          </div>
          <Progress value={task.progressPercentage} className="h-1.5" />
        </div>
      )}

      {/* Badges Row */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Priority Badge */}
        <Badge className={cn('gap-1', priorityStyle.bg, priorityStyle.color)}>
          {PriorityIcon && <PriorityIcon className="h-3 w-3" />}
          {task.priority}
        </Badge>

        {/* Milestone Badge */}
        {task.isMilestone && (
          <Badge className="gap-1 bg-purple-500/20 text-purple-400">
            <Milestone className="h-3 w-3" />
            Milestone
          </Badge>
        )}

        {/* Critical Path Badge */}
        {task.isOnCriticalPath && (
          <Badge className="gap-1 bg-red-500/20 text-red-400">
            <Zap className="h-3 w-3" />
            Critical Path
          </Badge>
        )}

        {/* Weather Dependent */}
        {task.weatherDependent && (
          <Badge className="gap-1 bg-sky-500/20 text-sky-400">
            <Cloud className="h-3 w-3" />
            Weather
          </Badge>
        )}

        {/* Requires Inspection */}
        {task.requiresInspection && (
          <Badge className="gap-1 bg-amber-500/20 text-amber-400">
            <Shield className="h-3 w-3" />
            Inspection
          </Badge>
        )}
      </div>

      {/* Meta Information */}
      <div className="flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-3">
          {/* Subtasks */}
          {subtaskCount > 0 && (
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>{completedSubtasks}/{subtaskCount}</span>
            </div>
          )}

          {/* Attachments */}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{attachmentCount}</span>
            </div>
          )}

          {/* Photos */}
          {photoCount > 0 && (
            <div className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              <span>{photoCount}</span>
            </div>
          )}

          {/* Comments */}
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{commentCount}</span>
            </div>
          )}

          {/* Location */}
          {task.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{task.location}</span>
            </div>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={cn('flex items-center gap-1', isOverdue && 'text-red-400')}>
            <Clock className="h-3 w-3" />
            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
          </div>
        )}
      </div>

      {/* Assignee */}
      {task.assignedTo && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gold-500/20 flex items-center justify-center">
              <Users className="h-3 w-3 text-gold-500" />
            </div>
            <span className="text-xs text-white/80">
              {task.assignedTo.email?.split('@')[0]}
            </span>
          </div>
        </div>
      )}

      {/* Blocked Indicator */}
      {task.status === 'BLOCKED' && (
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}