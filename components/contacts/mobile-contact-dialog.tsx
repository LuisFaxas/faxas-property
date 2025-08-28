'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface MobileContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive dialog component that switches between Dialog (desktop) and Sheet (mobile)
 * for creating and editing contacts
 */
export function MobileContactDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: MobileContactDialogProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className={cn(
            "h-[90vh] bg-gray-900 border-t border-white/10 flex flex-col",
            "overflow-hidden",
            className
          )}
        >
          <SheetHeader className="pb-4 border-b border-white/10">
            <SheetTitle className="text-white text-xl">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-white/60">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 px-4">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

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
      </DialogContent>
    </Dialog>
  );
}