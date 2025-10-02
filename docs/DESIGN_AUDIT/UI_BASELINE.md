# UI BASELINE - Current Overlay & Modal Design Patterns

**Project:** Miami Duplex Remodel Construction Management System
**Date Generated:** 2025-10-01
**Purpose:** Document current state of modal/sheet/overlay UI patterns BEFORE standardization work
**Status:** READ-ONLY baseline - no changes made

---

## Executive Summary

This document captures the current state of modal, sheet, dialog, and overlay components across the application. It serves as a baseline reference for the upcoming Mobile Menu & Bottom Sheet Overhaul (see `MOBILE_MENU_OVERHAUL.md`).

### Key Metrics
- **Total Files Analyzed:** 89 component files
- **Overlay Components in Use:** Dialog, Sheet, BottomSheet, Popover, DropdownMenu, AlertDialog, Command, Tooltip
- **Mobile Sheet Implementations:** 10+ custom mobile-specific wrappers
- **Admin Pages Using Modals:** 17+

---

## 1. Current Overlay Primitives In Use

### 1.1 Base Components (shadcn/ui + Radix)

#### Dialog (components/ui/dialog.tsx)
**Source:** Radix UI Dialog primitive
**Usage:** Desktop-first centered modals
**Styling:** `bg-black/80` backdrop, centered with `fixed left-[50%] top-[50%]`
**Close Methods:** X button only, backdrop click (default Radix), Escape key (default Radix)
**Z-Index:** `z-50`
**Evidence:** `components/ui/dialog.tsx:1-131`

**Key Implementation Detail:**
```typescript
// Custom focus management to prevent aria-hidden warnings
onOpenAutoFocus={(event) => {
  event.preventDefault();
  const focusableElement = (event.currentTarget as HTMLElement)?.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as HTMLElement;
  focusableElement?.focus();
}}
```
**Source:** `components/ui/dialog.tsx:43-51`

#### Sheet (components/ui/sheet.tsx)
**Source:** Radix UI Dialog with slide-in variants
**Usage:** Side panels (top/right/bottom/left)
**Styling:** `bg-black/80` backdrop, side-specific animations
**Close Methods:** X button, backdrop click, Escape key
**Z-Index:** `z-50`
**Evidence:** `components/ui/sheet.tsx:1-140`

**Variants:**
- **top:** `inset-x-0 top-0` with `slide-in-from-top`
- **bottom:** `inset-x-0 bottom-0` with `slide-in-from-bottom`
- **left:** `inset-y-0 left-0 w-3/4 sm:max-w-sm` with `slide-in-from-left`
- **right:** `inset-y-0 right-0 w-3/4 sm:max-w-sm` with `slide-in-from-right`

**Source:** `components/ui/sheet.tsx:33-50`

#### BottomSheet (components/ui/bottom-sheet.tsx) ⭐ HAS DRAG
**Source:** Custom implementation with touch/mouse drag support
**Usage:** Mobile-first bottom sheets with drag-to-dismiss
**Styling:** `bg-black/50 backdrop-blur-sm` backdrop, `glass` class for sheet
**Close Methods:** Drag-down gesture (>100px), X button, backdrop click
**Z-Index:** `z-50`
**Height:** `max-h-[85vh] min-h-[200px]`
**Evidence:** `components/ui/bottom-sheet.tsx:1-151`

**Drag Handle Visual:**
```typescript
<div className="w-12 h-1 rounded-full bg-white/30" />
```
**Source:** `components/ui/bottom-sheet.tsx:126`

**Drag Implementation:** Touch + Mouse event handlers with 100px dismiss threshold
**Source:** `components/ui/bottom-sheet.tsx:21-88`

#### Other Overlays
- **Popover:** `components/ui/popover.tsx` (tooltips, contextual menus)
- **DropdownMenu:** `components/ui/dropdown-menu.tsx` (menus with items)
- **AlertDialog:** `components/ui/alert-dialog.tsx` (destructive confirmations)
- **Command:** `components/ui/command.tsx` (command palette, max-h-[300px])
- **Tooltip:** (via Radix Tooltip primitive, not directly used in audit scope)

### 1.2 Mobile-Adaptive Wrappers

#### MobileDialog (components/ui/mobile/dialog.tsx)
**Purpose:** Responsive adapter - Dialog on desktop, Sheet on mobile
**Breakpoint:** `max-width: 768px` via `useMediaQuery`
**Mobile Height:** `h-[90vh]`
**Desktop Max-Width:** `sm:max-w-md/lg/2xl` (size variants)
**Evidence:** `components/ui/mobile/dialog.tsx:1-169`

**Responsive Switch Pattern:**
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

if (isMobile) {
  return <Sheet side="bottom" className="h-[90vh] rounded-t-2xl">...</Sheet>
}
return <Dialog className="sm:max-w-lg">...</Dialog>
```
**Source:** `components/ui/mobile/dialog.tsx:54-153`

**Special Feature:** `onPointerDownOutside` form protection
```typescript
onPointerDownOutside={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest('form')) {
    e.preventDefault(); // Prevent accidental close while filling forms
  }
}}
```
**Source:** `components/ui/mobile/dialog.tsx:120-126`

#### MobileDetailSheet (components/ui/mobile/detail-sheet.tsx)
**Purpose:** Reusable detail view pattern with sections + actions
**Height:** `h-[85vh]`
**Structure:** Sticky header + scrollable content + fixed action buttons
**Evidence:** `components/ui/mobile/detail-sheet.tsx:1-290`

**Layout Pattern:**
```typescript
<SheetContent className="h-[85vh] overflow-hidden flex-col">
  <div className="sticky top-0 bg-graphite-900 z-10">
    <SheetHeader>...</SheetHeader>
  </div>
  <div className="overflow-y-auto pb-24 -mx-6 px-6">
    {sections.map(...)}
  </div>
  <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t p-4">
    {actions.map(...)}
  </div>
</SheetContent>
```
**Source:** `components/ui/mobile/detail-sheet.tsx:66-175`

---

## 2. Current Dismiss Methods Across Components

### 2.1 Close Method Matrix

| Component | X Button | Backdrop Click | Esc Key | Drag Gesture | Visual Handle |
|-----------|:--------:|:--------------:|:-------:|:------------:|:-------------:|
| **Dialog** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Sheet** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **BottomSheet** | ✅ | ✅ | ❌* | ✅ | ✅ |
| **MobileDialog** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **MobileDetailSheet** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Popover** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **DropdownMenu** | ❌ | ✅ | ✅ | ❌ | ❌ |

*BottomSheet doesn't explicitly handle Escape (relies on portal overlay behavior)

### 2.2 Escape Key Behavior
**Pattern:** All Radix-based components (Dialog/Sheet/AlertDialog) inherit Escape key handling automatically
**Custom Handling:** 0 components override `onEscapeKeyDown`
**Evidence:** No occurrences of `onEscapeKeyDown` in codebase

### 2.3 Backdrop Click Behavior
**Pattern:** All overlays use Radix's `Overlay` primitive with click-to-close
**Custom Protection:** Only `MobileDialog` protects forms from accidental backdrop close
**Evidence:** `components/ui/mobile/dialog.tsx:120-126`

### 2.4 Drag-to-Dismiss
**Implementation Count:** 1 component only (`BottomSheet`)
**Dismiss Threshold:** 100px downward drag
**Visual Feedback:** `translateY(${currentY}px)` during drag
**Transition:** `cubic-bezier(0.4, 0, 0.2, 1)` 300ms on release
**Evidence:** `components/ui/bottom-sheet.tsx:34-40, 112-114`

---

## 3. Current Height Patterns

### 3.1 Mobile Sheet Heights (Bottom Sheets Only)

| Height Value | Usage Count | Use Cases | Files |
|--------------|-------------|-----------|-------|
| `h-[85vh]` | 5 | Detail views (tasks, contacts, events) | `bottom-sheet.tsx`, `mobile-detail-sheet.tsx`, `mobile-task-detail-sheet.tsx`, `mobile-contact-detail-sheet.tsx`, `mobile-filter-sheet.tsx` |
| `h-[90vh]` | 3 | Form dialogs (create/edit) | `mobile/dialog.tsx`, `mobile-contact-dialog.tsx`, `assign-task-dialog.tsx` |
| `h-[80vh]` | 1 | Contact card variant | `contact-card.tsx:271` |
| `h-full max-h-[calc(100vh-env(safe-area-inset-top))]` | 1 | Full-screen task dialog | `mobile-task-dialog.tsx:55` |

**Finding:** No standardized naming convention (e.g., "tall", "full", "compact")

### 3.2 Min-Height Usage
**Pattern:** Only `BottomSheet` sets minimum height
```typescript
<div className="max-h-[85vh] min-h-[200px]">
```
**Evidence:** `components/ui/bottom-sheet.tsx:108`

**Other min-h usage:**
- `min-h-[80px]` - Textareas (`ui/textarea.tsx`)
- `min-h-[env(safe-area-inset-bottom)]` - Mobile bottom nav (`blocks/mobile-bottom-nav.tsx`)

### 3.3 Desktop Dialog Max-Heights
**Content Scrolling:**
```typescript
<div className="overflow-y-auto max-h-[60vh]">
  {children}
</div>
```
**Evidence:** `components/ui/mobile/dialog.tsx:141`

**Command Palette:**
```typescript
<div className="max-h-[300px] overflow-y-auto">
```
**Evidence:** `components/ui/command.tsx:62`

---

## 4. Visual Indicators & Drag Handles

### 4.1 Current Handle Implementation

**Primary Drag Handle (BottomSheet):**
```typescript
// Container
<div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
     onTouchStart={...} onTouchMove={...} onTouchEnd={...}
     onMouseDown={...} onMouseMove={...} onMouseUp={...}>

  // Visual indicator
  <div className="w-12 h-1 rounded-full bg-white/30" />
</div>
```
**Dimensions:** 48px × 4px
**Color:** 30% opacity white
**Shape:** Fully rounded (rounded-full)
**Cursor:** `cursor-grab` → `active:cursor-grabbing`
**Evidence:** `components/ui/bottom-sheet.tsx:117-127`

**Secondary Handle (Toast):**
```typescript
<div className="w-8 h-1 rounded-full bg-white/30" />
```
**Dimensions:** 32px × 4px (smaller)
**Evidence:** `components/ui/toaster.tsx` (smaller handle for toast notifications)

**Icon-Based Handle (Rearrangeable Nav):**
```typescript
<GripVertical className="h-4 w-4 text-white/40 cursor-grab" />
```
**Type:** Lucide icon (vertical grip lines)
**Evidence:** `components/blocks/rearrangeable-navigation.tsx`

### 4.2 Components WITHOUT Handles
All other sheets/dialogs lack visual drag indicators:
- `Sheet` (standard Radix sheet)
- `MobileDialog` (90vh form sheets)
- `MobileDetailSheet` (85vh detail views)
- All feature-specific mobile sheets (tasks, contacts, schedule)

**Count:** 9 out of 10 mobile sheet implementations lack drag handles

---

## 5. Spacing, Radius, Shadows & Elevation

### 5.1 Border Radius Tokens (from tailwind.config.ts)

**CSS Variables:**
```css
--radius: 0.875rem;  /* 14px */
```

**Tailwind Utilities:**
```typescript
borderRadius: {
  lg: "var(--radius)",           // 14px
  md: "calc(var(--radius) - 2px)", // 12px
  sm: "calc(var(--radius) - 4px)", // 10px
}
```
**Source:** `tailwind.config.ts:66-70`

**Mobile Sheet Usage:**
```typescript
rounded-t-2xl  // 24px top corners, all mobile bottom sheets
```
**Count:** 4 occurrences (consistent across bottom sheets)
**Evidence:** `bottom-sheet.tsx:106`, `mobile/dialog.tsx:63`, `mobile/detail-sheet.tsx:70`, `mobile-task-detail-sheet.tsx:87`

### 5.2 Spacing Tokens (Tailwind Default)

**Base Unit:** 4px (`spacing: 1`)

**Common Modal Spacing:**
- `p-6` (24px) - Dialog/Sheet content padding
- `p-4` (16px) - Mobile sheet content padding
- `gap-4` (16px) - Standard gap between elements
- `space-y-2` (8px) - Vertical spacing in sections
- `space-y-4` (16px) - Vertical spacing between sections
- `pb-24` (96px) - Bottom padding to clear fixed action buttons

**Evidence:** Consistent across `dialog.tsx:40`, `sheet.tsx:34`, `mobile-detail-sheet.tsx:117`

### 5.3 Shadows & Elevation

**Modal Shadows:**
```typescript
// Dialog/Sheet shadows
shadow-lg  // Standard modal elevation
```
**Evidence:** `dialog.tsx:40`, `sheet.tsx:34`

**Glass Morphism Class:**
```css
.glass {
  background: rgba(20, 22, 27, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 14px;
}
```
**Source:** `app/globals.css:66-73`

**Custom Shadow (Tailwind Config):**
```typescript
boxShadow: {
  glass: '0 8px 32px rgba(0,0,0,0.25)',
}
```
**Source:** `tailwind.config.ts:88-90`

**Usage:** `BottomSheet` uses `.glass` class for background
**Evidence:** `components/ui/bottom-sheet.tsx:105`

### 5.4 Backdrop Opacity Patterns

**Modal Backdrops:**
```typescript
bg-black/80  // Dialog/Sheet (80% opacity)
bg-black/50  // BottomSheet (50% opacity + blur)
```

**Backdrop Blur:**
```typescript
backdrop-blur-sm  // BottomSheet, mobile task dialog
```

**Finding:** Inconsistent backdrop opacity (50% vs 80%)

---

## 6. Token Usage vs. Design System

### 6.1 Design System Tokens (from docs/07-design-system.md)

**Defined Color Tokens:**
```typescript
colors: {
  graphite: {
    900: '#0f1115',
    800: '#14161b',
    700: '#1b1e24',
    600: '#232730',
    // ...
  },
  accent: {
    DEFAULT: '#8EE3C8',
    500: '#8EE3C8',
  }
}
```
**Source:** `tailwind.config.ts:54-64`, `docs/07-design-system.md:16-39`

**CSS Variables (Dark Mode):**
```css
:root.dark {
  --background: 220 15% 7%;        /* graphite-900 */
  --foreground: 210 40% 98%;        /* white/98 */
  --card: 220 15% 9%;               /* graphite-800 */
  --popover: 220 15% 9%;
  --primary: 165 70% 75%;           /* accent */
  --muted: 220 15% 15%;
  --accent: 165 70% 75%;
  --border: 220 15% 15%;
  --input: 220 15% 15%;
  --ring: 165 70% 75%;
}
```
**Source:** `app/globals.css:30-50`

### 6.2 Actual Usage in Components

**Modal Backgrounds:**
```typescript
// Using design tokens
bg-background      // Dialog (uses CSS variable)
bg-graphite-900    // Mobile sheets (direct color)
bg-graphite-800    // Cards
```

**Hard-Coded Values Found:**
```typescript
// Hard-coded rgba values (NOT using tokens)
background: rgba(20, 22, 27, 0.55);  // .glass class
border: 1px solid rgba(255, 255, 255, 0.08);
bg-white/30  // Drag handle
bg-white/60  // Text muted
bg-black/50  // Backdrop
```

**Finding:** Mix of design tokens and hard-coded rgba values

### 6.3 Deviations from Design System

**Issue 1: Inconsistent Height Values**
- Design system defines spacing tokens but NO height presets
- Components use arbitrary `h-[85vh]`, `h-[90vh]` with no documented standard

**Issue 2: Hard-Coded Opacity**
- `.glass` class uses `rgba(20, 22, 27, 0.55)` instead of `bg-graphite-800/55`
- Drag handle uses `bg-white/30` (good, uses Tailwind opacity)
- Border uses `rgba(255, 255, 255, 0.08)` instead of `border-white/[0.08]`

**Issue 3: No Elevation Scale**
- Design system mentions `glass-card` but no documented elevation levels (e.g., elevation-1 through elevation-5)
- Only `shadow-lg` and `shadow-glass` are defined

---

## 7. Page-Specific Overlay Variants

### 7.1 Tasks Page Overlays
**File:** `app/admin/tasks/page.tsx`

**Modals Used:**
1. **FilterBottomSheet** - Uses `BottomSheet` ✅ (has drag)
2. **MobileTaskDetailSheet** - Uses `Sheet` ❌ (no drag, h-[85vh])
3. **MobileTaskDialog** - Custom full-screen dialog ❌ (no drag, calc(100vh-env(...)))

**Fixed Bottom Bar:**
```typescript
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 px-4 py-2">
```
**Evidence:** `app/admin/tasks/page.tsx:913`

### 7.2 Schedule Page Overlays
**File:** `app/admin/schedule/page.tsx`

**Modals Used:**
1. **EventDetailSheet** - Uses `MobileDetailSheet` ❌ (no drag, h-[85vh])
2. **EventDialog** - Desktop `Dialog` for create/edit

**FAB Button:**
```typescript
<Button className="fixed bottom-3 right-3 md:hidden h-14 w-14 rounded-full">
  <Plus />
</Button>
```
**Evidence:** `app/admin/schedule/page.tsx:841`

### 7.3 Contacts Page Overlays
**File:** `app/admin/contacts/page.tsx`

**Modals Used:**
1. **MobileContactDetailSheet** - Uses `Sheet` ❌ (no drag, h-[85vh])
2. **MobileFilterSheet** - Uses `Sheet` ❌ (no drag, h-[85vh])
3. **MobileContactDialog** - Uses responsive Sheet/Dialog ❌ (no drag, h-[90vh])

**Fixed Bottom Bar:**
```typescript
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-graphite-900/95 backdrop-blur-md border-t">
```
**Evidence:** `app/admin/contacts/page.tsx:786`

### 7.4 Dashboard Quick Actions
**File:** `components/dashboard/QuickActionsSheet.tsx`

**Modal Used:**
- **QuickActionsSheet** - Uses `Sheet` ❌ (no drag, side="bottom" on mobile)

**Evidence:** `components/dashboard/QuickActionsSheet.tsx:1-118`

---

## 8. Accessibility Patterns

### 8.1 ARIA Attributes

**Dialog/Sheet Titles (Radix Automatic):**
- All Dialog components use `<DialogTitle>` which auto-generates `aria-labelledby`
- All Sheet components use `<SheetTitle>` which auto-generates `aria-labelledby`
- **Evidence:** Radix primitive behavior, not manually set

**Screen Reader Support:**
```typescript
<span className="sr-only">Close</span>
```
**Count:** 10 occurrences across Dialog, Sheet, and mobile wrappers
**Evidence:** `ui/dialog.tsx:57`, `ui/sheet.tsx:70`, `mobile-task-detail-sheet.tsx:92`

**Hidden Accessible Titles:**
```typescript
<SheetHeader className="sr-only">
  <SheetTitle>{task.title}</SheetTitle>
</SheetHeader>
```
**Purpose:** Provide accessible title while showing custom visual header
**Evidence:** `mobile-task-detail-sheet.tsx:90-92`

### 8.2 Focus Management

**Custom Auto-Focus (Dialog):**
```typescript
onOpenAutoFocus={(event) => {
  event.preventDefault();
  // Focus the first focusable element manually
  const focusableElement = (event.currentTarget as HTMLElement)?.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as HTMLElement;
  focusableElement?.focus();
}}
```
**Purpose:** Prevent aria-hidden warnings from Radix auto-focus
**Evidence:** `components/ui/dialog.tsx:43-51`

**Focus Indicators:**
```typescript
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```
**Count:** 7 files with consistent focus ring pattern
**Evidence:** `ui/dialog.tsx:55`, `ui/sheet.tsx:68`, `ui/select.tsx`, `ui/toast.tsx`

### 8.3 Focus Trap
**Pattern:** All Radix Dialog/Sheet components have built-in focus trap
**Custom Implementation:** None (relying on Radix defaults)
**Evidence:** No manual `useFocusTrap` or `FocusTrap` component usage found

---

## 9. Common Inconsistencies Observed

### 9.1 Height Standards
**Problem:** 4 different height values for similar use cases
- Detail sheets: Mix of `h-[80vh]`, `h-[85vh]`
- Form dialogs: Mix of `h-[90vh]`, `h-full max-h-[calc(...)]`

**Affected Files:**
- `bottom-sheet.tsx` → `max-h-[85vh]`
- `mobile/detail-sheet.tsx` → `h-[85vh]`
- `mobile/dialog.tsx` → `h-[90vh]`
- `mobile-task-dialog.tsx` → `h-full max-h-[calc(100vh-env(safe-area-inset-top))]`

### 9.2 Safe Area Handling
**Problem:** 3 different approaches
1. Explicit calc: `pb-[calc(1rem+env(safe-area-inset-bottom))]`
2. Tailwind utility: `pb-safe`
3. No safe area handling (most components)

**Affected Files:**
- `mobile-task-dialog.tsx:55,88` → Uses calc
- `mobile/dialog.tsx:102` → Uses `pb-safe`
- Most other sheets → No safe area handling

### 9.3 Drag Support
**Problem:** Only 1 out of 10+ mobile sheet components has drag-to-dismiss
- `BottomSheet` → ✅ Has drag
- All other Sheet/MobileDialog components → ❌ No drag

**Impact:** Inconsistent mobile UX - users expect drag-to-dismiss on all bottom sheets

### 9.4 Backdrop Styling
**Problem:** Two different backdrop patterns
- Dialog/Sheet → `bg-black/80`
- BottomSheet → `bg-black/50 backdrop-blur-sm`

**Finding:** BottomSheet uses lighter backdrop + blur for better aesthetics

### 9.5 Border Radius
**Problem:** Inconsistent top corner rounding
- Mobile sheets → `rounded-t-2xl` (24px) ✅ Consistent
- Desktop dialogs → `sm:rounded-lg` (12px)
- Dropdowns/Popovers → `rounded-md` (12px)

**Finding:** Mobile sheets ARE consistent (all use `rounded-t-2xl`)

---

## 10. Summary of Current State

### Strengths ✅
1. **Consistent z-index layering** - All modals use `z-50`
2. **Good accessibility foundation** - sr-only labels, custom focus management, Radix primitives
3. **Responsive patterns established** - `useMediaQuery` switches between Dialog/Sheet
4. **Glass morphism consistency** - `.glass` class and backdrop-blur patterns
5. **Mobile sheet border radius** - All use `rounded-t-2xl`

### Weaknesses ⚠️
1. **Height standardization lacking** - 4 different values for similar use cases
2. **Drag functionality rare** - Only 1 component has drag-to-dismiss (9 missing)
3. **Safe area handling inconsistent** - 3 different approaches, many components ignore it
4. **Hard-coded colors** - `.glass` class uses rgba instead of Tailwind tokens
5. **No visual indicators** - 9 out of 10 mobile sheets lack drag handles

### Architecture Patterns 🏗️
- **3-tier component hierarchy:** Base primitives → Mobile wrappers → Feature-specific
- **Radix UI foundation:** All overlays built on Radix Dialog/Popover primitives
- **Responsive switching:** `useMediaQuery('(max-width: 768px)')` pattern established
- **Flex + overflow pattern:** `flex flex-col overflow-hidden` → `flex-1 overflow-y-auto`

---

## 11. Recommendations for Standardization

Based on current patterns, the following standards are recommended:

### Height Standards
```typescript
const SHEET_HEIGHTS = {
  detail: 'h-[85vh]',      // Detail/view sheets (most common)
  form: 'h-[90vh]',        // Form dialogs
  fullscreen: 'h-full max-h-[calc(100vh-env(safe-area-inset-top))]'
}
```

### Drag Handle Standard
```typescript
<div className="w-12 h-1 rounded-full bg-white/30" />
```

### Safe Area Standard
```typescript
<footer className="pb-safe">  // Use Tailwind utility
```

### Backdrop Standard
```typescript
<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
```

---

## END OF UI BASELINE

**Generated:** 2025-10-01
**Files Analyzed:** 89
**Lines Scanned:** ~8,500+
**Next Step:** See `MOBILE_SHEET_AUDIT.md` for component-by-component breakdown
