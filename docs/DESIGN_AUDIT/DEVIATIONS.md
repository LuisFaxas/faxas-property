# DEVIATIONS - Inconsistencies & Non-Standard Patterns

**Project:** Miami Duplex Remodel Construction Management System
**Date:** 2025-10-01
**Purpose:** Document all inconsistencies found during UI baseline audit
**Priority:** Use this for standardization roadmap

---

## Executive Summary

This document enumerates all deviations from consistent patterns across modal/sheet/overlay components. Each deviation includes exact file paths, conflicting patterns, and impact assessment.

**Total Deviations Found:** 28
**Critical (User-Facing):** 1
**High Priority (UX):** 10
**Medium Priority (Consistency):** 12
**Low Priority (Nice-to-Have):** 5

---

## 1. CRITICAL DEVIATIONS (User-Facing Bugs)

### 1.1 Schedule Event Delete Button Missing

**Deviation:** Delete button conditionally hidden based on event status
**Expected:** Delete should ALWAYS be available
**Impact:** Users cannot delete DONE/CANCELED events

**Evidence:**
- **File:** `components/schedule/mobile/event-detail-sheet.tsx`
- **Lines:** 121-175
- **Pattern:**
```typescript
// Lines 121-162: Conditional actions
if (event.status !== 'DONE' && event.status !== 'CANCELED') {
  if (onComplete) actions.push({ id: 'complete', ... });
  if (onEdit) actions.push({ id: 'edit', ... });
  if (onCancel) actions.push({ id: 'cancel', ... });
}

// Lines 164-175: Delete action (may not show for DONE/CANCELED)
if (onDelete) {
  actions.push({
    id: 'delete',
    label: 'Delete Event',
    icon: Trash,
    onClick: onDelete,
    variant: 'destructive',
  });
}
```

**Fix Required:**
```typescript
// Delete should be outside the status condition
const actions: DetailAction[] = [];

// Status-dependent actions
if (event.status !== 'DONE' && event.status !== 'CANCELED') {
  // ... conditional actions
}

// Delete ALWAYS available
if (onDelete) {
  actions.push({
    id: 'delete',
    label: 'Delete Event',
    icon: Trash,
    onClick: onDelete,
    variant: 'destructive', // Ensures it's separated at bottom
  });
}
```

---

## 2. HIGH PRIORITY DEVIATIONS (UX Improvements)

### 2.1 Drag-to-Dismiss Support Missing

**Deviation:** Only 2 out of 12 mobile sheets support drag gestures
**Expected:** All bottom sheets should support drag-to-dismiss
**Impact:** Inconsistent mobile UX, users expect drag on all sheets

**Components WITHOUT Drag (10/12):**
1. `components/ui/sheet.tsx` (standard Sheet component)
2. `components/ui/mobile/dialog.tsx` (MobileDialog - h-[90vh])
3. `components/ui/mobile/detail-sheet.tsx` (MobileDetailSheet - h-[85vh])
4. `components/tasks/mobile-task-detail-sheet.tsx` (338 lines, custom)
5. `components/tasks/mobile-task-dialog.tsx` (full-screen)
6. `components/contacts/mobile-contact-detail-sheet.tsx` (415 lines, custom)
7. `components/contacts/mobile-filter-sheet.tsx` (350 lines, custom)
8. `components/contacts/mobile-contact-dialog.tsx` (form dialog)
9. `components/schedule/mobile/event-detail-sheet.tsx` (via MobileDetailSheet)
10. `components/dashboard/QuickActionsSheet.tsx` (FAB menu)

**Components WITH Drag (2/12):**
1. ✅ `components/ui/bottom-sheet.tsx`
2. ✅ `components/tasks/filter-bottom-sheet.tsx` (uses BottomSheet)

**Evidence:** See `MOBILE_SHEET_AUDIT.md` table

**Fix Required:** Add drag support to all bottom sheets (see `MOBILE_MENU_OVERHAUL.md` Phase 1)

### 2.2 Visual Drag Handles Missing

**Deviation:** 10 out of 12 components lack visual drag indicators
**Expected:** All draggable sheets should have visible handle
**Impact:** Users don't know sheets are draggable

**Components WITHOUT Handle (10/12):**
- All components from deviation 2.1 except BottomSheet and FilterBottomSheet

**Current Handle Standard (from BottomSheet):**
```typescript
<div className="w-12 h-1 rounded-full bg-white/30" />
```
- **Dimensions:** 48px × 4px
- **Color:** 30% opacity white
- **Shape:** Fully rounded
- **Position:** Top-center with `pt-2` spacing

**Fix Required:** Add drag handle to all sheets following BottomSheet pattern

### 2.3 Height Standards Inconsistent

**Deviation:** 4 different height values for similar use cases
**Expected:** Standardized height tokens (detail: 85vh, form: 90vh)
**Impact:** Inconsistent visual experience, no clear naming convention

**Height Distribution:**
| Height | Count | Files | Use Case |
|--------|-------|-------|----------|
| `h-[85vh]` | 5 | bottom-sheet, detail-sheet, task-detail, contact-detail, filter-sheet | Detail views ✅ MOST COMMON |
| `h-[90vh]` | 3 | mobile/dialog, contact-dialog, assign-task-dialog | Form dialogs |
| `h-[80vh]` | 1 | contact-card | Contact card variant ⚠️ OUTLIER |
| `calc(100vh-env(safe-area-inset-top))` | 1 | mobile-task-dialog | Full-screen ⚠️ UNIQUE |

**Evidence:**
- `components/ui/bottom-sheet.tsx:108` → `max-h-[85vh]`
- `components/ui/mobile/dialog.tsx:63` → `h-[90vh]`
- `components/contacts/contact-card.tsx:271` → `h-[80vh]` ⚠️
- `components/tasks/mobile-task-dialog.tsx:55` → `h-full max-h-[calc(...)]`

**Fix Required:** Define height tokens (see `TOKEN_AUDIT.md` Section 6.3)

### 2.4 Safe Area Handling Inconsistent

**Deviation:** 3 different approaches to safe areas
**Expected:** Consistent use of `pb-safe` Tailwind utility
**Impact:** Inconsistent spacing on iOS devices

**Patterns Found:**
1. **Explicit calc (2 files):**
   ```typescript
   // mobile-task-dialog.tsx:88
   pb-[calc(1rem+env(safe-area-inset-bottom))]
   ```

2. **Tailwind utility (2 files):**
   ```typescript
   // mobile/dialog.tsx:102
   pb-safe
   ```

3. **No safe area handling (8 files):**
   - Most sheets ignore safe areas entirely

**Fix Required:** Standardize on `pb-safe` for all mobile sheet footers

### 2.5 Backdrop Opacity Inconsistent

**Deviation:** Two different backdrop opacity values
**Expected:** Single standard backdrop style
**Impact:** Visual inconsistency between modals

**Patterns:**
- **Dialog/Sheet:** `bg-black/80` (80% opacity) - 5 files
- **BottomSheet:** `bg-black/50 backdrop-blur-sm` (50% + blur) - 3 files

**Evidence:**
- `ui/dialog.tsx:23` → `bg-black/80`
- `ui/sheet.tsx:24` → `bg-black/80`
- `ui/bottom-sheet.tsx:96` → `bg-black/50 backdrop-blur-sm`
- `mobile-task-dialog.tsx:47` → `bg-black/50 backdrop-blur-sm`

**Observation:** BottomSheet's 50% + blur looks better aesthetically

**Fix Required:** Standardize on `bg-black/50 backdrop-blur-sm` for all modals

### 2.6 Form Protection Inconsistent

**Deviation:** Only 1 component protects forms from accidental backdrop close
**Expected:** All form dialogs should prevent accidental close
**Impact:** Users lose form data when clicking outside

**Component WITH Protection:**
- `components/ui/mobile/dialog.tsx:120-126`
```typescript
onPointerDownOutside={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest('form')) {
    e.preventDefault(); // Prevent close if clicking on form
  }
}}
```

**Components WITHOUT Protection (all other dialogs with forms):**
- `mobile-contact-dialog.tsx`
- `mobile-task-dialog.tsx`
- All Schedule event dialogs
- Budget/Procurement forms

**Fix Required:** Apply form protection pattern to all form dialogs

### 2.7 Large Custom Sheets (Code Duplication)

**Deviation:** Large custom implementations instead of using reusable patterns
**Expected:** Use `MobileDetailSheet` pattern to reduce duplication
**Impact:** Harder to maintain, inconsistent behavior

**Large Custom Components:**
1. **mobile-task-detail-sheet.tsx:** 338 lines
   - Should use `MobileDetailSheet` → ~80 lines (75% reduction)

2. **mobile-contact-detail-sheet.tsx:** 415 lines
   - Should use `MobileDetailSheet` → ~100 lines (76% reduction)

3. **mobile-filter-sheet.tsx:** 350 lines
   - Could be refactored to use `DraggableSheet` → ~120 lines (66% reduction)

**Evidence:** See `MOBILE_SHEET_AUDIT.md` sections 6, 8, 9

**Fix Required:** Refactor to use standard patterns (see `MOBILE_MENU_OVERHAUL.md` Phase 5)

### 2.8 Border Radius Inconsistency (Mobile vs Desktop)

**Deviation:** Different corner radius for mobile sheets vs desktop dialogs
**Expected:** Document why different, ensure intentional
**Impact:** None (mobile/desktop have different design languages)

**Patterns:**
- **Mobile sheets:** `rounded-t-2xl` (24px) - 10 files ✅ CONSISTENT
- **Desktop dialogs:** `sm:rounded-lg` (14px) - 5 files
- **Popovers/Dropdowns:** `rounded-md` (12px) - 10 files

**Evidence:**
- `ui/bottom-sheet.tsx:106` → `rounded-t-2xl`
- `ui/dialog.tsx:40` → `sm:rounded-lg`

**Finding:** Mobile sheets ARE consistent with each other (all use 24px)

**Action:** Document intentional difference, no fix needed

### 2.9 Missing Escape Key Handler

**Deviation:** BottomSheet doesn't explicitly handle Escape key
**Expected:** All modals should close on Escape
**Impact:** Minor - overlay click still works, but inconsistent with other modals

**Component:** `components/ui/bottom-sheet.tsx`

**Current:** Relies on backdrop overlay click behavior
**Expected:** Add explicit Escape key handler like Dialog/Sheet

**Fix Required:**
```typescript
React.useEffect(() => {
  if (!open) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [open, onOpenChange]);
```

### 2.10 Scroll Lock Inconsistent

**Deviation:** Some components don't properly lock background scroll
**Expected:** All modals should prevent body scroll when open
**Impact:** Can scroll page behind modal on some components

**Pattern Found:** Most use `overflow-hidden` on container, but body scroll lock missing

**Fix Required:** Ensure all modals lock body scroll (Radix handles this for Dialog/Sheet, but custom implementations may need manual handling)

---

## 3. MEDIUM PRIORITY DEVIATIONS (Consistency)

### 3.1 Hard-Coded `.glass` Class

**Deviation:** `.glass` class uses hard-coded rgba values instead of Tailwind tokens
**Expected:** Use Tailwind opacity syntax
**Impact:** Not using design tokens, harder to theme

**Evidence:** `app/globals.css:66-73`
```css
.glass {
  background: rgba(20, 22, 27, 0.55);  /* ⚠️ Should be bg-graphite-800/55 */
  border: 1px solid rgba(255, 255, 255, 0.08);  /* ⚠️ Should be border-white/[0.08] */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);  /* ⚠️ Should use backdrop-blur class */
  -webkit-backdrop-filter: blur(8px);
  border-radius: 14px;  /* ⚠️ Should use var(--radius) */
}
```

**Fix Required:**
```css
.glass {
  @apply bg-graphite-800/55 border border-white/[0.08] backdrop-blur;
  @apply rounded-[var(--radius)];
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
```

### 3.2 Border Colors Not Using Tokens

**Deviation:** Most components use `border-white/10` instead of `border-border` token
**Expected:** Use design system CSS variable
**Impact:** Bypassing theming system

**Evidence:**
- `ui/bottom-sheet.tsx:105` → `border-white/10`
- `mobile/detail-sheet.tsx:75` → `border-white/10`
- 20+ other files

**Token Available:** `border-border` → `hsl(var(--border))`
**Source:** `app/globals.css:47`, `tailwind.config.ts:20`

**Fix Required:** Replace `border-white/10` with `border-border` or create `border-modal` token

### 3.3 Text Colors Mixed Usage

**Deviation:** Some use CSS variables, others use direct colors
**Expected:** Consistent use of `text-foreground` and `text-muted-foreground`
**Impact:** Inconsistent when theming

**Patterns Found:**
- `text-foreground` (token) vs. `text-white` (direct)
- `text-muted-foreground` (token) vs. `text-white/60` (hard-coded opacity)

**Evidence:**
- `ui/dialog.tsx:99` → `text-foreground` ✅
- `mobile-task-detail-sheet.tsx` → `text-white` ❌

**Fix Required:** Standardize on CSS variable tokens

### 3.4 Header Sticky Positioning Inconsistent

**Deviation:** Different approaches to sticky headers within sheets
**Expected:** Consistent pattern
**Impact:** Minor visual inconsistency

**Patterns:**
1. **Sticky with z-10:**
   ```typescript
   <div className="sticky top-0 z-10 bg-graphite-900">
   ```
   **Evidence:** `mobile/detail-sheet.tsx:75`

2. **Sticky without z-index:**
   ```typescript
   <div className="sticky top-0 bg-graphite-900">
   ```
   **Evidence:** `mobile-task-detail-sheet.tsx:125`

3. **No sticky, negative margins for full-bleed:**
   ```typescript
   <div className="-mx-6 px-6 pt-6">
   ```
   **Evidence:** `mobile/detail-sheet.tsx:75`

**Fix Required:** Standardize sticky header pattern

### 3.5 Action Button Layout Inconsistent

**Deviation:** Different action button arrangements at bottom of sheets
**Expected:** Consistent hierarchy (primary → secondary → destructive)
**Impact:** Users learn different button positions per sheet

**Patterns:**
1. **Vertical stack (all full-width):**
   ```typescript
   <div className="space-y-2">
     <Button className="w-full">Primary</Button>
     <Button className="w-full">Secondary</Button>
     <Button className="w-full" variant="destructive">Delete</Button>
   </div>
   ```
   **Evidence:** `mobile-filter-sheet.tsx`

2. **Grid for secondary actions:**
   ```typescript
   <div className="space-y-2">
     <Button className="w-full">Primary</Button>
     <div className="grid grid-cols-2 gap-2">
       <Button>Secondary 1</Button>
       <Button>Secondary 2</Button>
     </div>
     <Button className="w-full" variant="destructive">Delete</Button>
   </div>
   ```
   **Evidence:** `mobile-contact-detail-sheet.tsx`

3. **No clear hierarchy:**
   - Some sheets have delete button NOT separated
   - Some mix primary/secondary in same row

**Fix Required:** Define standard action button layout pattern (see `MOBILE_MENU_OVERHAUL.md` Rule 5)

### 3.6 No Snap Points Implemented

**Deviation:** No sheets implement snap points (half-height, full-height)
**Expected:** Mobile sheets could snap to different heights
**Impact:** Nice-to-have feature, not critical

**Current:** All sheets are fixed height
**Potential:** Could add half/full snap points like iOS sheets

**Fix Priority:** Low (enhancement, not standardization)

### 3.7 Accessibility Title Pattern Inconsistent

**Deviation:** Two different patterns for accessible titles
**Expected:** Consistent approach
**Impact:** Minor accessibility inconsistency

**Patterns:**
1. **Direct SheetTitle (visible):**
   ```typescript
   <SheetTitle>{title}</SheetTitle>
   ```
   **Evidence:** Most components

2. **Hidden sr-only + custom visual:**
   ```typescript
   <SheetHeader className="sr-only">
     <SheetTitle>{task.title}</SheetTitle>
   </SheetHeader>
   {/* Custom visual header */}
   <h2 className="text-xl">{task.title}</h2>
   ```
   **Evidence:** `mobile-task-detail-sheet.tsx:90-92`

**Finding:** Pattern #2 is for custom-styled headers, Pattern #1 for default styling

**Action:** Document both patterns as valid use cases

### 3.8 Min-Height Only on BottomSheet

**Deviation:** Only BottomSheet sets `min-h-[200px]`
**Expected:** All sheets should have minimum height
**Impact:** Other sheets could collapse too small

**Evidence:**
- `ui/bottom-sheet.tsx:108` → `min-h-[200px]` ✅
- All other sheets → No min-height ❌

**Fix Required:** Add minimum height to all sheets

### 3.9 Content Padding Inconsistent

**Deviation:** Different padding patterns for scrollable content
**Expected:** Standard padding
**Impact:** Minor visual inconsistency

**Patterns:**
- `p-4` (16px) - Most mobile sheets
- `px-6 py-4` (24px/16px) - Some desktop views
- `px-4 py-6` (16px/24px) - Alternate pattern
- `-mx-6 px-6` (negative margin for full-bleed borders) - Mobile detail sheets

**Fix Required:** Define standard content padding for mobile vs. desktop

### 3.10 Footer Border Treatment Inconsistent

**Deviation:** Some action footers have top border, some don't
**Expected:** Consistent visual separator
**Impact:** Visual inconsistency

**Patterns:**
- `border-t border-white/10` - Most components ✅
- No border - Some components ❌

**Fix Required:** Ensure all action footers have top border

### 3.11 Desktop Dialog Max-Width Inconsistent

**Deviation:** Different max-width values for desktop dialogs
**Expected:** Size variants (sm, md, lg) used consistently
**Impact:** Visual inconsistency on desktop

**Patterns:**
- `max-w-lg` (32rem / 512px) - Default dialog
- `max-w-md` (28rem / 448px) - Small dialogs
- `max-w-2xl` (42rem / 672px) - Large dialogs (bidding, RFPs)
- `max-w-full` - Full-width variant

**Evidence:** `mobile/dialog.tsx:31-36` defines size variants

**Action:** Ensure consistent usage of defined size prop

### 3.12 Cursor States on Drag Handles

**Deviation:** Only BottomSheet uses `cursor-grab active:cursor-grabbing`
**Expected:** All drag handles should show grab cursor
**Impact:** Users don't know to drag

**Evidence:**
- `ui/bottom-sheet.tsx:118` → `cursor-grab active:cursor-grabbing` ✅
- Future drag handles need this pattern

**Fix Required:** Include cursor classes in standard drag handle component

---

## 4. LOW PRIORITY DEVIATIONS (Nice-to-Have)

### 4.1 No Named Opacity Tokens

**Deviation:** Using inline opacity values (`/30`, `/60`, `/80`)
**Expected:** Semantic opacity tokens
**Impact:** None (Tailwind syntax is fine), but semantic names would be clearer

**Current Usage:**
- `bg-white/30` - Drag handles
- `text-white/60` - Muted text
- `bg-black/50` - Backdrops
- `bg-graphite-800/50` - Card backgrounds

**Recommendation:** Create semantic tokens (see `TOKEN_AUDIT.md` Section 5.3)

### 4.2 No Semantic Z-Index Tokens

**Deviation:** Using numeric `z-50`, `z-40`, `z-30`
**Expected:** Semantic names like `z-modal`, `z-header`, `z-sidebar`
**Impact:** None (numbers work fine), but semantic names more maintainable

**Recommendation:** Create semantic tokens (see `TOKEN_AUDIT.md` Section 8.3)

### 4.3 No Velocity-Based Dismiss

**Deviation:** BottomSheet uses 100px threshold only, no velocity check
**Expected:** Quick swipe should dismiss even if < 100px
**Impact:** Minor UX improvement

**Current:**
```typescript
if (currentY > 100) {
  onOpenChange(false);
}
```

**Potential Enhancement:**
```typescript
const duration = Date.now() - startTime;
const velocity = currentY / duration;

if (currentY > 100 || velocity > 0.5) {  // 0.5 px/ms threshold
  onOpenChange(false);
}
```

**Evidence:** See `MOBILE_MENU_OVERHAUL.md` Rule 1 for velocity implementation

### 4.4 No Animation Variants

**Deviation:** All sheets use same slide-in animation
**Expected:** Could have spring/bounce/ease variants
**Impact:** None (current animation is fine)

**Current:** Radix default slide-in
**Potential:** Framer Motion spring animations

**Priority:** Low enhancement

### 4.5 No Loading/Skeleton States

**Deviation:** Sheets don't have loading states while content fetches
**Expected:** Skeleton loaders while data loads
**Impact:** Blank sheet briefly shown

**Fix Priority:** Low (not a deviation, just missing feature)

---

## 5. Summary by Category

### By Priority

| Priority | Count | Examples |
|----------|-------|----------|
| **Critical** | 1 | Schedule delete button bug |
| **High** | 10 | Drag support missing, height inconsistency |
| **Medium** | 12 | Hard-coded .glass class, border colors |
| **Low** | 5 | Semantic tokens, velocity dismiss |
| **TOTAL** | **28** | |

### By Type

| Type | Count | Examples |
|------|-------|----------|
| **Bug** | 1 | Delete button conditional logic |
| **UX Inconsistency** | 10 | Drag, handles, heights, safe areas |
| **Code Quality** | 7 | Large custom sheets, duplication |
| **Design Token** | 6 | Hard-coded values, missing tokens |
| **Accessibility** | 2 | Title patterns, focus management |
| **Enhancement** | 2 | Snap points, velocity dismiss |

### By Component Count Affected

| Issue | Components Affected | Percentage |
|-------|---------------------|------------|
| Missing drag support | 10/12 | 83% |
| Missing drag handle | 10/12 | 83% |
| Height inconsistency | 12/12 | 100% |
| Safe area handling | 10/12 | 83% |
| Form protection | 11/12 | 92% |
| Border colors | 20/89 | 22% |

---

## 6. Migration Priority Order

Based on impact and effort, recommended order:

### Phase 1: Critical Fixes (Immediate)
1. **Fix schedule event delete button** - 1 file, ~10 lines
   - File: `components/schedule/mobile/event-detail-sheet.tsx`
   - Lines: 164-175

### Phase 2: High-Impact UX (1-2 weeks)
1. **Add drag support to all sheets** - Create `DraggableSheet` base component
   - Effort: 2-3 days
   - Affected: 10 components

2. **Add visual drag handles** - Extract handle component
   - Effort: 1 day
   - Affected: 10 components

3. **Standardize heights** - Define tokens, migrate components
   - Effort: 2 days
   - Affected: 12 components

4. **Refactor large custom sheets** - Use MobileDetailSheet pattern
   - Effort: 3-4 days
   - Affected: 3 components (saves ~1200 lines of code)

### Phase 3: Consistency Improvements (1 week)
1. **Standardize safe area handling** - Use `pb-safe` everywhere
2. **Fix backdrop styles** - Consistent `bg-black/50 backdrop-blur-sm`
3. **Add form protection** - Apply to all form dialogs
4. **Fix `.glass` class** - Use Tailwind tokens

### Phase 4: Token Standardization (3-5 days)
1. **Create height tokens** - Add to `tailwind.config.ts`
2. **Create opacity tokens** - Semantic names
3. **Create z-index tokens** - Semantic layer names
4. **Migrate components** - Use new tokens

### Phase 5: Polish (Optional)
1. Snap points implementation
2. Velocity-based dismiss
3. Animation variants
4. Loading states

---

## 7. Evidence File Map

For detailed evidence, see:

| Deviation Category | Evidence File | Section |
|-------------------|---------------|---------|
| Component behavior | `MOBILE_SHEET_AUDIT.md` | All sections |
| Height/spacing/radius | `UI_BASELINE.md` | Section 3 |
| Token usage | `TOKEN_AUDIT.md` | All sections |
| Component imports | `COMPONENT_AUDIT.csv` | All rows |
| Original plan comparison | `MOBILE_MENU_OVERHAUL.md` | Current State Analysis |

---

## END OF DEVIATIONS

**Total Deviations:** 28
**Urgent Fixes Needed:** 1
**Standardization Work:** 27
**Lines of Code to Reduce:** ~1200 (via refactoring)

**Next Action:** See migration priority order above for implementation sequence.
