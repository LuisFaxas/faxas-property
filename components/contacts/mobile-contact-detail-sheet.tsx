'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Mail,
  Phone,
  Building,
  User,
  Edit,
  Trash,
  UserPlus,
  Clock,
  Lock,
  Unlock,
  ClipboardList,
  Calendar,
  FileText,
  Activity,
  MessageSquare,
  MapPin,
  Globe,
  Send,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  company?: string;
  email?: string;
  emails?: string[];
  phone?: string;
  phones?: string[];
  category: string;
  status: string;
  type?: string;
  portalStatus?: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
  notes?: string;
  address?: string;
  website?: string;
  assignedTasks?: any[];
  _count?: {
    assignedTasks?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface MobileContactDetailSheetProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onInvite?: (contact: Contact) => void;
  onAssignTask?: (contact: Contact) => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

const categoryColors: Record<string, string> = {
  SUBCONTRACTOR: 'bg-blue-500/20 text-blue-500',
  SUPPLIER: 'bg-green-500/20 text-green-500',
  CONSULTANT: 'bg-purple-500/20 text-purple-500',
  INSPECTOR: 'bg-orange-500/20 text-orange-500',
  CLIENT: 'bg-yellow-500/20 text-yellow-500',
  OTHER: 'bg-gray-500/20 text-gray-500',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-500',
  INACTIVE: 'bg-gray-500/20 text-gray-500',
  POTENTIAL: 'bg-blue-500/20 text-blue-500',
  BLACKLISTED: 'bg-red-500/20 text-red-500',
  FOLLOW_UP: 'bg-yellow-500/20 text-yellow-500',
};

export function MobileContactDetailSheet({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onInvite,
  onAssignTask,
  onCall,
  onEmail,
}: MobileContactDetailSheetProps) {
  if (!contact) return null;

  const hasPortalAccess = contact.portalStatus === 'ACTIVE';
  const isPendingInvite = contact.portalStatus === 'INVITED';
  const taskCount = contact._count?.assignedTasks || contact.assignedTasks?.length || 0;
  
  // Get primary contact info
  const primaryEmail = contact.email || contact.emails?.[0];
  const primaryPhone = contact.phone || contact.phones?.[0];

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get portal status details
  const getPortalStatus = () => {
    if (hasPortalAccess) {
      return { icon: Unlock, text: 'Portal Active', color: 'text-green-500' };
    }
    if (isPendingInvite) {
      return { icon: Clock, text: 'Invite Pending', color: 'text-yellow-500' };
    }
    return { icon: Lock, text: 'No Portal Access', color: 'text-gray-500' };
  };

  const portalStatus = getPortalStatus();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-gray-900 border-t border-white/10 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="pb-4 border-b border-white/10">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-accent-500/20 text-accent-500 text-lg font-semibold">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-white text-xl flex items-center gap-2">
                {contact.name}
                {contact.type === 'COMPANY' ? (
                  <Building className="h-4 w-4 text-white/40" />
                ) : (
                  <User className="h-4 w-4 text-white/40" />
                )}
              </SheetTitle>
              <SheetDescription className="text-white/60">
                {contact.company || contact.category.replace('_', ' ')}
              </SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn(categoryColors[contact.category] || categoryColors.OTHER)}>
                  {contact.category.replace('_', ' ')}
                </Badge>
                <Badge className={cn(statusColors[contact.status] || statusColors.ACTIVE)}>
                  {contact.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 py-4 border-b border-white/10">
          {primaryPhone && (
            <Button
              variant="outline"
              className="h-12 justify-start"
              onClick={() => {
                if (onCall) {
                  onCall(primaryPhone);
                } else {
                  window.location.href = `tel:${primaryPhone}`;
                }
              }}
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
          )}
          {primaryEmail && (
            <Button
              variant="outline"
              className="h-12 justify-start"
              onClick={() => {
                if (onEmail) {
                  onEmail(primaryEmail);
                } else {
                  window.location.href = `mailto:${primaryEmail}`;
                }
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          )}
          {!hasPortalAccess && !isPendingInvite && (
            <Button
              variant="outline"
              className="h-12 justify-start"
              onClick={() => onInvite?.(contact)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Send Invite
            </Button>
          )}
          <Button
            variant="outline"
            className="h-12 justify-start"
            onClick={() => onAssignTask?.(contact)}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Assign Task
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-2">
              {primaryEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/60 w-20">Email:</span>
                  <a 
                    href={`mailto:${primaryEmail}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {primaryEmail}
                  </a>
                </div>
              )}
              {primaryPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/60 w-20">Phone:</span>
                  <a 
                    href={`tel:${primaryPhone}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {primaryPhone}
                  </a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-white/60 w-20">Address:</span>
                  <span className="text-white/80">{contact.address}</span>
                </div>
              )}
              {contact.website && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/60 w-20">Website:</span>
                  <a 
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {contact.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Portal Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <portalStatus.icon className="h-4 w-4" />
              Portal Access
            </h3>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", portalStatus.color)}>
                  {portalStatus.text}
                </span>
                {contact.lastLoginAt && (
                  <span className="text-xs text-white/60">
                    Last login: {format(new Date(contact.lastLoginAt), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Tasks */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks ({taskCount})
            </h3>
            {contact.assignedTasks && contact.assignedTasks.length > 0 ? (
              <div className="space-y-2">
                {contact.assignedTasks.slice(0, 5).map((task: any) => (
                  <div 
                    key={task.id} 
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-white/60 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {task.status && (
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
                {contact.assignedTasks.length > 5 && (
                  <p className="text-sm text-white/60 text-center py-2">
                    +{contact.assignedTasks.length - 5} more tasks
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40 bg-white/5 rounded-lg p-3">
                No tasks assigned
              </p>
            )}
          </div>

          {/* Activity */}
          {(contact.lastActivityAt || contact.createdAt) && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </h3>
              <div className="space-y-2 text-sm text-white/60">
                {contact.lastActivityAt && (
                  <div className="flex items-center justify-between">
                    <span>Last activity:</span>
                    <span>{format(new Date(contact.lastActivityAt), 'MMM d, h:mm a')}</span>
                  </div>
                )}
                {contact.createdAt && (
                  <div className="flex items-center justify-between">
                    <span>Added:</span>
                    <span>{format(new Date(contact.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-white/80 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onEdit?.(contact);
              onClose();
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => {
              onDelete?.(contact);
              onClose();
            }}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}