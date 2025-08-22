# INVESTMENT PROPERTY — Control Center (Hybrid Stack)

**Implementation Plan & Build Script for Claude Code**

> **Goal**: Build a production‑ready, minimal, and clean web app for the *Miami Duplex Remodel* project with:
>
> * **Firebase Auth** (Google/email) + role claims
> * **Managed Postgres** (Neon or Supabase) for structured data
> * **Firebase Storage** for plan PDFs & file uploads
> * **Next.js (App Router, TS)** + **Tailwind (Graphite + Glassmorphism)** + **shadcn/ui** + **Storybook**
> * **n8n** automations (Gmail, Google Calendar, notifications, optional AI plan analysis)
> * **Two dashboards**: **Admin** (mission control) & **Contractor** (simple, guided)
> * **Module access checklist** per contractor per project
> * Seeded with **Project: Miami Duplex Remodel** and **Budget item: Footings (installed) — \$25,000** baseline

---

## 0) Guardrails & Success Criteria

**Success if ALL are true:**

1. Admin can invite a contractor (no plaintext passwords), set module access via checklist, and suspend/restore access.
2. Contractor can **request a visit**, **upload invoice/file**, **view assigned tasks/plans** (only what Admin allows).
3. Admin dashboard shows: **Tasks (today/this week)**, **Calendar (week)**, **Contacts follow‑ups**, **Budget exceptions (>10%)**, **Procurement due this week**, **Open risks**, **Latest plans**.

**Non‑Goals (v1):** Payments/AP, accounting sync, mobile app, multi‑tenant orgs.

---

## 1) Stack & Services

* **Frontend/API**: Next.js (13+/App Router), TypeScript, shadcn/ui, Tailwind
* **Auth**: Firebase Auth (Google + Email/Password), **custom claims** for roles
* **DB**: Managed **Postgres** (Neon or Supabase) via **Prisma**
* **Files**: Firebase Storage (plans, invoices, uploads), signed URLs for reads
* **Automations**: **n8n** on VPS for Gmail/Calendar/notifications/AI
* **Hosting**: Hostinger VPS (Docker) for Next.js + n8n; Caddy as reverse proxy (TLS)
* **Observability**: optional Sentry
* **Testing**: Playwright E2E (happy paths)

---

## 2) Repository Layout

```
apps/control-center/
  app/
    (public)/
    admin/
      page.tsx
      access/
      contacts/
      budget/
      procurement/
      plans/
      schedule/
      tasks/
      risks/
      decisions/
    contractor/
      page.tsx
      my-tasks/
      my-schedule/
      uploads/
      invoices/
      plans/
    api/
      health/route.ts
      webhooks/
        gmail-inbound/route.ts
        calendar-event/route.ts
      admin/
        invite-contractor/route.ts
        set-claims/route.ts   // delete after seeding
      signed-url/route.ts
  components/
    ui/ ... (design system; shadcn scaffold)
    blocks/ (dashboard widgets)
  lib/
    firebaseClient.ts
    firebaseAdmin.ts
    auth.ts   // verifyIDToken, getUserRole
    prisma.ts
    storage.ts // signed URL helpers
    access.ts  // module access checks
  prisma/
    schema.prisma
    seed.ts
  public/
  styles/
    globals.css
    tailwind.css
  .storybook/
  Dockerfile
  docker-compose.yml (for local)
  Caddyfile
  next.config.js
  package.json
  README.md
```

---

## 3) Environment Variables (`.env`)

```
# Next.js
NODE_ENV=development

# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (base64-encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64=...

# Database (Neon/Supabase)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# App secrets
WEBHOOK_SECRET=change-me-long-random
JWT_AUDIENCE=your-firebase-project-id

# Optional
SENTRY_DSN=
```

> **Claude**: never hardcode secrets; rely on environment and README instructions.

---

## 4) Install & Scaffold

1. Initialize Next.js (App Router, TS) + Tailwind + shadcn/ui + Storybook.
2. Add Firebase client/admin SDKs, Prisma, zod, date-fns, react-hook-form, tanstack table, react-big-calendar (or FullCalendar).
3. Configure Tailwind theme (Graphite/Dark + Glassmorphism), Storybook, and shadcn components.

---

## 5) Tailwind Theme (Graphite + Glass)

**`tailwind.config.ts`** (snippet)

```ts
theme: {
  extend: {
    colors: {
      graphite: {
        900: '#0f1115',
        800: '#14161b',
        700: '#1b1e24',
        600: '#232730',
        500: '#2c313c',
        400: '#3b4150',
        300: '#4a5163',
        200: '#5a6278',
        100: '#6b7490',
      },
      accent: { 500: '#8EE3C8' },
    },
    backdropBlur: { xs: '2px' },
    boxShadow: {
      glass: '0 8px 32px rgba(0,0,0,0.25)',
    },
  }
}
```

**Glass utility (global CSS)**

```css
.glass {
  background: rgba(20, 22, 27, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,.25);
  backdrop-filter: blur(8px);
  border-radius: 14px;
}
```

---

## 6) Prisma Schema (Postgres)

**`prisma/schema.prisma`**

```prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

enum Role { ADMIN STAFF CONTRACTOR VIEWER }

enum ScheduleType { CALL MEETING SITE_VISIT WORK EMAIL_FOLLOWUP }
enum ScheduleStatus { REQUESTED PLANNED DONE CANCELED RESCHEDULE_NEEDED }

enum BudgetStatus { BUDGETED COMMITTED PAID }
enum ProcurementStatus { QUOTED ORDERED DELIVERED INSTALLED }

enum InvoiceStatus { RECEIVED UNDER_REVIEW APPROVED PAID REJECTED }

enum Module {
  TASKS SCHEDULE PLANS UPLOADS INVOICES PROCUREMENT_READ DOCS_READ
}

model User {
  id        String  @id      // Firebase UID
  email     String  @unique
  role      Role
  createdAt DateTime @default(now())
  tasks     Task[]   @relation("AssignedTasks")
}

model Project {
  id        String   @id @default(cuid())
  name      String
  status    String   // active/archived
  createdAt DateTime @default(now())

  contacts    Contact[]
  tasks       Task[]
  schedule    ScheduleEvent[]
  budgets     BudgetItem[]
  procurement Procurement[]
  plans       PlanFile[]
  decisions   Decision[]
  risks       Risk[]
  meetings    Meeting[]
  invoices    Invoice[]
  access      UserModuleAccess[]
}

model Contact {
  id           String  @id @default(cuid())
  projectId    String
  project      Project @relation(fields: [projectId], references: [id])
  name         String
  company      String?
  specialty    String?
  category     String   // contractor/supplier/partner/city/referral_source
  referredById String?
  status       String   // new/contacted/interview/hired/rejected/standby
  emails       String[]
  phones       String[]
  notes        String?
  userId       String?  // linked Firebase user
}

model Task {
  id           String   @id @default(cuid())
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id])
  title        String
  description  String?
  status       String   // new/in_progress/blocked/done
  dueDate      DateTime?
  assignedToId String?
  assignedTo   User?    @relation("AssignedTasks", fields: [assignedToId], references: [id])
  relatedContactIds String[] // denormalized for quick filters
  createdAt    DateTime @default(now())
}

model ScheduleEvent {
  id              String   @id @default(cuid())
  projectId       String
  project         Project  @relation(fields: [projectId], references: [id])
  title           String
  type            ScheduleType
  start           DateTime
  end             DateTime?
  status          ScheduleStatus
  googleEventId   String?
  replied         Boolean  @default(false)
  notes           String?
  requesterUserId String?
  relatedContactIds String[]
  createdAt       DateTime @default(now())
}

model BudgetItem {
  id             String   @id @default(cuid())
  projectId      String
  project        Project  @relation(fields: [projectId], references: [id])
  discipline     String   // structural/electrical/plumbing/hvac/finishes/site/...
  category       String   // materials/tools/rentals/contractors/labor/other
  item           String
  unit           String?
  qty            Decimal  @db.Numeric(12,2) @default(0)
  estUnitCost    Decimal  @db.Numeric(12,2) @default(0)
  estTotal       Decimal  @db.Numeric(12,2) @default(0)
  committedTotal Decimal  @db.Numeric(12,2) @default(0)
  paidToDate     Decimal  @db.Numeric(12,2) @default(0)
  vendorContactId String?
  status         BudgetStatus
  variance       Decimal  @db.Numeric(6,4) @default(0) // store for easy filtering
}

model Procurement {
  id            String   @id @default(cuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id])
  materialItem  String
  quantity      Decimal  @db.Numeric(12,2)
  discipline    String
  phase         String   // rough_in/finishes/site/...
  requiredBy    DateTime
  leadTimeDays  Int
  supplierId    String?
  orderStatus   ProcurementStatus
  eta           DateTime?
  notes         String?
  budgetItemId  String?
}

model PlanFile {
  id            String   @id @default(cuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id])
  category      String   // architectural/structural/mep/electrical/plumbing/interior/site
  storagePath   String   // Firebase Storage path
  version       String
  dateIssued    DateTime
  notes         String?
  sharedWithIds String[] // contact IDs
  createdAt     DateTime @default(now())
}

model Decision {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  topic     String
  options   String[]
  decision  String
  date      DateTime
  ownerUserId String
  rationale String?
  followUpNeeded Boolean @default(false)
}

model Risk {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  description String
  category    String   // cost/schedule/scope/quality
  probability Decimal  @db.Numeric(6,4)
  impactCost  Decimal? @db.Numeric(12,2)
  impactDays  Int?
  impactQuality Int?
  score      Decimal  @db.Numeric(12,4) // probability*(cost+days) or custom
  mitigation String?
  trigger    String?
  status     String    // open/monitoring/closed
}

model Meeting {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  date      DateTime
  participantContactIds String[]
  type      String   // weekly_review/site_walk/contractor_interview
  agenda    String?
  notes     String?
  decisionIds String[]
  actionTaskIds String[]
  nextMeetingDate DateTime?
}

model Invoice {
  id               String   @id @default(cuid())
  projectId        String
  project          Project  @relation(fields: [projectId], references: [id])
  contractorUserId String
  contactId        String
  budgetItemId     String?
  amount           Decimal  @db.Numeric(12,2)
  tax              Decimal? @db.Numeric(12,2)
  status           InvoiceStatus
  filePath         String   // Firebase Storage path
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  paidAt           DateTime?
}

model UserModuleAccess {
  userId    String
  projectId String
  module    Module
  canView   Boolean @default(false)
  canEdit   Boolean @default(false)
  canUpload Boolean @default(false)
  canRequest Boolean @default(false)

  project   Project @relation(fields: [projectId], references: [id])

  @@id([userId, projectId, module])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String
  entity    String
  entityId  String
  meta      Json
  createdAt DateTime @default(now())
}
```

**Indexes to add** via Prisma or DB:

* `Task(projectId, status, dueDate)`
* `ScheduleEvent(projectId, start desc)`
* `Contact(projectId, status)`
* `BudgetItem(projectId, discipline, status)`
* `Procurement(projectId, requiredBy, orderStatus)`
* `Risk(projectId, status, score desc)`

---

## 7) Seed Script

**`prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { id: 'miami-duplex' },
    update: {},
    create: { id: 'miami-duplex', name: 'Miami Duplex Remodel', status: 'active' }
  });

  // Baseline Budget: Footings (installed) $25,000 (locked baseline)
  await prisma.budgetItem.create({
    data: {
      projectId: project.id,
      discipline: 'structural',
      category: 'contractors',
      item: 'Footings (installed)',
      unit: 'lot',
      qty: 1,
      estUnitCost: 25000,
      estTotal: 25000,
      committedTotal: 0,
      paidToDate: 0,
      status: 'BUDGETED',
      variance: 0
    }
  });
}

main().finally(() => prisma.$disconnect());
```

---

## 8) Auth & Role Enforcement

**`lib/firebaseAdmin.ts`**

* Initialize Admin SDK from `FIREBASE_SERVICE_ACCOUNT_BASE64`.

**`lib/auth.ts`**

* `verifyIdToken(authorizationHeader)`: returns `{ uid, role }` from custom claims.
* Middleware helper to guard `admin` routes.

**One‑time admin claim route (delete after use)**

* `app/api/admin/set-claims/route.ts` → `POST { uid, role }` with `WEBHOOK_SECRET`.

**Access checks**

* `lib/access.ts` → helpers:

  * `requireRole(role: 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER')`
  * `checkModule(userId, projectId, module)`

---

## 9) Storage Rules & Signed URLs

**Firebase Storage Rules** (starter)

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuth() { return request.auth != null; }

    // Contractor uploads: write only to own folder; reads via signed URLs
    match /projects/{projectId}/contractors/{uid}/{rest=**} {
      allow write: if isAuth() && request.auth.uid == uid;
      allow read: if false;
    }

    // Plans live under /projects/{projectId}/plans/* — read via signed URLs only
    match /projects/{projectId}/plans/{rest=**} {
      allow read, write: if false;
    }
  }
}
```

**Signed URL API**: `app/api/signed-url/route.ts`

* `POST { storagePath, expiresIn }` → returns short‑lived download URL after verifying current user has access.

---

## 10) Admin & Contractor Dashboards

**Admin Dashboard widgets** (blocks):

* Tasks (Today/This Week)
* Week Calendar
* Contacts (Follow‑ups today/overdue)
* Budget Exceptions (>10% variance)
* Procurement (Due this week)
* Risks (Open, by score)
* Plans (Latest per category)

**Contractor Dashboard top actions** (show only if allowed via `UserModuleAccess`):

* **Request**: Site Visit / Meeting / Work Block (3‑step wizard → `ScheduleEvent` with `REQUESTED`)
* **Upload Invoice** (PDF + small form: amount, tax, link to budget item)
* **Upload Files/Photos** (proof, RFI)
* **View Plans** (only shared & permitted)
* **My Tasks** (assigned to me)
* **My Schedule** (approved + pending)

**Admin → Contractor invite flow**:

* POST `/api/admin/invite-contractor` with `{ projectId, contactId, email, name, preset }`

  * Creates/gets Firebase user
  * Sets claim `role=CONTRACTOR`
  * Links Contact.userId
  * Upserts `UserModuleAccess` rows from **Preset**
  * Generates **password reset link** & sends via n8n email
  * No plaintext passwords ever

---

## 11) API Endpoints (Shapes)

* `POST /api/admin/invite-contractor`
  **In**: `{ projectId, contactId, email, name, preset }`
  **Out**: `{ ok: true }`

* `POST /api/webhooks/gmail-inbound` (from n8n)
  **Headers**: `x-webhook-secret`
  **In**: `{ from, senderEmail, subject, snippet, receivedAt, projectId }`
  **Action**: upsert Contact by email → create ScheduleEvent(type=EMAIL\_FOLLOWUP, status=PLANNED) + Task("Reply: …")

* `POST /api/webhooks/calendar-event` (from n8n)
  **In**: `{ googleEventId, start, end, title, attendees, projectId }`
  **Action**: upsert ScheduleEvent by googleEventId

* `POST /api/signed-url`
  **In**: `{ storagePath, expiresIn }`
  **Out**: `{ url }` if user has rights.

---

## 12) n8n Flows

1. **Gmail → App**

   * Trigger: Gmail (Label `Construction/Inbound`)
   * HTTP POST → `/api/webhooks/gmail-inbound` (with `x-webhook-secret`)
   * App creates **Contact**, **ScheduleEvent**, **Task**

2. **Calendar Outbound (App → Google)**

   * Every 2 min: fetch events where `needsCalendarSync=true` (expose `/api/export/pending-calendar` or use Firestore/DB query via an app endpoint)
   * Create/Update Google Calendar event
   * PATCH back `googleEventId`, `needsCalendarSync=false`

3. **Calendar Inbound (Google → App)**

   * Trigger: Google Calendar updated/new event
   * POST → `/api/webhooks/calendar-event` to upsert ScheduleEvent

4. **Reply Tracker**

   * Trigger: Gmail Sent matching thread
   * POST → `/api/schedule/{id}` to set `{ replied: true }`

5. **Plan Analysis (optional)**

   * Trigger: File added to Firebase Storage under `/projects/{projectId}/plans/*`
   * Download via **signed URL** (from an app webhook) or service account
   * AI node (Claude/OpenAI) → extract metadata → POST to `/api/plans/analyze` to store

6. **Notifications**

   * Contractor invite → email magic link
   * New schedule request → notify admin
   * Invoice status changes → notify contractor

> **Claude**: generate minimal n8n JSON exports for these flows or provide pictured node lists with configuration instructions.

---

## 13) Storybook & Design System

1. Setup Storybook; theme with dark graphite.

2. Build core components first & document:

   * **Atoms**: Button, IconButton, Badge, Tag, Avatar, Tooltip
   * **Inputs**: TextField, TextArea, Select, DateTimePicker, FileDropzone, Toggle, Checkbox
   * **Molecules**: Card (glass), Modal, Drawer, Tabs, Steps (Wizard), Toast
   * **Data**: DataTable (TanStack), KanbanColumn, KPIWidget, Calendar (Week)
   * **Layouts**: PageShell (sidebar + header), DashboardGrid, EmptyState
   * **Special**: AccessChecklistGrid (modules × permissions)

3. Create stories for Admin Dashboard widgets and Contractor top‑actions.

---

## 14) Docker & Reverse Proxy

**`Dockerfile`** (Next.js minimal, Node 20)
**`docker-compose.yml`** (VPS):

```yaml
version: '3.9'
services:
  app:
    build: .
    env_file: .env
    restart: always
    ports: [ "3000:3000" ]
  n8n:
    image: n8nio/n8n:latest
    restart: always
    environment:
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PORT=5678
    ports: [ "5678:5678" ]
  caddy:
    image: caddy:latest
    restart: always
    ports: [ "80:80", "443:443" ]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
```

**`Caddyfile`**

```
control.yourdomain.com {
  reverse_proxy app:3000
}

n8n.yourdomain.com {
  reverse_proxy n8n:5678
}
```

> **Claude**: ensure HTTPS certificates via Caddy’s automatic TLS (DNS must point to VPS).

---

## 15) CI/CD (GitHub Actions)

* On push to `main`: build Docker image, push to registry, pull on VPS (watchtower) or SSH deploy.
* Run `prisma migrate deploy` on container start.

---

## 16) Testing (Playwright E2E)

Create basic E2E:

1. **Admin invite → contractor login** (magic link flow simulated) → contractor sees only allowed modules.
2. **Contractor uploads invoice** (PDF) → admin sees it → status `RECEIVED → APPROVED`.
3. **Contractor requests site visit** → admin approves → event appears on Google Calendar.
4. **Budget exception** view shows items where `ABS((committedTotal-estTotal)/estTotal) > 0.10`.

---

## 17) Performance & Security Notes

* Store UTC in DB; format client‑side.
* Validate all inputs with **zod**.
* Rate‑limit webhook endpoints by IP & secret.
* AuditLog writes for sensitive actions (budget edits, invoice state changes).
* Admin 2FA in Firebase Auth.

---

## 18) Developer Tasks (Make It So)

**Claude, perform in this order:**

1. **Scaffold** Next.js + Tailwind + shadcn/ui + Storybook project as per structure.
2. Add **Firebase client/admin** libs; implement **auth.ts** (token verify, role claims).
3. Add **Prisma** with the schema above; run `prisma migrate dev`; implement **seed.ts** (Miami project + \$25k Footings).
4. Implement **Storage rules** and **signed URL API**.
5. Build **Admin Dashboard** page shell + widgets (dummy data → hook Prisma).
6. Build **Contractor Dashboard** with top actions & module checks.
7. Implement **/api/admin/invite-contractor** (create Firebase user, set claims, link Contact, apply preset, send password reset link via n8n webhook).
8. Implement **webhooks** (`/api/webhooks/gmail-inbound`, `/api/webhooks/calendar-event`) with `WEBHOOK_SECRET`.
9. Wire up **n8n** flows (provide minimal configs or JSON export).
10. Add Storybook stories for components; apply **Graphite/Glass** theme.
11. Add **Dockerfile**, **docker-compose.yml**, **Caddyfile**; document `.env`.
12. Implement **Playwright** tests for core flows.
13. Add **README.md** with setup, envs, and run instructions.

---

## 19) README (What to Output)

Claude, generate a `README.md` that includes:

* Overview and stack
* Exact **env var** setup
* Firebase setup steps (Auth providers, service account, Storage rules)
* Postgres (Neon/Supabase) setup & migration steps
* Running locally (docker-compose) and deploying to VPS
* n8n flows setup (Gmail/Calendar creds, webhook URLs)
* Admin bootstrap (set claims route → delete)
* Seed command (`prisma db seed`)
* Testing commands (Playwright)
* Security checklist

---

## 20) Access Presets (Examples)

* **Field Contractor**
  `TASKS(view), SCHEDULE(request), PLANS(view), UPLOADS(upload), INVOICES(upload)`
* **Supplier**
  `PROCUREMENT_READ(view), INVOICES(upload)`
* **Viewer**
  `PLANS(view), DOCS_READ(view)`

> Claude: store presets as constants and apply in `invite-contractor`.

---

## 21) Queries (Reporting Snippets)

**Budget Exceptions**

```sql
SELECT id, discipline, item, est_total, committed_total,
  (committed_total - est_total) / NULLIF(est_total, 0) AS variance
FROM budget_items
WHERE project_id = $1
  AND ABS((committed_total - est_total) / NULLIF(est_total, 0)) > 0.10
ORDER BY variance DESC;
```

**Paid by Vendor (future when payments table exists)** — placeholder for roadmap.

---

## 22) Roadmap (Post‑launch)

* Payments & Change Orders
* Vendor W‑9 & insurance uploads + expiry reminders
* Metabase dashboards
* PWA polish (installable, offline plans)
* Timesheets & check‑in/out (optional)

---

### Final Notes to Claude

* Keep code **minimal, typed, and organized**.
* Prefer **server actions / route handlers** with explicit auth checks.
* Never store plaintext passwords; use **password reset links** or **email sign‑in links**.
* Use **module access checks** before returning signed URLs or records.
* Prioritize **Admin and Contractor** flows first; other modules can stub and iterate.

**Deliverables**: a working repo with the structure above, initial migrations, seed data, core pages & APIs, n8n flow outlines/exports, Docker + Caddy config, and a complete README.

---

**END OF PROMPT**
