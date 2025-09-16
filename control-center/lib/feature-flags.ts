/**
 * Feature Flags Configuration
 * Centralized feature flag management for incremental rollout
 */

export const FeatureFlags = {
  /**
   * Dashboard V2 Feature Flag
   * When enabled, renders the new dashboard layout
   * Default: false (uses existing dashboard)
   */
  DASHBOARD_V2: process.env.NEXT_PUBLIC_DASHBOARD_V2 === 'true',

  /**
   * Add more feature flags here as needed
   * Example:
   * ADVANCED_ANALYTICS: process.env.NEXT_PUBLIC_ADVANCED_ANALYTICS === 'true',
   * REAL_TIME_COLLAB: process.env.NEXT_PUBLIC_REAL_TIME_COLLAB === 'true',
   */
} as const;

// Type-safe feature flag checker
export function isFeatureEnabled(flag: keyof typeof FeatureFlags): boolean {
  return FeatureFlags[flag] === true;
}

// Export for use in components
export default FeatureFlags;