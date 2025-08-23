'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './task-card';
import { KanbanColumn } from './kanban-column';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

interface KanbanBoardProps {
  tasks: any[];
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
  onTaskEdit?: (task: any) => void;
  onTaskDelete?: (task: any) => void;
  onTaskSelect?: (task: any) => void;
  className?: string;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'border-gray-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-purple-500' },
  { id: 'BLOCKED', title: 'Blocked', color: 'border-red-500' },
  { id: 'COMPLETED', title: 'Completed', color: 'border-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', color: 'border-gray-600' },
];

export function KanbanBoard({
  tasks = [],
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  onTaskSelect,
  className,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, any[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      BLOCKED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    tasks.forEach((task) => {
      const status = task.status as TaskStatus;
      if (grouped[status]) {
        grouped[status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeId),
    [activeId, tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;

    // Check if we're dropping on a column
    if (columns.some(col => col.id === targetStatus)) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        onTaskMove?.(taskId, targetStatus);
      }
    }

    setActiveId(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className={cn('w-full', className)}>
        <div className="flex gap-4 p-4 min-h-[calc(100vh-12rem)]">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={tasksByStatus[column.id]}
              isOver={overId === column.id}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
              onTaskSelect={onTaskSelect}
              onTaskMove={onTaskMove}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-50 rotate-3">
            <TaskCard
              task={activeTask}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}