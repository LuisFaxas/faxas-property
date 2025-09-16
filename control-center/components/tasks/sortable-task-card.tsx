'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './task-card';

interface SortableTaskCardProps {
  task: any;
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
  onSelect?: (task: any) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function SortableTaskCard({
  task,
  onEdit,
  onDelete,
  onSelect,
  onStatusChange,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onSelect={onSelect}
        onStatusChange={onStatusChange}
        isDragging={isDragging}
      />
    </div>
  );
}