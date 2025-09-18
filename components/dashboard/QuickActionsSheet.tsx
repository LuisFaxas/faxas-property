'use client';

import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Calendar,
  UserPlus,
  Upload,
  FileText,
  DollarSign,
} from 'lucide-react';

interface QuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionsSheet({ open, onOpenChange }: QuickActionsSheetProps) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const actions = [
    {
      label: 'Add Task',
      icon: Plus,
      href: '/admin/tasks/new',
      description: 'Create a new task',
    },
    {
      label: 'Create RFP',
      icon: FileText,
      href: '/admin/bidding/new',
      description: 'Request for Proposal',
    },
    {
      label: 'Add Budget Item',
      icon: DollarSign,
      href: '/admin/budget',
      description: 'Add to project budget',
    },
    {
      label: 'Schedule Event',
      icon: Calendar,
      href: '/admin/schedule/new',
      description: 'Add to calendar',
    },
    {
      label: 'Add Contact',
      icon: UserPlus,
      href: '/admin/contacts/new',
      description: 'Add team member or vendor',
    },
    {
      label: 'Upload Document',
      icon: Upload,
      href: '/admin/documents',
      description: 'Upload plans or files',
    },
  ];

  const handleAction = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? 'bottom' : 'right'}
        className={`glass motion-reduce:transition-none motion-reduce:animate-none ${isMobile ? '' : 'md:w-[360px]'}`}
        aria-label="Quick Actions"
      >
        <SheetHeader>
          <SheetTitle className="text-white">Quick Actions</SheetTitle>
          <SheetDescription className="text-white/60">
            Common tasks and shortcuts
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                type="button"
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 hover:bg-white/5
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-ring focus-visible:ring-offset-2
                           focus-visible:ring-offset-background"
                onClick={() => handleAction(action.href)}
                aria-label={action.label}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" aria-hidden="true" />
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-white/60 mt-0.5">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}