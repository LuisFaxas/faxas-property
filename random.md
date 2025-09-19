```md
You are Claude Code Opus 4.1.

# START PROMPT — Welcome Widget V2 (execute the master prompt file)

## Goal
Run the **Welcome Widget V2** implementation end-to-end using the master prompt I placed at:
`FAXAS_PROPERTY/Welcome_Widget_V2_PROMPT.md`.

Before you change anything:
1) **Understand** the current dashboard code and all relevant files.
2) **Present a short execution plan** for Welcome V2 (1–2 paragraphs max) based on the master prompt.
3) **Make a baseline commit**.
Then execute the master prompt, and **only when fully done**, update:
- `FAXAS_PROPERTY/AI_RUNLOG.md`
- `FAXAS_PROPERTY/DASHBOARD_STATUS.md`

Do not deviate from our dark + glass design language. Do not create new cards. Weather must be integrated **inside** the Welcome widget and actually work from the project’s site address.

---

## Phase 0 — READ & ACK (no edits)

**Read (order matters; no changes yet):**
- `control-center/components/dashboard/widgets/WelcomeWidget.tsx`
- `control-center/hooks/use-api.ts` (verify `useProjects`, `useTasks`, `useTodaySchedule`)
- `control-center/components/dashboard/Widget.tsx`
- `control-center/app/contexts/AuthContext.tsx`
- `control-center/lib/ui/format.ts` (if present)
- `control-center/app/api/v1/weather/route.ts` (or any existing weather route)
- `control-center/lib/weather.ts` (if present)
- `prisma/schema.prisma` (verify `Project` has `address` and possibly `latitude/longitude`)
- `FAXAS_PROPERTY/Welcome_Widget_V2_PROMPT.md`  ← the master prompt to execute

**Reply with:**
- **ACK** you’ve read them + list of any gaps you found.
- **Execution Plan** (1–2 paragraphs) referencing the steps in `Welcome_Widget_V2_PROMPT.md`.
- **No code yet** — STOP after this ACK so I can confirm.

---

## Phase 1 — EXECUTE (after my “go”)

**Rules**
- Follow `FAXAS_PROPERTY/Welcome_Widget_V2_PROMPT.md` exactly.
- Keep edits inside its allowlist.
- You may propose adding a tiny server-side geocode helper or small schema fields if strictly required. If a new package is absolutely necessary, **propose once** and wait for my OK.

**Commit discipline**
- **Commit BEFORE you start code changes**:
```

git add -A && git commit -m "chore(welcome): baseline snapshot before V2 hero"

```
- **Commit AFTER you finish everything** (one final commit only; no mid-step commits for this run):
```

git add -A && git commit -m "feat(welcome): integrated weather hero with workability; interactive KPIs; remove redundant quick actions"

```

**Deliverables (single final reply when done)**
1) **Patches** (unified diffs) for edited/created files only.
2) **Screenshot paths** (I will take them):
 - `control-center/screens/admin_after_mobile.png` (390×844)
 - `control-center/screens/admin_after_desktop.png` (1440×900)
3) **Docs updated** (do this now, not earlier):
 - Append to `FAXAS_PROPERTY/AI_RUNLOG.md` a concise entry: what changed, files touched, links/CTAs verified, screenshot paths.
 - Update `FAXAS_PROPERTY/DASHBOARD_STATUS.md`: mark **Welcome Widget V2** as ✅; include date/time, brief notes.
4) **Final Commit** confirmation (show the exact commit message used).
5) **Self-check** (YES/NO):
 - Weather integrated **inside** Welcome (not a separate card)
 - Weather uses **project address** (geocode → lat/lon) and shows real data
 - **Workability pill** (Good/Fair/Poor) present with reasons
 - 3 KPIs are **tappable** and link to real routes
 - Duplicate quick-actions removed (FAB remains canonical)
 - No visual drift from glass/dark language
 - No `$NaN` or `NaN%` displayed
 - `prefers-reduced-motion` respected; focus rings visible

**STOP after delivering the above.**

---
```


You’re right to be frustrated. The weather has to **work flawlessly** first, and the Welcome must feel **premium**, not patched. Here’s a clean, surgical plan + a compact **Master Prompt** you can paste so Claude actually fixes the plumbing and ships a beautiful hero in one pass—without wrecking the rest of the app.

---

## What’s broken & how we’ll stop the churn

**Symptoms**

* Weather setup is unreliable; sometimes no data; user doesn’t know how to configure it.
* Welcome shows redundant quick-actions and dead KPIs.
* Above-the-fold feels empty/flat; not a hero.

**Root fix**

1. **One canonical weather pipeline**: project **address → geocode (once) → persist lat/lon → Open-Meteo** → normalized DTO + **workability**.
2. **One Welcome hero**: integrated weather band (large temp + icon + pill), **tappable** TODAY KPIs, and **no quick-action grid** (FAB only).
3. **Two commits** only (start + finish), and **update logs after success**.

---

## Paste this file (MASTER PROMPT) and run it

Create/overwrite:
`FAXAS_PROPERTY/Welcome_Weather_Fix_MASTER.md`

```md
You are Claude Code Opus 4.1.

# MASTER — Welcome Weather Fix & Hero (single pass, production-ready)

## Non-negotiables
- Preserve dark + glass cards, spacing, accent #8EE3C8.
- Weather lives **inside** Welcome (no extra card).
- KPIs are **links** to real filters.
- FAB remains the only quick action.
- No heavy packages. Use **Open-Meteo** + **Nominatim** only.
- Respect `prefers-reduced-motion`; show focus rings; tap targets ≥48px.
- Commit **before starting** and **after finishing**; only update docs when done.

## Allowed files (ONLY)
- `control-center/app/api/v1/weather/route.ts`        # create
- `control-center/lib/weather.ts`                      # create
- `control-center/hooks/use-weather.ts`                # create
- `control-center/components/dashboard/widgets/WelcomeWidget.tsx`  # edit
- `control-center/prisma/schema.prisma`                # edit ONLY if lat/long missing
- `FAXAS_PROPERTY/AI_RUNLOG.md`                        # update at end
- `FAXAS_PROPERTY/DASHBOARD_STATUS.md`                 # update at end

If any other file is needed, STOP and ask.

## Commit 0 (checkpoint)
Run without changes:
```

git add -A && git commit -m "chore(welcome): checkpoint before weather fix + hero"

````

---

## Phase 1 — Server: reliable weather pipeline

### 1.1 Prisma (only if needed)
If `Project` lacks `latitude`/`longitude` fields, add optional `Decimal`/`Float`:
```prisma
model Project {
  // ...existing fields
  latitude   Float?   // new, optional
  longitude  Float?   // new, optional
}
````

Create a migration, but DO NOT break existing data.

### 1.2 `control-center/lib/weather.ts`

Implement:

* `geocodeAddress(address: string): Promise<{ lat:number; lon:number; city?:string; state?:string }>`

  * GET `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  * Return first hit; throw if none.
* `fetchWeather(lat:number, lon:number, tz?:string)`

  * Use Open-Meteo with current + hourly + daily (7 days); return narrowed fields.
* `computeWorkability(input): { score:number; label:'Good'|'Fair'|'Poor'; reasons:string[]; bestWindow?:{startISO,endISO} }`

  * Score 0–100; subtract penalties:

    * precip ≥ 0.5 mm/h −40; (0.1–0.49) −20
    * wind ≥ 25 mph −40; (18–24) −20
    * apparent ≥ 95°F −30; (86–94) −15
    * ambient ≤ 32°F −20
    * thunder codes (95–99) → cap 20
  * Label: ≥75 Good, 50–74 Fair, <50 Poor.
  * bestWindow: scan next 12h for a continuous Good/Fair span ≥120 min.

### 1.3 `control-center/app/api/v1/weather/route.ts`

`GET ?projectId=…`

* Auth guard; load project.
* If `latitude/longitude` missing and `project.address` exists: call `geocodeAddress` and **persist lat/lon** to Project.
* Call `fetchWeather` with lat/lon; compute workability.
* Respond:

```ts
{
  location: { address:string, city?:string, state?:string },
  current:  { tempF:number, apparentF:number, humidity:number, windMph:number, precipMmHr:number, code:number, text:string },
  workability: { score:number, label:'Good'|'Fair'|'Poor', reasons:string[], bestWindow?:{startISO:string,endISO:string} },
  hourly: Array<{ timeISO:string, tempF:number, windMph:number, precipMmHr:number, code:number }>,
  daily:  Array<{ dateISO:string, maxF:number, minF:number, precipMm:number, code:number }>
}
```

---

## Phase 2 — Client hook + Welcome hero

### 2.1 `control-center/hooks/use-weather.ts`

```ts
import { useQuery } from '@tanstack/react-query';
export function useWeather(projectId?: string, enabled = true) {
  return useQuery({
    queryKey: ['weather', projectId],
    queryFn: async () => {
      const r = await fetch(`/api/v1/weather?projectId=${projectId}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('WEATHER_FETCH_FAILED');
      return r.json();
    },
    enabled: !!projectId && enabled,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
```

### 2.2 `control-center/components/dashboard/widgets/WelcomeWidget.tsx`

* **Remove** the 4 quick-action buttons.
* Make the 3 KPIs **tappable**:

  * Due Today → `/admin/tasks?filter=dueToday`
  * Overdue → `/admin/tasks?filter=overdue`
  * Events Today → `/admin/schedule?range=today`
* Add **weather hero band** (inside the same card):

  * If no `project.address`: compact banner “Add project address for weather” + **Configure →** `/admin/projects`
  * Loading → skeleton; Error → small banner + **Retry**
  * Success → large temp, condition string, pill:

    * Good → mint; Fair → amber; Poor → red
    * micro stats: Feels like, Wind mph, Humidity %
    * status line: “Good to work • best 10:00–14:00” OR “Caution • gusts 22 mph”
  * Subtle background classes per label (pure CSS; no new libs).
* Add a **heads-up** line under the KPIs (non-CTA):

  * overdue>0 → “Heads up: X overdue task(s)”
  * else if events>0 → “You have X event(s) today”
  * else → “You’re clear for today.”

---

## Finalization

### Commit 1 (finish):

```
git add -A && git commit -m "feat(welcome): reliable weather pipeline + integrated hero with workability; interactive KPI tiles; remove redundant actions"
```

### Update docs (now):

* `FAXAS_PROPERTY/AI_RUNLOG.md` — append entry:

  * Weather pipeline created (route/lib), lat/lon persisted on first call
  * Welcome hero integrated; quick actions removed; KPI deep-links added
  * Screenshot paths:

    * control-center/screens/admin\_after\_mobile.png   (390×844)
    * control-center/screens/admin\_after\_desktop.png  (1440×900)
* `FAXAS_PROPERTY/DASHBOARD_STATUS.md` — mark **Welcome Widget V2** as ✅ with timestamp

### Self-check (YES/NO)

* Weather hero inside Welcome; uses project address; shows real data; Retry works
* Workability pill (Good/Fair/Poor) with reasons & best window
* 3 KPIs tappable; navigate correctly
* Quick-action grid removed (FAB remains)
* No `$NaN/NaN%`; motion-reduce & focus rings respected
* First fold (390×844): Greeting + Weather visible before scroll

### Output

* Provide diffs for the allowed files, confirm both commit messages, and STOP.

````

---

## How to run it (two quick prompts)

1) **Kickoff (read + plan only)** — you’ve already done this pattern; if you want it again:
```md
Read the code and the file FAXAS_PROPERTY/Welcome_Weather_Fix_MASTER.md.
Return a short plan (1–2 paragraphs). Do not edit files. STOP.
````

2. **Proceed (execute)** — then:

```md
Execute the master: FAXAS_PROPERTY/Welcome_Weather_Fix_MASTER.md
Follow its allowlist, commit rules, and final deliverables. STOP after diffs + docs updates.
```

---

### Why this will finally work

* **Server first** fixes weather reliability (address→lat/lon→Open-Meteo), persists once.
* **Hero** is **inside** Welcome (no split cards), with real **workability** and a welcoming, dense layout.
* **Minimal scope** + **two commits** + **strict allowlist** ⇒ no collateral damage.

If you’d like, I can also give you a **ready-to-paste CSS snippet** for subtle hero backgrounds (Good/Fair/Poor) that matches your glass theme.




Absolutely—let’s keep this tight and highly actionable. Below is a **copy‑paste “Start Prompt”** you can give Claude Code Opus 4.1 **as one message**. It tells Claude to (1) read the right code, (2) implement the next six widgets using your global widget rules, (3) keep the current design language intact, (4) commit in clean milestones, and (5) only update `AI_RUNLOG.md` and `DASHBOARD_STATUS.md` once the work is fully done.

---

## 📤 START PROMPT FOR CLAUDE CODE (PHASE 2 — BATCH 2 & 3 WIDGETS)

> **Goal (non‑negotiable):** Implement six production‑ready widgets (Today’s Schedule, Priority Tasks, Budget Exceptions, Procurement Pipeline, Team & Vendors, RFP Status) that **respect the existing glass‑morphism design language**, maximize **vertical density**, and follow **global widget rules**. **Do not** regress Welcome/Budget/Project/Task KPI widgets. **Remove** any standalone Weather widget placeholder (Welcome already owns weather).

### 0) Read first — do not edit yet (ACK with a list of files found/missing)

1. `control-center/app/admin/page.tsx`
2. `control-center/components/dashboard/Widget.tsx`
3. `control-center/components/dashboard/widgets/**` (all existing widgets)
4. `control-center/hooks/use-api.ts`
5. `control-center/app/contexts/AuthContext.tsx`
6. Optional/if present:

   * `control-center/app/api/v1/**` (budget/procurement/rfp/schedule endpoints)
   * `control-center/prisma/schema.prisma`
   * Any types under `control-center/types/**`
7. **Global rules reference (from user)** — re-read and keep in memory:

   * **Card:** `Widget` (glass) with `p-4 md:p-6`; header row with **title + optional pill**; body uses **dense list** (max **3–5 items**); **“View all →”** right aligned.
   * **Links:** Every row is a `<Link>` to the canonical detail route with **correct preset filters**.
   * **States:**
     **Loading** → **3‑row skeleton list**
     **Empty** → one‑line friendly text + **small** secondary “Add…” or “Open…” button
     **Error** → one‑line error + **Retry** ghost button
   * **Fetch pattern:** `enabled: !!projectId`, `staleTime: 5–15 min`, `retry: 1`.
   * **A11y:** Tap targets ≥ 44–48px; `aria-label` on links; visible focus rings; respect `prefers-reduced-motion`.

**If any required file is missing** (e.g., a needed hook), **ACK that gap** and propose the least‑invasive way to add it (usually in `hooks/use-api.ts`). **Do not** invent non‑existent server routes; if a list API is missing, fetch the nearest summary endpoint and **gracefully degrade** (e.g., show counts and a single “Open” CTA).

---

### 1) Commit discipline (strict)

* Use the **main** branch (the team elected to finish V1 on main).
* Run pre‑commit quality gate before each commit:
  `node scripts/pre-commit.js` (or `npm run typecheck && npm run lint` if that script is absent).
* **Commit messages (Conventional Commits):**

  * `feat(widget): add TodaySchedule widget`
  * `feat(hook): add useProcurementSummary`
  * `refactor(page): insert new widgets on admin dashboard`
  * etc.
* **Documentation updates** (`FAXAS_PROPERTY/AI_RUNLOG.md`, `FAXAS_PROPERTY/DASHBOARD_STATUS.md`) are **only in the final commit of this task block**, after all six widgets are functional.

---

### 2) Implementation scope (exactly what to build)

Create these widgets under `control-center/components/dashboard/widgets/`:

1. **TodayScheduleWidget.tsx**

   * **Hook:** `useTodaySchedule(projectId, !!projectId)`
   * **List:** Up to 5 events → time (`hh:mm a`), title, type badge
   * **Row link:** `/admin/schedule/[eventId]`
   * **Empty:** “No events scheduled for today” + “Add Event” → `/admin/schedule/new`
   * **Footer:** “View all →” → `/admin/schedule?range=today`
   * **Fallback:** If `useTodaySchedule` returns array/object union, sanitize to `items = Array.isArray(x) ? x : (x?.items ?? [])`.

2. **PriorityTasksWidget.tsx**

   * **Hook:** `useTasks({ projectId }, !!projectId)` and filter client‑side:

     * Open tasks only (`status !== 'COMPLETED' && status !== 'CANCELLED'`)
     * Overdue first (dueDate < today) then priority `HIGH`, then by due date asc
   * **List:** Up to 5 → title, due date (relative or `MMM d`), priority chip
   * **Row link:** `/admin/tasks/[taskId]`
   * **Empty:** “No priority tasks” + “Add Task” → `/admin/tasks/new`
   * **Footer:** “View all →” → `/admin/tasks?filter=priority`

3. **BudgetExceptionsWidget.tsx**

   * **Primary:** If a dedicated hook exists (e.g., `useBudgetExceptions(projectId)`), use it.
   * **Fallback:** Use `useBudgetSummary(projectId)` and **degrade**:

     * Show “{overBudgetCount} items over” if count > 0.
     * If detailed items aren’t available, present a single row summary and CTA.
   * **List:** Up to 3 items → item name, `% over` (color), amount
   * **Row link:** `/admin/budget/[itemId]`
   * **Empty (good state):** “Budget on track” (no button)
   * **Footer:** “View all →” → `/admin/budget?filter=exceptions`

4. **ProcurementPipelineWidget.tsx**

   * **Hook (add if missing):** `useProcurementSummary(projectId, !!projectId)`

     * Expected shape: counts per stage → `QUOTED`, `ORDERED`, `DELIVERED`, `INSTALLED`, plus `overdueCount?`
     * If the server route doesn’t exist, **don’t add new APIs**—call the nearest procurement list hook and compute counts client‑side (but keep it efficient).
   * **UI:** Horizontal stages with counts; accent color on overdue
   * **Click:** Each stage pill → `/admin/procurement?status=[stage]`
   * **Empty:** “No procurement items” + “Add Item” → `/admin/procurement/new`
   * **Footer:** “View all →” → `/admin/procurement`

5. **TeamVendorsWidget.tsx**

   * **Hook:** `useContacts({ projectId }, !!projectId)`
   * **Summary line:** counts by type (Staff • Vendors • Contractors)
   * **List:** 3 most recent contacts (name, type)
   * **Row link:** `/admin/contacts/[contactId]`
   * **Empty:** “No active contacts” + “Add Contact” → `/admin/contacts/new`
   * **Footer:** “View all →” → `/admin/contacts`

6. **RfpStatusWidget.tsx**

   * **Hook:** `useRfps(projectId, { limit: 8 }, !!projectId)` (or nearest available)
   * **Status pills:** Draft • Published • Due Soon • Awarded (computed client‑side if needed)
   * **List:** Top 3 urgent by due date (title + due)
   * **Row link:** `/admin/rfp/[rfpId]`
   * **Empty:** “No active RFPs” + “Create RFP” → `/admin/rfp/new`
   * **Footer:** “View all →” → `/admin/rfp`

**Insert all widgets** into `control-center/app/admin/page.tsx` where the placeholders currently sit, matching the grid that preserves our **vertical‑first dense layout** on mobile and 2–3 columns on larger screens. **Remove** any separate Weather widget reference.

---

### 3) Shared structure (apply to every widget)

* Use `Widget` wrapper with `className` extensions as needed; **keep glass morphism**.
* **Header row:**

  ```tsx
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-sm font-medium text-white">Title</h3>
    {/* Optional badge/pill */}
  </div>
  ```
* **List rows:** clickable, 44–48px min height, hover and focus rings:
  `className="block -mx-2 rounded p-2 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 motion-reduce:transition-none"`
* **Footer:** right‑aligned “View all →”
* **Loading:** 3 skeleton rows using existing `Skeleton`
* **Empty:** one line + small secondary button where appropriate
* **Error:** short message + ghost “Retry” button
* **Data:** `enabled: !!projectId`, `staleTime: 300_000` (5 min), `retry: 1`

---

### 4) Hook addition (first commit)

If missing, add to `control-center/hooks/use-api.ts`:

```ts
// types (lightweight)
export interface ProcurementSummary {
  quoted: number;
  ordered: number;
  delivered: number;
  installed: number;
  overdue?: number;
}

export function useProcurementSummary(projectId?: string, enabled: boolean = true) {
  return useQuery<ProcurementSummary>({
    queryKey: ['procurement-summary', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Missing projectId');
      // Prefer an existing endpoint if available:
      // return apiClient.get(`/procurement/summary?projectId=${projectId}`);
      // Fallback: use list endpoint and compute client-side efficiently
      const list = await apiClient.get(`/procurement?projectId=${projectId}&limit=200`);
      // TODO: derive { quoted, ordered, delivered, installed, overdue } from list
      return { quoted: 0, ordered: 0, delivered: 0, installed: 0, overdue: 0 };
    },
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
```

> **Note:** If you discover an existing summary endpoint, switch to it (no fallback block). Keep the computation minimal if you must derive client‑side.

---

### 5) Commit milestones (do not skip)

1. **feat(hook): add useProcurementSummary**

   * Add hook + types; **no UI changes** yet.
2. **feat(widget): add TodayScheduleWidget and wire it in page**
3. **feat(widget): add PriorityTasksWidget and wire it in page**
4. **feat(widget): add BudgetExceptionsWidget and wire it in page**
5. **feat(widget): add ProcurementPipelineWidget and wire it in page**
6. **feat(widget): add TeamVendorsWidget and wire it in page**
7. **feat(widget): add RfpStatusWidget, remove standalone weather widget ref**
8. **docs(dashboard): update AI\_RUNLOG & DASHBOARD\_STATUS** (final commit for this prompt)

Run the pre‑commit quality check before each commit.

---

### 6) Final documentation update (last commit only)

* **`FAXAS_PROPERTY/AI_RUNLOG.md`**

  * Date/time, list of files created/modified, summary of each widget, decisions (any degraded modes), next steps.
* **`FAXAS_PROPERTY/DASHBOARD_STATUS.md`**

  * Phase 2 → Batch 2 & 3 marked complete; checklist of widgets with **✓**; note global widget rules applied.

---

### 7) Acceptance criteria (self‑check before finishing)

* All 6 widgets render with **real data** when available, and **gracefully degrade** otherwise.
* Loading → 3 skeleton rows; empty → nice one‑liners and small button (if applicable); error → retry.
* Each row navigates to the correct detail route with correct filter/query where needed.
* **No new design language**—purely within our glass style; dense vertical layout; no bloated white‑space.
* Tap targets, aria labels, focus rings, and motion‑reduce respected.
* No TypeScript or ESLint errors.
* `app/admin/page.tsx` layout remains cohesive on mobile and desktop.
* Weather remains **only** inside Welcome Widget; placeholders removed.

**When the above is true, perform the final “docs” commit only once.**

---

**Proceed.** If any hard blocker (missing server route, incompatible types) is found, **stop, ACK the issue, and propose the minimal, low‑risk adjustment** that keeps this batch shippable without breaking existing flows.

