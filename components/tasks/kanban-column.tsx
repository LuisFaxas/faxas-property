'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskCard } from './sortable-task-card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: any[];
  isOver?: boolean;
  onTaskEdit?: (task: any) => void;
  onTaskDelete?: (task: any) => void;
  onTaskSelect?: (task: any) => void;
  onTaskMove?: (taskId: string, newStatus: string) => void;
  onAddTask?: (status: string) => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  isOver,
  onTaskEdit,
  onTaskDelete,
  onTaskSelect,
  onTaskMove,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id,
  });

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col bg-graphite-800/30 rounded-lg border-2 border-dashed transition-all duration-200',
        'min-w-[320px] md:min-w-[350px] max-w-[350px]',
        color,
        (isOver || isDroppableOver) && 'border-solid bg-graphite-800/50 scale-[1.02]'
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">{title}</h3>
            <Badge variant="secondary" className="bg-white/10">
              {tasks.length}
            </Badge>
          </div>
          {onAddTask && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onAddTask(id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 p-4">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm">
                No tasks in {title.toLowerCase()}
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onSelect={onTaskSelect}
                  onStatusChange={onTaskMove}
                />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}