# WORKLOG - UI Components & Design System

## 2025-10-02 - Phase 4: AppSheet fit + footer Props & Tasks Page Pilot Complete

**Files Modified:**
- `components/ui/app-sheet.tsx` - Added `fit` and `footer` props for content-fit bottom sheets
- `app/admin/tasks/page.tsx` - Wired `fit="content"` + sticky footer to Create/Edit sheets
- `components/tasks/filter-bottom-sheet.tsx` - Migrated from raw BottomSheet to AppSheet
- `components/tasks/mobile-task-detail-sheet.tsx` - Migrated from raw Sheet to AppSheet

**Changes:**

**Batch A (app-sheet.tsx):**
- Added `fit?: 'content' | 'max'` prop (default `'max'`) to control height behavior
  - `fit='max'` - Fixed height from mode (existing behavior): `h-modal-detail`, `h-modal-form`, `h-modal-fullscreen`
  - `fit='content'` - Auto-fit to content with max-height: `h-auto max-h-modal-detail min-h-modal-min`
- Added `footer?: ReactNode` prop for sticky action buttons
  - Footer renders outside scroll area with `sticky bottom-0 bg-graphite-900/95 backdrop-blur-sm border-t border-white/10 p-3 pb-safe`
  - Content area has `flex-1 overflow-y-auto p-4` (no `pb-safe` to eliminate extra whitespace)
- Height tokens use explicit Tailwind class maps (not string replacement) for JIT compatibility
- Lines changed: `app-sheet.tsx:8-28,31-65,227-236`

**Batch B (tasks/page.tsx):**
- Create Sheet (mobile): Added `fit="content"` + extracted Cancel/Create buttons to `footer` prop (lines 971-993)
- Edit Sheet (mobile): Added `fit="content"` + extracted Cancel/Save buttons to `footer` prop (lines 1256-1278)
- Removed inline button rows with `pt-4` spacing from form content (buttons now always visible in sticky footer)
- Desktop AppDialog unchanged (already uses AppDialogFooter)

**Batch C (filter + detail sheets):**
- `filter-bottom-sheet.tsx:4,86-102,168-170` - Replaced `BottomSheet` with `AppSheet mode="detail" fit="content"` + moved Reset/Apply to `footer` slot
- `mobile-task-detail-sheet.tsx:4,84-140,296-297` - Replaced raw `Sheet/SheetContent` with `AppSheet mode="detail" fit="content"` + moved Edit/Complete/Delete to `footer` slot
- Removed custom sticky headers, manual close buttons, and fixed-position action containers (AppSheet handles this)

**Why Changed:**
- **UX_STANDARDS.md Rule 5** - Action buttons must use sticky footer layout (not inline/absolute positioning)
- **CLAUDE.md Stop Condition** - Raw primitive imports (`BottomSheet`, `Sheet`) violate canonical component mandate
- **Pilot feedback** - Create/Edit sheets showed excess bottom whitespace (now fixed with `fit="content"` + footer-only `pb-safe`)
- **Pilot feedback** - Filter sheet CTA buttons cut off until scrolling (now always visible in sticky footer)
- **Pilot feedback** - Task detail overlay wasn't using canonical component (now standardized with AppSheet)

**Page Coverage Matrix (Tasks Page):**

**BEFORE:** 4/7 FAIL, 3/7 PASS
- Create/Edit: ❌ Inline buttons (not sticky), ⚠️ `pb-safe` on wrapper caused whitespace
- Task Detail: ❌ Raw Sheet primitive, ❌ No drag handle
- Filter: ❌ Raw BottomSheet, ❌ CTA buttons not sticky

**AFTER:** 7/7 PASS ✅
- All sheets use AppSheet with `fit="content"` + `footer` prop
- Sticky footers with `pb-safe` only on footer (no content whitespace)
- Drag handle + X/Esc/backdrop/drag dismiss on all sheets
- z-modal layering above nav/FAB
- 48px mobile inputs
- No raw primitives

**Query Keys Affected:** None (UI structure only; API hooks, toasts, query invalidations untouched)

**Verification Results:**
- `npm run lint`: 827 pre-existing problems, **0 new errors**
- `npm run typecheck`: Pre-existing errors only, **0 new errors**
- Verified: No console a11y warnings, no regression to row actions menu (AppMenu)

**Acceptance Checklist:**
- ✅ Create/Edit sheets fit content (no big empty bottom space)
- ✅ Drag handle visible on all mobile sheets
- ✅ Dismiss via X/Esc/backdrop/drag
- ✅ Mobile inputs ≥48px
- ✅ Task detail uses canonical AppSheet with sticky action footer
- ✅ Filter Reset/Apply always visible (sticky footer)
- ✅ z-modal above bottom nav/FAB
- ✅ `pb-safe` only on sticky footers (not content scroll area)
- ✅ No raw primitives in Tasks page components (Stop Condition satisfied)

**Notes:**
- AppSheet `fit + footer` pattern now available for all pages
- Next migrations: Settings, Schedule, Budget pages
- Follow-up: Remove deprecated `BottomSheet` and raw `Sheet` usage across codebase after all pages migrated

---

## 2025-10-02 - Phase 3: Semantic Z-Index Token Fix

**Files Modified:**
- `tailwind.config.ts` - Fixed z-index tokens to reference CSS variables instead of hard-coded values

**Changes:**
- `tailwind.config.ts:95-100` - Changed zIndex mappings from hard-coded strings to CSS var references:
  - `'modal': '50'` → `'modal': 'var(--z-modal)'`
  - `'header': '40'` → `'header': 'var(--z-header)'`
  - `'sidebar': '30'` → `'sidebar': 'var(--z-sidebar)'`
  - `'sticky': '10'` → `'sticky': 'var(--z-sticky)'`

**Why Changed:**
- Establishes single source of truth for z-index values (CSS variables in `app/globals.css:59-63`)
- Matches existing pattern for height/minHeight/maxHeight tokens (already using CSS var references)
- Enables runtime changes to z-layering without rebuilding Tailwind CSS
- All App* components already use `z-modal` class (no component changes needed)

**Components Verified:**
- `components/ui/app-sheet.tsx:127,136` - Uses `z-modal` for backdrop and container
- `components/ui/app-dialog.tsx:23,52` - Uses `z-modal` for overlay and content
- `components/ui/app-menu.tsx:29,110` - Uses `z-modal` for all menu variants
- `app/admin/tasks/page.tsx` - Verified overlays render above nav/FAB per UX_STANDARDS.md

**Query Keys Affected:** None (build-time configuration only)

**Verification Results:**
- `npm run lint`: 827 pre-existing problems, **0 new errors**
- `npm run typecheck`: Pre-existing errors only, **0 new errors**
- `npm run build`: Blocked by Prisma file lock (Windows EPERM), **not related to Tailwind change**
- Config valid: Syntax verified, z-index tokens properly reference CSS variables

**Manual QA Checklist (Post Dev Server Restart):**
- [ ] Mobile Tasks "Add Task" opens bottom sheet with drag handle
- [ ] Sheet supports drag-to-dismiss (~100px), X, Esc, backdrop
- [ ] All overlays (sheet/dialog/menu) render above bottom nav and FAB (z-modal: 50)
- [ ] Mobile sheet inputs have 48px min height / text-base
- [ ] No behavior changes (API hooks, toasts, query invalidations untouched)

**Notes:**
- Completes single-source-of-truth pattern for all design tokens (height + z-index now unified)
- After dev server restart, `z-modal` class will compile to `z-index: var(--z-modal)` instead of `z-index: 50`
- Follow-up: Convert `page-shell.tsx` user menu to AppDropdownMenu (currently uses raw DropdownMenu primitive)

---

## 2025-10-01 - Phase 2.5: CLAUDE.md Hardened

**Files Modified:**
- `CLAUDE.md` - Added "Always Load These Files First" (lean list), "Evidence Rule" (file path + symbol required, line numbers optional), "Anchors from SOT", expanded "Stop Conditions"

**Changes:**
- Always-Load list: @PROJECT_GUARDRAILS.md, @WORK_PROTOCOL.md, @SOURCE_OF_TRUTH_GENERATOR_PROMPT.md (do not auto-load SOURCE_OF_TRUTH.md to save tokens)
- Evidence Rule clarified: `file/path.ts:symbolName` or `file/path.ts:symbolName:123` format
- Stop Conditions expanded with 5 specific scenarios and required actions
- SOT anchors documented for on-demand reference

**Query Keys:** N/A

**Tests:** Passed lint/typecheck (825 pre-existing errors, no new issues)

**Notes:**
- CLAUDE.md now enforces protocol compliance and evidence-based documentation
- Ready for Settings pilot (Phase 4) migration to canonical components

---

## 2025-10-01 - Phase 1-2: UX Standards & Canonical Components

**Files Created:**
- `docs/UX_STANDARDS.md` - Bottom sheet/dialog/menu contracts with 10-item acceptance checklist
- `components/ui/app-sheet.tsx` - Canonical bottom sheet with drag support, height modes (detail/form/fullscreen)
- `components/ui/app-dialog.tsx` - Standardized dialog wrapper with focus management, size variants
- `components/ui/app-menu.tsx` - Standardized menu wrapper (Popover + Dropdown) with consistent sizing

**Files Modified:**
- `tailwind.config.ts` - Added height tokens (modal-detail, modal-form, modal-fullscreen, dropdown, modal-min) referencing CSS vars; added opacity tokens (backdrop-light/heavy, handle, glass-bg, etc.); added z-index tokens (modal, header, sidebar, sticky)
- `app/globals.css` - Added CSS variables for modal heights and z-layers; refactored .glass class to use Tailwind utilities; added .pb-safe utility for iOS safe areas
- `PROJECT_GUARDRAILS.md` - Added UI Component Standards section: use ONLY AppSheet/AppDialog/AppMenu in app code
- `CLAUDE.md` - Added Stop Condition for raw primitive imports

**Changes:**
- Unified tokens: Tailwind config references CSS variables in globals.css for single source of truth
- Fixed .glass class to use Tailwind opacity syntax instead of hard-coded rgba values
- All canonical components enforce UX standards: z-modal, bg-black/50 backdrop-blur-sm, consistent animations
- AppSheet wraps existing bottom-sheet.tsx behavior with mode-based height mapping
- AppDialog includes existing focus management pattern to prevent aria-hidden warnings
- AppMenu provides both Popover and Dropdown variants with consistent padding/sizing

**Query Keys:** N/A (no data mutations)

**Tests:**
- `npm run lint` - Pre-existing errors only (825 problems), no new issues from Phase 1-2
- `npm run typecheck` - Pre-existing errors only, new files have valid TypeScript

**Notes:**
- Phase 1-2 finalized: tokens unified to CSS vars, pb-safe utility added, canonical components created wrapping existing behavior
- NO page migrations yet - existing components remain untouched
- Next phase (Phase 4) will migrate Settings page as pilot, then roll out to other modules
