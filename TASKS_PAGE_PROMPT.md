# TASKS PAGE IMPLEMENTATION PROMPT

## Context
You are implementing the Tasks page for a construction management system. The page exists at `/app/admin/tasks/page.tsx` with role-based access for ADMIN/STAFF.

## Read-First Files
Before making any changes, read these files to understand patterns:
1. `/app/admin/tasks/page.tsx` - Current tasks page implementation
2. `/components/tasks/task-card.tsx` - Task card component
3. `/components/tasks/kanban-board.tsx` - Kanban board view
4. `/hooks/use-api.ts` - Task-related hooks (lines 17-125 per SOT)
5. `/lib/validations/task.ts` - Task validation schemas
6. `/app/contexts/ProjectContext.tsx` - Project scoping context

## Key Requirements

### Authentication & Authorization
- Page requires ADMIN or STAFF role
- Uses `requireRole(['ADMIN', 'STAFF'])` in API routes
- Required header: `x-project-id` for all project-scoped endpoints

### Task Assignment Invariant (XOR)
**CRITICAL**: A Task is assigned to EITHER `assignedToId` (User) OR `assignedContactId` (Contact), NEVER both.
- Enforce at API validation layer
- Backstop enforcement at database
- UI must present XOR selection (not both fields)

### Data & State
Query keys from SOT State Management (lines 17-125):
- `['tasks', query]` - Task list with filters (line 17)
- `['task', taskId]` - Single task details (line 25)

Mutations and invalidations (verbatim from SOT):
- Create Task: invalidates `['tasks']`, `['tasks', { projectId }]` (line 31)
- Update Task: invalidates `['tasks']`, `['task', id]` (line 60)
- Update Status: invalidates `['tasks']`, `['task']` (line 89)
- Delete Task: invalidates `['tasks']` (line 110)
- Bulk Delete: invalidates `['tasks']` (line 125)

### API Endpoints (from SOT API Inventory)
- `GET /api/v1/tasks` - List tasks (requires x-project-id)
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/[id]` - Task details
- `PUT /api/v1/tasks/[id]` - Update task
- `DELETE /api/v1/tasks/[id]` - Delete task
- `PUT /api/v1/tasks/[id]/status` - Update status only

### Views
- Kanban board (default on desktop)
- List view (default on mobile)
- Filter bar with status/priority/assignee filters
- View switcher component

## Component Structure
```tsx
TasksPage
├── PageShell
├── TaskFilterBar
├── ViewSwitcher
└── ConditionalView
    ├── KanbanBoard (desktop)
    └── MobileListView (mobile)
```

## Mobile Considerations
- 48px minimum touch targets
- Cards default on mobile
- Swipe actions for complete/archive
- Bottom sheet for task details
- Sticky filter bar

## Error Handling
- Show skeleton loaders on initial load
- Toast notifications for mutations
- Optimistic updates with rollback
- Network error recovery

## Acceptance Criteria
- [ ] Task assignment XOR enforced (assignedToId XOR assignedContactId)
- [ ] Mobile-first behavior with 48px targets
- [ ] Skeleton loaders during fetch
- [ ] Inline validation errors
- [ ] Explicit query invalidations match SOT exactly
- [ ] No regressions to PageShell/theme/navigation
- [ ] x-project-id header sent with all requests