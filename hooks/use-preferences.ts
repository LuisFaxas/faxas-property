import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/app/contexts/AuthContext';

// Types
export interface UserPreferences {
  id: string;
  userId: string;

  // Navigation
  mobileNavItems: string[];
  navItemOrder: number[];
  quickActions: any[];
  dashboardWidgets: any[];
  favoritePages: string[];

  // Appearance
  theme: 'light' | 'dark' | 'auto';
  themeCustom?: any;
  density: 'compact' | 'comfortable' | 'spacious';
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
  reduceMotion: boolean;
  colorBlindMode?: string;

  // Display
  showCompleted: boolean;
  defaultView: 'card' | 'list' | 'table';
  itemsPerPage: number;
  defaultProjectId?: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationSettings: any;
  digestFrequency: 'never' | 'daily' | 'weekly';
  quietHours?: { start: string; end: string };

  // Privacy & Security
  profileVisibility: 'public' | 'team' | 'private';
  activityStatus: boolean;
  twoFactorMethod?: string;
  trustedDevices: any[];
  sessionTimeout: number;

  // Mobile
  swipeActions: boolean;
  hapticFeedback: boolean;
  biometricAuth: boolean;
  offlineMode: boolean;
  dataSaver: boolean;

  // Advanced
  debugMode: boolean;
  betaFeatures: boolean;
  featureFlags?: any;
  customShortcuts?: any;

  // Metadata
  onboardingCompleted: boolean;
  tourCompleted: any;
  lastSettingsUpdate: string;
  createdAt: string;
}

interface NavigationConfig {
  mobileNavItems: string[];
  navItemOrder: number[];
  quickActions: any[];
  availableItems: string[];
}

// Get user preferences
export function usePreferences(enabled: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['preferences', user?.uid],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/users/preferences');
      return response.data?.data as UserPreferences;
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// Update preferences
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await apiClient.patch('/api/v1/users/preferences', updates);
      return response.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preferences', user?.uid] });

      // Update localStorage for immediate effect
      if (data.mobileNavItems) {
        localStorage.setItem('userNavItems', JSON.stringify(data.mobileNavItems));
      }
      if (data.theme) {
        localStorage.setItem('theme', data.theme);
      }

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });
}

// Reset preferences to defaults
export function useResetPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/api/v1/users/preferences');
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', user?.uid] });

      // Clear localStorage
      localStorage.removeItem('userNavItems');
      localStorage.removeItem('theme');
      localStorage.removeItem('showCompletedTasks');

      toast({
        title: 'Success',
        description: 'Settings reset to defaults',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reset settings',
        variant: 'destructive',
      });
    },
  });
}

// Navigation-specific hooks
export function useNavigationConfig(enabled: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['navigation-config', user?.uid],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/users/preferences/navigation');
      return response.data?.data as NavigationConfig;
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNavigation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: { mobileNavItems: string[]; navItemOrder?: number[] }) => {
      const response = await apiClient.post('/api/v1/users/preferences/navigation', config);
      return response.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preferences', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['navigation-config', user?.uid] });

      // Update localStorage for immediate effect
      localStorage.setItem('userNavItems', JSON.stringify(data.mobileNavItems));

      toast({
        title: 'Success',
        description: 'Navigation updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update navigation',
        variant: 'destructive',
      });
    },
  });
}

// Utility hook for getting a single preference with fallback
export function usePreference<K extends keyof UserPreferences>(
  key: K,
  defaultValue: UserPreferences[K]
): UserPreferences[K] {
  const { data: preferences } = usePreferences();

  // Check localStorage first for immediate access
  if (key === 'mobileNavItems') {
    const stored = localStorage.getItem('userNavItems');
    if (stored) {
      try {
        return JSON.parse(stored) as UserPreferences[K];
      } catch {}
    }
  }

  return preferences?.[key] ?? defaultValue;
}

// Smart defaults based on user role
export function getSmartDefaults(userRole: string = 'VIEWER') {
  const defaults: Partial<UserPreferences> = {
    theme: 'dark',
    density: 'comfortable',
    fontSize: 'medium',
    showCompleted: false,
    swipeActions: true,
    hapticFeedback: true,
    offlineMode: true,
    emailNotifications: true,
    pushNotifications: false,
  };

  // Role-specific navigation defaults
  const navigationDefaults = {
    ADMIN: {
      mobileNavItems: ['home', 'tasks', 'bidding'],
      dashboardWidgets: ['welcome', 'budget', 'tasks', 'bidding'],
    },
    STAFF: {
      mobileNavItems: ['home', 'tasks', 'schedule'],
      dashboardWidgets: ['welcome', 'tasks', 'schedule'],
    },
    CONTRACTOR: {
      mobileNavItems: ['home', 'my-tasks', 'bids'],
      dashboardWidgets: ['tasks', 'schedule', 'documents'],
    },
    VIEWER: {
      mobileNavItems: ['home', 'tasks', 'schedule'],
      dashboardWidgets: ['welcome', 'progress', 'schedule'],
    },
  };

  return {
    ...defaults,
    ...navigationDefaults[userRole as keyof typeof navigationDefaults],
  };
}