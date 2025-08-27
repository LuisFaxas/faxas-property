# Mobile Component Migration Guide

## Overview
This guide helps you migrate from page-specific mobile components to the new standardized mobile component library.

## Component Location Changes

### Old Structure
```
components/
├── tasks/
│   ├── mobile-task-card.tsx
│   ├── mobile-task-dialog.tsx
│   └── mobile-task-detail-sheet.tsx
├── schedule/
│   └── mobile-event-card.tsx
└── ui/
    ├── mobile-dialog.tsx (old location)
    └── mobile-card.tsx (old location)
```

### New Structure
```
components/
└── ui/
    └── mobile/
        ├── index.ts         # All exports
        ├── dialog.tsx       # MobileDialog
        ├── card.tsx         # MobileCard  
        ├── detail-sheet.tsx # MobileDetailSheet
        └── list.tsx         # MobileList
```

## Import Changes

### Before
```typescript
import { MobileTaskCard } from '@/components/tasks/mobile-task-card';
import { MobileTaskDialog } from '@/components/tasks/mobile-task-dialog';
```

### After
```typescript
import { MobileCard, MobileDialog } from '@/components/ui/mobile';
```

## Component Migration

### 1. Task Cards → MobileCard

**Before:**
```tsx
<MobileTaskCard
  task={task}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**After:**
```tsx
<MobileCard
  leftSwipeAction={{
    label: 'Delete',
    color: 'bg-red-500',
    icon: Trash,
    onAction: () => handleDelete(task)
  }}
  rightSwipeAction={{
    label: 'Edit',
    color: 'bg-blue-500',
    icon: Edit,
    onAction: () => handleEdit(task)
  }}
>
  {/* Task content */}
</MobileCard>
```

### 2. Task Dialogs → MobileDialog

**Before:**
```tsx
<MobileTaskDialog
  open={isOpen}
  onClose={handleClose}
  task={task}
/>
```

**After:**
```tsx
<MobileDialog
  open={isOpen}
  onOpenChange={handleClose}
  title="Edit Task"
  size="md"
>
  {/* Form content */}
</MobileDialog>
```

### 3. Detail Sheets → MobileDetailSheet

**Before:**
```tsx
<MobileTaskDetailSheet
  task={selectedTask}
  isOpen={detailOpen}
  onClose={() => setDetailOpen(false)}
/>
```

**After:**
```tsx
<MobileDetailSheet
  isOpen={detailOpen}
  onClose={() => setDetailOpen(false)}
  title={selectedTask.title}
  sections={[
    {
      id: 'description',
      label: 'Description',
      value: selectedTask.description
    },
    // ... more sections
  ]}
  actions={[
    {
      id: 'edit',
      label: 'Edit',
      onClick: () => handleEdit(selectedTask)
    }
  ]}
/>
```

## Hook Migration

### Swipe Actions Hook

The `useSwipeActions` hook has been moved to the hooks folder:

**Before:**
```typescript
import { useSwipeActions } from '@/components/ui/mobile-card';
```

**After:**
```typescript
import { useSwipeActions } from '@/hooks/use-swipe-actions';
```

### List Sections Hook

**Before:**
```typescript
import { useListSections } from '@/components/ui/mobile-list';
```

**After:**
```typescript
import { useListSections } from '@/hooks/use-list-sections';
```

## Step-by-Step Migration Process

1. **Update Imports**
   - Replace all old imports with new ones from `@/components/ui/mobile`
   - Update hook imports to use `@/hooks/` paths

2. **Replace Components**
   - Replace task-specific mobile components with generic ones
   - Pass appropriate props to configure generic behavior

3. **Update Props**
   - Map old prop names to new ones
   - Add any missing required props

4. **Test Functionality**
   - Verify swipe actions work correctly
   - Test modal/sheet opening and closing
   - Ensure data displays properly

## Pages to Migrate

- [ ] Tasks Page (`app/admin/tasks/page.tsx`)
- [ ] Schedule Page (`app/admin/schedule/page.tsx`)
- [ ] Contacts Page (`app/admin/contacts/page.tsx`)
- [ ] Budget Page (`app/admin/budget/page.tsx`)
- [ ] Procurement Page (`app/admin/procurement/page.tsx`)

## Common Issues and Solutions

### Issue: TypeScript errors on component props
**Solution:** Check the new component's TypeScript interface in the component file or use IDE autocomplete.

### Issue: Swipe actions not working
**Solution:** Ensure you're passing proper `SwipeAction` objects with `onAction` callbacks.

### Issue: Styles not applying correctly
**Solution:** The new components use consistent Tailwind classes. Check the `className` prop is being passed correctly.

## Need Help?

Refer to the `MOBILE_STANDARDS.md` document for detailed component documentation and examples.