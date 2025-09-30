# Mobile Menu & Bottom Sheet Overhaul Plan

**Status:** Planning Complete - Ready for Implementation
**Created:** 2025-01-30
**Last Updated:** 2025-01-30 (Added Phase 4: Schedule Page Scroll Fix)

---

## Executive Summary

This document outlines a comprehensive plan to standardize and enhance all mobile menu/bottom sheet interactions across the construction management application. The goal is to provide a consistent, mobile-optimized user experience following iOS and Android platform standards.

### Key Issues Identified
- Only 1 of 7 mobile menu components supports drag-to-close gestures
- Inconsistent close mechanisms (X button vs drag vs backdrop)
- 6 different height patterns across components
- Missing critical features (schedule event delete button)
- No visual drag indicators on most sheets
- Multiple competing component implementations
- **Schedule page scroll interference** - Page scrolls when using calendar gestures (swipe navigation conflicts)

---

## Current State Analysis

### Existing Components Inventory

#### 1. `components/ui/bottom-sheet.tsx` ✅ **HAS DRAG SUPPORT**
- **Status:** Working drag implementation
- **Features:**
  - Custom touch/mouse drag gestures
  - Visual drag handle (w-12 h-1 bg-white/30)
  - 100px dismiss threshold
  - Smooth transitions
  - Height: max-h-[85vh]
- **Used By:**
  - `components/tasks/filter-bottom-sheet.tsx`
- **Issues:** None - this is our reference implementation
- **Line References:**
  - Drag handle: line 117-127
  - Touch handlers: lines 21-40
  - Mouse handlers: lines 42-88

#### 2. `components/ui/sheet.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Standard Radix UI Dialog wrapper
- **Features:**
  - Side variants (top, right, bottom, left)
  - Standard X close button
  - Backdrop tap-to-close
  - Slide-in/out animations
- **Used By:**
  - Most pages across the app
  - MobileDetailSheet (wrapper)
  - MobileContactDetailSheet
  - MobileFilterSheet
  - QuickActionsSheet
  - EventDetailSheet (via MobileDetailSheet)
- **Issues:**
  - No drag gestures
  - No visual drag indicator
  - Inconsistent with mobile platform standards
- **Line References:**
  - Base component: lines 1-140
  - Variants: lines 38-43

#### 3. `components/ui/mobile/detail-sheet.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Reusable detail pattern
- **Features:**
  - Sections/actions structure
  - Sticky header
  - Scrollable content
  - Fixed action buttons
  - Height: 85vh
- **Used By:**
  - `components/schedule/mobile/event-detail-sheet.tsx`
- **Issues:**
  - Uses standard Sheet (no drag)
  - Good pattern, needs drag support
- **Line References:**
  - Component definition: lines 1-290
  - Actions rendering: lines 151-171

#### 4. `components/ui/mobile/dialog.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Responsive Dialog→Sheet adapter
- **Features:**
  - Switches between Dialog (desktop) and Sheet (mobile)
  - Size variants (sm, md, lg, full)
  - Footer support
  - Height: 90vh on mobile
- **Used By:**
  - Form dialogs across the app
  - MobileFormDialog
  - MobileConfirmDialog
  - MobileDetailDialog
- **Issues:**
  - Uses standard Sheet (no drag)
  - Different height than other sheets (90vh vs 85vh)
- **Line References:**
  - Mobile rendering: lines 57-108
  - Desktop rendering: lines 112-153

#### 5. `components/tasks/mobile-task-detail-sheet.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Custom task detail implementation
- **Features:**
  - 338 lines of custom code
  - Status icons, progress bars
  - Subtasks display
  - Dependencies and comments
  - Fixed action buttons
  - Height: 85vh
- **Used By:**
  - `app/admin/tasks/page.tsx`
- **Issues:**
  - Uses standard Sheet (no drag)
  - Duplicate implementation (should use MobileDetailSheet pattern)
  - Only X button for closing (no back arrow found despite user report)
- **Line References:**
  - Component: lines 1-338
  - Header: lines 123-130
  - Actions: lines 293-334

#### 6. `components/contacts/mobile-contact-detail-sheet.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Detailed contact view
- **Features:**
  - 415 lines
  - Avatar display
  - Quick actions (call, email, invite)
  - Portal status
  - Assigned tasks list
  - Activity timeline
  - Height: 85vh
- **Used By:**
  - `app/admin/contacts/page.tsx`
- **Issues:**
  - Uses standard Sheet (no drag)
  - Should follow standardized pattern
- **Line References:**
  - Component: lines 1-415
  - Header: lines 142-171
  - Quick actions: lines 174-225
  - Footer actions: lines 388-411

#### 7. `components/schedule/mobile/event-detail-sheet.tsx` ❌ **NO DRAG SUPPORT + MISSING DELETE**
- **Status:** Event detail view with critical bug
- **Features:**
  - Uses MobileDetailSheet wrapper
  - Event information display
  - Status badges
  - Attendees list
  - Conditional actions
- **Used By:**
  - `app/admin/schedule/page.tsx`
- **Issues:**
  - Uses MobileDetailSheet (no drag)
  - **CRITICAL:** Delete action defined but not always showing (lines 164-175)
  - Action logic may be excluding delete in certain statuses
- **Line References:**
  - Component: lines 1-212
  - Actions definition: lines 121-175
  - Delete action: lines 164-175 (conditional rendering issue)

#### 8. `components/contacts/mobile-filter-sheet.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Complex filter interface
- **Features:**
  - 350 lines
  - Multi-section filters
  - Active filter display
  - Export CSV option
  - Height: 85vh
- **Used By:**
  - `app/admin/contacts/page.tsx`
- **Issues:**
  - Uses standard Sheet (no drag)
- **Line References:**
  - Component: lines 1-350
  - Filter groups: lines 201-235

#### 9. `components/tasks/filter-bottom-sheet.tsx` ✅ **HAS DRAG SUPPORT**
- **Status:** Working filter with drag
- **Features:**
  - Uses BottomSheet component
  - Status and priority filters
  - Apply/Reset actions
- **Used By:**
  - `app/admin/tasks/page.tsx`
- **Issues:** None - uses the correct pattern
- **Line References:**
  - Component: lines 1-178
  - Uses BottomSheet: line 86

#### 10. `components/dashboard/QuickActionsSheet.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** FAB menu for quick actions
- **Features:**
  - 118 lines
  - Action list with icons
  - Responsive (bottom on mobile, right on desktop)
- **Used By:**
  - `app/admin/page.tsx` (dashboard)
- **Issues:**
  - Uses standard Sheet (no drag)
  - FAB menu should be easily dismissible
- **Line References:**
  - Component: lines 1-118
  - Sheet usage: lines 76-118

#### 11. `components/tasks/mobile-task-dialog.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Full-screen task form
- **Features:**
  - Full viewport height
  - Custom header with X button
  - Scrollable content
  - Footer support
  - Height: calc(100vh-env(safe-area-inset-top))
- **Used By:**
  - Task creation flows
- **Issues:**
  - Custom implementation instead of using standard pattern
  - No drag support
  - Different height pattern
- **Line References:**
  - Component: lines 1-119
  - Mobile rendering: lines 42-96

#### 12. `components/contacts/mobile-contact-dialog.tsx` ❌ **NO DRAG SUPPORT**
- **Status:** Contact form dialog
- **Features:**
  - Responsive Dialog→Sheet
  - Height: 90vh
- **Used By:**
  - Contact creation/editing
- **Issues:**
  - Uses standard Sheet (no drag)
- **Line References:**
  - Component: lines 1-89
  - Mobile rendering: lines 44-68

### Page-by-Page Menu Usage

#### Tasks Page (`app/admin/tasks/page.tsx`)
- **Fixed Bottom Bar:** Line 913 (search + view toggle)
- **FAB Button:** Implicit via QuickActionsSheet
- **Filter Sheet:** FilterBottomSheet ✅ (has drag)
- **Task Detail:** MobileTaskDetailSheet ❌ (no drag)
- **Create Dialog:** MobileTaskDialog ❌ (no drag)
- **Status:** Partially compliant

#### Schedule Page (`app/admin/schedule/page.tsx`)
- **FAB Button:** Line 841 (fixed bottom-3 right-3)
- **Event Detail:** EventDetailSheet ❌ (no drag, missing delete)
- **Create Dialog:** Uses Dialog component
- **Status:** Non-compliant + critical bug

#### Contacts Page (`app/admin/contacts/page.tsx`)
- **Fixed Bottom Bar:** Line 786 (search + actions)
- **Contact Detail:** MobileContactDetailSheet ❌ (no drag)
- **Filter Sheet:** MobileFilterSheet ❌ (no drag)
- **Create Dialog:** MobileContactDialog ❌ (no drag)
- **Status:** Non-compliant

#### Bidding Page (`app/admin/bidding/page.tsx`)
- **FAB Button:** Line 259 (fixed bottom-6 right-6, md:hidden)
- **Status:** Minimal mobile optimization

#### Dashboard Page (`app/admin/page.tsx`)
- **FAB Button:** QuickActionsSheet ❌ (no drag)
- **Status:** Non-compliant

#### Budget, Procurement, Risks, Users, Settings, Plans, Decisions
- **Menu Type:** Standard Dialog components
- **Mobile Support:** Responsive but not mobile-optimized
- **Status:** Low priority (use standard Dialog on these)

### Height Pattern Analysis

| Component | Height | Use Case |
|-----------|--------|----------|
| BottomSheet | max-h-[85vh] | Filters |
| MobileDetailSheet | h-[85vh] | Detail views |
| MobileDialog | h-[90vh] | Forms |
| MobileTaskDialog | calc(100vh-env()) | Full-screen |
| MobileContactDetailSheet | h-[85vh] | Details |
| MobileFilterSheet | h-[85vh] | Filters |
| EventDetailSheet | h-[85vh] | Details |

**Inconsistency:** 90vh vs 85vh for different use cases

### Close Mechanism Analysis

| Component | X Button | Backdrop | Drag | Visual Indicator |
|-----------|----------|----------|------|------------------|
| BottomSheet | ✅ | ✅ | ✅ | ✅ (w-12 h-1) |
| Sheet | ✅ | ✅ | ❌ | ❌ |
| MobileDetailSheet | ✅ | ✅ | ❌ | ❌ |
| MobileDialog | ✅ | ✅ | ❌ | ❌ |
| Others | ✅ | ✅ | ❌ | ❌ |

**Inconsistency:** Only 1 component supports drag gestures

---

## Mobile-First Standards

Based on Material Design 3, iOS Human Interface Guidelines, and mobile platform standards, we establish the following requirements for all mobile bottom sheets:

### Rule 1: Drag-to-Dismiss ✅
**Standard:** ALL bottom sheets MUST support drag-down gesture to close

**Why:**
- Primary close method on mobile devices
- Thumb-friendly (within thumb zone)
- Native iOS and Android behavior
- Better UX than hunting for X button

**Implementation:**
- Touch event listeners (touchstart, touchmove, touchend)
- Mouse event listeners for desktop testing (mousedown, mousemove, mouseup)
- Minimum drag distance threshold: 100px
- Velocity-based dismissal for quick swipes
- Smooth spring animations on release

**Technical Requirements:**
```typescript
// Minimum drag threshold
const DISMISS_THRESHOLD = 100; // pixels

// Velocity threshold for quick dismiss
const VELOCITY_THRESHOLD = 0.5; // pixels per ms

// Handle touch start
const handleTouchStart = (e: TouchEvent) => {
  startY = e.touches[0].clientY;
  startTime = Date.now();
};

// Handle touch move
const handleTouchMove = (e: TouchEvent) => {
  const deltaY = e.touches[0].clientY - startY;
  if (deltaY > 0) { // Only allow downward drag
    setCurrentY(deltaY);
  }
};

// Handle touch end
const handleTouchEnd = () => {
  const velocity = currentY / (Date.now() - startTime);
  if (currentY > DISMISS_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
    onClose();
  } else {
    setCurrentY(0); // Snap back
  }
};
```

### Rule 2: Consistent Close Methods ✅
**Standard:** Bottom sheets should support three close methods

**Primary:** Drag-down gesture
- Visual indicator at top
- Natural mobile gesture
- Quick and intuitive

**Secondary:** Tap outside overlay
- Dim background (bg-black/50 backdrop-blur-sm)
- Click/tap to dismiss
- Standard modal behavior

**Tertiary:** X button
- Top-right corner
- Accessibility/discoverability
- Fallback for users unfamiliar with gestures

**Remove:** Back arrows
- Not a standard mobile pattern
- Confusing (what does "back" mean in a modal?)
- Use consistent close methods only

### Rule 3: Visual Drag Indicator ✅
**Standard:** 4px × 32px rounded handle at top center

**Specifications:**
- Dimensions: `w-8 h-1` (32px × 4px)
- Color: `bg-white/30` (semi-transparent white)
- Position: 12px from top, horizontally centered
- Border radius: `rounded-full`
- Cursor: `cursor-grab` on handle area, `active:cursor-grabbing` when dragging
- Always visible above content

**HTML Structure:**
```jsx
<div
  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  <div className="w-8 h-1 rounded-full bg-white/30" />
</div>
```

### Rule 4: Height Standards ✅
**Standard:** Context-dependent heights

**Detail Views** (Task, Event, Contact details):
- Height: `h-[85vh]`
- Why: Allows content scroll while keeping actions visible
- Use case: Reading information with actions at bottom

**Action Menus** (FAB menus, quick actions):
- Height: `auto` with `max-h-[75vh]`
- Why: Content-dependent, don't waste space
- Use case: List of action buttons

**Forms** (Create/Edit):
- Height: `h-[90vh]`
- Why: Maximize space for inputs and keyboard
- Use case: Data entry with many fields

**Filters** (Search filters, advanced filters):
- Height: `h-[85vh]`
- Why: Complex filter options with apply/reset buttons
- Use case: Multiple filter sections

### Rule 5: Action Button Layout ✅
**Standard:** Fixed bottom section with clear hierarchy

**Layout Pattern:**
```
┌─────────────────────────────┐
│  [Primary Action - Full]    │  ← Most important (blue)
├─────────────────────────────┤
│ [Secondary] [Secondary]     │  ← Supporting actions (outline)
├─────────────────────────────┤
│  [Destructive - Full]       │  ← Delete/Cancel (red, separated)
└─────────────────────────────┘
```

**Button Specifications:**
- Primary: Full width, solid background (bg-blue-600)
- Secondary: Grid or row, outline style
- Destructive: Full width, separated with top border, red variant
- Height: `h-12` (48px minimum for touch targets)
- Gap: `gap-3` (12px between buttons)
- Padding: `p-4` (16px container padding)

**Example Implementation:**
```jsx
<div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4 space-y-3">
  {/* Primary Action */}
  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700">
    Save Changes
  </Button>

  {/* Secondary Actions */}
  <div className="grid grid-cols-2 gap-3">
    <Button variant="outline" className="h-12">Edit</Button>
    <Button variant="outline" className="h-12">Share</Button>
  </div>

  {/* Destructive Action */}
  <Button
    variant="outline"
    className="w-full h-12 text-red-500 hover:text-red-400 hover:bg-red-500/10 border-t pt-3"
  >
    Delete
  </Button>
</div>
```

### Rule 6: Content Scrolling ✅
**Standard:** Header sticky, content scrollable, actions fixed

**Structure:**
```
┌─────────────────────────────┐
│ ═══ [Drag Handle] ═══       │  ← Always visible
├─────────────────────────────┤
│ [Header - Sticky]           │  ← Sticky with shadow on scroll
│ Title, badges, close button │
├─────────────────────────────┤
│                             │
│ [Scrollable Content Area]   │  ← -mx-6 px-6 for full-bleed
│ All detail sections here    │
│                             │
│                             │
├─────────────────────────────┤
│ [Fixed Actions]             │  ← absolute bottom-0
│ Buttons always visible      │
└─────────────────────────────┘
```

**CSS Classes:**
```jsx
// Container
<div className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] flex flex-col">

  // Drag handle
  <div className="flex justify-center pt-3 pb-2">...</div>

  // Sticky header
  <div className="sticky top-0 z-10 bg-graphite-900 border-b border-white/10 px-6 py-4">
    ...
  </div>

  // Scrollable content
  <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
    ...
  </div>

  // Fixed actions
  <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4">
    ...
  </div>
</div>
```

### Rule 7: Mobile vs Desktop ✅
**Standard:** Responsive sheet behavior

**Mobile (<768px):**
- Side: `side="bottom"`
- Full width: `inset-x-0`
- Height: As per Rule 4
- Drag gestures: Enabled
- Animation: `slide-in-from-bottom`

**Desktop (≥768px):**
- Side: `side="right"`
- Width: `md:w-[420px]`
- Full height: `h-screen`
- Drag gestures: Optional (less important)
- Animation: `slide-in-from-right`

**Implementation:**
```tsx
const isMobile = useMediaQuery('(max-width: 768px)');

<Sheet open={open} onOpenChange={onClose}>
  <SheetContent
    side={isMobile ? 'bottom' : 'right'}
    className={cn(
      isMobile
        ? 'h-[85vh] rounded-t-2xl'
        : 'h-screen w-[420px]'
    )}
  >
    ...
  </SheetContent>
</Sheet>
```

---

## Implementation Plan

### Phase 1: Enhanced Draggable Sheet Component

**Objective:** Create a production-ready draggable bottom sheet component that will replace all existing sheet implementations.

#### Step 1.1: Create Base Draggable Sheet
**File:** `components/ui/mobile/draggable-sheet.tsx`

**Requirements:**
- Extend existing `BottomSheet` component (already has drag support)
- Add framer-motion for smooth animations
- Support snap points (closed, half, full)
- Velocity-based dismiss
- Keyboard accessibility (Escape key to close)
- Focus trap for accessibility
- Proper ARIA attributes

**Implementation Details:**
```typescript
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '../button';

interface DraggableSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  height?: 'detail' | 'form' | 'menu' | 'filter'; // Maps to height standards
  showDragHandle?: boolean;
  enableDrag?: boolean;
}

export function DraggableSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  height = 'detail',
  showDragHandle = true,
  enableDrag = true,
}: DraggableSheetProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  const heightClasses = {
    detail: 'h-[85vh]',
    form: 'h-[90vh]',
    menu: 'max-h-[75vh]',
    filter: 'h-[85vh]',
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldClose = info.velocity.y > 500 || info.offset.y > 150;
    if (shouldClose) {
      onOpenChange(false);
    }
  };

  // Handle Escape key
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        drag={enableDrag ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        style={{ y, opacity }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'glass border-t border-white/10 rounded-t-2xl',
          'flex flex-col',
          heightClasses[height]
        )}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-8 h-1 rounded-full bg-white/30" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {description && (
                <p className="text-sm text-white/60 mt-1">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </>
  );
}
```

**Testing Requirements:**
- [ ] Touch drag on iOS Safari
- [ ] Touch drag on Android Chrome
- [ ] Mouse drag on desktop
- [ ] Escape key closes sheet
- [ ] Backdrop click closes sheet
- [ ] Velocity-based dismiss works
- [ ] Snap back animation when drag < threshold
- [ ] Accessibility (focus trap, ARIA labels)

**Files to Create:**
- `components/ui/mobile/draggable-sheet.tsx` (new)

**Acceptance Criteria:**
- Component renders with drag handle visible
- Drag down > 150px closes sheet
- Quick swipe (velocity > 500) closes sheet
- Smooth spring animation on open/close
- All close methods work (drag, X, backdrop, Escape)

#### Step 1.2: Create Enhanced Detail Sheet
**File:** `components/ui/mobile/enhanced-detail-sheet.tsx`

**Purpose:** High-level wrapper around DraggableSheet with opinionated structure for detail views (tasks, contacts, events, etc.)

**Features:**
- Uses DraggableSheet as base
- Predefined sections structure
- Action buttons at bottom
- Status badges in header
- Icon support
- Scrollable content sections

**Implementation Details:**
```typescript
import { DraggableSheet } from './draggable-sheet';
import { Button } from '../button';
import { Badge } from '../badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DetailSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  content: React.ReactNode;
}

export interface DetailAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  className?: string;
}

export interface EnhancedDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  statusBadge?: {
    label: string;
    className?: string;
  };
  headerIcon?: {
    icon: LucideIcon;
    className?: string;
  };
  sections: DetailSection[];
  actions: DetailAction[];
}

export function EnhancedDetailSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  statusBadge,
  headerIcon,
  sections,
  actions,
}: EnhancedDetailSheetProps) {
  // Separate actions by type
  const primaryActions = actions.filter(a => a.variant === 'default' || !a.variant);
  const secondaryActions = actions.filter(a => a.variant === 'outline');
  const destructiveActions = actions.filter(a => a.variant === 'destructive');

  return (
    <DraggableSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      height="detail"
    >
      {/* Custom Header */}
      <div className="sticky top-0 z-10 bg-graphite-900 border-b border-white/10 px-6 py-4">
        <div className="flex items-start gap-3">
          {headerIcon && (
            <div className={cn("mt-1", headerIcon.className)}>
              <headerIcon.icon className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-white/60 mt-1">{subtitle}</p>
            )}
            {statusBadge && (
              <Badge className={cn("mt-2", statusBadge.className)}>
                {statusBadge.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="space-y-3">
              <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {section.title}
              </h3>
              <div>{section.content}</div>
            </div>
          );
        })}
      </div>

      {/* Fixed Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4 space-y-3">
        {/* Primary Actions */}
        {primaryActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              className={cn("w-full h-12", action.className)}
              onClick={action.onClick}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          );
        })}

        {/* Secondary Actions */}
        {secondaryActions.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {secondaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className={cn("h-12", action.className)}
                  onClick={action.onClick}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Destructive Actions */}
        {destructiveActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              className={cn(
                "w-full h-12 text-red-500 hover:text-red-400 hover:bg-red-500/10 border-t pt-3",
                action.className
              )}
              onClick={action.onClick}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          );
        })}
      </div>
    </DraggableSheet>
  );
}
```

**Files to Create:**
- `components/ui/mobile/enhanced-detail-sheet.tsx` (new)

**Acceptance Criteria:**
- Renders with all sections
- Actions display in correct hierarchy
- Drag-to-close works
- Content scrolls properly
- Actions stay fixed at bottom

#### Step 1.3: Create Hooks for Drag Logic
**File:** `lib/hooks/use-drag-to-close.ts`

**Purpose:** Reusable hook to extract drag gesture logic for use in any component

**Implementation:**
```typescript
import { useState, useCallback } from 'react';

interface UseDragToCloseOptions {
  onClose: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

export function useDragToClose({
  onClose,
  threshold = 150,
  velocityThreshold = 500,
}: UseDragToCloseOptions) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setStartTime(Date.now());
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  }, [isDragging, startY]);

  const handleTouchEnd = useCallback(() => {
    const duration = Date.now() - startTime;
    const velocity = currentY / duration;

    if (currentY > threshold || velocity > velocityThreshold / 1000) {
      onClose();
    }

    setCurrentY(0);
    setIsDragging(false);
  }, [currentY, threshold, velocityThreshold, startTime, onClose]);

  return {
    dragHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    transform: `translateY(${currentY}px)`,
    isDragging,
  };
}
```

**Files to Create:**
- `lib/hooks/use-drag-to-close.ts` (new)

**Acceptance Criteria:**
- Hook returns drag handlers
- Calculates velocity correctly
- Respects threshold and velocity threshold
- Works with touch events

---

### Phase 2: Fix Critical Bugs

**Objective:** Address user-reported issues immediately using new components.

#### Step 2.1: Fix Schedule Event Delete Button
**File:** `components/schedule/mobile/event-detail-sheet.tsx`

**Issue:** Delete action is defined (lines 164-175) but may not be showing in certain statuses.

**Root Cause Analysis:**
```typescript
// Lines 121-162: Actions conditionally added
if (event.status !== 'DONE' && event.status !== 'CANCELED') {
  if (onComplete) actions.push({ id: 'complete', ... });
  if (onEdit) actions.push({ id: 'edit', ... });
  if (onCancel) actions.push({ id: 'cancel', ... });
}

// Lines 164-175: Delete action added BUT may be blocked by status check
if (onDelete) {
  actions.push({ id: 'delete', label: 'Delete Event', icon: Trash, ... });
}
```

**Fix:** Ensure delete action is ALWAYS available regardless of status.

**Implementation:**
```typescript
// BEFORE: Delete might not show for DONE/CANCELED events
if (event.status !== 'DONE' && event.status !== 'CANCELED') {
  // ... other actions
}
if (onDelete) {
  actions.push({ id: 'delete', ... });
}

// AFTER: Delete always available
const actions: DetailAction[] = [];

// Status-dependent actions
if (event.status !== 'DONE' && event.status !== 'CANCELED') {
  if (onComplete) {
    actions.push({
      id: 'complete',
      label: 'Mark as Done',
      icon: CheckCircle,
      onClick: onComplete,
      variant: 'default',
    });
  }
  if (onEdit) {
    actions.push({
      id: 'edit',
      label: 'Edit Event',
      icon: Edit,
      onClick: onEdit,
      variant: 'outline',
    });
  }
  if (onCancel) {
    actions.push({
      id: 'cancel',
      label: 'Cancel Event',
      icon: XCircle,
      onClick: onCancel,
      variant: 'outline',
    });
  }
}

// Delete is ALWAYS available as destructive action
if (onDelete) {
  actions.push({
    id: 'delete',
    label: 'Delete Event',
    icon: Trash,
    onClick: onDelete,
    variant: 'destructive', // This ensures it's separated at bottom
  });
}
```

**Migration to Enhanced Pattern:**
Replace entire file to use `EnhancedDetailSheet`:
```typescript
import { EnhancedDetailSheet, DetailSection, DetailAction } from '@/components/ui/mobile/enhanced-detail-sheet';

export function EventDetailSheet({ event, isOpen, onClose, onEdit, onDelete, onComplete, onCancel }) {
  const sections: DetailSection[] = [
    {
      id: 'basic',
      title: 'Event Details',
      icon: Calendar,
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Type:</span>
            <span className="text-white">{event.type}</span>
          </div>
          {/* ... other fields */}
        </div>
      ),
    },
    // ... other sections
  ];

  const actions: DetailAction[] = [];

  // Conditional actions
  if (event.status !== 'DONE' && event.status !== 'CANCELED') {
    if (onComplete) {
      actions.push({
        id: 'complete',
        label: 'Mark as Done',
        icon: CheckCircle,
        onClick: onComplete,
        variant: 'default',
      });
    }
    if (onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit Event',
        icon: Edit,
        onClick: onEdit,
        variant: 'outline',
      });
    }
  }

  // Delete ALWAYS available
  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete Event',
      icon: Trash,
      onClick: onDelete,
      variant: 'destructive',
    });
  }

  return (
    <EnhancedDetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle={event.location}
      statusBadge={{
        label: event.status,
        className: getStatusColor(event.status),
      }}
      sections={sections}
      actions={actions}
    />
  );
}
```

**Testing:**
- [ ] Delete button shows on PENDING events
- [ ] Delete button shows on DONE events
- [ ] Delete button shows on CANCELED events
- [ ] Delete button shows on PLANNED events
- [ ] Drag-to-close works
- [ ] Delete confirmation works

**Files to Modify:**
- `components/schedule/mobile/event-detail-sheet.tsx` (refactor)

**Acceptance Criteria:**
- Delete button visible on ALL event statuses
- Button is separated at bottom as destructive action
- Drag-to-close works
- All other actions still function correctly

#### Step 2.2: Fix Task Detail Sheet Dual Close Issue
**File:** `components/tasks/mobile-task-detail-sheet.tsx`

**Issue:** User reported "two closing methods (arrow + X)" but code review shows only X button. Possible user confusion or outdated issue.

**Current State:**
- Line 123-130: Only X button visible
- No back arrow found in code

**Action:** Migrate to EnhancedDetailSheet pattern to ensure consistency and add drag support.

**Implementation:**
Replace 338-line custom implementation with EnhancedDetailSheet:

```typescript
import { EnhancedDetailSheet, DetailSection, DetailAction } from '@/components/ui/mobile/enhanced-detail-sheet';
import { Edit, Trash, CheckCircle, Clock, User, AlertCircle } from 'lucide-react';

export function MobileTaskDetailSheet({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  // Build sections from task data
  const sections: DetailSection[] = [
    {
      id: 'description',
      title: 'Description',
      icon: FileText,
      content: (
        <p className="text-sm text-white/80 whitespace-pre-wrap">
          {task.description || 'No description'}
        </p>
      ),
    },
    {
      id: 'details',
      title: 'Task Details',
      icon: Clock,
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Status:</span>
            <StatusBadge status={task.status} />
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Priority:</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Due Date:</span>
            <span className="text-white">
              {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Assigned:</span>
            <span className="text-white">{task.assignedTo?.name || 'Unassigned'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Progress:</span>
            <span className="text-white">{task.progressPercentage}%</span>
          </div>
        </div>
      ),
    },
    // Add subtasks section if exists
    task.subtasks && task.subtasks.length > 0 && {
      id: 'subtasks',
      title: 'Subtasks',
      icon: CheckCircle,
      content: (
        <div className="space-y-2">
          {task.subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 p-2 bg-white/5 rounded">
              <Checkbox checked={subtask.isCompleted} readOnly />
              <span className="text-sm text-white">{subtask.title}</span>
            </div>
          ))}
        </div>
      ),
    },
  ].filter(Boolean);

  // Build actions
  const actions: DetailAction[] = [
    {
      id: 'edit',
      label: 'Edit Task',
      icon: Edit,
      onClick: onEdit,
      variant: 'default',
    },
    {
      id: 'complete',
      label: task.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Complete',
      icon: CheckCircle,
      onClick: () => onStatusChange(task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'),
      variant: 'outline',
    },
    {
      id: 'delete',
      label: 'Delete Task',
      icon: Trash,
      onClick: onDelete,
      variant: 'destructive',
    },
  ];

  return (
    <EnhancedDetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      subtitle={task.project?.name}
      statusBadge={{
        label: task.status,
        className: getStatusColor(task.status),
      }}
      headerIcon={{
        icon: getStatusIcon(task.status),
        className: getStatusColor(task.status),
      }}
      sections={sections}
      actions={actions}
    />
  );
}
```

**Benefits:**
- Reduces from 338 lines to ~80 lines
- Adds drag-to-close support
- Consistent with other detail sheets
- Maintains all existing functionality

**Testing:**
- [ ] Task detail displays correctly
- [ ] All sections render (description, details, subtasks)
- [ ] Edit button works
- [ ] Complete/Incomplete toggle works
- [ ] Delete button works
- [ ] Drag-to-close works
- [ ] Only one close mechanism (X button + drag)

**Files to Modify:**
- `components/tasks/mobile-task-detail-sheet.tsx` (complete refactor)

**Acceptance Criteria:**
- Single X button for closing (no arrows)
- Drag gesture works
- All task information displays correctly
- All actions function properly
- Component uses EnhancedDetailSheet pattern

---

### Phase 3: Standardize FAB Menus

**Objective:** Ensure all FAB (Floating Action Button) menus support drag-to-close.

#### Step 3.1: Update QuickActionsSheet
**File:** `components/dashboard/QuickActionsSheet.tsx`

**Current State:**
- Uses standard Sheet component (no drag)
- 118 lines
- Responsive (bottom on mobile, right on desktop)

**Migration:**
```typescript
import { DraggableSheet } from '@/components/ui/mobile/draggable-sheet';
import { useMediaQuery } from '@/hooks/use-media-query';

export function QuickActionsSheet({ open, onOpenChange }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();

  const actions = [
    { id: 'task', label: 'New Task', icon: Plus, href: '/admin/tasks?create=true' },
    { id: 'event', label: 'New Event', icon: Calendar, href: '/admin/schedule?create=true' },
    { id: 'contact', label: 'New Contact', icon: UserPlus, href: '/admin/contacts?create=true' },
    // ... other actions
  ];

  const handleAction = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  // Desktop: Keep standard Sheet with right side
  if (!isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[360px]">
          {/* ... existing desktop content */}
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile: Use DraggableSheet
  return (
    <DraggableSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Quick Actions"
      height="menu"
    >
      <div className="px-6 py-4 space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.href)}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-white font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </DraggableSheet>
  );
}
```

**Testing:**
- [ ] FAB menu opens on mobile
- [ ] Drag-to-close works
- [ ] All action buttons work
- [ ] Desktop version still works (right side)

**Files to Modify:**
- `components/dashboard/QuickActionsSheet.tsx` (refactor)

**Acceptance Criteria:**
- Mobile version uses DraggableSheet
- Desktop version keeps right-side Sheet
- All actions navigate correctly
- Drag gesture works smoothly

#### Step 3.2: Update Task Page FAB Menu
**File:** `app/admin/tasks/page.tsx`

**Current State:**
- Fixed bottom bar at line 913
- Uses QuickActionsSheet (which will be updated in Step 3.1)
- FilterBottomSheet already has drag support ✅

**Action:** Verify QuickActionsSheet integration works after Step 3.1 update.

**Testing:**
- [ ] FAB button visible
- [ ] Opens QuickActionsSheet
- [ ] Drag-to-close works
- [ ] Filter sheet still works

**Files to Check:**
- `app/admin/tasks/page.tsx` (verify only)

#### Step 3.3: Update Schedule Page FAB Menu
**File:** `app/admin/schedule/page.tsx`

**Current State:**
- FAB button at line 841
- Opens create event dialog

**Action:** Ensure create event dialog uses mobile-optimized pattern.

**Implementation:**
```typescript
// Add DraggableSheet for create form on mobile
const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <DraggableSheet
    open={isCreateOpen}
    onOpenChange={setIsCreateOpen}
    title="Create Event"
    height="form"
  >
    <EventForm formData={formData} onChange={setFormData} />
    <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4">
      <Button className="w-full h-12" onClick={handleCreate}>
        Create Event
      </Button>
    </div>
  </DraggableSheet>
) : (
  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
    {/* ... existing desktop dialog */}
  </Dialog>
)}
```

**Files to Modify:**
- `app/admin/schedule/page.tsx` (add mobile create form)

**Acceptance Criteria:**
- FAB button opens create form
- Form uses DraggableSheet on mobile
- Drag-to-close works
- Desktop keeps standard Dialog

#### Step 3.4: Update Contacts Page FAB Menu
**File:** `app/admin/contacts/page.tsx`

**Current State:**
- Fixed bottom bar at line 786
- Uses MobileFilterSheet (no drag)
- Uses MobileContactDialog for create (no drag)

**Action:** Both components need drag support.

**Implementation for Filter Sheet:**
```typescript
// Replace MobileFilterSheet usage with DraggableSheet
<DraggableSheet
  open={isFilterOpen}
  onOpenChange={setIsFilterOpen}
  title="Filter Contacts"
  height="filter"
>
  {/* Move filter content from MobileFilterSheet here */}
  <div className="px-6 py-4 space-y-6">
    {/* Portal Access Filters */}
    {/* Status Filters */}
    {/* Category Filters */}
  </div>

  {/* Actions at bottom */}
  <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4 space-y-3">
    <Button variant="outline" onClick={handleClear}>Clear Filters</Button>
    <Button onClick={handleApply}>Apply Filters</Button>
  </div>
</DraggableSheet>
```

**Files to Modify:**
- `components/contacts/mobile-filter-sheet.tsx` (migrate to DraggableSheet)
- `components/contacts/mobile-contact-dialog.tsx` (migrate to DraggableSheet)

**Acceptance Criteria:**
- Filter sheet has drag support
- Contact create dialog has drag support
- All filters work correctly
- Contact creation works

#### Step 3.5: Update Bidding Page FAB
**File:** `app/admin/bidding/page.tsx`

**Current State:**
- FAB button at line 259 (md:hidden)
- Minimal mobile optimization

**Action:** Add mobile-optimized create dialog with drag support.

**Implementation:**
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <DraggableSheet
    open={isCreateOpen}
    onOpenChange={setIsCreateOpen}
    title="Create RFP"
    height="form"
  >
    {/* RFP creation form */}
    <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t border-white/10 p-4">
      <Button className="w-full h-12" onClick={handleCreate}>
        Create RFP
      </Button>
    </div>
  </DraggableSheet>
) : (
  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
    {/* Desktop dialog */}
  </Dialog>
)}
```

**Files to Modify:**
- `app/admin/bidding/page.tsx` (add mobile create form)

**Acceptance Criteria:**
- FAB opens create form
- Form uses DraggableSheet
- Drag-to-close works

---

### Phase 4: Fix Schedule Page Scroll Interference

**Objective:** Prevent page scrolling on schedule page to allow uninterrupted calendar gesture interactions (swipe navigation, drag events).

#### Problem Analysis

**Root Cause:**
The PageShell component has `overflow-auto` on the main content area (line 443 in `page-shell.tsx`), which allows the entire page to scroll. On the schedule page, this creates a conflict:
- User swipes left/right to navigate calendar months
- Browser interprets this as a scroll gesture
- Page scrolls vertically OR calendar navigation triggers
- Results in poor UX - gesture conflicts and unintentional scrolling

**Affected Files:**
1. `components/blocks/page-shell.tsx` - Line 443: `"flex-1 overflow-auto"`
2. `app/admin/schedule/page.tsx` - Lines 779-847: Calendar container structure
3. `components/schedule/fullcalendar-view.tsx` - Line 274: `"flex flex-col h-full min-h-[400px]"`

**Current Structure:**
```tsx
// PageShell (page-shell.tsx:443)
<main className="flex-1 overflow-auto">  ← PROBLEM: Allows page scroll
  {children}
</main>

// Schedule Page (page.tsx:779)
<div className="h-full flex flex-col relative overflow-hidden">
  <div className="flex-1 min-h-0 overflow-hidden">  ← Tries to prevent overflow
    <FullCalendarView />  ← Calendar with swipe gestures
  </div>
</div>

// FullCalendar (fullcalendar-view.tsx:274)
<div className="flex flex-col h-full min-h-[400px]">  ← Takes full height
  {/* Calendar content */}
</div>
```

**Issue:** Even though child components use `overflow-hidden`, the parent PageShell still scrolls.

#### Solution Strategy

**Option 1: Page-Specific Override (Recommended)**
Add a prop to PageShell to disable scroll for specific pages like schedule.

**Option 2: CSS Touch-Action**
Use `touch-action: none` to prevent scroll gestures on schedule page.

**Option 3: Fixed Height Container**
Make schedule page use fixed viewport height without overflow.

#### Step 4.1: Add No-Scroll Prop to PageShell

**File:** `components/blocks/page-shell.tsx`

**Changes:**
```typescript
interface PageShellProps {
  children: React.ReactNode
  pageTitle?: string
  userRole?: 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'
  userName?: string
  userEmail?: string
  fabIcon?: LucideIcon
  fabLabel?: string
  onFabClick?: () => void
  disableScroll?: boolean  // NEW: Disable page scrolling
}

export function PageShell({
  children,
  pageTitle,
  userRole: propUserRole,
  userName: propUserName,
  userEmail: propUserEmail,
  fabIcon,
  fabLabel,
  onFabClick,
  disableScroll = false  // NEW: Default to allow scrolling
}: PageShellProps) {
  // ... existing code ...

  return (
    <div className="flex h-screen bg-graphite-900">
      {/* Sidebar */}
      {/* ... */}

      {/* Main Content */}
      <main className={cn(
        "flex-1",
        disableScroll ? "overflow-hidden" : "overflow-auto"  // CHANGE: Conditional overflow
      )}>
        {children}
      </main>
    </div>
  );
}
```

**Line to Change:**
- Line 443: From `"flex-1 overflow-auto"` to conditional `disableScroll ? "overflow-hidden" : "overflow-auto"`

**Acceptance Criteria:**
- [ ] PageShell accepts `disableScroll` prop
- [ ] When true, main content has `overflow-hidden`
- [ ] When false or undefined, maintains current behavior
- [ ] Other pages unaffected

#### Step 4.2: Enable No-Scroll on Schedule Page

**File:** `app/admin/schedule/page.tsx`

**Changes:**
```typescript
// Landscape mode (line 770)
<PageShell
  pageTitle="Schedule"
  userRole={(userRole || 'VIEWER') as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'}
  userName={user?.displayName || 'User'}
  userEmail={user?.email || ''}
  fabIcon={Plus}
  fabLabel="Add Event"
  onFabClick={() => setIsCreateOpen(true)}
  disableScroll={true}  // NEW: Prevent page scroll in landscape
>
  <div className="h-full flex flex-col relative overflow-hidden">
    {/* Calendar content - now truly fixed height */}
  </div>
</PageShell>

// Portrait mode (line 854)
<PageShell
  pageTitle="Schedule"
  userRole={(userRole || 'VIEWER') as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'}
  userName={user?.displayName || 'User'}
  userEmail={user?.email || ''}
  fabIcon={Plus}
  fabLabel="Add Event"
  onFabClick={() => setIsCreateOpen(true)}
  disableScroll={isMobile}  // NEW: Prevent scroll on mobile portrait too
>
  {/* Content */}
</PageShell>
```

**Lines to Change:**
- Line 778: Add `disableScroll={true}` prop
- Line 862: Add `disableScroll={isMobile}` prop

**Desktop Behavior:**
- Keep scrolling on desktop (large screens can scroll if needed)
- Only disable on mobile where gestures conflict

**Mobile Behavior:**
- No page scroll
- Calendar takes full viewport height
- Swipe gestures work without interference

**Acceptance Criteria:**
- [ ] Schedule page doesn't scroll on mobile
- [ ] Calendar swipe navigation works smoothly
- [ ] No vertical scroll on calendar views
- [ ] FAB button remains accessible
- [ ] Desktop version still functional
- [ ] Other pages unaffected

#### Step 4.3: Ensure Calendar Takes Full Height

**File:** `components/schedule/fullcalendar-view.tsx`

**Current Height:** `min-h-[400px] sm:min-h-[500px]` (line 274)

**Issue:** Min-height allows calendar to grow beyond viewport, causing scroll.

**Solution:** Use max-height or exact height based on viewport.

**Changes:**
```typescript
<div className={cn(
  "flex flex-col h-full",
  // Remove min-h that causes overflow
  // "min-h-[400px] sm:min-h-[500px]"  ← REMOVE THIS
)}>
  {/* Toolbar - fixed height */}
  <div className="flex-shrink-0">
    {/* Navigation buttons */}
  </div>

  {/* Calendar - takes remaining space */}
  <div className="flex-1 min-h-0">  {/* min-h-0 prevents flex overflow */}
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      height="100%"  {/* Use 100% to fill parent */}
      // ... other props
    />
  </div>
</div>
```

**Lines to Change:**
- Line 274: Remove `min-h-[400px] sm:min-h-[500px]`
- Add `min-h-0` to calendar container to prevent flex overflow

**Acceptance Criteria:**
- [ ] Calendar fills available height exactly
- [ ] No vertical scrollbar on calendar
- [ ] All calendar views fit within viewport
- [ ] Month/week/day views don't overflow

#### Step 4.4: Add Touch-Action CSS (Defense in Depth)

**File:** `app/admin/schedule/page.tsx`

**Additional Safety:** Prevent browser touch gestures from interfering.

**Changes:**
```typescript
<div className={cn(
  "h-full flex flex-col relative overflow-hidden",
  "touch-pan-x touch-pan-y",  // NEW: Only allow specific pan directions
  isMobile && "touch-none"  // NEW: On mobile, disable all touch-action for calendar container
)}>
  <div className="flex-1 min-h-0 overflow-hidden touch-manipulation">
    <FullCalendarView />
  </div>
</div>
```

**CSS Properties:**
- `touch-none`: Disables all browser touch handling (calendar handles gestures)
- `touch-manipulation`: Enables fast tap (disables double-tap zoom)
- `touch-pan-x`: Allows horizontal panning only
- `touch-pan-y`: Allows vertical panning only

**Acceptance Criteria:**
- [ ] No browser pull-to-refresh on calendar
- [ ] No double-tap zoom on calendar
- [ ] Swipe gestures handled by calendar only
- [ ] No unintended scroll bounce

#### Testing Requirements

**Manual Testing:**
1. **Mobile Portrait:**
   - [ ] Page doesn't scroll vertically
   - [ ] Swipe left/right navigates months
   - [ ] No scroll bounce
   - [ ] Events tap to open detail
   - [ ] FAB button accessible

2. **Mobile Landscape:**
   - [ ] Calendar fills viewport
   - [ ] No scrolling
   - [ ] Swipe gestures work
   - [ ] View toggle works

3. **Desktop:**
   - [ ] Calendar displays full size
   - [ ] Page scroll if needed (large calendar)
   - [ ] All interactions work

4. **Gesture Conflicts:**
   - [ ] Swipe left → Previous month (NOT page scroll)
   - [ ] Swipe right → Next month (NOT page scroll)
   - [ ] Drag event → Moves event (NOT scrolls page)
   - [ ] Tap event → Opens detail (NOT scroll)

**Devices to Test:**
- iOS Safari (iPhone)
- Android Chrome (Samsung/Pixel)
- Desktop Chrome
- Desktop Safari

**Files to Modify:**
- `components/blocks/page-shell.tsx` (add disableScroll prop)
- `app/admin/schedule/page.tsx` (use disableScroll, add touch-action CSS)
- `components/schedule/fullcalendar-view.tsx` (remove min-height, ensure 100% height)

**Acceptance Criteria Summary:**
- [ ] Schedule page never scrolls on mobile
- [ ] Calendar gestures work without interference
- [ ] All calendar views fit viewport
- [ ] FAB button remains accessible
- [ ] Other pages unaffected by changes
- [ ] Desktop functionality maintained

---

### Phase 5: Standardize Detail Sheets

**Objective:** Migrate all detail sheet components to use EnhancedDetailSheet pattern.

#### Step 5.1: Migrate Contact Detail Sheet
**File:** `components/contacts/mobile-contact-detail-sheet.tsx`

**Current State:**
- 415 lines of custom code
- Uses standard Sheet (no drag)
- Good structure but not standardized

**Action:** Refactor to use EnhancedDetailSheet.

**Implementation:**
```typescript
import { EnhancedDetailSheet, DetailSection, DetailAction } from '@/components/ui/mobile/enhanced-detail-sheet';

export function MobileContactDetailSheet({ contact, isOpen, onClose, onEdit, onDelete, onInvite }) {
  const sections: DetailSection[] = [
    {
      id: 'contact-info',
      title: 'Contact Information',
      icon: Mail,
      content: (
        <div className="space-y-2 text-sm">
          {/* Email, phone, address, website */}
        </div>
      ),
    },
    {
      id: 'portal',
      title: 'Portal Access',
      icon: getPortalIcon(contact.portalStatus),
      content: (
        <div className="bg-white/5 rounded-lg p-3">
          {/* Portal status */}
        </div>
      ),
    },
    {
      id: 'tasks',
      title: `Tasks (${taskCount})`,
      icon: ClipboardList,
      content: (
        <div className="space-y-2">
          {/* Assigned tasks list */}
        </div>
      ),
    },
  ];

  const actions: DetailAction[] = [
    primaryPhone && {
      id: 'call',
      label: 'Call',
      icon: Phone,
      onClick: () => window.location.href = `tel:${primaryPhone}`,
      variant: 'outline',
    },
    primaryEmail && {
      id: 'email',
      label: 'Email',
      icon: Mail,
      onClick: () => window.location.href = `mailto:${primaryEmail}`,
      variant: 'outline',
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: onEdit,
      variant: 'outline',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash,
      onClick: onDelete,
      variant: 'destructive',
    },
  ].filter(Boolean);

  return (
    <EnhancedDetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={contact.name}
      subtitle={contact.company || contact.category}
      statusBadge={{
        label: contact.status,
        className: getStatusColor(contact.status),
      }}
      sections={sections}
      actions={actions}
    />
  );
}
```

**Benefits:**
- Reduces from 415 lines to ~100 lines
- Adds drag support
- Consistent structure
- Maintains all functionality

**Files to Modify:**
- `components/contacts/mobile-contact-detail-sheet.tsx` (complete refactor)

**Acceptance Criteria:**
- All contact information displays
- Quick actions work (call, email)
- Edit/Delete buttons work
- Drag-to-close works
- Portal status shows correctly

---

### Phase 6: Update Base Sheet Component

**Objective:** Enhance the base Sheet component to support drag gestures while maintaining backward compatibility.

#### Step 6.1: Add Drag Support to Sheet Component
**File:** `components/ui/sheet.tsx`

**Strategy:** Add optional drag props without breaking existing usage.

**Implementation:**
```typescript
interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  enableDrag?: boolean;
  showDragHandle?: boolean;
  onDragClose?: () => void;
}

const SheetContent = React.forwardRef<...>(
  ({ side = "right", className, children, enableDrag = false, showDragHandle = false, ...props }, ref) => {
    const { dragHandlers, transform, isDragging } = useDragToClose({
      onClose: () => props.onOpenChange?.(false),
    });

    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          ref={ref}
          className={cn(sheetVariants({ side }), className)}
          style={enableDrag ? { transform } : undefined}
          {...(enableDrag && side === 'bottom' ? dragHandlers : {})}
          {...props}
        >
          {showDragHandle && side === 'bottom' && (
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-8 h-1 rounded-full bg-white/30" />
            </div>
          )}
          {children}
          <SheetPrimitive.Close className="...">
            <X className="h-4 w-4" />
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  }
);
```

**Migration Strategy:**
- New components use `enableDrag={true}` and `showDragHandle={true}`
- Existing components continue to work without changes
- Gradual migration over time

**Files to Modify:**
- `components/ui/sheet.tsx` (add optional drag support)

**Acceptance Criteria:**
- Existing Sheet usages still work
- New `enableDrag` prop adds drag support
- `showDragHandle` prop adds visual indicator
- Backward compatible

---

### Phase 7: Documentation & Testing

#### Step 7.1: Update Component Documentation

**Create Component Guide:**
`docs/MOBILE_COMPONENTS.md`

```markdown
# Mobile Component Guide

## When to Use Each Component

### DraggableSheet
Use for: Quick actions, simple menus, filters
Height: auto or max-h-[75vh]

### EnhancedDetailSheet
Use for: Task/contact/event details with actions
Height: h-[85vh]

### MobileDialog (forms)
Use for: Create/edit forms
Height: h-[90vh]

## Migration Checklist

- [ ] Replace Sheet with DraggableSheet for mobile views
- [ ] Add visual drag handle
- [ ] Use correct height standard
- [ ] Implement action button hierarchy
- [ ] Test drag-to-close gesture
- [ ] Test on iOS and Android
```

**Files to Create:**
- `docs/MOBILE_COMPONENTS.md` (new)

#### Step 7.2: Create Testing Checklist

**For Each Component:**
- [ ] Visual drag handle visible
- [ ] Drag down > 150px closes sheet
- [ ] Quick swipe (velocity) closes sheet
- [ ] X button closes sheet
- [ ] Backdrop tap closes sheet
- [ ] Escape key closes sheet
- [ ] Content scrolls properly
- [ ] Actions stay fixed at bottom
- [ ] Smooth animations
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Works on desktop (mouse drag)
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

#### Step 7.3: Update CLAUDE.md

**Add to CLAUDE.md:**
```markdown
## Mobile Menu Standards

All mobile bottom sheets must follow these rules:
1. Drag-to-dismiss gesture support
2. Visual drag indicator (w-8 h-1 bg-white/30)
3. Correct height (detail: 85vh, form: 90vh, menu: auto)
4. Action button hierarchy (primary, secondary, destructive)
5. Sticky header, scrollable content, fixed actions

Components:
- `DraggableSheet` - Base draggable bottom sheet
- `EnhancedDetailSheet` - Detail views with sections/actions
- `useDragToClose` - Hook for drag gesture logic

See MOBILE_MENU_OVERHAUL.md for full details.
```

---

## Implementation Checklist

### Phase 1: Core Components
- [ ] Step 1.1: Create `DraggableSheet` component
- [ ] Step 1.2: Create `EnhancedDetailSheet` component
- [ ] Step 1.3: Create `useDragToClose` hook
- [ ] Test all new components on iOS/Android

### Phase 2: Critical Bugs
- [ ] Step 2.1: Fix schedule event delete button
- [ ] Step 2.2: Refactor task detail sheet
- [ ] Test both fixes thoroughly

### Phase 3: FAB Menus
- [ ] Step 3.1: Update QuickActionsSheet
- [ ] Step 3.2: Verify tasks page FAB
- [ ] Step 3.3: Update schedule page FAB
- [ ] Step 3.4: Update contacts page filters & create
- [ ] Step 3.5: Update bidding page FAB

### Phase 4: Schedule Page Scroll Fix
- [ ] Step 4.1: Add `disableScroll` prop to PageShell
- [ ] Step 4.2: Enable no-scroll on schedule page
- [ ] Step 4.3: Ensure calendar takes full height
- [ ] Step 4.4: Add touch-action CSS
- [ ] Test on iOS Safari and Android Chrome
- [ ] Verify gestures work without scroll interference

### Phase 5: Detail Sheets
- [ ] Step 5.1: Migrate contact detail sheet
- [ ] Verify all detail sheets use consistent pattern

### Phase 6: Base Component
- [ ] Step 6.1: Add optional drag support to Sheet

### Phase 7: Documentation
- [ ] Step 7.1: Create mobile components guide
- [ ] Step 7.2: Create testing checklist
- [ ] Step 7.3: Update CLAUDE.md

---

## Testing Strategy

### Manual Testing

**Devices to Test:**
- iPhone (iOS Safari)
- Android phone (Chrome)
- Desktop (Chrome, Firefox, Safari)

**Test Cases:**
1. **Drag Gesture**
   - Drag down slowly (< threshold) → should snap back
   - Drag down fully (> threshold) → should close
   - Quick swipe down → should close with velocity
   - Drag up → should not close

2. **Close Methods**
   - X button → should close
   - Backdrop tap → should close
   - Escape key → should close
   - Drag gesture → should close

3. **Visual Indicators**
   - Drag handle visible and centered
   - Smooth drag tracking
   - Snap back animation smooth
   - Close animation smooth

4. **Content Behavior**
   - Header stays sticky on scroll
   - Content scrolls properly
   - Actions stay fixed at bottom
   - Long content doesn't overflow

5. **Accessibility**
   - Keyboard navigation works
   - Screen reader announces correctly
   - Focus trap works
   - ARIA labels correct

### Automated Testing

**Component Tests:**
```typescript
describe('DraggableSheet', () => {
  it('should render with drag handle', () => {});
  it('should close on drag > threshold', () => {});
  it('should snap back on drag < threshold', () => {});
  it('should close on backdrop click', () => {});
  it('should close on Escape key', () => {});
  it('should respect height prop', () => {});
});
```

---

## Rollback Plan

If issues arise during implementation:

1. **Phase 1 Issues:** Revert new component files, continue using existing components
2. **Phase 2 Issues:** Revert specific file changes, keep bug fix commits separate
3. **Phase 3-4 Issues:** Each component migration is independent, can revert individually
4. **Phase 5 Issues:** Revert Sheet.tsx changes, optional drag support not required

**Git Strategy:**
- One commit per phase step
- Clear commit messages with phase/step numbers
- Feature branch for entire overhaul
- Merge to main only after full testing

---

## Success Metrics

### Quantitative
- [ ] 100% of detail sheets support drag-to-close
- [ ] 100% of FAB menus support drag-to-close
- [ ] 100% of mobile sheets have visual drag indicators
- [ ] 0 user reports of missing buttons/actions
- [ ] < 3 height variants across all sheets

### Qualitative
- [ ] Consistent mobile experience across all pages
- [ ] Natural, iOS/Android-like interactions
- [ ] Reduced code duplication (fewer custom implementations)
- [ ] Easier to maintain and extend

---

## Maintenance Guidelines

### Adding New Mobile Sheets

1. **Determine sheet type:**
   - Detail view → Use `EnhancedDetailSheet`
   - Form → Use `DraggableSheet` with height="form"
   - Menu → Use `DraggableSheet` with height="menu"
   - Filter → Use `DraggableSheet` with height="filter"

2. **Follow height standards:**
   - Detail: 85vh
   - Form: 90vh
   - Menu: auto (max 75vh)
   - Filter: 85vh

3. **Implement action hierarchy:**
   - Primary actions first (full width)
   - Secondary actions in grid (2 columns)
   - Destructive actions last (separated, full width)

4. **Always include:**
   - Drag handle (via component prop)
   - X button (built-in)
   - Backdrop dismiss (built-in)
   - Escape key support (built-in)

### Code Review Checklist

When reviewing PRs that add/modify mobile sheets:
- [ ] Uses correct component (DraggableSheet or EnhancedDetailSheet)
- [ ] Follows height standards
- [ ] Has visual drag indicator
- [ ] Actions follow hierarchy pattern
- [ ] Tested on mobile device (not just desktop)
- [ ] Accessibility considered

---

## Notes

- **framer-motion v12.23.12** already installed, no new dependencies needed
- Keep desktop versions using standard Dialog where appropriate (budget, procurement, etc.)
- Mobile-first does not mean mobile-only
- Prioritize consistency over innovation
- Follow platform standards (iOS HIG, Material Design 3)

---

## Progress Tracking

| Phase | Step | Status | Assignee | Notes |
|-------|------|--------|----------|-------|
| 1 | 1.1 | ⬜ Not Started | | Create DraggableSheet |
| 1 | 1.2 | ⬜ Not Started | | Create EnhancedDetailSheet |
| 1 | 1.3 | ⬜ Not Started | | Create useDragToClose hook |
| 2 | 2.1 | ⬜ Not Started | | Fix schedule delete button |
| 2 | 2.2 | ⬜ Not Started | | Refactor task detail sheet |
| 3 | 3.1 | ⬜ Not Started | | Update QuickActionsSheet |
| 3 | 3.2 | ⬜ Not Started | | Verify tasks page FAB |
| 3 | 3.3 | ⬜ Not Started | | Update schedule page FAB |
| 3 | 3.4 | ⬜ Not Started | | Update contacts page |
| 3 | 3.5 | ⬜ Not Started | | Update bidding page |
| 4 | 4.1 | ⬜ Not Started | | Add disableScroll to PageShell |
| 4 | 4.2 | ⬜ Not Started | | Enable no-scroll on schedule |
| 4 | 4.3 | ⬜ Not Started | | Fix calendar full height |
| 4 | 4.4 | ⬜ Not Started | | Add touch-action CSS |
| 5 | 5.1 | ⬜ Not Started | | Migrate contact detail sheet |
| 6 | 6.1 | ⬜ Not Started | | Enhance base Sheet component |
| 7 | 7.1 | ⬜ Not Started | | Create component guide |
| 7 | 7.2 | ⬜ Not Started | | Create testing checklist |
| 7 | 7.3 | ⬜ Not Started | | Update CLAUDE.md |

**Legend:**
- ⬜ Not Started
- 🟡 In Progress
- ✅ Completed
- ⏸️ Blocked
- ❌ Skipped

---

**Last Updated:** 2025-01-30
**Document Owner:** Development Team
**Review Cycle:** Update after each phase completion
