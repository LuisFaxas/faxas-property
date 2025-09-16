import { useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing swipe actions on mobile cards
 */
export function useSwipeActions() {
  const { toast } = useToast();
  const activeCard = useRef<HTMLElement | null>(null);

  const handleSwipeStart = useCallback((element: HTMLElement) => {
    // Close any other open cards
    if (activeCard.current && activeCard.current !== element) {
      activeCard.current.style.transform = 'translateX(0)';
    }
    activeCard.current = element;
  }, []);

  const handleSwipeComplete = useCallback(() => {
    // Reset after action
    if (activeCard.current) {
      activeCard.current.style.transform = 'translateX(0)';
      activeCard.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, variant: 'default' | 'destructive' = 'default') => {
    toast({
      description: message,
      variant,
    });
  }, [toast]);

  return {
    handleSwipeStart,
    handleSwipeComplete,
    showToast,
  };
}