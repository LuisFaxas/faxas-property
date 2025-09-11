# MASTER CONTEXT DOCUMENT
## Construction Management System - Control Center

**Version**: 2.0 - COMPLETE SYSTEM DOCUMENTATION  
**Date**: September 2025  
**Status**: 72% Complete (346 TypeScript warnings remaining)  
**Purpose**: Complete LLM-ready context for Miami Duplex Remodel construction management system

---

## 1. COMPLETE PROJECT ARCHITECTURE

### Core System Identity
- **Project**: Miami Duplex Remodel Construction Management System
- **Framework**: Next.js 15.5.0 App Router (React 19.1.0)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM 6.14.0
- **Authentication**: Firebase Auth + Admin SDK 13.4.0 with custom claims
- **State Management**: TanStack Query 5.85.5 (client state) + React Context (auth/project)
- **Styling**: Tailwind CSS 3.4.17 + Custom glass morphism theme
- **UI Components**: Radix UI + shadcn/ui + custom mobile-first components

### Critical Architecture Principles
1. **Mobile-First Everything**: All components start mobile, enhance to desktop
2. **Security-First**: Policy engine controls ALL data access with project scoping
3. **PageShell Architecture**: Universal authenticated page wrapper (NEVER remove)
4. **Repository Pattern**: All database access via scoped repositories
5. **Error Resilience**: Comprehensive logging, graceful degradation, retry mechanisms
6. **Real-time Sync**: TanStack Query with optimistic updates and background refetch

---

## 2. COMPLETE AUTHENTICATION & SECURITY SYSTEM

### Environment & Configuration
```env
# CRITICAL Environment Variables (from package.json scripts)
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
NEXT_PUBLIC_FIREBASE_CONFIG=... # Client-side config
NEXT_PUBLIC_APP_URL=... # For CORS
```

### Security Middleware (`middleware.ts`)
```typescript
// Comprehensive Security Headers:
- Content Security Policy with nonce generation
- HSTS (HTTP Strict Transport Security)
- X-Content-Type-Options: nosniff
- Permissions Policy (restrictive)
- CORS configuration for API routes
- CSP allows Firebase domains, WebSocket for dev
```

### Firebase Authentication Flow
```typescript
// Client (`lib/firebaseClient.ts`) -> AuthContext -> API Client
1. User logs in via Firebase Auth (email/password or Google)
2. AuthContext manages token refresh (50min intervals + visibility detection)
3. API client adds Bearer token to all requests with retry logic
4. Server verifies token via Firebase Admin SDK

// Token Management:
- Automatic refresh every 50 minutes
- Page visibility change triggers refresh check
- Failed requests trigger token retry (max 2 attempts)
- Hard redirects on auth failure (window.location.href)
```

### API Security Architecture
```typescript
// Security Layers (all API routes):
1. Middleware: Security headers, CORS
2. withAuth wrapper: Token verification, rate limiting
3. Policy Engine: Module permissions, project scoping
4. Repository: Data isolation by project
5. Response: Sanitization, error handling

// Rate Limits (by role):
- ADMIN: 200 requests/minute
- STAFF: 150 requests/minute  
- CONTRACTOR: 100 requests/minute
- VIEWER: 50 requests/minute
```

### Policy Engine (`lib/policy/index.ts`) - CRITICAL SECURITY
```typescript
// Core Security Functions:
Policy.assertMember(userId, projectId) // Project membership
Policy.assertModuleAccess(userId, projectId, module, permission)
Policy.getUserProjectRole(userId, projectId)
Policy.applyDataRedaction(data, role, module) // Hide sensitive data

// Permission Types:
'read' | 'write' | 'export' | 'delete' | 'approve'

// Modules:
TASKS | SCHEDULE | BUDGET | PROCUREMENT | CONTACTS | etc.
```

---

## 3. COMPLETE DATABASE ARCHITECTURE

### Core Entity Relationships
```
Project (Hub)
├── ProjectMember (User access)
├── UserModuleAccess (Permissions)
├── Task (with dual assignment)
├── Contact (with portal bridge)
├── ScheduleEvent
├── BudgetItem
├── Procurement
├── PlanFile
├── Decision
├── Risk
├── Meeting
├── Invoice
└── RFP/Bidding System
```

### CRITICAL Database Patterns

#### Project Scoping (Universal Pattern)
```prisma
// ALL entities have projectId
model AnyEntity {
  projectId String
  project   Project @relation(fields: [projectId], references: [id])
  
  @@index([projectId]) // Performance
}
```

#### Dual Assignment System (Tasks)
```prisma
model Task {
  // Can assign to either User OR Contact
  assignedToId      String?  // User assignment
  assignedContactId String?  // Contact assignment
  
  // Construction-specific fields
  isOnCriticalPath   Boolean @default(false)
  isMilestone        Boolean @default(false)
  weatherDependent   Boolean @default(false)
  requiresInspection Boolean @default(false)
  
  // Rich metadata
  progressPercentage Int     @default(0)
  trade              String?
  location           String?
  tags               String[] @default([])
  customFields       Json?
  
  // Audit trail
  activities         TaskActivity[]
  comments           TaskComment[]
  attachments        TaskAttachment[]
}
```

#### Portal Integration System
```prisma
model Contact {
  // Portal Bridge - Contact -> User conversion
  userId       String?   @unique
  portalStatus String    @default("NONE") // NONE, INVITED, ACTIVE
  inviteToken  String?   @unique
  inviteExpiry DateTime?
  
  // Multi-contact info
  emails String[] // Multiple emails
  phones String[] // Multiple phones
  
  // Task assignment capability
  assignedTasks Task[] @relation("ContactTasks")
}
```

#### Permission System
```prisma
model UserModuleAccess {
  userId     String
  projectId  String
  module     Module  // TASKS, SCHEDULE, BUDGET, etc.
  canView    Boolean @default(false)
  canEdit    Boolean @default(false)
  canUpload  Boolean @default(false)
  canRequest Boolean @default(false)
  
  @@id([userId, projectId, module])
}
```

### Business Logic Models

#### RFP/Bidding System (Advanced)
```prisma
model Rfp {
  title       String
  dueAt       DateTime
  status      RfpStatus // DRAFT, PUBLISHED, CLOSED
  items       RfpItem[] // Detailed line items
  invitations BidInvitation[]
  bids        Bid[]
  award       Award?
}
```

#### Financial Tracking
```prisma
model BudgetItem {
  // Cost tracking
  estTotal       Decimal @db.Decimal(12, 2)
  committedTotal Decimal @db.Decimal(12, 2)
  paidToDate     Decimal @db.Decimal(12, 2)
  variance       Decimal @db.Decimal(6, 4)
  
  // Linked procurement
  procurements   Procurement[]
}
```

---

## 4. COMPLETE MOBILE-FIRST UI SYSTEM

### Application Shell Architecture

#### Root Layout (`app/layout.tsx`)
```typescript
// Foundation:
- Geist fonts (Sans + Mono) with CSS variables
- Dark mode enforced (html className="dark")
- Background: graphite-900
- Global Toaster for notifications
- Providers wrapper with all contexts
```

#### Providers Stack (`app/providers.tsx`)
```typescript
// Layered Context Providers:
1. QueryClientProvider (TanStack Query)
   └ staleTime: 1 minute, no window refocus, retry: 1
2. AuthProvider (Firebase auth state)
3. UserInitializer (ensure user exists in database)
4. ProjectProvider (project selection state)
5. ToastListener (custom toast events)
6. ReactQueryDevtools (dev only)
```

### CRITICAL: PageShell Architecture (`components/blocks/page-shell.tsx`)
**THIS IS THE UNIVERSAL AUTHENTICATED PAGE WRAPPER - NEVER REMOVE**

```typescript
// Complete Responsive System:
- Desktop: Collapsible sidebar with hover states
- Landscape: Auto-collapse + hover expand (w-14 -> w-52)
- Mobile: Bottom navigation with 3 items + FAB + More
- Project switcher in header (desktop) / top (mobile)
- User dropdown with settings/logout
- Glass morphism styling throughout

// Navigation By Role:
ADMIN/STAFF: [Home, Tasks, Schedule, Contacts, Budget, Procurement, Plans, Risks, Users]
CONTRACTOR: [Home, My Tasks, My Schedule, Uploads, Invoices, Plans]
```

### Mobile Component System

#### MobileDialog Pattern (`components/ui/mobile/dialog.tsx`)
```typescript
// Auto-adaptive component:
- Mobile: Sheet (slides up from bottom)
- Desktop: Dialog (centered modal)
- ALWAYS use this instead of raw Dialog/Sheet

// Implementation:
const isMobile = useMediaQuery('(max-width: 768px)');
return isMobile ? <Sheet /> : <Dialog />;
```

#### Advanced Mobile Components

**MobileTaskCard** (`components/tasks/mobile-task-card.tsx`):
```typescript
// Swipe Gestures (react-swipeable):
- Right swipe: Complete task (green background)
- Left swipe: Delete task (red background)
- Resistance curves for smooth UX
- Desktop: Dropdown menu fallback
- Visual status indicators with progress bars
```

**KPICarousel** (`components/schedule/kpi-carousel.tsx`):
```typescript
// Responsive Stats Display:
- Mobile: Embla carousel with dots navigation
- Tablet+: CSS Grid (2-4 columns based on screen)
- Auto-disable carousel on larger screens
- Intersection Observer for performance
```

**MobileContactList** (`components/contacts/mobile-contact-list.tsx`):
```typescript
// Sectioned Organization:
- Collapsible sections (localStorage state)
- Portal status indicators
- Sections: Active, Potential, Follow-up, Inactive
- Show/hide controls with counts
```

### Touch Interaction Standards
```css
/* Mobile Standards v3.0 Compliance */
- Minimum touch target: 48px x 48px
- Secondary actions: 44px minimum
- Swipe dead zones: 16px margins
- Double-tap prevention: 300ms delays removed
- Hardware acceleration: transform3d usage
```

---

## 5. COMPLETE API & DATA FLOW ARCHITECTURE

### API Client (`lib/api-client.ts`) - CRITICAL REQUEST HANDLING
```typescript
// Axios Configuration:
- Base URL: '/api/v1'
- Automatic Bearer token injection
- Token refresh on 401 (max 2 retries)
- Custom toast events on auth failure
- Hard redirect to /login after max retries
- Response unwrapping (extracts .data from wrapper)

// Error Handling Flow:
401 -> Token refresh -> Retry -> Failure -> Toast -> Redirect
```

### Complete API Hooks (`hooks/use-api.ts`) - 666 LINES OF HOOKS
```typescript
// Comprehensive Hook Coverage:

// PROJECTS: useProjects()
// TASKS: useTasks(), useTask(), useCreateTask(), useUpdateTask(), 
//        useBulkUpdateTasks(), useDeleteTask(), useBulkDeleteTasks()
// SCHEDULE: useSchedule(), useTodaySchedule(), useApproveScheduleEvent()
// CONTACTS: useContacts(), useCreateContact()
// RFPs: useRfps(), useCreateRfp(), usePublishRfp(), useUploadAttachment()
// USERS: useUsers(), useCreateUser(), useUserPermissions()

// Pattern - All hooks include:
- TanStack Query integration
- Optimistic updates
- Cache invalidation strategies  
- Toast notifications
- Error handling
```

### API Route Architecture (`/api/v1/*`)
```typescript
// Universal Pattern:
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    const { auth, projectId, projectMember } = security;
    
    // 1. Extract/validate parameters
    const query = Object.fromEntries(request.nextUrl.searchParams);
    
    // 2. Permission check via Policy Engine
    await Policy.assertModuleAccess(auth.uid, projectId!, 'TASKS', 'read');
    
    // 3. Create scoped repository
    const context = await createSecurityContext(auth.uid, projectId!);
    const repos = createRepositories(context);
    
    // 4. Execute operation (auto-scoped to project)
    const data = await repos.tasks.findMany(query);
    
    // 5. Apply data redaction by role
    const redacted = Policy.applyDataRedaction(data, auth.role, 'TASKS');
    
    return successResponse(redacted);
  },
  { module: 'TASKS', action: 'view', requireProject: true }
);
```

### Repository Pattern (`lib/data/repositories.ts`)
```typescript
// Scoped Repository System:
- BaseRepository: Common CRUD operations
- ScopedRepository: Project-filtered operations
- SecurityContext: User + project context
- All queries automatically include: projectId = context.projectId

// Available Repositories:
TaskRepository, BudgetRepository, ProcurementRepository,
ContactRepository, ScheduleRepository, ProjectRepository
```

### Error Handling & Logging (`lib/logger.ts`)
```typescript
// Winston Logger with Daily Rotation:
- Development: Console with colors
- Production: File rotation (error, combined, security logs)
- Structured logging with correlation IDs
- Security audit trail for auth events
- API request/response logging
- Database query performance logging

// Log Levels: error, warn, info, http, debug
// Special: log.security.* for audit events
```

---

## 6. COMPLETE BUILD STATUS & PAGE ANALYSIS

### Production-Ready Pages (85%+ Complete)

#### Tasks Page (`app/admin/tasks/page.tsx`) - 1353 LINES - GOLD STANDARD
```typescript
// Complete Feature Set:
- Advanced filtering (status, priority, assigned, overdue, today)
- Search with date queries ("today", "overdue", "this week")
- Bulk operations (complete, delete, assign)
- Progress tracking with show/hide completed toggle
- Mobile: MobileTaskCard with swipe actions
- Desktop: DataTable with sorting/filtering
- Fixed bottom search bar with view toggle integration
- Full CRUD with MobileTaskDialog/Sheet adaptive system
- TanStack Query with optimistic updates
```

#### Calendar Page (`app/admin/schedule/page.tsx`)
```typescript
// FullCalendar Integration:
- Multiple views: month, week, day, list
- Mobile: KPICarousel for today's events
- Desktop: Sidebar with event details
- Today's events with countdown timers
- Event management with status tracking
- Mobile-optimized event creation/editing
```

#### Contacts Page (`app/admin/contacts/page.tsx`)
```typescript
// Portal Integration System:
- Sectioned contact organization (Active, Potential, Follow-up)
- Portal invitation workflow with progress tracking
- Contact-to-user conversion system
- Mobile: MobileContactList with collapsible sections
- Desktop: Table with portal status indicators
- Email invitation system with token validation
```

### Homepage Reality (`app/page.tsx`) - 34 LINES
**CRITICAL**: This is NOT a dashboard - it's an auth router
```typescript
// Actual Implementation:
if (!user) router.push('/login');
else if (userRole === 'ADMIN' || userRole === 'STAFF') router.push('/admin');
else if (userRole === 'CONTRACTOR') router.push('/contractor');
else router.push('/login');

// Shows: Loading spinner during auth check
// NO dashboard content, widgets, or homepage functionality
```

### Incomplete/Planned Features
- **Budget System** (needs rebuild): Current system not industry-standard
- **Contractor Portal** (5% complete): Mockup stage, needs full implementation
- **RFP/Bidding System** (foundation only): Models exist, UI needed
- **Plans Module** (file management): Upload/view system needed
- **Risks Module** (basic tracking): Full risk management features needed
- **Reporting/Analytics**: Dashboard widgets, export functionality

### Development Scripts (package.json)
```bash
npm run dev          # Next.js development server
npm run build        # Production build
npm run lint         # ESLint checking
npm run db:push      # Prisma schema push (dev)
npm run db:migrate   # Prisma migrations
npm run db:studio    # Prisma Studio GUI
npm run create-admin # Create admin user
npm run test:security # Security-focused tests
```

---

## 7. COMPLETE VISUAL DESIGN SYSTEM

### CSS Architecture (`app/globals.css`)
```css
/* Layer Structure: */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS Custom Properties: */
:root { /* Light theme variables (unused) */ }
.dark { 
  --background: 220 15% 7%;     /* Main background */
  --accent: 165 70% 75%;        /* Mint green #8EE3C8 */
  --card: 220 15% 9%;           /* Card background */
  --border: 220 15% 15%;        /* Border color */
}

/* Force dark mode: */
html { @apply dark; }
```

### Glass Morphism System (`globals.css`)
```css
/* Complete Glass Implementation: */
.glass {
  background: rgba(20, 22, 27, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 14px;
}

.glass-card { @apply glass p-6; }
.glass-hover { 
  @apply transition-all duration-200 hover:shadow-xl hover:backdrop-blur-lg; 
}
```

### Color System (Tailwind Config)
```typescript
// Graphite Palette (Custom):
graphite: {
  900: '#0f1115', // Darkest - main background
  800: '#14161b', // Cards, modals  
  700: '#1b1e24', // Elevated surfaces
  600: '#232730', // Borders, dividers
  500: '#2c313c', // Interactive elements
  400: '#3b4150', // Subtle text
  300: '#4a5163', // Secondary text
  200: '#5a6278', // Muted text
  100: '#6b7490', // Light text
}

// Accent System:
accent: {
  500: '#8EE3C8', // Primary brand color (mint green)
  foreground: (calculated) // Auto-contrast text
}
```

### Typography System
```typescript
// Font Stack (layout.tsx):
- Primary: Geist Sans (--font-geist-sans)
- Mono: Geist Mono (--font-geist-mono)
- Both loaded from @next/font/google with Latin subset
```

### Responsive Architecture
```css
/* Breakpoint Strategy: */
Default: Mobile-first (0px+)
sm: 640px+ (tablet)
md: 768px+ (desktop) 
lg: 1024px+ (large desktop)
xl: 1280px+ (extra large)
2xl: 1536px+ (ultra wide)

/* Touch Standards: */
- Primary buttons: 48px minimum
- Secondary actions: 44px minimum  
- Icon-only buttons: 40px minimum
- Text inputs: 44px minimum height
```

### Animation System
```css
/* Navigation Animations (globals.css): */
- Sidebar: width transition 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Text opacity: 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Icons: transform 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Hardware acceleration for landscape performance

/* Component Animations: */
- accordions: height transitions
- modals: scale/opacity transitions via Radix
- toasts: slide animations via Sonner
```

### Dark Theme Optimizations
```css
/* Form Controls (globals.css): */
input[type="datetime-local"] {
  color-scheme: dark;
  /* Custom webkit styling for dark calendar picker */
}

/* Better contrast ratios for accessibility */
/* Reduced motion support for vestibular disorders */
```

---

## 8. DEVELOPMENT PATTERNS & CONVENTIONS

### File Organization
```
app/
├── admin/                 # Admin/Staff pages
├── contractor/            # Contractor pages  
├── api/v1/               # API routes
├── contexts/             # React contexts
└── (auth)/               # Auth-related pages

components/
├── ui/                   # Base UI components
├── blocks/               # Page-level components
├── tasks/                # Task-specific components
├── contacts/             # Contact-specific components
└── schedule/             # Calendar-specific components

lib/
├── api/                  # API utilities
├── data/                 # Repository pattern
├── policy/               # Authorization engine
├── validations/          # Zod schemas
└── utils.ts              # Utilities
```

### Component Patterns
```typescript
// Mobile-First Component Pattern:
export function ComponentName() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <>
      {/* Mobile Version */}
      {isMobile && <MobileComponent />}
      
      {/* Desktop Version */}
      {!isMobile && <DesktopComponent />}
    </>
  );
}

// MobileDialog Pattern:
<MobileDialog open={isOpen} onOpenChange={setIsOpen}>
  <MobileDialog.Content>
    <MobileDialog.Header>
      <MobileDialog.Title>Title</MobileDialog.Title>
    </MobileDialog.Header>
    {/* Content */}
  </MobileDialog.Content>
</MobileDialog>
```

### API Route Pattern
```typescript
// Standard API Route:
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    // 1. Extract security context
    const { auth, projectId } = security;
    
    // 2. Validate permissions
    await Policy.assertModuleAccess(auth.user.id, projectId!, Module.X, 'write');
    
    // 3. Validate input
    const body = await request.json();
    const validatedData = schema.parse(body);
    
    // 4. Create scoped repositories
    const scopedContext = await createSecurityContext(auth.user.id, projectId!);
    const repos = createRepositories(scopedContext);
    
    // 5. Perform operation
    const result = await repos.x.create({ data: validatedData });
    
    // 6. Return response
    return successResponse(result, 'Created successfully');
  },
  { module: Module.X, action: 'edit', requireProject: true }
);
```

---

## 9. CRITICAL LESSONS LEARNED

### Homepage Crisis Analysis
- **Problem**: Attempted to completely rebuild homepage architecture, removing essential PageShell wrapper
- **Impact**: Broke navigation, project selector, and authentication flow  
- **Solution**: Git hard reset to stable commit, restored PageShell architecture
- **Lesson**: The "homepage" is just auth routing - NOT a dashboard to be rebuilt

### Development Rules (Established After Crisis)
1. **Be Methodical**: Deep analysis before any changes
2. **Respect Existing Architecture**: Don't rebuild working systems
3. **Get Approval**: Present plans before implementation
4. **Incremental Changes**: Small, focused improvements only
5. **Test Thoroughly**: Verify all user flows after changes

### Architecture Principles
1. **PageShell is Sacred**: Universal wrapper must remain intact
2. **Mobile-First Always**: Start with mobile, enhance for desktop
3. **Repository Pattern**: Use scoped repositories for all data access
4. **Policy Engine**: All authorization through centralized policy system
5. **Component Co-location**: Keep related mobile/desktop variants together

---

## 10. IMMEDIATE DEVELOPMENT GUIDANCE

### When Adding New Features
1. **Check Policy Engine**: Ensure proper module permissions exist
2. **Create Mobile-First**: Start with mobile component, add desktop version
3. **Use MobileDialog**: Leverage existing mobile dialog system
4. **Follow Repository Pattern**: Create scoped repositories for data access
5. **Add to PageShell**: Integrate navigation if needed

### When Modifying Existing Features
1. **Read This Document**: Understand current architecture first
2. **Analyze Existing Pattern**: Follow established conventions
3. **Test Mobile Interaction**: Verify touch targets and swipe gestures
4. **Check All Roles**: Test ADMIN, STAFF, CONTRACTOR access patterns
5. **Verify Project Scoping**: Ensure data isolation between projects

### When Creating New Pages
```typescript
// Standard Page Structure:
export default function NewPage() {
  return (
    <PageShell pageTitle="New Feature" fabIcon={Plus} onFabClick={() => {}}>
      <div className="p-4 space-y-6">
        {/* Mobile-first content */}
      </div>
    </PageShell>
  );
}
```

### Common Pitfalls to Avoid
1. **Don't Remove PageShell**: Always wrap authenticated pages
2. **Don't Skip Mobile**: Never build desktop-only components
3. **Don't Bypass Policy**: All API calls must check permissions
4. **Don't Hardcode ProjectId**: Always resolve dynamically
5. **Don't Break Glass Theme**: Maintain consistent visual design

---

## 11. TESTING & VERIFICATION

### Before Any Deployment
1. **Mobile Responsive**: Test all breakpoints (320px to 1920px+)
2. **Touch Interactions**: Verify 48px minimum targets, swipe gestures
3. **Role-Based Access**: Test ADMIN, STAFF, CONTRACTOR, VIEWER flows
4. **Project Isolation**: Verify users only see their project data
5. **Error Handling**: Test network failures, unauthorized access

### Critical User Flows
1. **Authentication**: Login → Role detection → Proper dashboard redirect
2. **Task Management**: Create → Assign → Update → Complete → Delete
3. **Mobile Navigation**: Bottom nav → FAB actions → Page transitions
4. **Contact Portal**: Invite → Accept → Portal access → Task assignment
5. **Project Switching**: Multi-project users can switch contexts

---

This master context document represents the complete current understanding of the Control Center system. It must be referenced before making any architectural decisions or significant changes to prevent future crises and ensure consistent, high-quality development.