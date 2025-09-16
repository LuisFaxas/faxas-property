# Dashboard Analysis - Phase 0 Discovery

## Executive Summary
Current admin dashboard at `/admin/page.tsx` is functional but lacks visual hierarchy, data density, and mobile optimization. This analysis documents the current state and proposed improvements following strict architectural constraints.

## Current State Analysis

### Screenshots
- **Desktop (1440×900)**: `screens/admin_before_desktop.png` - Captured 2025-09-12
- **Mobile (390×844)**: `screens/admin_before_mobile.png` - Captured 2025-09-12

### Architecture Review

#### Design System
- **Theme**: Dark mode only with graphite colors
- **Accent**: #8EE3C8 (teal/mint) defined as HSL 165 70% 75%
- **Glass morphism**: rgba(20, 22, 27, 0.55) with 8px blur
- **Border radius**: 14px (0.875rem)
- **Spacing**: Tailwind 4px base unit

#### Component Structure
- **PageShell**: Main layout wrapper with FAB support via props
- **KPIWidget**: Basic metric display component (no loading states)
- **MobileBottomNav**: 72px height with 3 primary items + FAB + More
- **UI Components**: 33 shadcn/ui components available

#### Data Layer
- **38 hooks available** in `hooks/use-api.ts`
- React Query for server state management
- Optimistic updates enabled
- TypeScript strict mode

### Issues Identified

1. **Visual Hierarchy** ⚠️
   - All KPI cards identical size/importance
   - No tiered information architecture
   - Poor use of screen real estate on desktop

2. **Mobile Experience** 🔴
   - Content cut off at bottom (no safe area padding)
   - FAB exists but not connected to actions
   - Single column stack lacks optimization

3. **Data Presentation** ⚠️
   - Single metrics without context or trends
   - No loading skeletons in KPIWidget
   - Empty states missing

4. **Interactivity** 🔴
   - "View All" buttons don't navigate
   - No Quick Actions sheet despite FAB presence
   - No hover states for additional info

5. **Accessibility Concerns** ⚠️
   - Glass opacity at 0.55 may fail WCAG contrast
   - No keyboard navigation considerations
   - Missing ARIA labels on interactive elements

6. **Role-Based Views** 🔴
   - Budget shows same data for all roles
   - No differentiation for CONTRACTOR vs ADMIN
   - VIEWER role not considered

7. **Performance** ⚠️
   - All widgets load simultaneously
   - No progressive loading
   - No virtualization for lists

8. **Construction Context** 🔴
   - Generic icons and terminology
   - Missing construction-specific widgets (weather, RFPs)
   - No project health composite score

## Proposed Improvements

### Information Architecture
```
Hero Zone (lg:col-span-2 each)
├── Project Overview (completion %, phase, address)
└── Budget Health (burn rate, variance, role-based)

KPI Zone (4 equal cards) 
├── Tasks Today
├── Overdue Tasks  
├── This Week Tasks
└── Completed (7d)

Activity Zone (lg:col-span-2 each)
├── Today's Schedule (timeline view)
└── Priority Tasks (top 5 urgent/high)

Status Zone (responsive grid)
├── Budget Exceptions
├── Procurement Pipeline
├── Team & Vendors
└── Weather Impact
```

### Grid System
- **Desktop**: `lg:grid-cols-4 lg:gap-6`
- **Tablet**: `md:grid-cols-2 md:gap-6`
- **Mobile**: `grid-cols-1 gap-4`
- **Safe area**: `pb-[calc(env(safe-area-inset-bottom)+88px)]`

### Widget Requirements
Each widget must include:
- Loading skeleton state
- Empty state with action
- Real navigation CTA
- Role-based data display
- Touch target ≥ 48px

### Quick Actions Integration
Connect existing FAB to sheet component:
- Mobile: Bottom sheet
- Desktop: Right drawer
- Actions: Add Task, Schedule Event, Add Contact, Upload Doc

## Hook Audit Results

### Available Hooks (38 total)
**Projects** (1): useProjects  
**Tasks** (13): useTasks, useTask, useCreateTask, useUpdateTask, useUpdateTaskStatus, useBulkUpdateTasks, useDeleteTask, useBulkDeleteTasks, useTaskActivities, useTaskComments, useCreateTaskComment, useCreateSubtask, useUpdateTaskProgress  
**Budget** (3): useBudget, useBudgetSummary, useBudgetExceptions  
**Schedule** (5): useSchedule, useTodaysSchedule, useTodaySchedule, useScheduleEvents, useApproveScheduleEvent  
**Contacts** (2): useContacts, useCreateContact  
**RFPs** (8): useRfps, useRfp, useCreateRfp, useUpdateRfp, useDeleteRfp, useUpsertRfpItems, useUploadAttachment, usePublishRfp  
**Users** (6): useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser, useUserPermissions, useUpdateUserPermissions

### Missing Hooks Needed
1. **Weather API** - No existing implementation
2. **Audit Log/Activity Feed** - Not in current schema  
3. **Procurement Summary** - Individual items exist but no summary hook

## Design Principles Applied

### Universal Dashboard Principles
1. **5-Second Rule** - Critical metrics immediately visible
2. **Progressive Disclosure** - Overview first, details on demand
3. **Visual Hierarchy** - Size/position indicate importance
4. **Consistent Color Usage** - Single color for similar items
5. **Hover for Secondary Details** - Avoid visual noise
6. **Clean Layout** - Reduce cognitive load
7. **Interactive Elements** - Click to filter, drill-down

### Construction-Specific Patterns
1. **Project Health Score** - Composite metric
2. **Project Dropdown Filter** - Multi-project support
3. **Task Completion Rates** - Today's priorities focus
4. **Budget Burn Rate** - Visual progress bars
5. **Real-time Updates** - Widget-based information
6. **Milestone Tracking** - Key project phases

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| WCAG contrast failure | High | High | Test first, adjust opacity with proof |
| Weather API missing | Medium | High | Mock initially or hide widget |
| Audit log not in schema | Medium | High | Use recent tasks as proxy |
| Performance with 11 widgets | Low | Medium | Progressive loading, virtualization |
| Quick Actions incomplete | Low | Low | Navigate to main sections initially |

## Success Metrics
- [ ] WCAG 2.1 AA compliance (4.5:1 contrast)
- [ ] Mobile safe area padding applied
- [ ] All CTAs navigate to real routes
- [ ] Loading states for all widgets
- [ ] Role-based data display
- [ ] Quick Actions sheet connected to FAB
- [ ] Responsive grid at 320/390/768/1024/1440px
- [ ] Touch targets ≥ 48px
- [ ] Reduced motion respected
- [ ] < 120ms main thread blocking

## Next Steps
1. **Phase 1**: Scaffold with grid zones and Quick Actions
2. **Phase 2**: Implement widgets in 3 batches
3. **Phase 3**: Polish, accessibility, performance

---
*Generated: 2025-09-12T16:00:00Z*  
*Tool: Claude Code Opus 4.1 with MCP*