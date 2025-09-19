'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { usePreferences, useUpdatePreferences, UserPreferences, getSmartDefaults } from '@/hooks/use-preferences';

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
  updateNavigation: (items: string[], order?: number[]) => void;

  // Theme operations
  switchTheme: (theme: 'light' | 'dark' | 'auto') => void;

  // Optimistic updates
  pendingUpdates: Partial<UserPreferences>;
  clearPendingUpdates: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, userRole } = useAuth();
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
    setLocalPreferences(prev => prev ? { ...prev, ...updates } : null);
    setPendingUpdates(updates);

    try {
      await updateMutation.mutateAsync(updates);
      setPendingUpdates({});
    } catch (error) {
      // Revert optimistic update on error
      setLocalPreferences(preferences);
      setPendingUpdates({});
      throw error;
    }
  }, [updateMutation, preferences]);

  // Update navigation
  const updateNavigation = useCallback((items: string[], order?: number[]) => {
    const updates = {
      mobileNavItems: items,
      navItemOrder: order || [0, 1, 2]
    };
    updatePreferences(updates);
  }, [updatePreferences]);

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
  }, [userRole, updateMutation]);

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
  const { preferences, updateNavigation } = usePreferencesContext();
  const { userRole } = useAuth();

  // Get defaults based on role
  const defaults = getSmartDefaults(userRole || 'VIEWER');

  return {
    items: preferences?.mobileNavItems || defaults.mobileNavItems || ['home', 'tasks', 'schedule'],
    order: preferences?.navItemOrder || [0, 1, 2],
    updateNavigation,
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