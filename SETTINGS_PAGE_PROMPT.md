# SETTINGS PAGE IMPLEMENTATION PROMPT

## Context
You are implementing the Settings page for a construction management system. The page exists at `/app/admin/settings/page.tsx` and allows users to manage their preferences.

## Read-First Files
Before making any changes, read these files to understand patterns:
1. `/app/admin/settings/page.tsx` - Current settings implementation
2. `/app/contexts/PreferencesContext.tsx` - Preferences state management (per SOT frontend)
3. `/hooks/use-preferences.ts` - usePreferences hook (per SOT frontend)
4. `/lib/validations/user.ts` - User and preferences validation schemas

## Key Requirements

### Authentication & Authorization
- Page requires authentication (any authenticated user can access)
- Uses `requireAuth()` in API routes
- No special role requirements - all users can manage their own preferences

### Data & State
- Query key: `['user-preferences']` (from SOT state management doc)
- Uses `usePreferences()` hook from PreferencesContext (per SOT frontend)
- Context: `PreferencesContext` at `app/contexts/PreferencesContext.tsx`
- Optimistic updates required for smooth UX

### API Endpoints (from SOT API Inventory)
- `GET /api/v1/users/preferences` - Fetch user preferences
- `PUT /api/v1/users/preferences` - Update preferences
- `PUT /api/v1/users/preferences/navigation` - Update navigation preferences

### Implementation Sections

#### 1. Profile Information
- Display user email (read-only from Firebase)
- Display user role (read-only)
- Display associated projects

#### 2. Display Preferences
- Theme: Dark only (no theme switcher needed)
- Density: Compact/Comfortable/Spacious
- Default view: Card/List/Table
- Show completed tasks: Boolean toggle

#### 3. Notification Settings
- Email notifications for task assignments
- Email notifications for due dates
- Push notifications (if implemented)
- Notification frequency settings

#### 4. Mobile Navigation
- Customize bottom navigation items (drag to reorder)
- Select which modules appear in mobile nav
- Maximum 5 items in bottom nav
- Use dedicated endpoint: `PUT /api/v1/users/preferences/navigation`

#### 5. Data & Privacy
- Clear preferences (reset to defaults)
- Privacy policy link
- Terms of service link

## Component Structure
```tsx
SettingsPage
├── PageShell
├── Tabs
│   ├── TabsList
│   └── TabsContent
│       ├── ProfileTab
│       ├── DisplayTab
│       ├── NotificationsTab
│       ├── MobileNavTab
│       └── DataPrivacyTab
└── SaveButton (with loading state)
```

## PreferencesContext Interface (from SOT)
```typescript
interface PreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
  resetPreferences: () => Promise<void>
  loading: boolean
}
```

## Mobile Considerations
- Use bottom sheets for mobile dialogs
- Ensure 48px minimum touch targets
- Responsive grid: 1 column mobile, 2 columns desktop
- Sticky save button on mobile

## Error Handling
- Show toast notifications for save success/failure
- Form validation errors inline
- Network error recovery with retry
- Optimistic rollback on failure

## Query Key Invalidations
When preferences update succeeds, invalidate:
- `['user-preferences']` - Main preferences query

## Testing Checklist
- [ ] Preferences persist across sessions
- [ ] Optimistic updates work smoothly
- [ ] Mobile nav customization saves correctly via navigation endpoint
- [ ] Form validation shows appropriate errors
- [ ] Works on mobile devices (48px targets)