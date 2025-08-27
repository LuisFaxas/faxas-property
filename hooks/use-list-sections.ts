import { useState, useEffect } from 'react';

/**
 * Hook for managing list sections with localStorage persistence
 */
export function useListSections<T>(storageKey?: string) {
  const [showCompleted, setShowCompleted] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${storageKey}-showCompleted`);
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-showCompleted`, JSON.stringify(showCompleted));
    }
  }, [showCompleted, storageKey]);

  return {
    showCompleted,
    setShowCompleted,
    toggleCompleted: () => setShowCompleted(!showCompleted),
  };
}