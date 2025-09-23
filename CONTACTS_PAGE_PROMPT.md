# CONTACTS PAGE IMPLEMENTATION PROMPT

## Context
You are implementing the Contacts page for a construction management system. The page exists at `/app/admin/contacts/page.tsx` with CRM functionality.

## Read-First Files
Before making any changes, read these files to understand patterns:
1. `/app/admin/contacts/page.tsx` - Current contacts page
2. `/components/contacts/contact-card.tsx` - Contact card component
3. `/hooks/use-api.ts` - Contact hooks (lines 160-210 per SOT)
4. `/lib/validations/contact.ts` - Contact validation schemas

## Key Requirements

### Authentication & Authorization
- Page requires authentication
- IDOR protection via x-project-id header
- Project membership verification server-side

### Data & State
Query keys from SOT State Management (lines 160-210):
- `['contacts', { projectId }]` - Contacts list (line 160)
- `['contact', id]` - Single contact details

Mutations and invalidations (verbatim from SOT):
- Create Contact: invalidates `['contacts']` (line 165)
- Update Contact: invalidates `['contacts']`, `['contact', id]` (line 180)
- Delete Contact: invalidates `['contacts']` (line 195)
- Send Invite: invalidates `['contact', id]` (line 210)

### API Endpoints (from SOT API Inventory)
- `GET /api/v1/contacts` - List contacts (requires x-project-id)
- `POST /api/v1/contacts` - Create contact
- `GET /api/v1/contacts/[id]` - Contact details
- `PUT /api/v1/contacts/[id]` - Update contact
- `DELETE /api/v1/contacts/[id]` - Delete contact
- `POST /api/v1/contacts/[id]/invite` - Send portal invitation

### Portal Invitation Flow
1. Contact created in system
2. Admin sends invite via `POST /api/v1/contacts/[id]/invite`
3. Contact receives email with `/accept-invite` link
4. Contact completes signup
5. User account linked to Contact record

## Component Structure
```tsx
ContactsPage
├── PageShell
├── ContactFilterBar
├── ContactGrid (desktop)
├── ContactList (mobile)
├── ContactCard
├── ContactDialog (create/edit)
└── InviteDialog
```

## Mobile Considerations
- List view default on mobile
- 48px minimum touch targets
- Bottom sheet for contact details
- Swipe actions for quick call/email

## Error Handling
- Skeleton loaders during fetch
- Toast notifications for actions
- Optimistic updates with rollback
- Handle invite failures gracefully

## Acceptance Criteria
- [ ] Invite flow functional
- [ ] IDOR safeguards via x-project-id enforced
- [ ] Query invalidations match SOT exactly
- [ ] Mobile-first with proper touch targets
- [ ] Contact-User linking works correctly