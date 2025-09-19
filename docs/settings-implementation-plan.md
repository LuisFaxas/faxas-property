# Settings Page Implementation Plan

## Overview
This document serves as the source of truth for creating an industry-leading settings system that provides comprehensive control over all aspects of the application and user account. The implementation will follow mobile-first principles while delivering powerful configuration capabilities that rival enterprise-grade construction management platforms.

## Current State Analysis

### Existing Settings Page (`/admin/settings/page.tsx`)
- **Desktop-focused design** with 4 tabs (Projects, Organization, Integrations, System)
- **DataTable** for project management (not mobile-friendly)
- **Only Projects tab** is implemented
- **No navigation customization** feature
- **Preferences stored in localStorage** only
- **No UserPreferences model** in database

### Mobile Standards (from Tasks/Schedule pages)
- `MobileDialog` - Bottom sheets on mobile, dialogs on desktop
- `FilterBottomSheet` - Mobile-optimized filtering
- `MobileCard` - Swipeable cards with actions
- `BottomSheet` - For forms and complex interactions
- **48px minimum touch targets**
- **Card-based layouts** instead of tables
- **Progressive disclosure** for complex options

## Implementation Architecture

### 1. Database Schema - Comprehensive Preferences System

```prisma
model UserPreferences {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])

  // Navigation & Interface
  mobileNavItems    Json      // ["home", "tasks", "bidding"]
  navItemOrder      Int[]     // [0, 1, 2]
  quickActions      Json      // FAB menu items
  dashboardWidgets  Json      // Widget configuration
  favoritePages     String[]  // Quick access pages

  // Appearance & Theme
  theme             String    @default("dark")
  themeCustom       Json?     // Custom theme colors
  density           String    @default("comfortable") // compact/comfortable/spacious
  fontSize          String    @default("medium")
  highContrast      Boolean   @default(false)
  reduceMotion      Boolean   @default(false)
  colorBlindMode    String?   // protanopia/deuteranopia/tritanopia

  // Display Preferences
  showCompleted     Boolean   @default(false)
  defaultView       String    @default("card") // card/list/table
  itemsPerPage      Int       @default(20)
  defaultProject    String?
  language          String    @default("en")
  timezone          String    @default("America/New_York")
  dateFormat        String    @default("MM/DD/YYYY")
  timeFormat        String    @default("12h")

  // Notifications
  emailNotifications    Boolean  @default(true)
  pushNotifications     Boolean  @default(false)
  smsNotifications      Boolean  @default(false)
  notificationSettings  Json     // Granular per-feature settings
  digestFrequency       String   @default("daily") // never/daily/weekly
  quietHours            Json?    // {start: "22:00", end: "08:00"}

  // Privacy & Security
  profileVisibility     String   @default("team") // public/team/private
  activityStatus        Boolean  @default(true)
  twoFactorMethod       String?  // sms/app/email
  trustedDevices        Json[]   // Device fingerprints
  sessionTimeout        Int      @default(10080) // Minutes (1 week)

  // Mobile-specific
  swipeActions          Boolean  @default(true)
  hapticFeedback        Boolean  @default(true)
  biometricAuth         Boolean  @default(false)
  offlineMode           Boolean  @default(true)
  dataSaver             Boolean  @default(false)

  // Integrations
  connectedServices     Json[]   // OAuth connections
  apiKeys               Json[]   // Personal API keys (encrypted)
  webhooks              Json[]   // Webhook configurations
  calendarSync          Json?    // Calendar integration settings

  // Advanced
  debugMode             Boolean  @default(false)
  betaFeatures          Boolean  @default(false)
  featureFlags          Json?    // Override feature flags
  customShortcuts       Json?    // Keyboard shortcuts

  // Metadata
  onboardingCompleted   Boolean  @default(false)
  tourCompleted         Json     @default("{}")
  lastSettingsUpdate    DateTime @updatedAt
  createdAt             DateTime @default(now())
}

// Settings Change Log for Audit
model SettingsChangeLog {
  id            String   @id @default(cuid())
  userId        String
  setting       String
  oldValue      Json?
  newValue      Json
  ipAddress     String?
  userAgent     String?
  timestamp     DateTime @default(now())

  @@index([userId, timestamp])
}

// Preset Configurations
model SettingsPreset {
  id            String   @id @default(cuid())
  name          String
  description   String?
  type          String   // system/team/personal
  settings      Json
  isDefault     Boolean  @default(false)
  createdBy     String?
  createdAt     DateTime @default(now())

  @@unique([name, type])
}
```

### 2. Settings Structure - Industry-Leading Control Center

#### Comprehensive Settings Sections

1. **Profile & Account Management**
   - Complete user profile editing
   - Avatar/profile picture upload
   - Professional credentials & certifications
   - Password & security settings
   - Two-factor authentication (SMS/App/Email)
   - Session management (view/revoke active sessions)
   - Account deletion & data export
   - Linked accounts (Google, Microsoft, etc.)

2. **Navigation & Interface Customization** ⭐ FLAGSHIP FEATURE
   - **Bottom Navigation Editor**
     - Select any 3 items from available modules
     - Drag-and-drop reordering
     - Custom icons selection
     - Live preview with animations
   - **Quick Actions Customization**
     - Configure FAB menu items
     - Set primary actions per page
   - **Dashboard Widget Management**
     - Add/remove/reorder widgets
     - Resize widgets (S/M/L/XL)
     - Custom widget configurations

3. **Appearance & Theming**
   - **Theme Engine**
     - Dark/Light/Auto modes
     - Custom color schemes
     - Brand color customization
     - Accent color picker
   - **Display Preferences**
     - Compact/Comfortable/Spacious density
     - Font size (Small/Medium/Large/XL)
     - High contrast mode
     - Reduce animations toggle
   - **Mobile-Specific**
     - Swipe gesture controls
     - Haptic feedback intensity
     - Landscape mode preferences

4. **Project & Workspace Control**
   - **Project Management**
     - Create/Edit/Archive projects
     - Project templates
     - Bulk project operations
     - Project sharing & permissions
   - **Default Settings**
     - Default project selection
     - Auto-switch based on location
     - Project-specific preferences
   - **Data Organization**
     - Custom project categories
     - Tag management
     - Smart filters & views

5. **Notifications & Communications**
   - **Notification Channels**
     - Email notifications (detailed controls)
     - Push notifications (mobile/desktop)
     - SMS alerts (critical only)
     - In-app notifications
   - **Granular Controls**
     - Per-module notifications
     - Notification scheduling
     - Quiet hours (DND mode)
     - Weekend/holiday preferences
   - **Digest Settings**
     - Daily/Weekly summaries
     - Custom report schedules
     - Alert thresholds

6. **Privacy & Security**
   - **Privacy Controls**
     - Profile visibility settings
     - Activity status
     - Data sharing preferences
     - Analytics opt-out
   - **Security Features**
     - Login history & alerts
     - Trusted devices management
     - API key management
     - Audit log access
   - **Compliance**
     - GDPR data requests
     - Privacy policy acceptance
     - Cookie preferences

7. **Integrations & Connections**
   - **Third-Party Services**
     - Calendar sync (Google/Outlook/Apple)
     - Cloud storage (Drive/Dropbox/OneDrive)
     - Accounting software connections
     - BIM software integrations
   - **API & Webhooks**
     - Personal API tokens
     - Webhook configurations
     - OAuth applications
   - **Import/Export**
     - Data import mappings
     - Export templates
     - Backup schedules

8. **Performance & Accessibility**
   - **Performance Settings**
     - Cache management
     - Offline mode preferences
     - Background sync
     - Data saver mode
   - **Accessibility**
     - Screen reader optimization
     - Keyboard shortcuts editor
     - Voice control settings
     - Color blind modes

9. **Advanced & Developer**
   - **Developer Options**
     - Debug mode toggle
     - Performance monitoring
     - Network throttling
     - Console logging level
   - **Experimental Features**
     - Beta features opt-in
     - A/B testing preferences
     - Feature flags override
   - **System Information**
     - App version & updates
     - Device information
     - Storage usage
     - Database statistics

### 3. Navigation Customization Feature

#### Available Navigation Items

**Admin/Staff:**
```javascript
const ADMIN_NAV_OPTIONS = [
  { id: 'home', label: 'Dashboard', icon: Home, href: '/admin' },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, href: '/admin/tasks' },
  { id: 'bidding', label: 'Bidding', icon: FileText, href: '/admin/bidding' },
  { id: 'schedule', label: 'Schedule', icon: Calendar, href: '/admin/schedule' },
  { id: 'contacts', label: 'Contacts', icon: Users, href: '/admin/contacts' },
  { id: 'budget', label: 'Budget', icon: DollarSign, href: '/admin/budget' },
  { id: 'procurement', label: 'Procurement', icon: Package, href: '/admin/procurement' },
  { id: 'plans', label: 'Plans', icon: FileText, href: '/admin/plans' },
  { id: 'risks', label: 'Risks', icon: AlertTriangle, href: '/admin/risks' },
];
```

**Contractor:**
```javascript
const CONTRACTOR_NAV_OPTIONS = [
  { id: 'home', label: 'Dashboard', icon: Home, href: '/contractor' },
  { id: 'my-tasks', label: 'My Tasks', icon: ClipboardList, href: '/contractor/my-tasks' },
  { id: 'bids', label: 'Bids', icon: FileText, href: '/contractor/bids' },
  { id: 'my-schedule', label: 'My Schedule', icon: Calendar, href: '/contractor/my-schedule' },
  { id: 'uploads', label: 'Uploads', icon: FileText, href: '/contractor/uploads' },
  { id: 'invoices', label: 'Invoices', icon: DollarSign, href: '/contractor/invoices' },
  { id: 'plans', label: 'Plans', icon: FileText, href: '/contractor/plans' },
];
```

#### Customization UI
- Drag-and-drop interface using `@dnd-kit/sortable`
- Visual preview of bottom navigation
- Limit to 3 selections
- Save to database on change
- Fallback to defaults if not customized

### 4. Component Structure

```
components/
  settings/
    mobile-settings-page.tsx      # Main mobile settings layout
    settings-section.tsx          # Collapsible section component
    navigation-customizer.tsx     # Drag-drop nav editor
    nav-preview.tsx              # Live preview of navigation
    profile-section.tsx          # Profile & account settings
    appearance-section.tsx       # Theme & display settings
    notifications-section.tsx   # Notification preferences
    project-settings.tsx        # Project management (mobile)
    settings-card.tsx           # Reusable settings card
```

### 5. API Endpoints

```typescript
// User Preferences
GET    /api/v1/users/preferences          // Get current user preferences
POST   /api/v1/users/preferences          // Create preferences
PUT    /api/v1/users/preferences          // Update preferences
DELETE /api/v1/users/preferences          // Reset to defaults

// Navigation specific
POST   /api/v1/users/preferences/navigation  // Update nav items only
GET    /api/v1/users/preferences/navigation  // Get nav configuration

// Batch updates
POST   /api/v1/users/preferences/batch      // Update multiple settings
```

### 6. Mobile UI Components

#### Settings Section Component
```tsx
interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultExpanded?: boolean;
}
```

#### Navigation Item Card
```tsx
interface NavItemCardProps {
  item: NavItem;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect: () => void;
}
```

#### Settings Toggle
```tsx
interface SettingsToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}
```

### 7. Implementation Priority & Steps

#### Priority 1: Core Infrastructure
1. Create comprehensive UserPreferences model
2. Build robust preferences API with caching
3. Implement preferences context with real-time sync
4. Create base settings page architecture
5. Set up feature flags system

#### Priority 2: Navigation Customization (Flagship Feature)
1. Install @dnd-kit/sortable for drag-drop
2. Build NavigationCustomizer component
3. Create interactive preview system
4. Implement instant apply with rollback
5. Add preset configurations

#### Priority 3: Essential User Controls
1. Complete profile management system
2. Security & authentication settings
3. Notification preferences
4. Project management interface
5. Basic appearance settings

#### Priority 4: Advanced Features
1. Widget dashboard customization
2. Theme engine implementation
3. Integration connections
4. Import/export functionality
5. Developer options

#### Priority 5: Polish & Optimization
1. Performance profiling
2. Accessibility audit (WCAG 2.1 AA)
3. Cross-device testing
4. Error boundaries & recovery
5. Analytics integration

### 8. Mobile-First Design Patterns

#### Touch Targets
- Minimum 48px height for all interactive elements
- 16px padding on tap targets
- Visual feedback on touch (scale/opacity)

#### Navigation Flow
- Settings accessible from user menu
- Back navigation via header
- Swipe-back gesture support
- Bottom sheet for complex forms

#### Responsive Breakpoints
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

#### Performance
- Lazy load sections
- Debounce API calls
- Optimistic UI updates
- Cache preferences locally

### 9. State Management

```typescript
// Preferences Context
interface PreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  error: Error | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

// Local Storage Fallback
const DEFAULT_PREFERENCES = {
  mobileNavItems: ['home', 'tasks', 'schedule'],
  theme: 'dark',
  compactView: false,
  showCompleted: false,
  swipeActions: true,
  hapticFeedback: true,
};
```

### 10. Migration Strategy

1. **Backwards Compatibility**
   - Check localStorage first
   - Migrate to database on first load
   - Keep localStorage as fallback

2. **Default Navigation**
   - Admin: Home, Tasks, Bidding
   - Contractor: Home, My Tasks, Bids
   - Viewer: Home, Tasks, Schedule

3. **Progressive Enhancement**
   - Basic settings work without JS
   - Enhanced features with JS
   - Offline support with service worker

### 11. Testing Requirements

#### Unit Tests
- Preferences API endpoints
- Navigation customizer logic
- Settings validation

#### Integration Tests
- Settings persistence
- Navigation updates
- Cross-device sync

#### E2E Tests
- Complete settings flow
- Navigation customization
- Mobile interactions

### 12. Accessibility

- ARIA labels on all controls
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Focus management in modals

### 13. Security Considerations

- Validate all preference updates
- Sanitize JSON fields
- Rate limit API endpoints
- Audit preference changes
- RBAC for admin settings

### 14. Performance Metrics

- Settings page load: < 200ms
- API response time: < 100ms
- Smooth 60fps animations
- Bundle size: < 50KB for settings

### 14. Unique Industry-Leading Features

#### Intelligent Settings
- **AI-Powered Suggestions**: ML-based settings recommendations based on usage patterns
- **Smart Defaults**: Role and context-aware default configurations
- **Predictive Adjustments**: Automatic settings optimization based on performance

#### Collaborative Settings
- **Team Presets**: Share settings configurations across teams
- **Settings Inheritance**: Project-level settings that cascade to team members
- **Configuration Templates**: Industry-standard templates for different project types

#### Advanced Customization
- **Visual Navigation Builder**: Drag-drop interface with live preview
- **Widget Marketplace**: Custom widgets from community/partners
- **Theme Studio**: Professional theme creation with export/sharing
- **Workflow Automation**: If-this-then-that rules for settings

#### Enterprise Features
- **Settings Policies**: Admin-enforced settings boundaries
- **Compliance Profiles**: Pre-configured for OSHA, ISO, etc.
- **Multi-tenant Support**: Organization-wide settings management
- **Settings Analytics**: Track setting usage and optimization

#### Mobile Innovation
- **Gesture Customization**: Define custom swipe actions
- **Voice Commands**: "Hey Claude, switch to dark mode"
- **Location-based Settings**: Auto-adjust based on job site
- **NFC Tag Integration**: Tap to apply site-specific settings

#### Performance & Reliability
- **Settings Sync Engine**: Real-time cross-device synchronization
- **Conflict Resolution**: Smart merging of concurrent changes
- **Offline-First**: Full functionality without connection
- **Version Control**: Settings history with rollback

### 15. Competitive Advantages

1. **Most Customizable**: More options than Procore, Buildertrend, or CoConstruct
2. **Fastest Implementation**: Instant apply with zero page refresh
3. **Best Mobile Experience**: Native-feeling with 60fps animations
4. **Smartest Defaults**: ML-powered intelligent suggestions
5. **Most Accessible**: WCAG 2.1 AAA compliance
6. **Most Secure**: Zero-trust architecture with E2E encryption
7. **Most Integrated**: 50+ third-party service connections

## Success Criteria

1. ✅ Mobile-first responsive design
2. ✅ Navigation customization working
3. ✅ All existing features preserved
4. ✅ < 200ms page load time
5. ✅ 100% mobile touch-friendly
6. ✅ Accessibility score > 90
7. ✅ Zero breaking changes
8. ✅ User satisfaction > 4.5/5


## Dependencies

- `@dnd-kit/sortable` - Drag and drop
- `react-beautiful-dnd` - Alternative DnD
- Existing UI components
- Prisma ORM
- TanStack Query

## Risk Mitigation & Quality Assurance

### Rollback Strategy
1. **Feature Flags**: Gradual rollout with instant rollback capability
2. **Parallel Systems**: Old settings remain accessible during transition
3. **Data Safety**: All changes logged with point-in-time recovery
4. **User Choice**: Opt-in beta with feedback loop
5. **Instant Revert**: One-click restore to previous configuration

### Quality Assurance
1. **Automated Testing**: 100% coverage for critical paths
2. **Cross-Device Testing**: iOS, Android, Desktop (Chrome, Safari, Edge)
3. **Performance Testing**: Load testing for 10,000+ concurrent users
4. **Security Audit**: Penetration testing for all endpoints
5. **Accessibility Audit**: WCAG 2.1 AAA compliance verification
6. **User Testing**: Beta program with 100+ users

### Monitoring & Analytics
1. **Real-time Monitoring**: Settings service health dashboard
2. **Error Tracking**: Sentry integration for instant alerts
3. **Performance Metrics**: Core Web Vitals tracking
4. **Usage Analytics**: Feature adoption tracking
5. **User Feedback**: In-app feedback system

## Technical Excellence Standards

### Code Quality
- **TypeScript**: 100% type coverage
- **Testing**: >90% test coverage
- **Documentation**: JSDoc for all public APIs
- **Code Review**: Mandatory peer review
- **Linting**: ESLint with strict rules

### Performance Standards
- **First Load**: < 100ms
- **Settings Apply**: < 50ms
- **API Response**: < 100ms
- **Animation**: 60fps consistent
- **Memory**: < 50MB heap usage

### Security Standards
- **Authentication**: OAuth 2.0 + JWT
- **Encryption**: AES-256 for sensitive data
- **API Security**: Rate limiting + CORS
- **Audit Trail**: Complete change history
- **Compliance**: GDPR, CCPA ready

---

**Document Version**: 2.0
**Last Updated**: September 18, 2025
**Status**: FINALIZED - Industry-Leading Implementation Ready
**Owner**: Development Team
**Classification**: Source of Truth