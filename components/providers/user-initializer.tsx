'use client';

import { useEffect } from 'react';
import { useInitializeUser } from '@/hooks/use-initialize-user';

export function UserInitializer({ children }: { children: React.ReactNode }) {
  const { isInitializing, isInitialized, error } = useInitializeUser();

  useEffect(() => {
    if (error) {
      console.error('User initialization error:', error);
    }
    if (isInitialized) {
      console.log('User initialization complete');
    }
  }, [error, isInitialized]);

  // Show initialization overlay if initializing
  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto"></div>
          <p className="text-white">Setting up your account...</p>
          <p className="text-white/60 text-sm">This only happens once</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}