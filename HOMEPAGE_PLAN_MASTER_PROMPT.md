# HOMEPAGE IMPLEMENTATION DIRECTIVE
## Miami Duplex Construction Management System - Complete LLM Implementation Guide

**Target Model**: Claude Code Opus 4  
**Implementation Status**: Ready for Execution  
**Directive**: Transform homepage from 34-line auth router to comprehensive construction management dashboard
**Architecture Integration**: Full alignment with existing MASTER_CONTEXT_DOCUMENT.md patterns

---

## EXECUTIVE SUMMARY

### Current State
- `app/page.tsx`: 34-line authentication router with loading spinner only
- Users redirected immediately to role-based dashboards (`/admin` or `/contractor`)
- No unified homepage experience or cross-project overview

### Transformation Goal
- Convert to comprehensive, mobile-first construction management dashboard
- Unified homepage for all authenticated users with role-based content
- Preserve existing architecture patterns and security model
- Implement industry-standard construction management features

### Success Criteria
- Single homepage serves all user roles with appropriate content filtering
- Mobile-first responsive design with 48px+ touch targets
- Real-time data integration with <2s loading times
- Context-aware FAB functionality across all pages
- Construction-specific features (weather, inspections, progress tracking)

---

## CRITICAL SYSTEM ARCHITECTURE (FROM MASTER_CONTEXT_DOCUMENT.md)

### NON-NEGOTIABLE ARCHITECTURAL PRINCIPLES
1. **PageShell is Sacred**: Universal authenticated page wrapper at `components/blocks/page-shell.tsx` MUST be preserved
   - Responsive sidebar (desktop) with mobile bottom navigation (3 nav + FAB + More)
   - Project switcher integration and user dropdown
   - Glass morphism styling with auto-collapse on landscape
2. **Mobile-First Everything**: All components start mobile (320px), enhance to desktop
3. **Security-First**: Policy engine (`lib/policy/index.ts`) controls ALL data access with project scoping
4. **Glass Morphism Theme**: Consistent graphite color palette + backdrop-blur effects
   - Background: graphite-900, Cards: graphite-800, Accent: #8EE3C8 (mint green)
   - Glass utility classes: `.glass`, `.glass-card`, `.glass-hover`
5. **Repository Pattern**: All database access via scoped repositories (`lib/data/repositories.ts`)
6. **TanStack Query Integration**: Client state management with 1-minute stale time
   - Hooks in `hooks/use-api.ts` (666 lines of comprehensive coverage)
7. **Role-Based Access Control**: ADMIN/STAFF/CONTRACTOR/VIEWER content differentiation

### COMPLETE TECHNOLOGY STACK (ESTABLISHED)
- **Framework**: Next.js 15.5.0 App Router with React 19.1.0
- **Language**: TypeScript strict mode with Zod validation schemas
- **Database**: PostgreSQL via Prisma ORM 6.14.0 with project scoping
- **Authentication**: Firebase Auth + Admin SDK 13.4.0 with custom claims
- **Styling**: Tailwind CSS 3.4.17 + custom glass morphism utilities
- **UI Library**: Radix UI + shadcn/ui + custom mobile-first components
- **State Management**: TanStack Query 5.85.5 + React Context (auth/project)
- **Security**: Policy engine with rate limiting and module permissions

### EXISTING MOBILE COMPONENT SYSTEM (LEVERAGE THESE)
- **MobileDialog**: Auto-adaptive component (`components/ui/mobile/dialog.tsx`)
  - Mobile: Sheet slides up from bottom, Desktop: Centered modal
- **MobileTaskCard**: Swipe gestures with react-swipeable (`components/tasks/mobile-task-card.tsx`)
- **KPICarousel**: Embla carousel for mobile, CSS Grid for desktop (`components/schedule/kpi-carousel.tsx`)
- **Touch Standards**: 48px minimum touch targets, 44px secondary actions

---

## HOMEPAGE LAYOUT ARCHITECTURE

### Mobile Layout Structure (< 768px)
```
┌─────────────────────────────────┐
│ PageShell Header                │ ← Project selector + user dropdown
│ (Project switcher, User menu)   │
├─────────────────────────────────┤
│ Project Hero Card               │ ← Current project overview
│ • Project name, timeline        │   48px min height, full width
│ • Progress %, key stats         │
│ • Weather widget (if outdoor)   │
├─────────────────────────────────┤
│ KPI Grid (2 columns × 2 rows)   │ ← Core metrics
│ ┌─────────────┬─────────────────┐│
│ │Tasks Today  │ Budget Status   ││
│ │   48px+     │     48px+       ││
│ ├─────────────┼─────────────────┤│
│ │Schedule     │ Team Status     ││
│ │   48px+     │     48px+       ││
│ └─────────────┴─────────────────┘│
├─────────────────────────────────┤
│ Today's Priority                │ ← Urgent tasks due today
│ • Swipe actions (complete/defer)│   Card height: min 64px
│ • Critical path indicators      │
├─────────────────────────────────┤
│ Today's Schedule                │ ← Events, meetings, inspections
│ • Timeline view with times      │   Each item: min 48px
│ • Status indicators             │
├─────────────────────────────────┤
│ Alerts & Issues                 │ ← Budget exceptions, overdue
│ • Red/yellow alert cards        │   Alert height: min 56px
│ • Tap to view details           │
├─────────────────────────────────┤
│ Recent Activity                 │ ← Live activity feed
│ • Task completions, updates     │   Feed items: min 40px
│ • Real-time updates             │
├─────────────────────────────────┤
│ Quick Actions Grid              │ ← Common actions
│ • 2-column layout               │   Each action: 48px+ square
│ • Role-based actions            │
└─────────────────────────────────┘
│ Mobile Bottom Navigation        │ ← 3 nav + FAB + More
│ [Home][Tasks][Schedule][FAB][More]│   Height: 60px, FAB: 56px
└─────────────────────────────────┘
```

### Desktop Layout Structure (≥ 768px)
```
┌────────────────────────────────────────────────────────┐
│ PageShell Header + Sidebar Navigation                  │
├─────────────────┬──────────────────────────────────────┤
│ Project Hero    │ KPI Grid (4 columns)                │
│ Card            │ ┌──────┬──────┬──────┬──────────────┐ │
│ • Weather       │ │Tasks │Budget│Sched │Team Status   │ │
│ • Progress      │ │Today │Status│Today │              │ │
│ • Timeline      │ └──────┴──────┴──────┴──────────────┘ │
├─────────────────┼──────────────────────────────────────┤
│ Today's         │ Today's Schedule                     │
│ Priority        │ • Full calendar view                 │
│ • Task list     │ • Meeting details                    │
│ • Critical path │ • Inspection status                  │
├─────────────────┼──────────────────────────────────────┤
│ Alerts & Issues │ Recent Activity Feed                 │
│ • Budget alerts │ • Expanded timeline view             │
│ • Safety issues │ • Team activity                      │
│ • Overdue items │ • Document updates                   │
├─────────────────┴──────────────────────────────────────┤
│ Quick Actions (Horizontal Layout)                      │
│ [Add Task][Schedule Meeting][Invite Contact][Upload]... │
└────────────────────────────────────────────────────────┘
```

---

## COMPONENT ARCHITECTURE

### 1. CORE HOMEPAGE COMPONENT
**File**: `app/page.tsx` (MAJOR OVERHAUL)

```typescript
// Current: 34 lines (auth router only)
// New: ~400-500 lines (full dashboard with auth preservation)

interface HomepageProps {
  // Role-based rendering
  userRole: 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'
  projectId: string
  user: FirebaseUser
}

// Key Features:
- Preserve authentication logic with fallback redirects
- Role-based content rendering (different views per role)
- Real-time data integration via TanStack Query hooks
- Mobile-first responsive layout with breakpoint detection
- Integration with existing PageShell wrapper
- Context-aware FAB functionality
```

### 2. PROJECT HERO CARD
**File**: `components/homepage/project-hero-card.tsx`

```typescript
interface ProjectHeroCardProps {
  project: Project
  weatherData?: WeatherInfo // For outdoor construction projects
  progressData: ProjectProgress
  isMobile: boolean
}

// Features:
- Project name, address, timeline display
- Progress bar with milestone indicators
- Key project stats (tasks complete, budget utilized, team size)
- Weather widget for outdoor work planning
- Last updated timestamp with real-time sync
- Responsive design (compact mobile, expanded desktop)
```

### 3. HOMEPAGE KPI WIDGETS
**File**: `components/homepage/homepage-kpi-grid.tsx`

```typescript
// Extends existing KPIWidget component
interface HomepageKPIGridProps {
  tasksToday: number
  budgetUtilization: number
  scheduleCompliance: number
  teamStatus: TeamStatusData
  userRole: Role
}

// KPI Widgets:
1. Tasks Today (with overdue indicator)
2. Budget Status (% utilized, variance alerts)
3. Schedule Today (events, compliance rate)
4. Team Status (active members, availability)

// Role-based visibility:
- CONTRACTOR: Limited budget visibility (no actual amounts)
- VIEWER: Read-only data without sensitive financial info
- ADMIN/STAFF: Full access to all metrics
```

### 4. TODAY'S PRIORITY WIDGET
**File**: `components/homepage/todays-priority-widget.tsx`

```typescript
interface TodaysPriorityWidgetProps {
  urgentTasks: Task[]
  onTaskUpdate: (taskId: string, update: TaskUpdate) => void
  isMobile: boolean
}

// Features:
- Tasks due today with priority indicators
- Overdue tasks with alert styling (red border, warning icons)
- Critical path items highlighted (gold accent)
- Mobile: Swipe actions (right=complete, left=defer)
- Desktop: Hover actions and bulk operations
- Real-time updates with optimistic UI
- Integration with existing task management system
```

### 5. TODAY'S SCHEDULE WIDGET
**File**: `components/homepage/todays-schedule-widget.tsx`

```typescript
interface TodaysScheduleWidgetProps {
  events: ScheduleEvent[]
  inspections: InspectionEvent[]
  meetings: MeetingEvent[]
  isMobile: boolean
}

// Features:
- Timeline view with hour markers
- Event types: meetings, inspections, deliveries, milestones
- Status indicators (confirmed, pending, requested)
- Weather impact alerts for outdoor events
- Quick reschedule/cancel actions
- Integration with calendar system
```

### 6. ALERTS & ISSUES WIDGET
**File**: `components/homepage/alerts-issues-widget.tsx`

```typescript
interface AlertsIssuesWidgetProps {
  budgetExceptions: BudgetAlert[]
  overdueTasks: Task[]
  safetyAlerts: SafetyAlert[]
  permitIssues: PermitAlert[]
  userRole: Role
}

// Alert Categories:
- Budget exceptions (red: over budget, yellow: approaching limit)
- Overdue tasks (escalating colors based on days overdue)
- Safety incidents/reminders (critical priority)
- Permit/inspection issues (regulatory compliance)
- Material delivery delays (supply chain alerts)
```

### 7. ACTIVITY FEED WIDGET
**File**: `components/homepage/activity-feed-widget.tsx`

```typescript
interface ActivityFeedWidgetProps {
  activities: ActivityEvent[]
  limit?: number // Default: 5 mobile, 10 desktop
  realTimeUpdates: boolean
}

// Activity Types:
- Task completions with user attribution
- New comments and updates
- File/photo uploads
- Budget changes and approvals
- Schedule modifications
- Team check-ins and status updates
- Document approvals
- Change order submissions

// Features:
- Real-time updates via WebSocket or polling
- User avatars and timestamps
- Expandable details on tap/click
- "Load more" functionality
- Filter by activity type
```

### 8. QUICK ACTIONS GRID
**File**: `components/homepage/quick-actions-grid.tsx`

```typescript
interface QuickActionsGridProps {
  userRole: Role
  onActionClick: (action: QuickAction) => void
  isMobile: boolean
}

// Role-Based Actions:
ADMIN/STAFF:
- Add Task, Schedule Meeting, Invite Contractor
- Upload Document, Create Budget Item, Log Expense
- Add Contact, Schedule Inspection, Create Change Order

CONTRACTOR:
- Submit Timesheet, Upload Progress Photo, Log Expenses
- Request Materials, Schedule Delivery, Report Issue
- Update Task Status, Add Comments

VIEWER:
- View Reports, Download Documents, Export Data

// Layout:
- Mobile: 2-column grid, 48px+ touch targets
- Desktop: Horizontal layout with grouped actions
- Icon + label format with consistent styling
```

---

## CONSTRUCTION-SPECIFIC FEATURES

### Weather Integration
**API**: OpenWeatherMap or similar weather service
**Implementation**: `components/homepage/weather-widget.tsx`

```typescript
interface WeatherWidgetProps {
  location: ProjectLocation
  forecastDays: number // Default: 3-day forecast
}

// Features:
- Current conditions and 3-day forecast
- Construction-specific alerts (rain, high winds, extreme temps)
- Work impact indicators (outdoor work advisability)
- Historical weather data for scheduling
- Integration with schedule planning
```

### Safety Dashboard
**Implementation**: `components/homepage/safety-tracker-widget.tsx`

```typescript
interface SafetyTrackerProps {
  recentIncidents: SafetyIncident[]
  safetyReminders: SafetyReminder[]
  lastSafetyMeeting: Date
}

// Features:
- Days since last incident counter
- Recent safety reminders and updates
- OSHA compliance checklist progress
- Safety meeting schedule
- Incident reporting quick action
```

### Inspection Management
**Implementation**: `components/homepage/inspection-dashboard-widget.tsx`

```typescript
interface InspectionDashboardProps {
  upcomingInspections: Inspection[]
  permitStatus: PermitStatus[]
  requiredDocuments: Document[]
}

// Features:
- Upcoming inspection schedule
- Permit status tracking
- Required document checklist
- Inspector contact information
- Reschedule/cancel functionality
```

### Progress Documentation
**Implementation**: `components/homepage/progress-photos-widget.tsx`

```typescript
interface ProgressPhotosProps {
  recentPhotos: ProgressPhoto[]
  milestoneComparisons: PhotoComparison[]
}

// Features:
- Latest progress photos with timestamps
- Before/after milestone comparisons
- Photo upload quick action
- Integration with task completion
- Automatic photo organization by project phase
```

---

## ENHANCED FAB FUNCTIONALITY

### Context-Aware Quick Actions
**Implementation**: Enhanced FAB system across all pages

```typescript
interface ContextualFABProps {
  currentPage: string
  userRole: Role
  primaryAction: QuickAction
  secondaryActions: QuickAction[]
}

// Page-Specific FAB Behavior:
Homepage:
- Primary: Quick Add Menu (expandable)
- Secondary: [Add Task, Schedule Meeting, Add Contact, Upload Photo]

Tasks Page:
- Primary: Add New Task
- Secondary: [Bulk Actions, Filter, Export]

Schedule Page:
- Primary: Add Event/Meeting
- Secondary: [Add Inspection, Schedule Delivery, View Calendar]

Contacts Page:
- Primary: Add New Contact
- Secondary: [Invite Contractor, Send Message, Import Contacts]

// Mobile Implementation:
- 56px diameter FAB with elevation shadow
- Expandable action menu with backdrop
- Smooth animations using Framer Motion
- Proper z-index management (z-50)
- Touch feedback and haptics
```

---

## ROLE-BASED ACCESS CONTROL

### Content Differentiation by Role

#### ADMIN/STAFF (Full Access)
```typescript
interface AdminHomepageContent {
  // Complete dashboard access
  projectOverview: FullProjectData
  budgetData: CompleteBudgetInfo // Include actual amounts
  teamManagement: TeamAdminData
  securityControls: SystemAdminControls
  
  // Quick Actions Available:
  - All project management functions
  - User administration
  - Budget/financial management
  - Contractor invitations and management
  - System configuration access
}
```

#### CONTRACTOR (Limited Access)
```typescript
interface ContractorHomepageContent {
  // Project-specific data only
  assignedTasks: ContractorTask[]
  budgetData: RedactedBudgetInfo // No actual amounts, % only
  scheduleEvents: ContractorSchedule[]
  materialRequests: ContractorProcurement[]
  
  // Quick Actions Available:
  - Task status updates
  - Time logging and expenses
  - Material requests
  - Progress photo uploads
  - Communication with project team
}
```

#### VIEWER (Read-Only Access)
```typescript
interface ViewerHomepageContent {
  // High-level overview only
  projectProgress: PublicProgressData
  scheduleOverview: PublicScheduleData
  budgetSummary: HighLevelBudgetData // No detailed amounts
  
  // Quick Actions Available:
  - Report generation
  - Document downloads
  - Data exports (limited)
}
```

---

## TECHNICAL IMPLEMENTATION GUIDELINES

### Data Integration Patterns
**API Endpoints**: All data via existing `/api/v1/*` routes

```typescript
// Homepage Data Fetching Strategy
export function useHomepageData(projectId: string, userRole: Role) {
  const tasksQuery = useTasks({ projectId, status: 'active', dueDate: 'today' })
  const scheduleQuery = useTodaySchedule(projectId)
  const budgetQuery = useBudgetSummary(projectId)
  const activityQuery = useRecentActivity(projectId, { limit: 10 })
  
  return {
    isLoading: tasksQuery.isLoading || scheduleQuery.isLoading,
    data: {
      tasks: tasksQuery.data,
      schedule: scheduleQuery.data,
      budget: budgetQuery.data,
      activity: activityQuery.data
    },
    refetchAll: () => {
      tasksQuery.refetch()
      scheduleQuery.refetch()
      budgetQuery.refetch()
      activityQuery.refetch()
    }
  }
}
```

### Real-Time Updates Implementation
**Strategy**: TanStack Query with background refetch + optimistic updates

```typescript
// Real-time update configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 30 * 1000, // 30 seconds background refetch
      refetchOnWindowFocus: true,
      retry: 2
    }
  }
})

// Optimistic update pattern for task completion
const completeTaskMutation = useMutation({
  mutationFn: (taskId: string) => apiClient.patch(`/tasks/${taskId}/complete`),
  onMutate: async (taskId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tasks'])
    
    // Snapshot previous value
    const previousTasks = queryClient.getQueryData(['tasks'])
    
    // Optimistically update
    queryClient.setQueryData(['tasks'], (old: any) => 
      old.map(task => task.id === taskId ? { ...task, status: 'COMPLETED' } : task)
    )
    
    return { previousTasks }
  },
  onError: (err, taskId, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context?.previousTasks)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['tasks'])
  }
})
```

### Mobile Performance Optimization
**Strategies**: Code splitting, lazy loading, image optimization

```typescript
// Component lazy loading
const ProjectHeroCard = lazy(() => import('@/components/homepage/project-hero-card'))
const ActivityFeedWidget = lazy(() => import('@/components/homepage/activity-feed-widget'))

// Image optimization for progress photos
<Image
  src={photo.url}
  alt={photo.description}
  width={400}
  height={300}
  className="rounded-lg"
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." // Low quality placeholder
/>

// Bundle size monitoring
// Target: <850KB gzipped (current system target)
// Homepage-specific: <200KB additional bundle size
```

---

## IMPLEMENTATION PHASES

## BACKEND FEATURE COMPATIBILITY ANALYSIS\n\n### HOMEPAGE PLAN ALIGNMENT WITH CURRENT BACKEND\n\n**ANSWER: IS THE CURRENT PLAN ALIGNED WITH THE BACKEND?**\n**STATUS**: ⚠️ PARTIALLY ALIGNED - Several critical API hooks are missing\n\n#### EXISTING COMPATIBLE FEATURES ✅\n- **Task Management Widgets**: Fully supported via existing `useTasks`, `useCreateTask`, `useUpdateTask` hooks\n- **Project Overview**: Supported via existing `useProjects` hook and project context\n- **Contact Integration**: Fully supported via existing `useContacts` and portal system\n- **Authentication & Security**: 100% compatible with existing policy engine and role-based access\n- **Mobile Components**: Fully compatible with established MobileDialog, swipe gesture patterns\n- **PageShell Integration**: 100% compatible with existing responsive navigation system\n\n#### MISSING BACKEND REQUIREMENTS ❌\n**Critical API hooks referenced in admin dashboard but NOT implemented:**\n- `useBudgetSummary(projectId, enabled)` - Budget overview widgets\n- `useBudgetExceptions(projectId, enabled)` - Budget exception alerts\n- `useTodaySchedule(projectId, enabled)` - Today's schedule timeline\n- `useRecentActivity(projectId, options, enabled)` - Real-time activity feed\n- `useWeatherData(location, enabled)` - Weather integration for construction\n\n**ANSWER: WILL EVERY FEATURE WORK CORRECTLY WITH CURRENT IMPLEMENTATION?**\n**STATUS**: ❌ NO - Missing API endpoints and hooks must be created first\n\n#### REQUIRED NEW API ENDPOINTS\n```typescript\n// Budget endpoints (critical for budget widgets)\nGET /api/v1/budget/summary/:projectId\nGET /api/v1/budget/exceptions/:projectId\n\n// Schedule endpoints (critical for schedule widgets)\nGET /api/v1/schedule/today/:projectId\nGET /api/v1/schedule/events/:projectId\n\n// Activity endpoints (critical for activity feed)\nGET /api/v1/activity/recent/:projectId\nPOST /api/v1/activity/log/:projectId\n\n// Weather endpoints (new functionality)\nGET /api/v1/weather/:location\n```\n\n### INTEGRATION WITH OTHER PAGES\n**ANSWER: WILL FEATURES WORK WITH OTHER PAGES?**\n**STATUS**: ✅ YES - Fully compatible with existing page architecture\n\n- **Tasks Page**: Homepage task widgets use same `useTasks` hook as tasks page\n- **Schedule Page**: Schedule widgets will integrate with existing calendar system\n- **Contacts Page**: Contact metrics use same `useContacts` hook\n- **Navigation**: Enhanced FAB will work across all existing pages\n- **Mobile Components**: All widgets use established mobile-first patterns\n- **Security**: Same policy engine controls access across all pages\n\n---\n\n## CLAUDE CODE OPUS 4 IMPLEMENTATION DIRECTIVE

### CRITICAL BACKEND ALIGNMENT REQUIREMENTS
**⚠️ PREREQUISITE**: Several API hooks referenced in the current admin dashboard DO NOT EXIST in `hooks/use-api.ts`:
- `useBudgetSummary` - Referenced but missing
- `useBudgetExceptions` - Referenced but missing  
- `useTodaySchedule` - Referenced but missing
- `useRecentActivity` - Needed for activity feed

**OPUS 4 DIRECTIVE**: Create these missing hooks FIRST to ensure full feature functionality. Work in parallel using multiple tools and MCP servers when possible.

### IMPLEMENTATION PHASES WITH TRACKING
**Execute these phases sequentially, updating completion status and committing after each phase:**

#### PHASE 1: API Foundation & Core Transformation
**Status**: ⏳ NOT STARTED

**Implementation Tasks:**
- **Create Missing API Hooks** in `hooks/use-api.ts`:
  - `useBudgetSummary(projectId, enabled)` - Project budget overview data
  - `useBudgetExceptions(projectId, enabled)` - Over-budget items
  - `useTodaySchedule(projectId, enabled)` - Today's scheduled events
  - `useRecentActivity(projectId, options, enabled)` - Activity feed data
  - `useWeatherData(location, enabled)` - Weather integration

- **Transform Core Homepage** `app/page.tsx`:
  - Preserve existing 34-line authentication logic with fallback redirects
  - Add comprehensive dashboard content while maintaining auth flow
  - Integrate with existing PageShell wrapper architecture
  - Implement responsive layout structure (mobile-first, desktop-enhanced)
  - Set up role-based content rendering using established patterns

**Success Criteria:**
- All missing API hooks created and functional
- Homepage authentication flow preserved and working
- Basic dashboard structure implemented
- PageShell integration maintained

**Upon Completion:**
- [ ] Update this section: Status → ✅ COMPLETED
- [ ] Git commit with message: "Phase 1: Homepage foundation and API hooks"
- [ ] Move to Phase 2

#### PHASE 2: Essential Dashboard Widgets
**Status**: ⏳ PENDING PHASE 1

**Implementation Tasks:**
- **Create Component Files** (work in parallel):
  - `components/homepage/project-hero-card.tsx` - Project overview with weather
  - `components/homepage/homepage-kpi-grid.tsx` - 4 core construction metrics
  - `components/homepage/todays-priority-widget.tsx` - Urgent tasks with swipe actions
  - `components/homepage/todays-schedule-widget.tsx` - Event timeline with status
  - `components/homepage/alerts-issues-widget.tsx` - Critical notifications

- **Integration Requirements**:
  - Use existing mobile component patterns (MobileDialog, swipe gestures)
  - Leverage established glass morphism styling
  - Implement proper TanStack Query integration
  - Add role-based content filtering

**Success Criteria:**
- All 5 core widgets implemented and functional
- Real-time data integration via new API hooks
- Mobile touch targets meet 48px minimum standards
- Role-based content appropriately filtered

**Upon Completion:**
- [ ] Update this section: Status → ✅ COMPLETED
- [ ] Git commit with message: "Phase 2: Core dashboard widgets"
- [ ] Move to Phase 3

#### PHASE 3: Enhanced Functionality & Real-Time Features
**Status**: ⏳ PENDING PHASE 2

**Implementation Tasks:**
- **Advanced Widgets** (parallel implementation):
  - `components/homepage/activity-feed-widget.tsx` - Real-time updates
  - `components/homepage/quick-actions-grid.tsx` - Role-based actions
  - `components/homepage/weather-widget.tsx` - Construction weather integration

- **Enhanced FAB System**:
  - Context-aware FAB functionality across all pages
  - Expandable action menus with backdrop
  - Page-specific primary/secondary actions

- **Real-Time Integration**:
  - TanStack Query background refetch (30-second intervals)
  - Optimistic updates for task interactions
  - Activity feed live updates

**Success Criteria:**
- Activity feed updates in real-time
- Quick actions work correctly for all user roles
- FAB context switching functions across pages
- Weather data integrates with schedule planning

**Upon Completion:**
- [ ] Update this section: Status → ✅ COMPLETED
- [ ] Git commit with message: "Phase 3: Enhanced functionality and real-time features"
- [ ] Move to Phase 4

#### PHASE 4: Construction-Specific Features  
**Status**: ❌ CANCELLED (September 11, 2025)
**Reason**: Features too complex for homepage widgets - should be separate dedicated pages

**Original Planned Widgets (CANCELLED):**
- ~~Safety tracking dashboard widget~~ → Should be /safety page
- ~~Inspection management integration~~ → Already in /schedule page  
- ~~Progress photo documentation~~ → Should be /photos page
- ~~Material delivery tracking~~ → Should be in /schedule or /inventory page

**Decision Rationale:**
Homepage widgets should be simple, glanceable, and actionable. Complex features requiring detailed interaction belong in dedicated pages, not dashboard widgets. This keeps the homepage focused and fast.

**Replacement Action:**
Proceed directly to Phase 5 (Optimization) after completing homepage integration with Phase 1-3 widgets only.

#### PHASE 5: Performance Optimization & Quality Assurance
**Status**: ⏳ PENDING PHASE 4

**Implementation Tasks:**
- **Performance Optimization**:
  - Bundle size analysis and optimization (<200KB additional)
  - Component lazy loading implementation
  - Image optimization for progress photos
  - Database query performance review

- **Mobile Enhancement**:
  - Advanced swipe gesture implementation
  - Touch feedback and haptics
  - Responsive design validation (320px-1920px+)

- **Quality Assurance**:
  - Error boundary implementation
  - Cross-device testing matrix
  - Role-based access validation
  - Performance benchmarking

**Success Criteria:**
- Homepage loads in <2 seconds on 3G networks
- All touch targets meet accessibility standards
- Error states degrade gracefully
- All user flows tested and validated

**Upon Completion:**
- [ ] Update this section: Status → ✅ COMPLETED
- [ ] Git commit with message: "Phase 5: Performance optimization and QA complete"
- [ ] Final deployment validation

### CLAUDE CODE OPUS 4 EXECUTION INSTRUCTIONS
**Work in parallel using all available tools and MCP servers. Execute multiple independent operations simultaneously when possible.**

**Required Approach:**
- Use multiple tool calls in single responses for parallel execution
- Leverage all MCP servers at disposal for comprehensive functionality
- Implement comprehensive solutions with thoughtful details (hover states, transitions, error handling)
- Apply design principles: hierarchy, contrast, balance throughout implementation
- Focus on robust, general solutions that work for all valid user inputs
- Return to Implementation Phases section after each phase to update completion status
- Commit changes after each phase completion with descriptive commit messages

---

## QUALITY ASSURANCE REQUIREMENTS

### Performance Benchmarks
- **First Contentful Paint**: <1.5 seconds
- **Time to Interactive**: <3 seconds  
- **Bundle Size Impact**: <200KB additional to existing ~850KB
- **API Response Time**: 95th percentile <300ms
- **Mobile Scroll Performance**: 60fps maintained

### Accessibility Standards
- **Touch Targets**: Minimum 48px × 48px for primary actions, 44px for secondary
- **Color Contrast**: WCAG AA compliance (4.5:1 ratio minimum)
- **Screen Reader**: Full ARIA labeling for all interactive elements
- **Keyboard Navigation**: Tab order and focus management
- **Motion**: Respect `prefers-reduced-motion` setting

### Device Testing Matrix
**Mobile Devices:**
- iPhone 12/13/14 (Safari)
- iPhone SE (320px width testing)
- Android phones (Chrome, Samsung Browser)
- iPad (Safari, Chrome)

**Desktop:**
- Chrome (Windows, Mac, Linux)
- Firefox (Windows, Mac, Linux)  
- Safari (Mac)
- Edge (Windows)

**Resolution Testing:**
- 320px (iPhone SE)
- 375px (iPhone standard)
- 768px (iPad portrait)
- 1024px (iPad landscape)
- 1280px (Desktop)
- 1920px+ (Large desktop)

### Security Validation
- [ ] Policy engine integration verified for all data access
- [ ] Role-based content filtering functions correctly
- [ ] Project scoping prevents cross-project data leakage
- [ ] Authentication state properly preserved during homepage enhancement
- [ ] API calls include proper authorization headers
- [ ] Sensitive data (budget amounts) properly redacted by role

---

## SUCCESS METRICS & KPIs

### User Experience Metrics
- **Task Completion Rate**: >95% for primary user flows
- **Navigation Efficiency**: <3 taps to reach any major function
- **User Session Duration**: 20%+ increase from current baseline
- **Mobile Usage**: 60%+ of interactions should be mobile-optimized

### Technical Performance Metrics
- **Page Load Speed**: <2s for 95th percentile users
- **Error Rate**: <0.1% for core functionality
- **API Success Rate**: >99.9% for data fetching operations
- **Real-time Update Latency**: <5 seconds for activity feed updates

### Business Impact Metrics
- **Daily Active Usage**: 30%+ increase in homepage engagement
- **Feature Adoption**: 80%+ of users utilize quick actions within first week
- **Mobile Productivity**: 40%+ increase in mobile task completions
- **Cross-Module Navigation**: 25%+ increase in feature discovery

---

## RISK MITIGATION & CONTINGENCY PLANS

### Technical Risks
**Risk**: Homepage transformation breaks existing authentication flow
**Mitigation**: Preserve original auth logic with feature flags for gradual rollout

**Risk**: Mobile performance degrades with additional content
**Mitigation**: Implement progressive loading and component lazy loading

**Risk**: Real-time updates impact system performance  
**Mitigation**: Configurable update intervals with fallback to manual refresh

### User Experience Risks
**Risk**: Users confused by unified homepage vs separate dashboards
**Mitigation**: Progressive disclosure with clear role-based sections

**Risk**: Mobile FAB functionality conflicts with existing navigation
**Mitigation**: Extensive testing with existing bottom navigation system

**Risk**: Information overload on smaller screens
**Mitigation**: Collapsible sections with user customization options

### Development Risks
**Risk**: Implementation timeline extends beyond 5 weeks
**Mitigation**: Phased rollout with MVP in Phase 2, enhancements in later phases

**Risk**: Component architecture becomes too complex
**Mitigation**: Clear component boundaries with shared design system compliance

---

## MAINTENANCE & FUTURE ENHANCEMENTS

### Monitoring & Analytics
- **Error Tracking**: Sentry integration for runtime error monitoring
- **Performance Monitoring**: Web Vitals tracking with Vercel Analytics
- **User Behavior**: Heat mapping and interaction tracking
- **API Performance**: Response time monitoring and alerting

### FUTURE ENHANCEMENT OPPORTUNITIES
**Advanced Customization**: User-configurable dashboard widgets with drag-and-drop interface
**Offline Functionality**: Service worker implementation with local data caching
**Advanced Analytics**: Project insights dashboard with trend analysis
**AI-Powered Features**: Project recommendations and predictive insights integration

### Documentation Requirements
- Component usage documentation for all new homepage components
- API integration patterns for real-time data updates
- Mobile testing procedures and device-specific considerations
- Performance optimization guidelines for future enhancements

---

## CLAUDE CODE OPUS 4 EXECUTION FRAMEWORK

### MANDATORY EXECUTION PATTERNS
**This directive serves as the complete implementation guide for Claude Code Opus 4 with phase tracking and commit requirements.**

**Core Execution Principles:**
- **Parallel Tool Execution**: Use multiple tool calls in single responses for simultaneous independent operations
- **Comprehensive Implementation**: Include as many relevant features and interactions as possible
- **Thoughtful Details**: Add hover states, transitions, comprehensive error handling
- **Design Excellence**: Apply hierarchy, contrast, and balance principles throughout
- **Phase Tracking**: Return to Implementation Phases section after each phase to update completion status
- **Commit After Phases**: Execute git commits with descriptive messages after each phase completion

**Required Tool Usage Strategy:**
- Leverage ALL available MCP servers for extended capabilities
- Use multiple Claude instances in parallel for independent tasks when beneficial
- Execute Read, Write, Edit tools simultaneously when working on different files
- Use Bash tool for parallel operations (git, npm, testing commands)
- Utilize WebFetch for research while implementing (parallel research + coding)

**Backend Integration Requirements:**
- **CRITICAL**: Create missing API hooks (`useBudgetSummary`, `useBudgetExceptions`, `useTodaySchedule`, `useRecentActivity`) before homepage implementation
- Must integrate with existing `hooks/use-api.ts` patterns
- Must use established `lib/policy/index.ts` for all authorization checks
- Must leverage existing mobile component system (MobileDialog, MobileTaskCard, KPICarousel)
- Must maintain PageShell wrapper and glass morphism theme consistency
- Must implement proper project scoping via established repository patterns

**Architecture Compliance Validation:**
- All user roles (ADMIN/STAFF/CONTRACTOR/VIEWER) have appropriate content access
- Mobile responsiveness maintained across 320px to 1920px+ screen sizes
- Real-time data integration via TanStack Query with proper cache management
- Construction-specific features provide genuine business value
- Performance benchmarks met (<2s load time, <200KB bundle impact)
- Phase completion tracking updated after each implementation phase
- Git commits executed with proper messages after each phase

**Session Management:**
- Use `/clear` to maintain focused context when switching between phases
- Create `CLAUDE.md` documentation for any new patterns established
- Update implementation status in real-time within this document
- Maintain explore-plan-code-commit workflow throughout implementation