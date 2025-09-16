'use client';

import React, { ReactNode } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X, LucideIcon } from 'lucide-react';

export interface DetailSection {
  id: string;
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  className?: string;
}

export interface DetailAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'destructive';
  className?: string;
  onClick: () => void;
}

export interface MobileDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  statusBadge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  };
  headerIcon?: {
    icon: LucideIcon;
    className?: string;
  };
  sections?: DetailSection[];
  customContent?: ReactNode;
  actions?: DetailAction[];
  className?: string;
}

/**
 * Reusable mobile detail sheet for displaying full item details
 * Used for tasks, contacts, budget items, etc.
 */
export function MobileDetailSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  statusBadge,
  headerIcon,
  sections,
  customContent,
  actions,
  className,
}: MobileDetailSheetProps) {
  const HeaderIcon = headerIcon?.icon;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[85vh] bg-graphite-900 border-t border-white/10 rounded-t-2xl overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-graphite-900 z-10 pb-4 -mx-6 px-6 -mt-6 pt-6">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                {HeaderIcon && (
                  <div className={cn(
                    'p-2 rounded-lg bg-white/10',
                    headerIcon?.className
                  )}>
                    <HeaderIcon className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <SheetTitle className="text-white text-lg">
                    {title}
                  </SheetTitle>
                  {subtitle && (
                    <p className="text-sm text-white/60 mt-1">{subtitle}</p>
                  )}
                  {statusBadge && (
                    <Badge 
                      variant={statusBadge.variant} 
                      className={cn('mt-2', statusBadge.className)}
                    >
                      {statusBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto pb-24 -mx-6 px-6">
          {/* Detail sections */}
          {sections && sections.length > 0 && (
            <div className="space-y-4">
              {sections.map((section) => {
                const SectionIcon = section.icon;
                return (
                  <div key={section.id} className={cn('space-y-2', section.className)}>
                    <div className="flex items-center gap-2">
                      {SectionIcon && (
                        <SectionIcon className="h-4 w-4 text-white/60" />
                      )}
                      <span className="text-sm font-medium text-white/80">
                        {section.label}
                      </span>
                    </div>
                    <div className="text-sm text-white">
                      {section.value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom content */}
          {customContent && (
            <div className={cn(sections && sections.length > 0 && 'mt-6')}>
              {customContent}
            </div>
          )}
        </div>

        {/* Fixed action buttons */}
        {actions && actions.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4 space-y-2">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.id}
                  onClick={action.onClick}
                  variant={action.variant || 'outline'}
                  className={cn(
                    'w-full h-12',
                    action.className
                  )}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Pre-built detail sheet for common item types
 */
export interface SimpleDetailItem {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
}

export function SimpleDetailSheet({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  ...props
}: {
  item: SimpleDetailItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (item: SimpleDetailItem) => void;
  onDelete?: (item: SimpleDetailItem) => void;
} & Omit<MobileDetailSheetProps, 'title' | 'isOpen' | 'onClose'>) {
  if (!item) return null;

  const sections: DetailSection[] = [];
  
  if (item.description) {
    sections.push({
      id: 'description',
      label: 'Description',
      value: item.description,
    });
  }

  if (item.assignee) {
    sections.push({
      id: 'assignee',
      label: 'Assigned To',
      value: item.assignee,
    });
  }

  if (item.dueDate) {
    sections.push({
      id: 'dueDate',
      label: 'Due Date',
      value: new Date(item.dueDate).toLocaleDateString(),
    });
  }

  if (item.tags && item.tags.length > 0) {
    sections.push({
      id: 'tags',
      label: 'Tags',
      value: (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ),
    });
  }

  const actions: DetailAction[] = [];
  
  if (onEdit) {
    actions.push({
      id: 'edit',
      label: 'Edit',
      variant: 'outline',
      onClick: () => {
        onEdit(item);
        onClose();
      },
    });
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete',
      variant: 'destructive',
      onClick: () => {
        onDelete(item);
        onClose();
      },
    });
  }

  return (
    <MobileDetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      statusBadge={item.status ? {
        label: item.status,
        className: 'bg-blue-500/20 text-blue-400',
      } : undefined}
      sections={sections}
      actions={actions}
      {...props}
    />
  );
}