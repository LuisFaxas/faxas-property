'use client';

import { useEffect, useState } from 'react';
import { useInitializeUser } from '@/hooks/use-initialize-user';
import axios from 'axios';
import { useAuth } from '@/app/contexts/AuthContext';

export function UserInitializer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isInitializing, isInitialized, error } = useInitializeUser();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (error) {
      console.error('User initialization error:', error);
    }
    if (isInitialized) {
      console.log('User initialization complete');
    }
  }, [error, isInitialized]);

  const handleRetry = async () => {
    if (!user) return;
    
    setRetrying(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post('/api/auth/initialize', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Manual initialization successful:', response.data);
      window.location.reload();
    } catch (err) {
      console.error('Manual initialization failed:', err);
      alert('Failed to initialize. Please refresh the page and try again.');
    } finally {
      setRetrying(false);
    }
  };

  // Show initialization overlay if initializing
  if (isInitializing || retrying) {
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

  // Show error state with retry option
  if (error && !isInitialized) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-50">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="text-red-500">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-white text-lg font-semibold">Initialization Failed</h3>
          <p className="text-white/60 text-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
          >
            Retry Initialization
          </button>
          <p className="text-white/40 text-xs">
            Or refresh the page to try again
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}