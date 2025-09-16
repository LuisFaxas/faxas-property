'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, CheckCircle, LucideIcon } from 'lucide-react';

export interface ListSection<T> {
  id: string;
  title: string;
  icon?: LucideIcon;
  items: T[];
  collapsed?: boolean;
  emptyMessage?: string;
  renderItem: (item: T, index: number) => ReactNode;
}

export interface MobileListProps<T> {
  sections: ListSection<T>[];
  showProgress?: boolean;
  progressConfig?: {
    completed: number;
    total: number;
    label?: string;
  };
  showCompletedToggle?: boolean;
  completedSectionId?: string;
  storageKey?: string;
  className?: string;
  emptyState?: ReactNode;
  onSectionToggle?: (sectionId: string, collapsed: boolean) => void;
}

/**
 * Reusable mobile list component with collapsible sections
 * Handles completed/archived items, progress tracking, etc.
 */
export function MobileList<T>({
  sections,
  showProgress = false,
  progressConfig,
  showCompletedToggle = false,
  completedSectionId = 'completed',
  storageKey,
  className,
  emptyState,
  onSectionToggle,
}: MobileListProps<T>) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    // Load collapsed state from localStorage if storageKey provided
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${storageKey}-collapsed`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    // Default: collapse completed section
    return showCompletedToggle ? new Set([completedSectionId]) : new Set();
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(
        `${storageKey}-collapsed`,
        JSON.stringify(Array.from(collapsedSections))
      );
    }
  }, [collapsedSections, storageKey]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      
      if (onSectionToggle) {
        onSectionToggle(sectionId, !prev.has(sectionId));
      }
      
      return next;
    });
  };

  // Calculate total items
  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

  // If no items at all, show empty state
  if (totalItems === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  const completedSection = sections.find(s => s.id === completedSectionId);
  const activeSections = sections.filter(s => s.id !== completedSectionId);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress indicator */}
      {showProgress && progressConfig && (
        <div className="bg-graphite-800/30 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-white/80">
                <span className="font-medium text-green-400">{progressConfig.completed}</span>
                <span className="text-white/60"> of </span>
                <span className="font-medium">{progressConfig.total}</span>
                <span className="text-white/60"> {progressConfig.label || 'completed'}</span>
              </div>
              {progressConfig.total > 0 && (
                <div className="mt-2 w-full bg-graphite-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progressConfig.completed / progressConfig.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
            
            {/* Toggle for completed section */}
            {showCompletedToggle && completedSection && completedSection.items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection(completedSectionId)}
                className="ml-4 px-3 py-1.5 text-xs font-medium border border-white/20 text-white/60 hover:text-white hover:bg-white/5"
              >
                {collapsedSections.has(completedSectionId) ? 'Show' : 'Hide'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Active sections */}
      {activeSections.map(section => (
        <ListSection
          key={section.id}
          section={section}
          isCollapsed={collapsedSections.has(section.id)}
          onToggle={() => toggleSection(section.id)}
        />
      ))}

      {/* Completed section (if exists) */}
      {completedSection && !collapsedSections.has(completedSectionId) && completedSection.items.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-white/60">
              {completedSection.title} ({completedSection.items.length})
            </span>
          </div>
          <ListSection
            section={completedSection}
            isCollapsed={false}
            onToggle={() => {}}
            hideHeader
          />
        </div>
      )}
    </div>
  );
}

/**
 * Individual list section component
 */
function ListSection<T>({
  section,
  isCollapsed,
  onToggle,
  hideHeader = false,
}: {
  section: ListSection<T>;
  isCollapsed: boolean;
  onToggle: () => void;
  hideHeader?: boolean;
}) {
  const SectionIcon = section.icon;

  if (section.items.length === 0) {
    return null;
  }

  return (
    <div>
      {!hideHeader && (
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 mb-2 transition-colors w-full"
        >
          {SectionIcon && <SectionIcon className="h-4 w-4" />}
          <span className="flex-1 text-left font-medium">
            {section.title} ({section.items.length})
          </span>
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform',
            isCollapsed && '-rotate-90'
          )} />
        </button>
      )}
      
      {!isCollapsed && (
        <div className="space-y-2">
          {section.items.length === 0 && section.emptyMessage ? (
            <div className="text-sm text-white/40 text-center py-4">
              {section.emptyMessage}
            </div>
          ) : (
            section.items.map((item, index) => section.renderItem(item, index))
          )}
        </div>
      )}
    </div>
  );
}

