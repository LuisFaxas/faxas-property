"use client"

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Home,
  ClipboardList,
  Calendar,
  FileText,
  Users,
  DollarSign,
  ShoppingCart,
  FileBox,
  AlertTriangle,
  Upload,
  CreditCard,
  GripVertical,
  Check,
  X,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  adminHref?: string;
  contractorHref?: string;
}

// Navigation item mapping
const navigationItems: Record<string, NavigationItem> = {
  home: {
    id: 'home',
    href: '/admin',
    adminHref: '/admin',
    contractorHref: '/contractor',
    label: 'Home',
    icon: Home
  },
  tasks: {
    id: 'tasks',
    href: '/admin/tasks',
    label: 'Tasks',
    icon: ClipboardList
  },
  'my-tasks': {
    id: 'my-tasks',
    href: '/contractor/my-tasks',
    label: 'My Tasks',
    icon: ClipboardList
  },
  bidding: {
    id: 'bidding',
    href: '/admin/bidding',
    label: 'Bidding',
    icon: FileText
  },
  bids: {
    id: 'bids',
    href: '/contractor/bids',
    label: 'Bids',
    icon: FileText
  },
  schedule: {
    id: 'schedule',
    href: '/admin/schedule',
    label: 'Schedule',
    icon: Calendar
  },
  'my-schedule': {
    id: 'my-schedule',
    href: '/contractor/my-schedule',
    label: 'Schedule',
    icon: Calendar
  },
  contacts: {
    id: 'contacts',
    href: '/admin/contacts',
    label: 'Contacts',
    icon: Users
  },
  budget: {
    id: 'budget',
    href: '/admin/budget',
    label: 'Budget',
    icon: DollarSign
  },
  procurement: {
    id: 'procurement',
    href: '/admin/procurement',
    label: 'Procurement',
    icon: ShoppingCart
  },
  plans: {
    id: 'plans',
    href: '/admin/plans',
    adminHref: '/admin/plans',
    contractorHref: '/contractor/plans',
    label: 'Plans',
    icon: FileBox
  },
  risks: {
    id: 'risks',
    href: '/admin/risks',
    label: 'Risks',
    icon: AlertTriangle
  },
  uploads: {
    id: 'uploads',
    href: '/contractor/uploads',
    label: 'Uploads',
    icon: Upload
  },
  invoices: {
    id: 'invoices',
    href: '/contractor/invoices',
    label: 'Invoices',
    icon: CreditCard
  }
};

interface SortableItemProps {
  id: string;
  item: NavigationItem;
  isDragging?: boolean;
  isInBottomNav?: boolean;
}

function SortableItem({ id, item, isDragging, isInBottomNav }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isLocalDragging,
  } = useSortable({ id });

  const Icon = item.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all",
        "bg-white/5 border border-white/10",
        isLocalDragging && "opacity-50 scale-105",
        !isLocalDragging && "hover:bg-white/10"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-white/40" />
      </div>
      <div className="flex items-center gap-3 flex-1">
        <div className={cn(
          "p-2 rounded-lg",
          isInBottomNav ? "bg-accent/20" : "bg-white/10"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            isInBottomNav ? "text-accent" : "text-white/70"
          )} />
        </div>
        <span className="font-medium">{item.label}</span>
      </div>
      {isInBottomNav && (
        <div className="text-xs text-accent bg-accent/20 px-2 py-1 rounded">
          Bottom Nav
        </div>
      )}
    </div>
  );
}

interface RearrangeableNavigationProps {
  currentItems: string[];
  availableItems: NavigationItem[];
  onSave: (items: string[]) => void;
  onCancel: () => void;
}

export function RearrangeableNavigation({
  currentItems,
  availableItems,
  onSave,
  onCancel
}: RearrangeableNavigationProps) {
  const [items, setItems] = useState<string[]>(currentItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const activeItem = activeId ? navigationItems[activeId] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="font-semibold text-lg">Rearrange Navigation</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder • First 3 items appear in bottom nav
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => onSave(items)}
            className="bg-accent hover:bg-accent/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>
      </div>

      {/* Navigation Items List */}
      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((itemId, index) => {
                const item = navigationItems[itemId];
                if (!item) return null;
                return (
                  <SortableItem
                    key={itemId}
                    id={itemId}
                    item={item}
                    isInBottomNav={index < 3}
                  />
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeItem ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-accent shadow-lg">
                <GripVertical className="h-5 w-5 text-white/40" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <activeItem.icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-medium">{activeItem.label}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Bottom Nav Preview */}
      <div className="border-t border-white/10 p-4 bg-black/20">
        <label className="text-xs text-muted-foreground mb-2 block">Bottom Navigation Preview</label>
        <div className="flex items-center justify-around bg-white/5 rounded-lg p-3">
          {items.slice(0, 3).map((itemId) => {
            const item = navigationItems[itemId];
            if (!item) return null;
            const Icon = item.icon;
            return (
              <div key={itemId} className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-[10px] text-white/70">{item.label}</span>
              </div>
            );
          })}
          <div className="flex flex-col items-center gap-1">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center -mt-2">
              <span className="text-2xl text-white">+</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-lg bg-white/10">
              <span className="text-xs">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}