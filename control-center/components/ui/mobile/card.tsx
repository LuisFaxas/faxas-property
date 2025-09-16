'use client';

import React, { useState, useRef, ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface SwipeAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
  action: () => void;
}

export interface MobileCardProps {
  children: ReactNode;
  leftSwipeAction?: SwipeAction;
  rightSwipeAction?: SwipeAction;
  onTap?: () => void;
  className?: string;
  disabled?: boolean;
  isDimmed?: boolean;
  swipeThreshold?: number;
  swipeResistance?: number;
}

const colorClasses = {
  green: 'from-green-600 to-green-500',
  red: 'from-red-600 to-red-500',
  blue: 'from-blue-600 to-blue-500',
  yellow: 'from-yellow-600 to-yellow-500',
  gray: 'from-gray-600 to-gray-500',
};

/**
 * Reusable mobile card component with swipe actions
 * Can be used for tasks, contacts, budget items, etc.
 */
export function MobileCard({
  children,
  leftSwipeAction,
  rightSwipeAction,
  onTap,
  className,
  disabled = false,
  isDimmed = false,
  swipeThreshold = 60,
  swipeResistance = 0.3,
}: MobileCardProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeState, setSwipeState] = useState<'idle' | 'swiping' | 'executing'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);

  const completeThreshold = 100;

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || disabled) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
    setSwipeState('swiping');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile || disabled) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    
    // Apply resistance at edges
    let adjustedDelta = deltaX;
    
    if (Math.abs(deltaX) > completeThreshold) {
      const excess = Math.abs(deltaX) - completeThreshold;
      const resistance = deltaX > 0 ? swipeResistance : swipeResistance;
      adjustedDelta = deltaX > 0 
        ? completeThreshold + (excess * resistance)
        : -(completeThreshold + (excess * resistance));
    }
    
    // Limit max swipe distance
    adjustedDelta = Math.max(-150, Math.min(150, adjustedDelta));
    setCurrentX(adjustedDelta);
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging || disabled) return;
    
    setIsDragging(false);
    
    // Right swipe action
    if (currentX > completeThreshold && rightSwipeAction) {
      setSwipeState('executing');
      setCurrentX(completeThreshold);
      setTimeout(() => {
        rightSwipeAction.action();
        resetSwipe();
      }, 200);
    }
    // Left swipe action
    else if (currentX < -completeThreshold && leftSwipeAction) {
      setSwipeState('executing');
      setCurrentX(-completeThreshold);
      setTimeout(() => {
        leftSwipeAction.action();
        resetSwipe();
      }, 200);
    }
    // Snap back to center
    else {
      resetSwipe();
    }
  };

  const resetSwipe = () => {
    setCurrentX(0);
    setSwipeState('idle');
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger tap if we're swiping or clicking on a button
    if (swipeState !== 'idle' || (e.target as HTMLElement).closest('button')) return;
    if (onTap && !disabled) {
      onTap();
    }
  };

  // Only apply swipe on mobile
  const swipeHandlers = isMobile ? {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  } : {};

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        className
      )}
      {...swipeHandlers}
    >
      {/* Background layers for swipe actions */}
      {isMobile && (
        <div className="absolute inset-0">
          {/* Right swipe background */}
          {currentX > 20 && rightSwipeAction && (
            <div className={cn(
              'absolute inset-0 flex items-center justify-start px-4',
              `bg-gradient-to-r ${colorClasses[rightSwipeAction.color]}`
            )}>
              <rightSwipeAction.icon className="h-6 w-6 text-white" />
              <span className="ml-3 text-white font-medium">{rightSwipeAction.label}</span>
            </div>
          )}
          
          {/* Left swipe background */}
          {currentX < -20 && leftSwipeAction && (
            <div className={cn(
              'absolute inset-0 flex items-center justify-end px-4',
              `bg-gradient-to-l ${colorClasses[leftSwipeAction.color]}`
            )}>
              <span className="mr-3 text-white font-medium">{leftSwipeAction.label}</span>
              <leftSwipeAction.icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Main card content */}
      <div
        className={cn(
          'relative bg-graphite-800 backdrop-blur-sm',
          'border border-white/10',
          'transition-all duration-200 ease-out',
          isDragging && 'transition-none',
          isDimmed && !isDragging && !swipeState.includes('executing') && 'opacity-75',
          swipeState === 'executing' && 'scale-95',
          onTap && !disabled && 'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          transform: isMobile ? `translateX(${currentX}px)` : undefined,
        }}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

