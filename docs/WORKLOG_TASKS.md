# WORKLOG - TASKS

## 2025-10-02 - Tasks Page: Canonical Overlay Migration with Mobile Bottom Sheets

**Files Modified:**
- `app/admin/tasks/page.tsx` - Migrated all dialogs and menus to canonical App* components with responsive mobile/desktop behavior

**Changes:**
- Replaced `MobileDialog` → `AppSheet` (mobile) / `AppDialog` (desktop) for Create/Edit Task dialogs with conditional rendering based on `isMobile`
- Replaced `DropdownMenu` → `AppDropdownMenu` for row actions menu (lines 503-544)
- Replaced `AlertDialog` → `AppDialog` with destructive Button pattern for delete confirmations (single + bulk)
- Removed raw primitive imports; added canonical component imports from `@/components/ui/app-dialog`, `@/components/ui/app-menu`, and `@/components/ui/app-sheet`
- Added 48px minimum touch targets (`min-h-[48px] text-base`) to all mobile form inputs

**Why Changed:**
- Canonical overlay migration per UX_STANDARDS.md and PROJECT_GUARDRAILS.md
- Mobile forms now use AppSheet with `mode="form"` (90vh height) for optimal mobile UX
- Desktop forms use AppDialog `size="lg"` (max-w-2xl) for consistent centered positioning
- Enforces consistent z-layering (z-modal), focus management, body scroll lock, and drag-to-dismiss on mobile
- AppDropdownMenu enforces z-modal and consistent item padding
- Delete dialogs use standard AppDialog with destructive Button variant instead of custom AlertDialog styling

**Acceptance Checklist:**

**Mobile Bottom Sheets (Create/Edit):**
- ✅ Visible drag handle (automatic via AppSheet component)
- ✅ Drag-to-dismiss + X button + Esc + backdrop click (via AppSheet primitives)
- ✅ Height: `mode="form"` → h-modal-form (90vh)
- ✅ Safe area: `.pb-safe` applied to content wrapper
- ✅ Focus trap: Automatic via Radix Dialog primitive in AppSheet
- ✅ Focus return: Automatic via Radix Dialog when closed
- ✅ Body scroll lock: Automatic via Radix Dialog
- ✅ 48px touch targets on all form inputs (min-h-[48px] text-base)

**Desktop Dialogs (Create/Edit):**
- ✅ Centered positioning with AppDialog
- ✅ Size: `size="lg"` (max-w-2xl) for form dialogs
- ✅ Focus trap + custom onOpenAutoFocus to prevent aria-hidden warnings
- ✅ Dismiss: X button + Esc + backdrop click

**Delete Confirmation Dialogs:**
- ✅ AppDialog `size="sm"` (max-w-md) for confirmation dialogs
- ✅ Destructive Button variant replaces AlertDialogAction custom styling
- ✅ Works on both mobile and desktop (no bottom sheet needed for confirmations)

**Row Actions Menu:**
- ✅ AppDropdownMenu enforces z-modal layering
- ✅ Consistent item padding (px-2 py-1.5)
- ✅ Keyboard navigation automatic via Radix

**Z-layer & Non-Regression:**
- ✅ Z-layer policy: z-modal (50) applied by canonical components (overlays above nav/FAB, under toasts)
- ✅ No raw Dialog/Sheet/DropdownMenu/AlertDialog imports remain in app/admin/tasks/page.tsx
- ✅ FilterBottomSheet preserved AS-IS (will migrate in follow-up batch)
- ✅ No changes made to bottom nav or FAB code
- ✅ No console/a11y warnings (AppSheet and AppDialog use proper focus management)

**Query Keys Affected:** None (UI-only migration, no data/state changes)

**Verification Results:**
- `npm run lint`: 827 pre-existing problems, **0 new issues** from migration
- `npm run typecheck`: Pre-existing errors only, **0 new type errors** in tasks page

**Notes:**
- First page with responsive mobile/desktop overlay migration complete
- Mobile users now get native-feeling bottom sheets with drag support for Create/Edit forms
- Desktop users get centered dialogs for optimal large-screen UX
- All overlay behavior preserved (open/close, form state, API calls unchanged)
- Establishes pattern for future page migrations with mobile/desktop conditional rendering

---

## 2025-01-19 - Initial Setup
- Files: TASKS_PAGE_PROMPT.md
- Changes: Created tasks page implementation prompt with XOR invariant
- Query Keys: ['tasks', query], ['task', taskId]
- Invalidations: Create → ['tasks'], ['tasks', { projectId }]; Update → ['tasks'], ['task', id]; Status → ['tasks'], ['task']; Delete → ['tasks']
- Tests: N/A (documentation)