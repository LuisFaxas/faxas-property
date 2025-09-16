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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MobileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  preventScroll?: boolean;
}

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  full: 'sm:max-w-full',
};

/**
 * Universal mobile dialog component that adapts between Dialog (desktop) and Sheet (mobile)
 * Provides consistent modal experience across all pages
 */
export function MobileDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
  showCloseButton = true,
  preventScroll = false,
}: MobileDialogProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Mobile: Use bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className={cn(
            "h-[90vh] bg-graphite-900 border-t border-white/10 rounded-t-2xl",
            "flex flex-col",
            preventScroll && "overflow-hidden",
            className
          )}
        >
          {/* Header */}
          <SheetHeader className="relative pb-4 border-b border-white/10">
            <SheetTitle className="text-white text-lg pr-8">
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="text-white/60 text-sm">
                {description}
              </SheetDescription>
            )}
            {showCloseButton && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="absolute right-0 top-0 h-8 w-8 p-0 text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </SheetHeader>

          {/* Content */}
          <div className={cn(
            "flex-1 overflow-y-auto py-4 px-4",
            preventScroll && "overflow-hidden"
          )}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-white/10 px-4 pt-4 pb-safe">
              {footer}
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className={cn(
          "bg-graphite-800 border-white/10 text-white",
          sizeClasses[size],
          className
        )}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if dialog contains forms
          const target = e.target as HTMLElement;
          if (target.closest('form')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-white/60">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className={cn(
          "py-4",
          preventScroll ? "overflow-hidden" : "overflow-y-auto max-h-[60vh]"
        )}>
          {children}
        </div>

        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pre-configured variants for common use cases
 */
export const MobileFormDialog: React.FC<MobileDialogProps> = (props) => (
  <MobileDialog {...props} size="md" preventScroll={false} />
);

export const MobileConfirmDialog: React.FC<MobileDialogProps> = (props) => (
  <MobileDialog {...props} size="sm" preventScroll={true} />
);

export const MobileDetailDialog: React.FC<MobileDialogProps> = (props) => (
  <MobileDialog {...props} size="lg" preventScroll={false} />
);