# WORKLOG - BUDGET

## 2025-09-23 - Award→Commitment Integration

### Files Changed
- app/api/v1/bids/[bidId]/award/route.ts: Creates commitment, updates BudgetItem.committedTotal
- lib/validations/budget.ts: Added createCommitmentFromBidSchema

### Why
- Award action needs to update budget committedTotal field immediately
- Transaction ensures atomic update of Award + Commitment + BudgetItem

### Query Keys Invalidated
- Award endpoint returns updated budget snapshot
- Frontend components must invalidate ['budget', { projectId }] and ['budget-summary', { projectId }]

### Verification
- Award creates Commitment with required workPackageId
- BudgetItem.committedTotal updated in transaction
- Response includes budget summary totals

## 2025-01-19 - Initial Setup
- Files: BUDGET_PAGE_PROMPT.md
- Changes: Created budget page implementation prompt with cost redaction
- Query Keys: ['budget', { projectId }], ['budget-summary', { projectId }]
- Invalidations: Create/Update/Delete → ['budget'], ['budget-summary']
- Tests: N/A (documentation)