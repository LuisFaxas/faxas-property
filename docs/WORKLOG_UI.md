# WORKLOG - UI Components & Design System

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
