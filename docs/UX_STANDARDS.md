# UX STANDARDS - Modal, Sheet & Menu Contracts

**Date:** 2025-10-01
**Purpose:** Define enforceable contracts for all overlay components
**Applies To:** All bottom sheets, dialogs, popovers, and dropdown menus
**Status:** MANDATORY - Use AppSheet/AppDialog/AppMenu instead of raw primitives

---

## 1. Bottom Sheet Rules

### Rule 1: Visual Drag Handle
**Contract:** All bottom sheets MUST display a visible drag handle at the top.

**Spec:**
- Dimensions: `w-12 h-1` (48px × 4px)
- Color: `bg-white/30` (30% opacity white)
- Shape: `rounded-full`
- Position: Top-center with `pt-2` spacing

**Evidence:** `components/ui/bottom-sheet.tsx:126`

### Rule 2: Dual Dismiss Methods
**Contract:** Bottom sheets MUST support BOTH X button AND drag-to-dismiss.

**Spec:**
- X button: Absolute positioned `right-4 top-4`, `sr-only` "Close" label
- Drag gesture: 100px threshold, touch + mouse support
- Backdrop click: Closes by default. If a form has unsaved changes, enable form protection: intercept backdrop and show a confirm dialog (or block close) until the user decides.
- Escape key: Closes by default. Same form protection logic applies.

**Evidence:** `MOBILE_SHEET_AUDIT.md` - Only 2/12 components currently compliant

### Rule 3: Height Presets
**Contract:** Use semantic height modes, not arbitrary values.

**Modes:**
- `detail`: `h-modal-detail` (85vh) - For detail/view sheets (most common)
- `form`: `h-modal-form` (90vh) - For form dialogs
- `fullscreen`: `h-modal-fullscreen` (calc with safe area) - Full-screen sheets

**Min-Height:** All sheets MUST set `min-h-modal-min` (200px)

**Evidence:** `TOKEN_AUDIT.md` Section 6.2

### Rule 4: Safe Area Handling
**Contract:** All mobile sheets MUST respect iOS safe areas.

**Spec:**
- Footer padding: `pb-safe` (custom utility class)
- Full-screen mode: Height token `h-modal-fullscreen` automatically accounts for `env(safe-area-inset-top)`

**Evidence:** `DEVIATIONS.md` Section 2.4

### Rule 5: Action Button Layout
**Contract:** Fixed action buttons at bottom with consistent hierarchy.

**Spec:**
- Container: `absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4 pb-safe`
- Layout: Vertical stack with `space-y-2`
- Order: Primary (full-width) → Secondary (full-width or grid) → Destructive (full-width, separated)
- Content clearance: Scrollable content MUST have `pb-24` (96px)

**Evidence:** `DEVIATIONS.md` Section 3.5

### Rule 6: Scroll Lock
**Contract:** Content MUST scroll internally, body MUST remain locked.

**Spec:**
- Container: `overflow-hidden flex flex-col`
- Content area: `flex-1 overflow-y-auto`
- Body scroll: Automatically locked by Radix Dialog primitive

### Rule 7: Focus Management
**Contract:** Focus MUST be trapped within sheet and restored on close.

**Spec:**
- Accessible title: `<SheetTitle>` or `sr-only` hidden title
- Focus trap: Automatic via Radix Dialog
- Focus return: Automatic via Radix Dialog
- Tab order: Linear (handle → X button → content → actions)

**Evidence:** `UI_BASELINE.md` Section 8

### Rule 8: Backdrop Behavior
**Contract:** Consistent backdrop styling across all sheets.

**Spec:**
- Color: `bg-black/50` (50% opacity)
- Blur: `backdrop-blur-sm` (4px)
- Z-index: `z-modal`
- Click behavior: Closes by default. If a form has unsaved changes, enable form protection: intercept backdrop click and show a confirm dialog (or block close) until the user decides.

**Evidence:** `DEVIATIONS.md` Section 2.5

### Rule 9: Motion & Transitions
**Contract:** Smooth animations for open/close/drag states.

**Spec:**
- Open: `data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom`
- Close: `data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom`
- Duration: `data-[state=open]:duration-500 data-[state=closed]:duration-300`
- Drag: No transition during drag, `transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)` on release

### Rule 10: Z-Index Layering
**Contract:** All overlays use semantic z-index tokens.

**Layers:**
- Modal/Sheet: `z-modal` (50)
- Header: `z-header` (40)
- Sidebar: `z-sidebar` (30)
- Sticky content: `z-sticky` (10)

---

## 2. Dialog Rules (Desktop)

### Rule 1: Centered Positioning
**Contract:** Dialogs MUST be center-positioned on desktop.

**Spec:**
- Position: `fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`
- Max-width variants: `max-w-md` (small), `max-w-lg` (default), `max-w-2xl` (large)
- Border radius: `sm:rounded-lg` (14px)
- Z-index: `z-modal`

### Rule 2: Focus Management
**Contract:** Custom focus logic to prevent aria-hidden warnings.

**Spec:** (See `components/ui/dialog.tsx:43-51`)
```typescript
onOpenAutoFocus={(event) => {
  event.preventDefault();
  const focusableElement = (event.currentTarget as HTMLElement)?.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as HTMLElement;
  focusableElement?.focus();
}}
```

### Rule 3: Header/Footer Structure
**Contract:** Consistent header/footer layout.

**Spec:**
- Header: `DialogHeader` with `DialogTitle` and optional `DialogDescription`
- Footer: `DialogFooter` with button group
- Padding: `p-6` (24px)

### Rule 4: Form Protection (Optional)
**Contract:** Form dialogs SHOULD prevent accidental backdrop close when unsaved changes exist.

**Spec:** If a form has unsaved changes, enable form protection: intercept backdrop click and Escape key, then show a confirm dialog (or block close) until the user decides.

**Example Implementation:** (See `components/ui/mobile/dialog.tsx:120-126`)
```typescript
onPointerDownOutside={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest('form')) {
    e.preventDefault();
  }
}}
```

---

## 3. Menu Rules (Popover/Dropdown)

### Rule 1: Consistent Sizing
**Contract:** Menus MUST use consistent width/height constraints.

**Spec:**
- Min-width: `min-w-[8rem]` (128px)
- Max-height: `max-h-[var(--radix-*-content-available-height)]` (uses Radix variable)
- Overflow: `overflow-y-auto overflow-x-hidden`
- Z-index: `z-modal`

### Rule 2: Padding & Spacing
**Contract:** Consistent item padding for touch targets.

**Spec:**
- Container padding: `p-1` (4px)
- Item padding: `px-2 py-1.5` (8px / 6px)
- Minimum item height: `h-9` (36px) - below 48px is acceptable for desktop-only menus

### Rule 3: Keyboard Navigation
**Contract:** All menu items MUST be keyboard accessible.

**Spec:**
- Arrow keys: Navigate items
- Enter/Space: Activate item
- Escape: Close menu
- Tab: Close menu and move to next focusable element

**Evidence:** Automatic via Radix Dropdown/Popover primitives

---

## 4. Acceptance Checklist (10 Items)

Use this checklist when implementing or reviewing overlay components:

### Bottom Sheets
- [ ] Visible drag handle (`w-12 h-1 rounded-full bg-white/30`)
- [ ] Drag-to-dismiss + X button + Backdrop + Escape (with optional form protection)
- [ ] Uses height mode (`detail`/`form`/`fullscreen`) via tokens (`h-modal-detail`, etc.)
- [ ] Safe area handling (`pb-safe` on footer)
- [ ] Fixed action buttons at bottom with `border-t` and `pb-safe`
- [ ] Scrollable content with `pb-24` clearance
- [ ] Focus trap + accessible title

### Dialogs
- [ ] Centered positioning on desktop with `z-modal`
- [ ] Custom focus management (no aria-hidden warnings)
- [ ] Consistent header/footer structure
- [ ] Form protection (if contains forms with unsaved changes)

### Menus
- [ ] Consistent sizing (`min-w-[8rem]`, max-height with Radix variable)
- [ ] Touch-friendly padding (`px-2 py-1.5`)
- [ ] Keyboard navigation (automatic via Radix)
- [ ] Z-index: `z-modal`

### All Overlays
- [ ] Uses semantic z-index token (`z-modal`, `z-header`, `z-sidebar`, `z-sticky`)
- [ ] Backdrop: `bg-black/50 backdrop-blur-sm`
- [ ] Smooth open/close animations

---

## 5. Reference Implementations

### Compliant Components (Use as Examples)

**Bottom Sheet:**
- `components/ui/bottom-sheet.tsx` - ✅ Reference implementation with drag support
- `components/tasks/filter-bottom-sheet.tsx` - ✅ Uses BottomSheet wrapper

**Dialog:**
- `components/ui/dialog.tsx` - ✅ Custom focus management
- `components/ui/mobile/dialog.tsx` - ✅ Responsive adapter with form protection

**Detail Sheet Pattern:**
- `components/ui/mobile/detail-sheet.tsx` - ✅ Reusable sticky header + scrollable content + fixed actions

### Non-Compliant Components (DO NOT Copy)

**Missing Drag Support (10 components):**
- `components/ui/sheet.tsx` - ❌ No drag, use AppSheet wrapper instead
- `components/tasks/mobile-task-detail-sheet.tsx` - ❌ 338 lines, should use MobileDetailSheet
- `components/contacts/mobile-contact-detail-sheet.tsx` - ❌ 415 lines, should use MobileDetailSheet

**See:** `DEVIATIONS.md` for full list

---

## 6. Enforcement

**DO NOT import raw primitives in app code:**
- ❌ `import { Dialog, Sheet, Popover, DropdownMenu } from '@/components/ui/*'`
- ✅ `import { AppDialog, AppSheet, AppMenu } from '@/components/ui/*'`

**Exceptions:**
- Base UI component implementations (`components/ui/*.tsx`)
- Existing components during migration (will be refactored in later phases)

**Stop Condition:**
If you see raw `Dialog`/`Sheet`/`Popover`/`DropdownMenu` imports in NEW page code, STOP and propose a migration plan.

---

## END OF UX STANDARDS

**Cross-References:**
- Implementation details: `UI_BASELINE.md`
- Deviations from standards: `DEVIATIONS.md`
- Component audit: `COMPONENT_AUDIT.csv`
- Token definitions: `TOKEN_AUDIT.md`
