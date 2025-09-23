# PROCUREMENT PAGE IMPLEMENTATION PROMPT

## Context
You are implementing the Procurement page for a construction management system. The page exists at `/app/admin/procurement/page.tsx` with module-based access.

## Read-First Files
Before making any changes, read these files to understand patterns:
1. `/app/admin/procurement/page.tsx` - Current procurement page
2. `/hooks/use-api.ts` - Procurement hooks (lines 320+ per SOT)
3. `/lib/validations/procurement.ts` - Procurement validation schemas

## Key Requirements

### Authentication & Authorization
- Module-based access via UserModuleAccess
- Check user has PROCUREMENT module access
- Required header: `x-project-id` for all endpoints

### Data & State
Query keys from SOT State Management (line 320):
- `['procurement', query]` - Procurement items list (line 320)
- `['procurement-summary']` - Procurement statistics/summary

Mutations and invalidations:
- Create/Update/Delete: invalidate `['procurement']`, `['procurement-summary']`
- Approve: invalidate `['procurement']`, specific item

### API Endpoints (from SOT API Inventory)
- `GET /api/v1/procurement` - List procurement items
- `POST /api/v1/procurement` - Create procurement item
- `PUT /api/v1/procurement/[id]` - Update procurement item
- `DELETE /api/v1/procurement/[id]` - Delete procurement item
- `GET /api/v1/procurement/analytics` - Procurement analytics
- `PUT /api/v1/procurement/[id]/approve` - Approve item

### Approval Workflow
- Items require approval before processing
- Approval endpoint: `PUT /api/v1/procurement/[id]/approve`
- Track approval status and approver

## Component Structure
```tsx
ProcurementPage
├── PageShell
├── ProcurementFilters
├── ProcurementTable (desktop)
├── ProcurementCards (mobile)
└── ApprovalDialog
```

## Mobile Considerations
- Card view default on mobile
- Swipe to approve gesture
- 48px minimum touch targets
- Bottom sheet for item details

## Error Handling
- Skeleton loaders during fetch
- Toast notifications for actions
- Optimistic updates with rollback
- Handle approval failures gracefully

## Acceptance Criteria
- [ ] Mobile-first with proper touch targets
- [ ] Correct query invalidations per SOT
- [ ] Approval flow functional
- [ ] Analytics data displayed
- [ ] Module access enforced
- [ ] x-project-id header sent with all requests