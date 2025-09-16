Absolutely—here is the **final, consolidated, battle‑hardened master prompt** you can drop into your repo as:

```
FAXAS_PROPERTY/CLAUDE_CODE_DASHBOARD_MASTER_PROMPT.md
```

It includes everything: Plan‑Mode gates, MCP tool usage (Puppeteer + Online Search), strict invariants, phased execution with stop points, allowed‑path enforcement, JSON reply envelope, required repo artifacts, widget specs, design standards, self‑review, acceptance criteria, and turnkey kickoff prompts.

---

# CLAUDE\_CODE\_DASHBOARD\_MASTER\_PROMPT.md

**Audience:** Claude Code Opus 4.1 in CCO4.1 with MCP tools
**Mode:** Start and remain in **PLAN MODE** until explicitly approved to implement.
**Goal:** Deliver an **industry‑leading**, **mobile‑first** Admin Dashboard at `/app/admin/page.tsx` that raises the visual + structural bar **without** breaking our architecture/design system.

---

## 0) COMPLIANCE CONTRACT (acknowledge before anything else)

Reply first with:

```
ACK:
- Plan Mode detected: <yes/no>
- MCP tools detected: <list tool names>
- Repo root resolved: <path or url>
- Will stop at each checkpoint until approved: <yes>
```

If Plan Mode is **not** active → **STOP**. Ask to enable Plan Mode. Do not proceed.

---

## 1) TOOL PREFLIGHT (must pass or STOP)

You **must** verify MCP tools before planning:

* **Puppeteer MCP**: navigation, type, click, screenshot available.
* **Online Search MCP**: available for market research.

Return:

```
TOOL_PREFLIGHT:
- puppeteer: <available yes/no> (methods: <list>)
- search: <available yes/no>
- login plan: /login → fill email+password → wait for admin dashboard marker
```

If Puppeteer is unavailable, STOP and ask to connect it.

---

## 2) NON‑NEGOTIABLE INVARIANTS (do not violate)

### Design

1. **No gradients or new color ramps.** Use the existing graphite dark theme + accent **`#8EE3C8`**.
2. Use `.glass-card` for all dashboard surfaces; spacing: **`p-4` mobile**, **`p-6` desktop**; gaps **`gap-4 md:gap-6`**.
3. **Mobile‑first**: support **320px** width. Apply bottom safe‑area padding:
   `pb-[calc(env(safe-area-inset-bottom)+88px)]`.
4. **Touch targets ≥ 48px**.

### Architecture

1. **One FAB only**: use `components/blocks/PageShell.tsx` via `onFabClick`. **Never create another FAB.**
2. **No ad‑hoc fetches in components.** Use hooks in `hooks/use-api.ts`. If data is missing, propose **one minimal typed hook** there (with `queryKey`, params, and return type) and use it.
3. **No invented fields.** Only schema‑backed data/endpoints.
4. **Navigation**: replicate the Task page pattern (`next/navigation`). **Every CTA must navigate or open an implemented sheet/dialog.**
5. **Every widget** ships with **loading skeleton** and **empty state**.

### Accessibility & Motion

* Any transition/animation **must** honor `@media (prefers-reduced-motion: reduce)`.
* Any global contrast change requires **WCAG 2.1 SC 1.4.3** proof (**≥ 4.5:1** for normal text). Provide **before/after ratios** and CSS showing reduced‑motion handling.

If any invariant conflict arises → **STOP** and propose the **smallest compliant change**.

---

## 3) REQUIRED REPO ARTIFACTS (must be created/updated)

* `DASHBOARD_ANALYSIS.md` — what you learned + BEFORE screenshots and issues list.
* `DASHBOARD_STATUS.md` — checkbox tracker by phase + widget.
* `docs/AI_RUNLOG.md` — time‑stamped log: tools called, parameters, files touched, screenshot paths, unresolved risks.
* `docs/DESIGN_FOUNDATIONS.md` & `docs/UI_PATTERNS.md` — codify visual language and patterns so the design scales beyond this page.

Do **not** move to the next phase until these files exist and are updated.

---

## 4) PHASED EXECUTION (hard stop points)

### **PHASE 0 — System + UX Discovery (STOP after output)**

1. Read files in this order:
   `app/globals.css` → `components/blocks/PageShell.tsx` → `app/admin/tasks/page.tsx` → `hooks/use-api.ts` → `components/ui/*`
2. **Puppeteer BEFORE** (mandatory):

   * Go to `/login`, log in with provided test account (see §15).
   * Open `/admin`.
   * Capture screenshots:

     * **Mobile** iPhone 14 Pro (390×844 @3x): `screens/admin_before_mobile.png`
     * **Desktop** 1440×900: `screens/admin_before_desktop.png`
   * Note: spacing, overflow, FAB collisions, contrast issues.
3. **Online Search MCP**:

   * Summarize **8–10 universal dashboard principles** (with citations).
   * Summarize **6–8 construction dashboard patterns/widgets** (with citations).
4. Write/update: `DASHBOARD_ANALYSIS.md` and `docs/AI_RUNLOG.md`.

**REPLY FORMAT (PHASE 0 only):**

* **ACK**
* **TOOL\_PREFLIGHT**
* **ANALYSIS** (files opened + 5–10 insights + screenshot paths + issues list)
* **RESEARCH\_SUMMARY** (principles/patterns with citations)
* **PLAN** (see §8)
  **STOP** and wait for approval.

---

### **PHASE 1 — Scaffold & Design Standard (STOP after output)**

Allowed edits (see §11 allowlist):

* `app/admin/page.tsx`: PageShell + grid + safe‑area padding; wire existing FAB (`onFabClick`) to **Quick Actions sheet** (mobile bottom sheet, desktop right drawer).
* `components/ui/sheet.tsx`: only if needed for the Quick Actions behavior.
* `components/dashboard/Widget.tsx`: light wrapper applying `.glass-card p-4 md:p-6`.
* `docs/DESIGN_FOUNDATIONS.md` and `docs/UI_PATTERNS.md`: initial versions.
* `app/globals.css`: **only if** WCAG contrast fails; include proof and `prefers-reduced-motion` handling.

Grid requirements:
`grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-6` (hero card may `lg:col-span-2`).

**REPLY FORMAT (PHASE 1 only):**

* **PATCHES** (full files or unified diffs; no ellipses)
* **PUPPETEER\_VERIFICATION\_AFTER** (mobile + desktop screenshots with paths; list deltas vs BEFORE)
* **DESIGN\_STANDARD** (the two docs generated/updated)
* **SELF\_REVIEW CHECKLIST** (see §12)
* **NEW\_FILES** / **MODIFIED\_FILES** tables
  **STOP** for approval.

---

### **PHASE 2 — Data Wiring & Widgets (iterate in small batches; STOP after each batch)**

* Implement widgets (see §7) in batches of **2–3 widgets**.
* Use existing hooks. If missing, add **one minimal typed hook** to `hooks/use-api.ts` (with `queryKey`, params, typed return).
* Each widget: `.glass-card p-4 md:p-6`, loading + empty states, real CTA.
* Update `DASHBOARD_STATUS.md` and `docs/AI_RUNLOG.md`.
* End each batch with **PUPPETEER\_VERIFICATION\_AFTER** (mobile + desktop), and **SELF\_REVIEW CHECKLIST**.
  **STOP** after each batch.

---

### **PHASE 3 — Polish, A11y, Performance (STOP after output)**

* Tighten spacing/responsive behavior at **320/390/768/1024/1440**.
* Motion via presets; **respect `prefers-reduced-motion`**.
* Keyboard navigation and ARIA roles/labels.
* Performance: no widget blocks main thread > **120ms**; `dynamic(import)` heavy subcomponents.
* Final **PUPPETEER\_VERIFICATION\_AFTER**, **SELF\_REVIEW**, and **NEXT\_STEPS**.
  **STOP** for final approval.

---

## 5) QUICK ACTIONS (via PageShell FAB)

Connect `onFabClick={handleQuickActions}` to a sheet/modal offering:

* Add Task → `/admin/tasks/new`
* Schedule Event → `/admin/schedule/new`
* Add Contact → `/admin/contacts/new`
* Upload Document → `/admin/documents` *(or existing upload modal)*

**Never create a second FAB.**

---

## 6) DESIGN SYSTEM & PATTERNS (outputs required in PHASE 1)

### `docs/DESIGN_FOUNDATIONS.md` (create/update)

* **Color tokens:** graphite background scale; accent `#8EE3C8`; semantic tokens (success/info/warn/destructive) mapped to existing palette.
* **Typography:** system stack; size scale **12/14/16/18/20/24/30/36**; weights **400/500/600/700**; clear usage rules.
* **Spacing & Layout:** 4px base; paddings; grid defaults `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`; consistent vertical rhythm.
* **Surfaces:** `.glass-card` only; elevation via subtle border + blur; **no shadows, no gradients**.
* **Motion:** Framer Motion presets (fade, slide‑up, stagger); respect `prefers-reduced-motion`.
* **Interactive states:** visible focus, hover/pressed; min **48px** targets; button hierarchy.
* **Accessibility:** contrast ≥ **4.5:1** normal text, ≥ **3:1** large; focus order; ARIA roles.

### `docs/UI_PATTERNS.md` (create/update)

* **Widget anatomy:** header (title + icon + CTA), content zone, meta/footer; sizes; when to use lists vs stat blocks.
* **Card variants:** stat, list, chart‑free by default (no fake sparklines).
* **Empty states:** icon + concise copy + single primary action.
* **Loading:** skeleton mirroring final layout (no spinner‑only).
* **Navigation:** whole‑card link **or** explicit CTA; follow Tasks page router pattern.
* **Mobile rules:** stacking order, truncation, two‑line max titles, safe‑area padding.
* **Error states:** in‑card banner + retry action.
* **Do/Don’t gallery:** quick examples (add later with screenshots).

---

## 7) WIDGET SUITE (to implement in PHASE 2)

All widgets: `.glass-card p-4 md:p-6`, loading + empty states, and real CTA.

1. **Project Overview** — `currentProject` (name, address, totals if present). CTA: `/admin/projects/[id]`.
2. **Task KPIs (4 cards)** — `useTasks({ projectId })`; metrics: `dueToday`, `overdue`, `completed (7d)`, `total`. CTA: `/admin/tasks?filter=…`.
3. **Today’s Priority Tasks** — due today + overdue (limit 5). CTA: `/admin/tasks`.
4. **Today’s Schedule** — `useTodaySchedule(projectId)` *(add hook if missing)*. CTA: `/admin/schedule`.
5. **Budget Health** — `useBudgetSummary(projectId)`; role logic:

   * ADMIN/STAFF → show amounts; CONTRACTOR → percentages only; VIEWER → status only. CTA: `/admin/budget`.
6. **Budget Exceptions** — `useBudgetExceptions(projectId)` *(add if missing)*; show count + top 3 overruns. CTA: `/admin/budget/exceptions`.
7. **Procurement Pipeline** — `useProcurementSummary(projectId)` *(add if needed)*; stages Draft→Pending→Approved→Ordered. CTA: `/admin/procurement`.
8. **RFP/Bidding Status (beta)** — `useRfpSummary(projectId)` *(add if needed)*; Draft, Published, Due soon, Awarded. CTA: `/admin/rfp`.
9. **Team & Vendors** — `useContacts(projectId)` (active filter). CTA: `/admin/contacts`.
10. **Weather Impact (lightweight)** — `/api/weather` if present; today + brief forecast. CTA: `/admin/schedule`.
11. **Recent Activity / Audit** — `useAuditFeed(projectId)` (optional). CTA: `/admin/activity`.

If an endpoint/hook is missing → **STOP** and propose the **minimal** new hook for `hooks/use-api.ts` (name, params, `queryKey`, return shape), then proceed.

---

## 8) WHAT “PLAN” MUST CONTAIN (PHASE 0 output)

* **Design Enhancements** within constraints (typography sizing, spacing rhythm, motion presets).
* **Information Architecture**: named zones, grid map (1/2/4‑col behavior), vertical rhythm, safe‑area plan.
* **Widget list** with for each: purpose, hook(s), loading + empty behavior, CTA route.
* **Files to add/modify** (paths + 1‑line purpose).
* **Risk register** (top risks + mitigations).
* **Parallelization** (what to research or script while coding—e.g., design guard, snapshot diffs).

---

## 9) CODING RULES (when approved to exit Plan Mode)

* Provide **complete files** or **unified diffs**. **No ellipses.**
* Strict TypeScript; no `any`.
* Modify **only** the files listed in PLAN for the current phase.
* Small, reversible commits per batch (scaffold → 2–3 widgets → polish).
* If a constraint conflicts with code, **STOP** and propose the smallest compliant change.

---

## 10) PUPPETEER VERIFICATION (BEFORE & AFTER)

Both BEFORE (PHASE 0) and AFTER (every implementing phase/batch):

* **Mobile** iPhone 14 Pro (390×844 @3x) → `screens/admin_[before|after]_mobile.png`
* **Desktop** 1440×900 → `screens/admin_[before|after]_desktop.png`
* Include a short delta list: spacing changes, overflow resolved, FAB alignment, contrast check, mobile safe‑area correctness.

---

## 11) ADVANCED ENFORCEMENT

### A. Phase path allowlists (hard boundary)

If a file is not listed for the phase, **do not** modify it.

**PHASE\_1\_ALLOWED\_PATHS**

* `app/admin/page.tsx`
* `components/ui/sheet.tsx` *(only if required for Quick Actions sheet behavior)*
* `components/dashboard/Widget.tsx`
* `components/dashboard/QuickActionsSheet.tsx`
* `docs/DESIGN_FOUNDATIONS.md`
* `docs/UI_PATTERNS.md`
* `DASHBOARD_ANALYSIS.md`
* `DASHBOARD_STATUS.md`
* `docs/AI_RUNLOG.md`
* `app/globals.css` *(ONLY with WCAG proof)*

**PHASE\_2\_ALLOWED\_PATHS** (per widget batch)

* `app/admin/page.tsx`
* `components/dashboard/*` *(ONLY new widgets declared in PLAN)*
* `hooks/use-api.ts` *(ONLY for the minimal typed hook previously approved)*
* `DASHBOARD_STATUS.md`
* `docs/AI_RUNLOG.md`

**PHASE\_3\_ALLOWED\_PATHS**

* `app/admin/page.tsx`
* `components/dashboard/*`
* `docs/DESIGN_FOUNDATIONS.md`
* `docs/UI_PATTERNS.md`
* `DASHBOARD_STATUS.md`
* `docs/AI_RUNLOG.md`
* `app/globals.css` *(ONLY for a11y‑proofed adjustments)*

If you believe a file outside the allowlist must change, **STOP** and request approval with rationale.

### B. Refusal triggers (must STOP)

* Puppeteer MCP or Online Search MCP unavailable.
* Plan Mode OFF.
* Required artifacts missing for the current phase.
* Requested change violates §2 invariants.
* Needed data is not available and a minimal hook hasn’t been approved.

### C. Machine‑checkable reply envelope (prepend to each reply)

Add this JSON block before your sections (then your human‑readable output):

```json
{
  "phase": "PHASE_0 | PHASE_1 | PHASE_2 | PHASE_3",
  "sections_provided": ["ACK","TOOL_PREFLIGHT","ANALYSIS","RESEARCH_SUMMARY","PLAN","PATCHES","PUPPETEER_VERIFICATION_AFTER","SELF_REVIEW","NEW_FILES","MODIFIED_FILES","DESIGN_STANDARD","NEXT_STEPS"],
  "passed_gates": {
    "plan_mode": true,
    "tool_preflight": true,
    "artifacts_written": ["DASHBOARD_ANALYSIS.md","docs/AI_RUNLOG.md"]
  },
  "allowed_paths_only": true,
  "needs_approval": true,
  "notes": ""
}
```

If a section isn’t required for this phase, omit it from `sections_provided`. `allowed_paths_only` must be `true`.

### D. Progress tracking (must update)

At the end of each phase/batch, update:

* `DASHBOARD_STATUS.md` (checkboxes)
* `docs/AI_RUNLOG.md` (timestamp, tools + params, files touched, screenshot paths, unresolved risks)

### E. Design guard (soft check)

If proposing `globals.css` changes, include:

* BEFORE vs AFTER color/opacity
* Computed contrast ratios (and text size)
* `@media (prefers-reduced-motion: reduce)` CSS
* Why this is required (1–2 lines)

### F. STOP words (forbidden concepts)

If your plan includes any of the below, remove them and re‑plan:

* New FAB, new layout framework, new color ramps, gradients, drag‑and‑drop framework, custom chart libraries without real historical data, consolidated “mega‑hook” that bypasses existing hooks.

---

## 12) SELF‑REVIEW CHECKLIST (must pass before asking to commit)

* [ ] Exactly **one FAB** (from PageShell) wired to Quick Actions; no duplicates.
* [ ] All CTAs navigate or open a real sheet/dialog (no dead buttons).
* [ ] **Mobile 320px**: no overflow; **48px** touch targets; safe‑area padding applied.
* [ ] **No gradients**; accent `#8EE3C8`; `.glass-card` everywhere.
* [ ] Each widget has loading + empty states.
* [ ] Strict TS builds; lint passes.
* [ ] Any contrast change: WCAG ≥ 4.5:1 proven; motion honors `prefers-reduced-motion`.
* [ ] **Puppeteer AFTER** screenshots attached; deltas vs BEFORE listed.
* [ ] `DASHBOARD_STATUS.md` and `docs/AI_RUNLOG.md` updated.

---

## 13) ACCEPTANCE CRITERIA (final gate)

* All items in §12 are true.
* `DESIGN_FOUNDATIONS.md` and `UI_PATTERNS.md` exist and are followed.
* **No invented data**; only schema‑backed via hooks.
* Clear UX uplift in AFTER screenshots; no regressions (overlaps, scroll traps, FAB collisions).
* Code is small, reviewable commits aligned with the phase allowlist.

---

## 14) COMMIT/BRANCH PRACTICE (for later)

* Branch: `feat/dashboard-v1`.
* Commits: small and focused—e.g., `feat(dashboard): scaffold + quick actions sheet`, `feat(dashboard): add task-kpis widget`.
* Only merge after each phase/batch passes the SELF‑REVIEW + AFTER screenshots.

---

## 15) TEST ACCOUNT (Puppeteer login)

```
Email:    admin@schoolworldvacation.com
Password: 121993Pw
```

Use only for local/dev verification.

---

## 16) KICKOFF MESSAGE (paste this in Plan Mode)

> You are in PLAN MODE. Load and follow `FAXAS_PROPERTY/CLAUDE_CODE_DASHBOARD_MASTER_PROMPT.md`.
> Run **PHASE 0** now and **STOP** after it:
>
> 1. TOOL\_PREFLIGHT: list Puppeteer & Search MCP tools; confirm Plan Mode.
> 2. Read the required files (globals → PageShell → tasks page → hooks/use-api.ts → components/ui/\*).
> 3. Puppeteer BEFORE: log in with the test account; capture `/admin` at iPhone‑14‑Pro (390×844 @3x) and 1440×900; list spacing/overflow/FAB/contrast issues.
> 4. Online Search MCP: compile universal dashboard principles + construction‑specific patterns (with citations).
> 5. Write `DASHBOARD_ANALYSIS.md` and `docs/AI_RUNLOG.md`.
>    Return **only**: ACK, TOOL\_PREFLIGHT, ANALYSIS, RESEARCH\_SUMMARY, PLAN. Prepend the JSON reply envelope (§11.C). **STOP** for approval.

---

## 17) PHASE‑1 IMPLEMENTATION MESSAGE (after you approve the PLAN)

> Proceed with **PHASE 1 (scaffold & design standard)**—manual approval per edit:
> Allowed files only (see allowlist):
>
> * `app/admin/page.tsx`: PageShell + grid + `pb-[calc(env(safe-area-inset-bottom)+88px)]`; wire FAB to Quick Actions **sheet** (mobile bottom sheet / desktop right drawer).
> * `components/ui/sheet.tsx` (only if required).
> * `components/dashboard/Widget.tsx` (wrapper applying `.glass-card p-4 md:p-6`).
> * `docs/DESIGN_FOUNDATIONS.md`, `docs/UI_PATTERNS.md` (initial versions).
> * `app/globals.css` **only if** WCAG contrast fails (include proof & reduced‑motion CSS).
>   Deliver **PATCHES**, **PUPPETEER\_VERIFICATION\_AFTER**, **DESIGN\_STANDARD**, **SELF\_REVIEW**, and **NEW/MODIFIED FILES**. **STOP** for review.

---

## 18) PHASE‑2 WIDGET BATCH MESSAGE (repeat for each 2–3 widget batch)

> Implement the next 2–3 widgets from the PLAN using existing hooks (add **one minimal typed hook** to `hooks/use-api.ts` only if missing). Each widget must include loading + empty states and a real CTA.
> Deliver **PATCHES**, update `DASHBOARD_STATUS.md` + `docs/AI_RUNLOG.md`, run **PUPPETEER\_VERIFICATION\_AFTER** (both viewports), and complete the **SELF\_REVIEW CHECKLIST**. **STOP** for review.

---

## 19) MCP SANITY CHECK (optional quick test before PHASE 0)

> List Puppeteer MCP tool methods and perform a dry login + one screenshot to `screens/_sanity.png`. Do not proceed further—just confirm tools are operational.

---

**End of master prompt.**
