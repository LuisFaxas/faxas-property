# SCHEDULE PAGE IMPLEMENTATION PROMPT

## Context
You are implementing the Schedule page for a construction management system. The page exists at `/app/admin/schedule/page.tsx` with calendar views.

## Read-First Files
Before making any changes, read these files to understand patterns:
1. `/app/admin/schedule/page.tsx` - Current schedule page
2. `/components/schedule/FullCalendarView.tsx` - Calendar component
3. `/components/schedule/EventDialog.tsx` - Event creation/editing
4. `/hooks/use-api.ts` - Schedule hooks (line 380 per SOT)

## Key Requirements

### Authentication & Authorization
- Page requires authentication
- Module-based access for contractors
- Required header: `x-project-id` for project-scoped endpoints

### Data & State
Query keys from SOT State Management (line 380):
- `['schedule', { projectId }]` - Schedule events list (line 380)
- `['schedule-today']` - Today's events for dashboard

Mutations and invalidations:
- Create/Update/Delete Event: invalidate `['schedule']`
- Approve Event: invalidate `['schedule']`, specific event

### API Endpoints (from SOT API Inventory)
- `GET /api/v1/schedule` - List schedule events
- `POST /api/v1/schedule` - Create event
- `PUT /api/v1/schedule/[id]` - Update event
- `DELETE /api/v1/schedule/[id]` - Delete event
- `GET /api/v1/schedule/today` - Today's events
- `PUT /api/v1/schedule/[id]/approve` - Approve event

## Component Structure
```tsx
SchedulePage
├── PageShell
├── FullCalendarView
├── EventDialog
├── FilterPanel
├── KpiCarousel (if present)
└── MobileEventCard
```

## Calendar Features
- Month/Week/Day views
- Drag-and-drop event editing
- Color coding by event type
- Milestone markers
- Resource timeline (if implemented)

## Mobile Considerations
- List view default on mobile
- Swipe between days/weeks
- 48px minimum touch targets
- Bottom sheet for event details
- KPI carousel if present

## Error Handling
- Skeleton loaders during fetch
- Toast notifications for actions
- Optimistic updates with rollback
- Conflict detection for overlapping events

## Acceptance Criteria
- [ ] Mobile views functional
- [ ] KPI carousel working (if present)
- [ ] Correct query invalidations per SOT
- [ ] Approval workflow functional
- [ ] x-project-id header sent with requests