'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { usePreferences, useUpdatePreferences, UserPreferences, getSmartDefaults } from '@/hooks/use-preferences';
import { useQueryClient } from '@tanstack/react-query';
import { type NavItemId } from '@/components/blocks/page-shell';
import { toast } from '@/hooks/use-toast';

interface PreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  error: Error | null;
  isDirty: boolean;

  // Core operations
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => void;

  // Navigation specific
  updateNavigation: (items: NavItemId[], order?: number[]) => Promise<void>;
  resetNavigation: () => Promise<void>;

  // Theme operations
  switchTheme: (theme: 'light' | 'dark' | 'auto') => void;

  // Optimistic updates
  pendingUpdates: Partial<UserPreferences>;
  clearPendingUpdates: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const { data: preferences, isLoading, error } = usePreferences();
  const updateMutation = useUpdatePreferences();

  const [pendingUpdates, setPendingUpdates] = useState<Partial<UserPreferences>>({});
  const [localPreferences, setLocalPreferences] = useState<UserPreferences | null>(null);

  // Initialize with smart defaults
  useEffect(() => {
    if (!preferences && userRole) {
      const defaults = getSmartDefaults(userRole);
      setLocalPreferences(defaults as UserPreferences);
    } else if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences, userRole]);

  // Sync with localStorage for immediate updates
  useEffect(() => {
    if (localPreferences?.theme) {
      document.documentElement.setAttribute('data-theme', localPreferences.theme);
    }
  }, [localPreferences?.theme]);

  // Update a single preference
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    // Optimistic update
    setLocalPreferences(prev => prev ? { ...prev, [key]: value } : null);
    setPendingUpdates(prev => ({ ...prev, [key]: value }));

    // Debounced server update
    const timeoutId = setTimeout(() => {
      updateMutation.mutate({ [key]: value });
      setPendingUpdates({});
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [updateMutation]);

  // Batch update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    // Optimistic update
    const previousPreferences = localPreferences;
    setLocalPreferences(prev => prev ? { ...prev, ...updates } : null);
    setPendingUpdates(updates);

    try {
      await updateMutation.mutateAsync(updates);
      // Invalidate the preferences query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      setPendingUpdates({});
    } catch (error) {
      // Revert optimistic update on error
      setLocalPreferences(previousPreferences);
      setPendingUpdates({});
      throw error;
    }
  }, [updateMutation, queryClient]);

  // Update navigation
  const updateNavigation = useCallback(async (items: NavItemId[], order?: number[]) => {
    // Validate exactly 3 items
    if (items.length !== 3) {
      toast({
        title: 'Invalid selection',
        description: 'Please select exactly 3 navigation items',
        variant: 'destructive',
      });
      throw new Error('Must select exactly 3 navigation items');
    }

    const updates = {
      mobileNavItems: items,
      navItemOrder: order || [0, 1, 2]
    };

    // Optimistic update
    const previousPreferences = localPreferences;
    setLocalPreferences(prev => prev ? { ...prev, ...updates } : null);

    // Update localStorage immediately for other components
    localStorage.setItem('userNavItems', JSON.stringify(items));

    try {
      await updatePreferences(updates);
      toast({
        title: 'Navigation updated',
        description: 'Your navigation preferences have been saved',
      });
    } catch (error) {
      // Revert on error
      setLocalPreferences(previousPreferences);
      localStorage.setItem('userNavItems', JSON.stringify(previousPreferences?.mobileNavItems || []));
      toast({
        title: 'Failed to update',
        description: 'Could not save navigation preferences',
        variant: 'destructive',
      });
      throw error;
    }
  }, [updatePreferences]);

  // Reset navigation to defaults
  const resetNavigation = useCallback(async () => {
    const defaults = getSmartDefaults(userRole || 'VIEWER');
    await updateNavigation(
      defaults.mobileNavItems as NavItemId[],
      defaults.navItemOrder as number[]
    );
  }, [userRole, updateNavigation]);

  // Switch theme
  const switchTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    updatePreference('theme', theme);

    // Apply immediately
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [updatePreference]);

  // Reset preferences
  const resetPreferences = useCallback(() => {
    const defaults = getSmartDefaults(userRole || 'VIEWER');
    setLocalPreferences(defaults as UserPreferences);
    updateMutation.mutate(defaults);
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
  }, [userRole, updateMutation, queryClient]);

  // Clear pending updates
  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates({});
  }, []);

  const value: PreferencesContextType = {
    preferences: localPreferences,
    loading: isLoading,
    error: error as Error | null,
    isDirty: Object.keys(pendingUpdates).length > 0,
    updatePreference,
    updatePreferences,
    resetPreferences,
    updateNavigation,
    resetNavigation,
    switchTheme,
    pendingUpdates,
    clearPendingUpdates,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferencesContext must be used within a PreferencesProvider');
  }
  return context;
}

// Utility hooks for specific preferences
export function useTheme() {
  const { preferences, switchTheme } = usePreferencesContext();
  return {
    theme: preferences?.theme || 'dark',
    setTheme: switchTheme,
  };
}

export function useNavigationItems() {
  const { preferences, updateNavigation, resetNavigation } = usePreferencesContext();
  const { userRole } = useAuth();

  // Get defaults based on role
  const defaults = getSmartDefaults(userRole || 'VIEWER');
  const items = (preferences?.mobileNavItems || defaults.mobileNavItems || ['home', 'tasks', 'schedule']) as NavItemId[];

  return {
    items,
    order: preferences?.navItemOrder || [0, 1, 2],
    updateNavigation,
    resetNavigation,
  };
}

export function useDisplayPreferences() {
  const { preferences, updatePreference } = usePreferencesContext();

  return {
    density: preferences?.density || 'comfortable',
    fontSize: preferences?.fontSize || 'medium',
    showCompleted: preferences?.showCompleted || false,
    defaultView: preferences?.defaultView || 'card',
    setDensity: (density: 'compact' | 'comfortable' | 'spacious') => updatePreference('density', density),
    setFontSize: (size: 'small' | 'medium' | 'large' | 'xl') => updatePreference('fontSize', size),
    setShowCompleted: (show: boolean) => updatePreference('showCompleted', show),
    setDefaultView: (view: 'card' | 'list' | 'table') => updatePreference('defaultView', view),
  };
}