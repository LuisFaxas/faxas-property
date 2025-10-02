# WORKLOG - SETTINGS

## 2025-10-01 - Settings Page: Canonical Overlay Migration

**Files Modified:**
- `app/admin/settings/page.tsx` - Migrated all dialogs and menus to canonical App* components

**Changes:**
- Replaced `Dialog` → `AppDialog` for Create/Edit Project dialogs (lines 519-718, 800-994)
- Replaced `DropdownMenu` → `AppDropdownMenu` for project actions menu (lines 400-454)
- Replaced `AlertDialog` → `AppDialog` with destructive Button pattern for delete confirmation (lines 997-1016)
- Removed raw primitive imports; added canonical component imports from `@/components/ui/app-dialog` and `@/components/ui/app-menu`

**Why Changed:**
- Canonical overlay migration per UX_STANDARDS.md and PROJECT_GUARDRAILS.md
- Enforces consistent z-layering (z-modal), focus management, body scroll lock
- AppDialog provides size variants ('sm'|'md'|'lg') for consistent max-widths
- AppDropdownMenu enforces z-modal and consistent item padding
- Delete dialog now uses standard destructive Button variant instead of custom AlertDialog styling

**Acceptance Checklist:**
- ✅ No drag handle needed (desktop dialogs, not bottom sheets)
- ✅ Dismiss: X button + Esc + backdrop click (via Radix Dialog primitives)
- ✅ Heights: Dialogs use size="lg" (max-w-2xl) for forms, size="sm" (max-w-md) for confirmation
- ✅ Focus trap: Automatic via Radix Dialog with custom onOpenAutoFocus to prevent aria-hidden warnings
- ✅ Focus return: Automatic via Radix Dialog when closed
- ✅ Body scroll lock: Automatic via Radix Dialog
- ✅ Z-layer policy: z-modal applied by canonical components (overlays above content/nav, under toasts)
- ✅ No raw Dialog/Sheet/DropdownMenu imports remain in app/admin/settings/page.tsx
- ✅ No console/a11y warnings (AppDialog custom focus management prevents aria-hidden issues)

**Nav/FAB Non-Regression:**
- Read-only verification: Canonical components use z-modal (50) which renders above bottom nav and FAB
- Backdrop overlay and Radix Portal ensure underlying elements are inert while overlays are open
- No changes made to nav or FAB code

**Query Keys Affected:** None (UI-only migration, no data/state changes)

**Verification Results:**
- `npm run lint`: 825 pre-existing problems, **0 new issues** from migration
- `npm run typecheck`: Pre-existing errors only, canonical components type-safe

**Notes:**
- First Settings page migration to canonical App* components complete
- All overlay behavior preserved (open/close, form state, API calls unchanged)
- Ready for additional page migrations using same pattern

---

## 2025-10-01 - Phase 1-2: UX Standards & Design Tokens

**Files Modified:**
- `tailwind.config.ts` - Added design tokens (height, opacity, z-index) unified with CSS variables
- `app/globals.css` - Added CSS variables for modal heights, z-layers, and .pb-safe utility
- `PROJECT_GUARDRAILS.md` - Added UI Component Standards enforcement rules

**Changes:**
- Design tokens now use single source of truth: CSS vars in globals.css, referenced by Tailwind config
- Tokens include: modal-detail (85vh), modal-form (90vh), modal-fullscreen (calc with safe area), opacity presets, z-index layers
- .glass class refactored to use Tailwind utilities instead of hard-coded rgba values
- pb-safe utility added for iOS safe area handling

**Query Keys:** N/A (settings system unchanged, tokens only)

**Tests:** Passed lint/typecheck (pre-existing errors only, no new issues)

**Notes:**
- Part of broader UI standardization effort (see WORKLOG_UI.md for component details)
- Settings page will be pilot for Phase 4 migration to canonical components

---

## 2025-09-23 - Mobile Navigation Rearrangement Flow Enhancement

### Summary
Implemented robust, role-aware mobile bottom navigation customization with Select & Reorder UI.

### Changes Made

#### 1. Navigation Architecture Overhaul (`components/blocks/page-shell.tsx`)
- Created centralized `navItemMapping` as single source of truth
- Added `getAvailableNavItems()` for role-based filtering
- Removed hardcoded `slice(3)` logic
- Compute "More" menu items as those NOT in bottom nav (using Set for O(1) lookup)
- Export `NavItemId` type for type safety throughout

#### 2. Mobile Bottom Nav Fix (`components/blocks/mobile-bottom-nav.tsx`)
- Now reads exactly 3 items from saved preferences
- Added `renderNavItem()` for consistent slot rendering
- Ensures 3 slots always render (empty spacers if needed)
- Proper aria-labels and 48px touch targets

#### 3. Complete Rearrangeable Navigation UI (`components/blocks/rearrangeable-navigation.tsx`)
- Two-zone Select & Reorder interface:
  - "Bottom Navigation" zone with drag-and-drop reordering
  - "Available Items" zone with add buttons
- X/3 counter badge showing selection status
- Save button disabled until exactly 3 selected
- Reset to defaults option in overflow menu
- Live preview of bottom nav appearance
- 48px minimum touch targets throughout

#### 4. Enhanced PreferencesContext (`app/contexts/PreferencesContext.tsx`)
- Proper optimistic updates with rollback on error
- Query invalidation: `['user-preferences']` after successful save
- localStorage sync for immediate UI updates
- Added `resetNavigation()` function
- Type-safe with `NavItemId` type
- Toast notifications for success/error feedback

#### 5. Settings Page Integration (`app/admin/settings/page.tsx`)
- Simplified UI showing current nav items
- "Customize" button opens full RearrangeableNavigation component
- Reuses same component as mobile bottom sheet for consistency
- Removed duplicate navigation item mappings

### Technical Details

#### Query Keys Affected
- `['user-preferences']` - Invalidated after navigation update
- `['navigation-config', userId]` - Invalidated after navigation update

#### API Endpoints
- `PUT /api/v1/users/preferences/navigation` - Updates navigation with exactly 3 items
- `DELETE /api/v1/users/preferences/navigation` - Resets to role-based defaults
- `GET /api/v1/users/preferences/navigation` - Returns current config + available items

#### Role-Based Defaults
```typescript
ADMIN: ['home', 'tasks', 'bidding']
STAFF: ['home', 'tasks', 'schedule']
CONTRACTOR: ['home', 'my-tasks', 'bids']
VIEWER: ['home', 'tasks', 'schedule']
```

### Acceptance Criteria Met
- ✅ Bottom bar reflects the 3 ids from preferences (order preserved)
- ✅ "More" shows only items not in the bottom bar
- ✅ Rearrange UI lets user pick any 3 from full, role-aware list and reorder them
- ✅ Save disabled until exactly 3 selected; "X/3 selected" counter visible
- ✅ `PUT /api/v1/users/preferences/navigation` called on save; invalidates `['user-preferences']`
- ✅ No use of `slice(3)` anywhere for navigation logic
- ✅ 48px touch targets; glass/dark consistent; a11y labels in place
- ✅ Works for ADMIN/STAFF and CONTRACTOR with proper item filtering

### Files Modified
- `components/blocks/page-shell.tsx`
- `components/blocks/mobile-bottom-nav.tsx`
- `components/blocks/rearrangeable-navigation.tsx`
- `app/contexts/PreferencesContext.tsx`
- `app/admin/settings/page.tsx`

### Testing Notes
- Verify navigation persistence across page refreshes
- Test role-based item filtering (ADMIN vs CONTRACTOR)
- Confirm optimistic updates rollback on API error
- Check mobile touch targets are 48px minimum
- Validate exactly 3 items enforcement

---

## 2025-01-19 - Initial Setup
- Files: PROJECT_GUARDRAILS.md, WORK_PROTOCOL.md, SETTINGS_PAGE_PROMPT.md, CLAUDE.md
- Changes: Created foundational guardrail files and settings implementation prompt
- Query Keys: None (documentation only)
- Tests: N/A (documentation)