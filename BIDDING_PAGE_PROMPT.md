# BIDDING PAGE IMPLEMENTATION PROMPT

## Context
You are implementing the Bidding page for a construction management system. The page exists at `/app/admin/bidding/page.tsx` with role-based access.

## Read-First Files
Before making any changes, read these files to understand patterns:
1. `/app/admin/bidding/page.tsx` - Current bidding page
2. TODO(`/app/admin/bidding/[rfpId]/page.tsx`) - Check if RFP detail page exists
3. `/hooks/use-api.ts` - RFP and bid hooks
4. `/lib/validations/rfp.ts` - RFP and bid validation schemas

## Key Requirements

### Authentication & Authorization
- ADMIN/STAFF: Full access to create RFPs and view all bids
- CONTRACTOR: Can submit bids, view own bids, read-only tabulation
- Required header: `x-project-id` for project-scoped endpoints

### Data & State
Query keys from SOT State Management:
- `['rfps', { projectId }]` - RFP list
- `['rfp', rfpId]` - Single RFP details
- `['bids', { rfpId }]` - Bids for an RFP
- `['bid', bidId]` - Single bid details

Mutations and invalidations:
- Create/Update RFP: invalidate `['rfps']`
- Submit Bid: invalidate `['bids', { rfpId }]`
- Update Bid: invalidate `['bid', bidId]`, `['bids']`

### API Endpoints (from SOT API Inventory)
- `GET /api/v1/rfps` - List RFPs
- `POST /api/v1/rfps` - Create RFP (ADMIN/STAFF)
- `GET /api/v1/rfps/[rfpId]` - RFP details
- `GET /api/v1/rfps/[rfpId]/tabulation` - Bid comparison table
- `GET /api/v1/bids` - List bids
- `POST /api/v1/bids` - Create bid
- `GET /api/v1/bids/[bidId]` - Bid details
- `PUT /api/v1/bids/[bidId]` - Update bid
- `PUT /api/v1/bids/[bidId]/submit` - Submit final bid

### Tabulation View
- Read-only for CONTRACTOR role (unless SOT says otherwise)
- Compare bids side-by-side
- Highlight lowest/best bids

## Component Structure
```tsx
BiddingPage
├── PageShell
├── RFPList
├── BidList
├── TabulationView
└── BidSubmissionDialog
```

## Mobile Considerations
- Card view for RFPs and bids
- 48px minimum touch targets
- Bottom sheet for bid submission
- Responsive tabulation table

## Error Handling
- Skeleton loaders during fetch
- Toast notifications for submissions
- Optimistic updates with rollback
- Handle bid deadlines gracefully

## Acceptance Criteria
- [ ] Mobile-first with proper touch targets
- [ ] Tabulation read-only for contractors
- [ ] Query invalidations match SOT exactly
- [ ] Bid submission workflow complete
- [ ] x-project-id header sent with requests