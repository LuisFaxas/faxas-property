'use client';

import { useSwipeable, SwipeableHandlers, SwipeEventData } from 'react-swipeable';
import { useCallback } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwiping?: (data: SwipeEventData) => void;
  enabled?: boolean;
  threshold?: number;
  preventScrollOnSwipe?: boolean;
  trackMouse?: boolean; // Enable mouse drag as swipe for desktop
}

/**
 * useSwipeGestures - A reusable hook for adding swipe gestures to any component
 * Perfect for calendar navigation, carousels, and mobile interactions
 */
export function useSwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onSwiping,
  enabled = true,
  threshold = 50,
  preventScrollOnSwipe = false,
  trackMouse = false,
}: SwipeGestureOptions): SwipeableHandlers {
  
  const handleSwipeLeft = useCallback(() => {
    if (enabled && onSwipeLeft) {
      onSwipeLeft();
    }
  }, [enabled, onSwipeLeft]);

  const handleSwipeRight = useCallback(() => {
    if (enabled && onSwipeRight) {
      onSwipeRight();
    }
  }, [enabled, onSwipeRight]);

  const handleSwipeUp = useCallback(() => {
    if (enabled && onSwipeUp) {
      onSwipeUp();
    }
  }, [enabled, onSwipeUp]);

  const handleSwipeDown = useCallback(() => {
    if (enabled && onSwipeDown) {
      onSwipeDown();
    }
  }, [enabled, onSwipeDown]);

  const handleSwiping = useCallback((eventData: SwipeEventData) => {
    if (enabled && onSwiping) {
      onSwiping(eventData);
    }
  }, [enabled, onSwiping]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    onSwipedUp: handleSwipeUp,
    onSwipedDown: handleSwipeDown,
    onSwiping: handleSwiping,
    delta: threshold,
    preventScrollOnSwipe,
    trackMouse,
    trackTouch: true,
    rotationAngle: 0,
    swipeDuration: 500,
  });

  return enabled ? swipeHandlers : { ref: () => {} };
}

/**
 * useCalendarSwipe - Specialized swipe hook for calendar navigation
 */
export function useCalendarSwipe(
  onPrevious: () => void,
  onNext: () => void,
  onViewChange?: (direction: 'up' | 'down') => void,
  options?: Partial<SwipeGestureOptions>
) {
  return useSwipeGestures({
    onSwipeLeft: onNext, // Swipe left to go to next month/week
    onSwipeRight: onPrevious, // Swipe right to go to previous month/week
    onSwipeUp: onViewChange ? () => onViewChange('up') : undefined,
    onSwipeDown: onViewChange ? () => onViewChange('down') : undefined,
    threshold: 75,
    preventScrollOnSwipe: true,
    ...options,
  });
}

/**
 * useCarouselSwipe - Specialized swipe hook for carousel/slider components
 */
export function useCarouselSwipe(
  onPrevious: () => void,
  onNext: () => void,
  options?: Partial<SwipeGestureOptions>
) {
  return useSwipeGestures({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    threshold: 50,
    preventScrollOnSwipe: true,
    trackMouse: true, // Allow mouse drag on desktop
    ...options,
  });
}