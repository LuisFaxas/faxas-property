'use client';

import React, { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Mail,
  Phone,
  Building,
  User,
  UserPlus,
  Trash2,
  Clock,
  Lock,
  Unlock,
  ClipboardList,
} from 'lucide-react';

interface MobileContactCardProps {
  contact: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    category: string;
    status: string;
    type?: string;
    portalStatus?: string;
    _count?: {
      assignedTasks?: number;
    };
  };
  onInvite?: (contact: any) => void;
  onDelete?: (contact: any) => void;
  onTap?: (contact: any) => void;
  className?: string;
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
  ACTIVE: 'bg-green-500',
  INACTIVE: 'bg-gray-500',
  POTENTIAL: 'bg-blue-500',
  BLACKLISTED: 'bg-red-500',
  FOLLOW_UP: 'bg-yellow-500',
};

// Swipe configuration
const SWIPE_THRESHOLD = 60;
const ACTION_THRESHOLD = 100;
const MAX_SWIPE = 150;

export function MobileContactCard({
  contact,
  onInvite,
  onDelete,
  onTap,
  className,
}: MobileContactCardProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeState, setSwipeState] = useState<'idle' | 'swiping' | 'inviting' | 'deleting'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);

  const hasPortalAccess = contact.portalStatus === 'ACTIVE';
  const isPendingInvite = contact.portalStatus === 'INVITED';
  const taskCount = contact._count?.assignedTasks || 0;
  const canInvite = !hasPortalAccess && !isPendingInvite;

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
    setSwipeState('swiping');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    
    // Apply resistance at edges
    let adjustedDelta = deltaX;
    
    if (Math.abs(deltaX) > ACTION_THRESHOLD) {
      const excess = Math.abs(deltaX) - ACTION_THRESHOLD;
      const resistance = 0.3;
      adjustedDelta = deltaX > 0 
        ? ACTION_THRESHOLD + (excess * resistance)
        : -(ACTION_THRESHOLD + (excess * resistance));
    }
    
    // Limit max swipe distance
    adjustedDelta = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, adjustedDelta));
    setCurrentX(adjustedDelta);
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;
    
    setIsDragging(false);
    
    // Right swipe - invite to portal
    if (currentX > ACTION_THRESHOLD && canInvite) {
      setSwipeState('inviting');
      setCurrentX(ACTION_THRESHOLD);
      setTimeout(() => {
        if (onInvite) {
          onInvite(contact);
        }
        resetSwipe();
      }, 200);
    }
    // Left swipe - delete
    else if (currentX < -ACTION_THRESHOLD) {
      setSwipeState('deleting');
      setCurrentX(-ACTION_THRESHOLD);
      setTimeout(() => {
        if (onDelete) {
          onDelete(contact);
        }
        resetSwipe();
      }, 200);
    }
    // Tap detection - if swipe was minimal
    else if (Math.abs(currentX) < 5) {
      if (onTap) {
        onTap(contact);
      }
      resetSwipe();
    }
    // Snap back to center if swipe was too small
    else {
      resetSwipe();
    }
  };

  const resetSwipe = () => {
    setCurrentX(0);
    setSwipeState('idle');
  };

  // Portal status icon
  const getPortalIcon = () => {
    if (hasPortalAccess) return <Unlock className="h-3.5 w-3.5 text-green-500" />;
    if (isPendingInvite) return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    return <Lock className="h-3.5 w-3.5 text-gray-500" />;
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background action indicators */}
      {isMobile && (
        <>
          {/* Right swipe background - Invite */}
          {canInvite && (
            <div
              className={cn(
                "absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-gradient-to-r from-green-600 to-green-500",
                "transition-opacity duration-200",
                currentX > SWIPE_THRESHOLD ? "opacity-100" : "opacity-0"
              )}
              style={{ width: Math.abs(currentX) }}
            >
              <UserPlus className="h-5 w-5 text-white" />
              {currentX > ACTION_THRESHOLD && (
                <span className="ml-2 text-sm font-medium text-white">Invite</span>
              )}
            </div>
          )}
          
          {/* Left swipe background - Delete */}
          <div
            className={cn(
              "absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-gradient-to-l from-red-600 to-red-500",
              "transition-opacity duration-200",
              currentX < -SWIPE_THRESHOLD ? "opacity-100" : "opacity-0"
            )}
            style={{ width: Math.abs(currentX) }}
          >
            {currentX < -ACTION_THRESHOLD && (
              <span className="mr-2 text-sm font-medium text-white">Delete</span>
            )}
            <Trash2 className="h-5 w-5 text-white" />
          </div>
        </>
      )}

      {/* Card Content */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-white/5 border border-white/10 rounded-lg p-4",
          "transition-transform duration-200 ease-out",
          "cursor-pointer active:scale-[0.98]",
          swipeState === 'inviting' && "scale-95",
          swipeState === 'deleting' && "scale-95"
        )}
        style={{
          transform: `translateX(${currentX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !isDragging && Math.abs(currentX) < 5 && onTap?.(contact)}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-accent-500">
              {getInitials(contact.name)}
            </span>
          </div>

          {/* Name and Company */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate flex items-center gap-2">
              {contact.name}
              {contact.type === 'COMPANY' ? (
                <Building className="h-3 w-3 text-white/40" />
              ) : (
                <User className="h-3 w-3 text-white/40" />
              )}
            </h3>
            {contact.company && (
              <p className="text-xs text-white/60 truncate">{contact.company}</p>
            )}
          </div>

          {/* Status Dot */}
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColors[contact.status] || 'bg-gray-500')} />
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Category Badge */}
          <Badge className={cn('text-xs', categoryColors[contact.category] || categoryColors.OTHER)}>
            {contact.category.replace('_', ' ')}
          </Badge>

          {/* Icons Row */}
          <div className="flex items-center gap-2">
            {/* Portal Status */}
            {getPortalIcon()}
            
            {/* Task Count */}
            {taskCount > 0 && (
              <div className="flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 text-white/40" />
                <span className="text-xs text-white/60">{taskCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info - Compact */}
        <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
          {contact.email && (
            <div className="flex items-center gap-1 min-w-0">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}