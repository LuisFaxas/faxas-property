'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ToastListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { message, type = 'default', description } = event.detail;
      
      toast({
        title: message,
        description,
        variant: type === 'error' ? 'destructive' : 'default',
      });
    };

    // Listen for custom toast events
    window.addEventListener('show-toast', handleShowToast as EventListener);

    return () => {
      window.removeEventListener('show-toast', handleShowToast as EventListener);
    };
  }, [toast]);

  return null;
}