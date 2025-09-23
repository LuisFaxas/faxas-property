"use client"

import React, { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { navItemMapping, type NavItemId } from '@/components/blocks/page-shell';
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
  Plus,
  Minus,
  RotateCcw,
  MoreVertical,
  MoreHorizontal,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface NavigationItem {
  id: NavItemId;
  label: string;
  icon: LucideIcon;
  href: string;
}

interface BottomNavItemProps {
  id: NavItemId;
  item: NavigationItem;
  onRemove: (id: NavItemId) => void;
}

function BottomNavItem({ id, item, onRemove }: BottomNavItemProps) {
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
        "flex items-center gap-3 p-3 rounded-lg transition-all min-h-[48px]",
        "bg-white/5 border border-white/10",
        isLocalDragging && "opacity-50 scale-105",
        !isLocalDragging && "hover:bg-white/10"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none min-h-[24px] min-w-[24px] flex items-center"
        aria-label={`Drag to reorder ${item.label}`}
      >
        <GripVertical className="h-5 w-5 text-white/40" />
      </div>
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 rounded-lg bg-accent/20">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <span className="font-medium">{item.label}</span>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onRemove(id)}
        className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
        aria-label={`Remove ${item.label} from bottom navigation`}
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface AvailableItemProps {
  item: NavigationItem;
  onAdd: (id: NavItemId) => void;
  disabled?: boolean;
}

function AvailableItem({ item, onAdd, disabled }: AvailableItemProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onAdd(item.id)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all w-full text-left min-h-[48px]",
        "bg-white/5 border border-white/10",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 active:scale-[0.98]"
      )}
      aria-label={`Add ${item.label} to bottom navigation`}
    >
      <div className="p-2 rounded-lg bg-white/10">
        <Icon className="h-5 w-5 text-white/70" />
      </div>
      <span className="font-medium flex-1">{item.label}</span>
      <Plus className="h-4 w-4 text-accent" />
    </button>
  );
}

interface RearrangeableNavigationProps {
  currentItems: NavItemId[];
  availableItems: NavigationItem[];
  onSave: (items: NavItemId[]) => Promise<void> | void;
  onCancel: () => void;
  onReset?: () => Promise<void> | void;
}

export function RearrangeableNavigation({
  currentItems,
  availableItems,
  onSave,
  onCancel,
  onReset
}: RearrangeableNavigationProps) {
  const [selectedItems, setSelectedItems] = useState<NavItemId[]>([]);
  const [activeId, setActiveId] = useState<NavItemId | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize with current items (max 3)
  useEffect(() => {
    setSelectedItems(currentItems.slice(0, 3));
  }, [currentItems]);

  // Create map of available items for quick lookup
  const itemsMap = useMemo(() => {
    const map = new Map<NavItemId, NavigationItem>();
    availableItems.forEach(item => {
      map.set(item.id, item);
    });
    return map;
  }, [availableItems]);

  // Compute items not selected for bottom nav
  const availableForSelection = useMemo(() => {
    const selectedSet = new Set(selectedItems);
    return availableItems.filter(item => !selectedSet.has(item.id));
  }, [availableItems, selectedItems]);

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
    setActiveId(event.active.id as NavItemId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedItems((items) => {
        const oldIndex = items.indexOf(active.id as NavItemId);
        const newIndex = items.indexOf(over.id as NavItemId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const handleAdd = (id: NavItemId) => {
    if (selectedItems.length >= 3) {
      toast({
        title: "Maximum items reached",
        description: "You can only have 3 items in the bottom navigation",
        variant: "destructive",
      });
      return;
    }
    setSelectedItems([...selectedItems, id]);
  };

  const handleRemove = (id: NavItemId) => {
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  const handleSave = async () => {
    if (selectedItems.length !== 3) {
      toast({
        title: "Select 3 items",
        description: "Please select exactly 3 items for the bottom navigation",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedItems);
    } catch (error) {
      console.error('Failed to save navigation preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!onReset) return;

    setIsResetting(true);
    try {
      await onReset();
      toast({
        title: "Reset successful",
        description: "Navigation has been reset to defaults",
      });
    } catch (error) {
      console.error('Failed to reset navigation:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const activeItem = activeId ? itemsMap.get(activeId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="font-semibold text-lg">Customize Navigation</h3>
          <p className="text-sm text-muted-foreground">
            Select and arrange 3 items for quick access
          </p>
        </div>
        <div className="flex gap-2">
          {onReset && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10"
                  aria-label="More options"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem
                  onClick={handleReset}
                  disabled={isResetting}
                  className="text-red-400"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to defaults
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="hover:bg-white/10"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedItems.length !== 3 || isSaving}
            className="bg-accent hover:bg-accent/90"
          >
            <Check className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Selected Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-white/70">Bottom Navigation</h4>
            <Badge variant={selectedItems.length === 3 ? "default" : "secondary"} className="text-xs">
              {selectedItems.length}/3 selected
            </Badge>
          </div>

          {selectedItems.length === 0 ? (
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
              <p className="text-white/50">No items selected</p>
              <p className="text-white/30 text-sm mt-1">Add items from below</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedItems}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {selectedItems.map((itemId) => {
                    const item = itemsMap.get(itemId);
                    if (!item) return null;
                    return (
                      <BottomNavItem
                        key={itemId}
                        id={itemId}
                        item={item}
                        onRemove={handleRemove}
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
          )}
        </div>

        {/* Available Items */}
        <div>
          <h4 className="font-medium text-sm text-white/70 mb-3">Available Items</h4>
          {availableForSelection.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/50">All items are in use</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableForSelection.map((item) => (
                <AvailableItem
                  key={item.id}
                  item={item}
                  onAdd={handleAdd}
                  disabled={selectedItems.length >= 3}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav Preview */}
      <div className="border-t border-white/10 p-4 bg-black/20">
        <label className="text-xs text-muted-foreground mb-2 block">Bottom Navigation Preview</label>
        <div className="flex items-center justify-around bg-white/5 rounded-lg p-3">
          {[0, 1, 2].map((index) => {
            const itemId = selectedItems[index];
            const item = itemId ? itemsMap.get(itemId) : null;

            if (item) {
              const Icon = item.icon;
              return (
                <div key={itemId} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-[10px] text-white/70">{item.label}</span>
                </div>
              );
            } else {
              return (
                <div key={index} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="p-2 rounded-lg border-2 border-dashed border-white/20">
                    <div className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] text-white/30">Empty</span>
                </div>
              );
            }
          })}
          <div className="flex flex-col items-center gap-1">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center -mt-2">
              <span className="text-2xl text-white">+</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-lg bg-white/10">
              <MoreHorizontal className="h-5 w-5 text-white/70" />
            </div>
            <span className="text-[10px] text-white/70">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}