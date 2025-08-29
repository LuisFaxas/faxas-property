import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import apiClient from '@/lib/api-client';

export function useInitializeUser() {
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const initializeUser = async () => {
      // Check if already initialized by trying to fetch projects
      try {
        await apiClient.get('/projects');
        setIsInitialized(true);
        return;
      } catch (err: any) {
        // If we get a 404 user not found, we need to initialize
        if (err?.statusCode === 404 && err?.error?.includes('User not found')) {
          console.log('User not found in database, initializing...');
        } else {
          // Other errors, don't initialize
          return;
        }
      }
      
      setIsInitializing(true);
      setError(null);
      
      try {
        const response = await apiClient.post('/auth/initialize');
        console.log('User initialized:', response.data);
        setIsInitialized(true);
        
        // Reload the page to refresh all data
        window.location.reload();
      } catch (err: any) {
        console.error('Failed to initialize user:', err);
        setError(err.error || 'Failed to initialize user');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeUser();
  }, [user]);
  
  return { isInitializing, isInitialized, error };
}