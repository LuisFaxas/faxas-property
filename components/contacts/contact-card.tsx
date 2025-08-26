'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Mail,
  Phone,
  Building,
  User,
  MoreVertical,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  Unlock,
  ClipboardList,
  Calendar,
  FileText,
  Activity,
  ChevronRight,
  Edit,
  Trash,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';

interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    company?: string;
    emails?: string[];
    phones?: string[];
    category: string;
    status: string;
    portalStatus?: string;
    lastLoginAt?: string;
    lastActivityAt?: string;
    assignedTasks?: any[];
    notes?: string;
    _count?: {
      assignedTasks?: number;
    };
  };
  onInvite?: (contact: any) => void;
  onAssignTask?: (contact: any) => void;
  onEdit?: (contact: any) => void;
  onDelete?: (contact: any) => void;
  onViewDetails?: (contact: any) => void;
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500';
    case 'INACTIVE':
      return 'bg-gray-500';
    case 'POTENTIAL':
      return 'bg-blue-500';
    case 'BLACKLISTED':
      return 'bg-red-500';
    case 'FOLLOW_UP':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

// Get portal status icon
function getPortalIcon(portalStatus?: string) {
  switch (portalStatus) {
    case 'ACTIVE':
      return <Unlock className="h-4 w-4 text-green-500" />;
    case 'INVITED':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'BLOCKED':
      return <Lock className="h-4 w-4 text-red-500" />;
    default:
      return <Lock className="h-4 w-4 text-gray-500" />;
  }
}

// Category colors
const categoryColors: Record<string, string> = {
  SUBCONTRACTOR: 'bg-blue-500/20 text-blue-500',
  SUPPLIER: 'bg-green-500/20 text-green-500',
  CONSULTANT: 'bg-purple-500/20 text-purple-500',
  INSPECTOR: 'bg-orange-500/20 text-orange-500',
  CLIENT: 'bg-yellow-500/20 text-yellow-500',
  OTHER: 'bg-gray-500/20 text-gray-500',
};

export function ContactCard({
  contact,
  onInvite,
  onAssignTask,
  onEdit,
  onDelete,
  onViewDetails,
}: ContactCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const taskCount = contact._count?.assignedTasks || contact.assignedTasks?.length || 0;
  const hasPortalAccess = contact.portalStatus === 'ACTIVE';
  const isPendingInvite = contact.portalStatus === 'INVITED';

  // Mobile swipe handling (simplified for now)
  const handleCardClick = () => {
    setIsDetailsOpen(true);
  };

  return (
    <>
      {/* Contact Card - Mobile First Design */}
      <div
        className={cn(
          'relative group',
          'bg-white/5 hover:bg-white/10',
          'border border-white/10 hover:border-white/20',
          'rounded-lg p-4',
          'transition-all duration-200',
          'cursor-pointer',
          'min-h-[120px]', // Ensure good touch target
        )}
        onClick={handleCardClick}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-accent-500/20 text-accent-500 text-sm font-semibold">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name and Company */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate" title={contact.name}>{contact.name}</h3>
              {contact.company && (
                <p className="text-sm text-white/60 truncate flex items-center gap-1" title={contact.company}>
                  <Building className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{contact.company}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!hasPortalAccess && !isPendingInvite && (
                <DropdownMenuItem onClick={() => onInvite?.(contact)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Portal Invite
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onAssignTask?.(contact)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Assign Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(contact)}
                className="text-red-500"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Category Badge */}
          <Badge className={cn('text-xs', categoryColors[contact.category] || categoryColors.OTHER)}>
            {contact.category}
          </Badge>

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Portal Status */}
            <div className="flex items-center gap-1" title={`Portal: ${contact.portalStatus || 'No Access'}`}>
              {getPortalIcon(contact.portalStatus)}
            </div>

            {/* Task Count */}
            {taskCount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <ClipboardList className="h-4 w-4 text-white/40" />
                <span className="text-white/80">{taskCount}</span>
              </div>
            )}

            {/* Activity Status Dot */}
            <div className={cn('w-2 h-2 rounded-full', getStatusColor(contact.status))} />
          </div>
        </div>

        {/* Contact Info - Show on larger screens */}
        <div className="hidden sm:flex items-center gap-4 text-sm text-white/60 min-w-0">
          {contact.emails?.[0] && (
            <div className="flex items-center gap-1 min-w-0 max-w-[200px]">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate" title={contact.emails[0]}>{contact.emails[0]}</span>
            </div>
          )}
          {contact.phones?.[0] && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{contact.phones[0]}</span>
            </div>
          )}
        </div>

        {/* Last Activity - Mobile */}
        <div className="sm:hidden mt-2 text-xs text-white/40">
          {contact.lastActivityAt ? (
            <span>Active {format(new Date(contact.lastActivityAt), 'MMM d')}</span>
          ) : (
            <span>No recent activity</span>
          )}
        </div>

        {/* Visual Swipe Hint */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-5 w-5 text-white/20" />
        </div>
      </div>

      {/* Details Sheet - Mobile Optimized */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="bottom" className="h-[80vh] bg-gray-900 border-t border-white/10">
          <SheetHeader className="pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-accent-500/20 text-accent-500 text-lg font-semibold">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-white text-xl">{contact.name}</SheetTitle>
                <SheetDescription className="text-white/60">
                  {contact.company || contact.category}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Quick Actions - Large Touch Targets */}
          <div className="grid grid-cols-2 gap-3 py-4">
            {contact.phones?.[0] && (
              <Button
                variant="outline"
                className="h-12 justify-start"
                onClick={() => window.location.href = `tel:${contact.phones![0]}`}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            )}
            {contact.emails?.[0] && (
              <Button
                variant="outline"
                className="h-12 justify-start"
                onClick={() => window.location.href = `mailto:${contact.emails![0]}`}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            )}
            {!hasPortalAccess && !isPendingInvite && (
              <Button
                variant="outline"
                className="h-12 justify-start"
                onClick={() => {
                  setIsDetailsOpen(false);
                  onInvite?.(contact);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Send Portal Invite
              </Button>
            )}
            <Button
              variant="outline"
              className="h-12 justify-start"
              onClick={() => {
                setIsDetailsOpen(false);
                onAssignTask?.(contact);
              }}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Assign Task
            </Button>
          </div>

          {/* Details Tabs */}
          <div className="space-y-4">
            {/* Tasks Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <ClipboardList className="h-4 w-4" />
                Tasks ({taskCount})
              </div>
              {contact.assignedTasks && contact.assignedTasks.length > 0 ? (
                <div className="space-y-2">
                  {contact.assignedTasks.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="bg-white/5 rounded p-2 text-sm">
                      <p className="text-white">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-white/60">
                          Due: {format(new Date(task.dueDate), 'MMM d')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">No tasks assigned</p>
              )}
            </div>

            {/* Activity Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Activity className="h-4 w-4" />
                Recent Activity
              </div>
              <div className="text-sm text-white/60">
                {contact.lastLoginAt && (
                  <p>Last login: {format(new Date(contact.lastLoginAt), 'MMM d, h:mm a')}</p>
                )}
                {contact.lastActivityAt && (
                  <p>Last activity: {format(new Date(contact.lastActivityAt), 'MMM d, h:mm a')}</p>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {contact.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <FileText className="h-4 w-4" />
                  Notes
                </div>
                <p className="text-sm text-white/60">{contact.notes}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}