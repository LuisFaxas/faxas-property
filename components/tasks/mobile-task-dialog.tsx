'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface MobileTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MobileTaskDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className
}: MobileTaskDialogProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Mobile: Use full-screen bottom sheet
  if (isMobile) {
    return (
      <div className={cn("mobile-task-dialog", open && "active")}>
        {open && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
              onClick={() => onOpenChange(false)}
            />
            
            {/* Full-screen bottom sheet */}
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-50",
                "h-full max-h-[calc(100vh-env(safe-area-inset-top))]",
                "glass border-t border-white/10",
                "animate-in slide-in-from-bottom duration-300",
                "flex flex-col",
                "bg-graphite-900",
                className
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  {description && (
                    <p className="text-sm text-white/60 mt-1">{description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="text-white/70 hover:text-white -mr-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="border-t border-white/10 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  {footer}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop: Use standard dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[525px] bg-graphite-800 border-white/10",
        className
      )}>
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-white/60">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}