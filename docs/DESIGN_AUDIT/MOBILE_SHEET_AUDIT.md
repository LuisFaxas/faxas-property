# MOBILE SHEET AUDIT - Component-by-Component Analysis

**Project:** Miami Duplex Remodel Construction Management System
**Date:** 2025-10-01
**Purpose:** Detailed audit of EVERY bottom sheet component for standardization work
**Cross-Reference:** See `MOBILE_MENU_OVERHAUL.md` for implementation plan

---

## Audit Table: All Mobile Bottom Sheets

| # | File Path | Component Name | Dismiss Methods | Height | Scroll Lock | ARIA/Title | Focus Return | Snap Points | Known Bugs | Drag Handle |
|---|-----------|----------------|-----------------|--------|-------------|------------|--------------|-------------|------------|-------------|
| 1 | `components/ui/bottom-sheet.tsx` | BottomSheet | Drag✅ X✅ Backdrop✅ | `max-h-[85vh] min-h-[200px]` | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ✅ `w-12 h-1` white/30 |
| 2 | `components/ui/sheet.tsx` | Sheet (bottom side) | X✅ Backdrop✅ Esc✅ | Variant-based | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |
| 3 | `components/ui/mobile/dialog.tsx` | MobileDialog | X✅ Backdrop✅* Esc✅ | `h-[90vh]` | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |
| 4 | `components/ui/mobile/detail-sheet.tsx` | MobileDetailSheet | X✅ Backdrop✅ Esc✅ | `h-[85vh]` | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |
| 5 | `components/tasks/filter-bottom-sheet.tsx` | FilterBottomSheet | Drag✅ X✅ Backdrop✅ | Uses BottomSheet | ✅ Yes | ✅ Title prop | ✅ Via BS | ❌ No | None | ✅ Via BottomSheet |
| 6 | `components/tasks/mobile-task-detail-sheet.tsx` | MobileTaskDetailSheet | X✅ Backdrop✅ Esc✅ | `h-[85vh]` | ✅ Yes | ✅ sr-only title | ✅ Radix | ❌ No | None | ❌ No |
| 7 | `components/tasks/mobile-task-dialog.tsx` | MobileTaskDialog | X✅ Backdrop✅ Esc✅ | `calc(100vh-env(safe-area-inset-top))` | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |
| 8 | `components/contacts/mobile-contact-detail-sheet.tsx` | MobileContactDetailSheet | X✅ Backdrop✅ Esc✅ | `h-[85vh]` | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |
| 9 | `components/contacts/mobile-filter-sheet.tsx` | MobileFilterSheet | X✅ Backdrop✅ Esc✅ | `h-[85vh]` | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |
| 10 | `components/contacts/mobile-contact-dialog.tsx` | MobileContactDialog | X✅ Backdrop✅ Esc✅ | `h-[90vh]` | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |
| 11 | `components/schedule/mobile/event-detail-sheet.tsx` | EventDetailSheet | X✅ Backdrop✅ Esc✅ | `h-[85vh]` via MobileDetailSheet | ✅ Yes | ✅ Via wrapper | ✅ Radix | ❌ No | **⚠️ Delete button conditionally hidden** | ❌ No |
| 12 | `components/dashboard/QuickActionsSheet.tsx` | QuickActionsSheet | X✅ Backdrop✅ Esc✅ | Auto (content-based) | ✅ Yes | ✅ SheetTitle | ✅ Radix | ❌ No | None | ❌ No |

\*MobileDialog has form protection: prevents backdrop close when clicking forms

---

## Detailed Component Breakdown

###1. ✅ `components/ui/bottom-sheet.tsx` - **BottomSheet**

**Status:** ⭐ REFERENCE IMPLEMENTATION (Only component with drag support)

**Properties:**
- **Height:** `max-h-[85vh] min-h-[200px]`
- **Backdrop:** `bg-black/50 backdrop-blur-sm`
- **Rounded:** `rounded-t-2xl`
- **Z-Index:** `z-50`

**Dismiss Methods:**
- ✅ Drag down > 100px (touch + mouse)
- ✅ X button (top-right)
- ✅ Backdrop click
- ⚠️ Escape key (not explicitly handled, relies on overlay click)

**Drag Handle:**
```typescript
<div className="w-12 h-1 rounded-full bg-white/30" />
// Location: line 126
// Interactive area: cursor-grab active:cursor-grabbing
// Touch handlers: onTouchStart, onTouchMove, onTouchEnd
// Mouse handlers: onMouseDown, onMouseMove, onMouseUp
```

**Scroll Behavior:**
```typescript
<div className="flex-1 overflow-y-auto p-4">
  {children}
</div>
```

**ARIA:**
- Title via `title` prop
- X button has `sr-only` "Close" label

**Bugs:** None known

**Used By:**
- `components/tasks/filter-bottom-sheet.tsx`

---

### 2. ❌ `components/ui/sheet.tsx` - **Sheet (bottom variant)**

**Status:** Standard Radix wrapper, NO drag support

**Properties:**
- **Height:** Not fixed (uses `inset-x-0 bottom-0`)
- **Backdrop:** `bg-black/80`
- **Rounded:** Not specified in variant
- **Z-Index:** `z-50`

**Dismiss Methods:**
- ✅ X button (absolute right-4 top-4)
- ✅ Backdrop click (Radix default)
- ✅ Escape key (Radix default)
- ❌ No drag support

**Drag Handle:** ❌ No

**Scroll Behavior:** Managed by content, no built-in overflow handling

**ARIA:**
- Uses `SheetTitle` and `SheetDescription` Radix primitives
- Auto-generates `aria-labelledby`

**Bugs:** None, but lacks drag gesture expected on mobile

**Used By:** Multiple components (see Component Audit CSV)

---

### 3. ❌ `components/ui/mobile/dialog.tsx` - **MobileDialog**

**Status:** Responsive adapter (Dialog on desktop, Sheet on mobile), NO drag

**Mobile Properties:**
- **Height:** `h-[90vh]`
- **Backdrop:** `bg-black/80`
- **Rounded:** `rounded-t-2xl`
- **Z-Index:** `z-50`
- **Side:** `bottom`

**Dismiss Methods:**
- ✅ X button (absolute right-0 top-0)
- ✅ Backdrop click **with form protection**
- ✅ Escape key (Radix default)
- ❌ No drag support

**Special Feature - Form Protection:**
```typescript
onPointerDownOutside={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest('form')) {
    e.preventDefault(); // Don't close if clicking outside form
  }
}}
// Location: lines 120-126
```

**Drag Handle:** ❌ No

**Scroll Behavior:**
```typescript
<div className="flex-1 overflow-y-auto py-4 px-4">
  {children}
</div>
```

**ARIA:**
- `SheetTitle` and `SheetDescription`
- X button has sr-only label

**Safe Area:** `pb-safe` on footer

**Bugs:** None known

**Used By:**
- Form dialogs across app
- `MobileFormDialog`, `MobileConfirmDialog`, `MobileDetailDialog` variants

---

### 4. ❌ `components/ui/mobile/detail-sheet.tsx` - **MobileDetailSheet**

**Status:** Reusable detail view pattern, NO drag

**Properties:**
- **Height:** `h-[85vh]`
- **Backdrop:** Default Sheet backdrop
- **Rounded:** `rounded-t-2xl`
- **Z-Index:** `z-50`
- **Structure:** Sticky header + scrollable content + fixed actions

**Dismiss Methods:**
- ✅ X button (custom in header)
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support

**Layout Pattern:**
```typescript
<SheetContent className="h-[85vh] ... overflow-hidden">
  {/* Sticky header (z-10) */}
  <div className="sticky top-0 bg-graphite-900 z-10 pb-4">
    <SheetHeader>...</SheetHeader>
  </div>

  {/* Scrollable content */}
  <div className="overflow-y-auto pb-24 -mx-6 px-6">
    {sections.map(...)}
  </div>

  {/* Fixed actions */}
  <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t p-4">
    {actions.map(...)}
  </div>
</SheetContent>
```

**Drag Handle:** ❌ No

**ARIA:**
- `SheetTitle` via Radix
- Section icons have semantic meaning

**Bugs:** None known

**Used By:**
- `components/schedule/mobile/event-detail-sheet.tsx`

---

### 5. ✅ `components/tasks/filter-bottom-sheet.tsx` - **FilterBottomSheet**

**Status:** Uses BottomSheet internally, HAS drag ✅

**Properties:**
- Inherits from `BottomSheet`
- **Height:** `max-h-[85vh]` (via BottomSheet)
- **Title:** "Filter Tasks"

**Dismiss Methods:**
- ✅ Drag (via BottomSheet)
- ✅ X button (via BottomSheet)
- ✅ Backdrop click (via BottomSheet)

**Drag Handle:** ✅ Yes (inherited from BottomSheet)

**Content:**
- Filter options by status, priority, assignee
- Apply/Reset buttons at bottom

**ARIA:** Inherited from BottomSheet

**Bugs:** None known

**Evidence:** `components/tasks/filter-bottom-sheet.tsx:1-178`

---

### 6. ❌ `components/tasks/mobile-task-detail-sheet.tsx` - **MobileTaskDetailSheet**

**Status:** Custom 338-line implementation, NO drag

**Properties:**
- **Height:** `h-[85vh]`
- **Backdrop:** Default Sheet
- **Rounded:** `rounded-t-2xl`
- **Structure:** Custom header + scrollable content + fixed actions

**Dismiss Methods:**
- ✅ X button only (line 128)
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support
- ❌ No back arrow (user report may be outdated)

**Layout:**
```typescript
<Sheet open={isOpen} onOpenChange={onClose}>
  <SheetContent side="bottom" className="h-[85vh] ... overflow-hidden">
    {/* Hidden accessible title */}
    <SheetHeader className="sr-only">
      <SheetTitle>{task.title}</SheetTitle>
    </SheetHeader>

    {/* Custom visual header */}
    <div className="sticky top-0 z-10 bg-graphite-900 border-b px-4 py-3">
      <h2>{task.title}</h2>
      <Button onClick={onClose}><X /></Button>
    </div>

    {/* Scrollable content */}
    <div className="overflow-y-auto pb-24 px-4 py-6">
      {/* Task details, progress, subtasks, dependencies, comments */}
    </div>

    {/* Fixed actions */}
    <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t p-4">
      <Button onClick={onEdit}>Edit</Button>
      <Button onClick={onStatusChange}>Mark Complete</Button>
      <Button variant="destructive" onClick={onDelete}>Delete</Button>
    </div>
  </SheetContent>
</Sheet>
```

**Drag Handle:** ❌ No

**ARIA:**
- ✅ `sr-only` SheetTitle for accessibility
- ✅ Visual header separate for styling

**Content Sections:**
- Description
- Status, priority, due date
- Assigned user
- Progress percentage
- Subtasks (if any)
- Dependencies
- Comments

**Bugs:** None identified in code review

**Evidence:** `components/tasks/mobile-task-detail-sheet.tsx:1-338`

**Recommendation:** Refactor to use `MobileDetailSheet` to reduce from 338 lines to ~80 lines

---

### 7. ❌ `components/tasks/mobile-task-dialog.tsx` - **MobileTaskDialog**

**Status:** Full-screen custom dialog, NO drag

**Properties:**
- **Height:** `h-full max-h-[calc(100vh-env(safe-area-inset-top))]`
- **Backdrop:** `bg-black/50 backdrop-blur-sm`
- **Rounded:** `rounded-t-2xl`
- **Safe Area:** Yes (top inset)

**Dismiss Methods:**
- ✅ X button (custom header)
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support

**Layout:**
```typescript
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent
    side="bottom"
    className="h-full max-h-[calc(100vh-env(safe-area-inset-top))] overflow-hidden"
  >
    {/* Custom header with X button */}
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <h2>Create Task</h2>
      <Button onClick={() => onOpenChange(false)}><X /></Button>
    </div>

    {/* Scrollable form content */}
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {children}
    </div>

    {/* Optional footer */}
    {footer && (
      <div className="border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {footer}
      </div>
    )}
  </SheetContent>
</Sheet>
```

**Drag Handle:** ❌ No

**ARIA:** SheetTitle via Radix

**Safe Area Handling:**
- Top: `max-h-[calc(100vh-env(safe-area-inset-top))]`
- Bottom: `pb-[calc(1rem+env(safe-area-inset-bottom))]`

**Bugs:** None known

**Evidence:** `components/tasks/mobile-task-dialog.tsx:1-119`

---

### 8. ❌ `components/contacts/mobile-contact-detail-sheet.tsx` - **MobileContactDetailSheet**

**Status:** 415-line custom detail view, NO drag

**Properties:**
- **Height:** `h-[85vh]`
- **Backdrop:** Default Sheet
- **Rounded:** `rounded-t-2xl`

**Dismiss Methods:**
- ✅ X button
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support

**Content Sections:**
- Contact avatar + name
- Quick actions (call, email, invite to portal)
- Contact information (phone, email, address, website)
- Portal status badge
- Assigned tasks list
- Activity timeline

**Layout:**
```typescript
<Sheet open={isOpen} onOpenChange={onClose}>
  <SheetContent side="bottom" className="h-[85vh] overflow-hidden">
    {/* Header with avatar */}
    <SheetHeader className="border-b pb-4">
      <Avatar />
      <SheetTitle>{contact.name}</SheetTitle>
      <Badge>{contact.status}</Badge>
    </SheetHeader>

    {/* Quick actions */}
    <div className="grid grid-cols-3 gap-2 py-4">
      <Button onClick={() => window.location.href = `tel:${phone}`}>
        <Phone /> Call
      </Button>
      <Button onClick={() => window.location.href = `mailto:${email}`}>
        <Mail /> Email
      </Button>
      {canInvite && <Button onClick={onInvite}><Send /> Invite</Button>}
    </div>

    {/* Scrollable details */}
    <div className="flex-1 overflow-y-auto py-4 space-y-6">
      {/* Contact info, portal status, tasks, activity */}
    </div>

    {/* Fixed actions */}
    <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t p-4">
      <Button onClick={onEdit}>Edit</Button>
      <Button variant="destructive" onClick={onDelete}>Delete</Button>
    </div>
  </SheetContent>
</Sheet>
```

**Drag Handle:** ❌ No

**ARIA:** SheetTitle, section headings

**Bugs:** None known

**Evidence:** `components/contacts/mobile-contact-detail-sheet.tsx:1-415`

**Recommendation:** Refactor to use `MobileDetailSheet` to reduce complexity

---

### 9. ❌ `components/contacts/mobile-filter-sheet.tsx` - **MobileFilterSheet**

**Status:** 350-line filter interface, NO drag

**Properties:**
- **Height:** `h-[85vh]`
- **Backdrop:** Default Sheet
- **Rounded:** `rounded-t-2xl`

**Dismiss Methods:**
- ✅ X button
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support

**Content:**
- Portal Access filters (All, Active, Invited, None)
- Status filters (Active, Inactive)
- Category filters (Subcontractor, Supplier, Client, etc.)
- Active filter count display
- Export to CSV option
- Clear Filters / Apply Filters buttons

**Layout:**
```typescript
<Sheet open={open} onOpenChange={onClose}>
  <SheetContent side="bottom" className="h-[85vh] overflow-hidden">
    <SheetHeader>
      <SheetTitle>Filter Contacts</SheetTitle>
    </SheetHeader>

    {/* Scrollable filter groups */}
    <div className="flex-1 overflow-y-auto py-4 space-y-6">
      {/* Portal Access section */}
      {/* Status section */}
      {/* Category section */}
    </div>

    {/* Fixed actions */}
    <div className="absolute bottom-0 left-0 right-0 bg-graphite-900 border-t p-4 space-y-2">
      <Button variant="outline" onClick={handleClear}>
        Clear Filters
      </Button>
      <Button onClick={handleApply}>
        Apply Filters ({activeFilterCount})
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

**Drag Handle:** ❌ No

**ARIA:** SheetTitle, section labels

**Bugs:** None known

**Evidence:** `components/contacts/mobile-filter-sheet.tsx:1-350`

---

### 10. ❌ `components/contacts/mobile-contact-dialog.tsx` - **MobileContactDialog**

**Status:** Responsive dialog/sheet for forms, NO drag

**Properties (Mobile):**
- **Height:** `h-[90vh]`
- **Backdrop:** Default
- **Rounded:** `rounded-t-2xl`
- **Uses:** Mobile/Dialog pattern (switches to Dialog on desktop)

**Dismiss Methods:**
- ✅ X button
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support

**Layout:**
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent side="bottom" className="h-[90vh]">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className="overflow-y-auto py-4">
        {children}
      </div>
    </SheetContent>
  </Sheet>
) : (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent>
      {children}
    </DialogContent>
  </Dialog>
)}
```

**Drag Handle:** ❌ No

**ARIA:** SheetTitle/DialogTitle

**Bugs:** None known

**Evidence:** `components/contacts/mobile-contact-dialog.tsx:1-89`

---

### 11. ⚠️ `components/schedule/mobile/event-detail-sheet.tsx` - **EventDetailSheet**

**Status:** Uses MobileDetailSheet, NO drag, **HAS BUG**

**Properties:**
- Inherits from `MobileDetailSheet` (`h-[85vh]`)

**Dismiss Methods:**
- ✅ X button (via MobileDetailSheet)
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support

**Actions:**
- Mark as Done (conditional: only if not DONE/CANCELED)
- Edit Event (conditional: only if not DONE/CANCELED)
- Cancel Event (conditional: only if not DONE/CANCELED)
- **Delete Event** (should always show, but may be hidden due to conditional)

**Known Bug:**
```typescript
// Lines 121-162: Conditional actions
if (event.status !== 'DONE' && event.status !== 'CANCELED') {
  if (onComplete) actions.push({ id: 'complete', ... });
  if (onEdit) actions.push({ id: 'edit', ... });
  if (onCancel) actions.push({ id: 'cancel', ... });
}

// Lines 164-175: Delete action added
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

**Issue:** Delete button may not show for DONE/CANCELED events even though it should always be available

**Evidence:** `components/schedule/mobile/event-detail-sheet.tsx:121-175`

**Fix Required:** Ensure delete action is ALWAYS available regardless of event status

---

### 12. ❌ `components/dashboard/QuickActionsSheet.tsx` - **QuickActionsSheet**

**Status:** FAB menu, NO drag

**Properties:**
- **Height:** Auto (content-based)
- **Side:** `bottom` on mobile, `right` on desktop
- **Backdrop:** Default

**Dismiss Methods:**
- ✅ X button
- ✅ Backdrop click
- ✅ Escape key
- ❌ No drag support

**Content:**
- List of quick action buttons (New Task, New Event, New Contact, etc.)
- Each button navigates to create flow

**Layout:**
```typescript
<Sheet open={open} onOpenChange={onClose}>
  <SheetContent side={isMobile ? 'bottom' : 'right'}>
    <SheetHeader>
      <SheetTitle>Quick Actions</SheetTitle>
    </SheetHeader>
    <div className="space-y-2 py-4">
      {actions.map((action) => (
        <Button onClick={() => router.push(action.href)}>
          <action.icon /> {action.label}
        </Button>
      ))}
    </div>
  </SheetContent>
</Sheet>
```

**Drag Handle:** ❌ No

**ARIA:** SheetTitle

**Bugs:** None known

**Evidence:** `components/dashboard/QuickActionsSheet.tsx:1-118`

**Recommendation:** Add drag support for easier dismissal

---

## Summary Statistics

### Dismiss Methods
- **X Button:** 12/12 components (100%)
- **Backdrop Click:** 12/12 components (100%)
- **Escape Key:** 11/12 components (92%) (BottomSheet missing explicit handler)
- **Drag Gesture:** 2/12 components (17%) ⚠️ **Only BottomSheet + FilterBottomSheet**

### Heights
- **`h-[85vh]`:** 5 components (BottomSheet max-h, detail sheets)
- **`h-[90vh]`:** 3 components (form dialogs)
- **`h-full max-h-[calc(...)]`:** 1 component (full-screen)
- **Auto/content-based:** 1 component (Quick Actions)

### Scroll Lock
- **All components:** ✅ Properly implement `overflow-hidden` on container + `overflow-y-auto` on content

### ARIA Labels
- **All components:** ✅ Use Radix `SheetTitle` or `DialogTitle` for auto-generated `aria-labelledby`
- **2 components:** Use `sr-only` hidden titles for custom visual headers

### Focus Return
- **All components:** ✅ Radix handles focus trap and return automatically

### Snap Points
- **No components:** ❌ None implement snap points (e.g., half-height, full-height)

### Visual Drag Handles
- **2/12 components:** ✅ BottomSheet + FilterBottomSheet (via BottomSheet)
- **10/12 components:** ❌ Missing drag handles

---

## Priority Recommendations

### 🔴 High Priority (User-Facing Bugs)
1. **Fix EventDetailSheet delete button** - Should always show regardless of status
   - File: `components/schedule/mobile/event-detail-sheet.tsx`
   - Lines: 164-175

### 🟡 Medium Priority (UX Improvements)
1. **Add drag support to all bottom sheets** - Only 2/12 have it
   - Affects: MobileDialog, MobileDetailSheet, all custom sheets
   - Impact: 10 components

2. **Refactor large custom sheets** - Reduce code duplication
   - `mobile-task-detail-sheet.tsx`: 338 lines → ~80 lines (use MobileDetailSheet)
   - `mobile-contact-detail-sheet.tsx`: 415 lines → ~100 lines (use MobileDetailSheet)
   - `mobile-filter-sheet.tsx`: 350 lines → ~120 lines (standardize pattern)

3. **Standardize heights** - Currently 4 different values
   - Adopt: `h-[85vh]` for details, `h-[90vh]` for forms

### 🟢 Low Priority (Nice to Have)
1. **Add snap points** - Half/full height states
2. **Consistent safe area handling** - Use `pb-safe` everywhere
3. **Extract drag handle component** - Reusable `<DragHandle />` component

---

## END OF MOBILE SHEET AUDIT

**Components Audited:** 12
**Total Lines Reviewed:** ~2,500+
**Critical Bugs Found:** 1
**UX Improvements Needed:** 10 components lack drag support

**Next Steps:** See `DEVIATIONS.md` for inconsistency details and `COMPONENT_AUDIT.csv` for quick reference.
