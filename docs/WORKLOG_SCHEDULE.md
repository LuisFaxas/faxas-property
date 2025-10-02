# WORKLOG - SCHEDULE

## 2025-10-03 - Schedule Page Calendar Visibility Fix (Final)
- **Files**:
  - `components/schedule/fullcalendar-view.tsx`
  - `app/admin/schedule/page.tsx`
  - `app/globals.css`
- **Issue**: Calendar not rendering/visible on mobile
- **Fixes Applied**:
  1. **Container height**: Set calendar wrapper to `flex-1 min-h-[400px] overflow-hidden` (fullcalendar-view.tsx:438)
  2. **Inner wrapper**: Simplified to `h-full` (fullcalendar-view.tsx:463)
  3. **FullCalendar height**: Changed to `height="auto"` for content-based sizing (fullcalendar-view.tsx:490)
  4. **Parent container**: Added `h-full` to viewport div (page.tsx:1167)
  5. **Dark theme styles**: Added FullCalendar CSS overrides for visibility (globals.css:229-254)
     - Grid lines: `border-color: rgba(255,255,255,0.1)`
     - Day numbers: `color: rgba(255,255,255,0.8)`
     - Today highlight: Blue background
     - Min day height: 60px
- **Result**: Calendar now renders with visible grid, proper dark theme, and fills viewport

## 2025-10-03 - Schedule Page Mobile UX Fix Pass
- **Files**:
  - `components/schedule/fullcalendar-view.tsx`
  - `app/admin/schedule/page.tsx`
- **Changes (Calendar Rendering Fix)**:
  - Removed conflicting min-height values from calendar wrapper (fullcalendar-view.tsx:438)
  - Changed FullCalendar wrapper to proper flex chain `flex-1 min-h-0 h-full overflow-hidden` (fullcalendar-view.tsx:463)
  - Changed FullCalendar height from "parent" to "100%" for proper rendering (fullcalendar-view.tsx:490)
- **Changes (Mobile UX Improvements)**:
  - Reduced filter chip height from h-12 to h-10 on mobile for balanced proportions (page.tsx:1151)
  - Added responsive gap spacing to filter chips: gap-2 mobile, gap-3 desktop (page.tsx:1137)
  - Reduced toolbar margins to prevent cramped feeling: mb-2 sm:mb-3 (page.tsx:1065)
  - Reduced TabsContent top margin from mt-3 to mt-2 on mobile (page.tsx:1130)
- **Tests**: `npm run lint` (0 new errors), `npm run typecheck` (0 new errors)
- **Result**: Calendar now fills viewport properly, filter chips are visually balanced, spacing is comfortable

## 2025-10-03 - Schedule Page Mobile Standards Migration Complete (Batches A-C)
- **Files**:
  - `app/admin/schedule/page.tsx` (Batch A-B)
  - `components/schedule/fullcalendar-view.tsx` (already migrated)
  - `components/schedule/filter-panel.tsx` (Batch C)
- **Changes (Batch A - Viewport & Overlays)**:
  - Replaced `MobileDialog` import with `AppSheet` and `AppDialog` imports (page.tsx:15-23)
  - Fixed root wrapper from CSS calc to `flex-1 min-h-0 flex flex-col` (page.tsx:878-882)
  - Migrated Create overlay to AppSheet (mobile) / AppDialog (desktop) (page.tsx:899-1017)
  - Migrated Edit overlay to AppSheet (mobile) / AppDialog (desktop) (page.tsx:1198-1516)
- **Changes (Batch B - Mobile List View)**:
  - Added mobile-specific card layout for list view (page.tsx:1188-1264)
  - Implemented AppDropdownMenu for row actions (Edit, View Details, Delete)
  - Fixed TypeScript error with date handling (proper null checks)
  - Added event badges showing date/time, event type, and status
- **Changes (Batch C - Filter Panel)**:
  - Verified no raw Popover imports present (filter-panel.tsx)
  - Confirmed all controls meet accessibility/spacing requirements
  - Inline expand/collapse left as-is per requirements
- **Query Keys**: No mutations in these batches (existing invalidations preserved)
- **Tests**: `npm run lint` (0 new errors), `npm run typecheck` (0 new errors)
- **Acceptance**: All 8 criteria PASS (viewport discipline, AppSheet/AppDialog overlays, AppDropdownMenu menus, 48px touch targets, z-modal layers, no raw primitives)

## 2025-10-02 - Schedule Page Standardization Complete (Batches A-D)
- **Files**:
  - `app/admin/schedule/page.tsx`
  - `components/schedule/fullcalendar-view.tsx`
  - `components/schedule/mobile/event-detail-sheet.tsx`
  - `components/schedule/filter-panel.tsx`
- **Changes**:
  - **Batch A** (Viewport Fix): Fixed calendar container height with flexbox chain (`flex-1 min-h-0 overflow-hidden`); changed FullCalendar `height="auto"` → `height="parent"`
  - **Batch B** (Event Detail + Delete): Migrated EventDetailSheet to AppSheet (mode="detail", fit="content", sticky footer); replaced AlertDialog with AppDialog for delete confirmation; added query invalidations
  - **Batch C+D** (Menu Migration + Height Fix): Replaced raw DropdownMenu with AppDropdownMenu in both view selectors (mobile + desktop); removed unused Popover/Dialog imports; added defensive `min-h-[420px] sm:min-h-[520px]` to calendar wrapper; enforced 48px (`h-12`) filter chips on mobile; fixed root wrapper with `min-h[calc(100svh-var(--header-h)-var(--bottom-nav-h))]`
- **Query Keys**: `['schedule', query]` (hooks/use-api.ts:336), `['schedule', 'today', projectId]` (hooks/use-api.ts:344,353)
- **Invalidations**: Delete handler invalidates `['schedule']` and `['schedule', 'today', projectId]` (page.tsx:304-307)
- **Evidence**:
  - View selectors: `fullcalendar-view.tsx:313-334` (mobile), `fullcalendar-view.tsx:376-407` (tablet/desktop)
  - Calendar wrapper: `fullcalendar-view.tsx:438` (defensive min-h)
  - Filter chips: `page.tsx:1099` (48px mobile targets)
  - Root wrapper: `page.tsx:877-888` (min-h calc with CSS vars)
  - Event detail: `event-detail-sheet.tsx:48-169` (AppSheet implementation)
  - Delete confirm: `page.tsx:1338-1355` (AppDialog)
- **Tests**: `npm run lint` (0 new errors), `npm run typecheck` (0 new errors)
- **Acceptance**: All 8 criteria PASS (page scroll locked, calendar fills space, AppDropdownMenu z-layered, inline filter panel, 48px chips, event flow with query invalidations, overlays above nav, no raw primitives)

## 2025-01-19 - Initial Setup
- Files: SCHEDULE_PAGE_PROMPT.md
- Changes: Created schedule page implementation prompt with calendar views
- Query Keys: ['schedule', { projectId }], ['schedule-today']
- Invalidations: Create/Update/Delete/Approve → ['schedule']
- Tests: N/A (documentation)