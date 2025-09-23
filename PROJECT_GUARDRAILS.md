# PROJECT_GUARDRAILS

## Non‑Negotiables (from Source‑of‑Truth)
- **Design & UX:** Dark‑only, graphite + glass morphism; mobile‑first; 48px touch targets; shadcn/ui primitives.
- **Auth & RBAC:** Firebase Auth with custom claims; server‑side guards for roles and modules; token refresh ≈ 50 min; never trust client role.
- **Project Scoping:** Project‑scoped endpoints require `x-project-id`; server verifies project membership; cross‑project access is denied.
- **Task Invariant (XOR):** A Task is assigned to **either** `assignedToId` (User) **or** `assignedContactId` (Contact), **never both**. Enforce in API validation and backstop at DB.
- **API Contract:** Standard success/error structures; correlation IDs on requests.
- **Storage:** Firebase Storage with **signed URLs** (1‑hour expiry) for file access; never expose raw URLs.
- **Security:** Input validation via Zod; role + module checks; rate limiting; security headers; webhook `x-webhook-secret`. No secrets in logs or docs.
- **State:** Use **TanStack Query** for server state; follow the SOT **Query Keys Registry** and **Mutation→Invalidation Matrix** exactly; do not invent keys.

## Patterns We Follow
- **Frontend:** Cards on mobile, tables on desktop; bottom sheets for mobile modals; responsive tokenized spacing/typography.
- **Forms:** react‑hook‑form + Zod; inline errors; accessible labels.
- **Observability:** Winston logs + correlation IDs; health checks; backups; Docker/Caddy deployment per Ops.

## Forbidden Practices
- Raw SQL (use Prisma Client).
- Printing or committing **any** secret values.
- Bypassing `requireAuth/requireRole` or module access checks.
- Ignoring `x-project-id` on project‑scoped routes.
- Violating Task XOR (both `assignedToId` and `assignedContactId`).

## Query Keys & Invalidations
- **Rule:** Use the keys and invalidation matrix **as listed in SOT** `05-state-management.md`. Do not embed the whole list here; reference SOT directly to avoid drift.

## Editing Workflow (summarized; see WORK_PROTOCOL.md)
1) READ: list exact files you will open.
2) PLAN: propose a tiny batch (≤ 3 files).
3) DIFF: show unified diff preview for approval.
4) APPLY: write changes only after approval.
5) VERIFY: run `npm run lint`, `npm run typecheck` (and build if appropriate) and paste results.
6) LOG: append a brief entry to `/docs/WORKLOG_<AREA>.md` including **query keys invalidated**.