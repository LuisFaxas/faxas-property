# BUDGET PAGE IMPLEMENTATION PROMPT

## Context
You are implementing the Budget page for a construction management system. The page exists at `/app/admin/budget/page.tsx` with role-based access controls.

## Read-First Files
Before making any changes, read these files to understand patterns:
1. `/app/admin/budget/page.tsx` - Current budget page implementation
2. `/components/ui/table.tsx` - Table component for budget items
3. `/hooks/use-api.ts` - Budget-related hooks (lines 275-310 per SOT)
4. `/lib/validations/budget.ts` - Budget validation schemas

## Key Requirements

### Authentication & Authorization
- ADMIN/STAFF: Full access to all budget data
- CONTRACTOR: Cost data automatically redacted (per SOT API)
- Required header: `x-project-id` for all endpoints

### Data & State
Query keys from SOT State Management (lines 275-310):
- `['budget', { projectId }]` - Budget items list (line 275)
- `['budget-summary', { projectId }]` - Budget summary/totals

Mutations and invalidations (verbatim from SOT):
- Create Budget: invalidates `['budget']`, `['budget-summary']` (line 280)
- Update Budget: invalidates `['budget']`, `['budget-summary']` (line 295)
- Delete Budget: invalidates `['budget']`, `['budget-summary']` (line 310)

### API Endpoints (from SOT API Inventory)
- `GET /api/v1/budget` - List budget items (requires x-project-id)
- `POST /api/v1/budget` - Create budget item
- `PUT /api/v1/budget/[id]` - Update budget item
- `DELETE /api/v1/budget/[id]` - Delete budget item
- `GET /api/v1/budget/summary` - Budget totals/summary
- `GET /api/v1/budget/exceptions` - Over-budget items

### Cost Redaction for Contractors
Per SOT API: Financial data automatically redacted for CONTRACTOR role
- Costs shown as "REDACTED" or hidden
- Percentages and status still visible
- Server-side enforcement

## Component Structure
```tsx
BudgetPage
├── PageShell
├── BudgetSummaryCards
│   ├── TotalBudgetCard
│   ├── SpentCard
│   ├── RemainingCard
│   └── ExceptionsCard
├── BudgetTable (desktop)
└── BudgetCards (mobile)
```

## Mobile Considerations
- Card view default on mobile
- Summary cards stack vertically
- 48px minimum touch targets
- Responsive grid layout

## Error Handling
- Skeleton loaders for initial data
- Toast notifications for mutations
- Optimistic updates with rollback
- Handle redacted data gracefully

## Acceptance Criteria
- [ ] Cost redaction verified for CONTRACTOR role
- [ ] Correct query key invalidations per SOT
- [ ] Mobile-first with card/table toggle
- [ ] Summary cards show accurate totals
- [ ] Exceptions highlighted appropriately
- [ ] x-project-id header sent with all requests