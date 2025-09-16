## MASTER PROMPT — Welcome Widget v2 (short, paste-ready for Claude Code 4.1)

> **Copy everything between the lines into Claude Code.**
>
> Keep answers in **edit / write / update / commit** actions only; avoid extra prose.

---

### 🧭 Scope

**Goal:** Upgrade `components/dashboard/widgets/WelcomeWidget.tsx` to an **industry‑grade** welcome panel with **integrated weather** and **workability** signal.
**Constraints:** Preserve existing design language (glass cards, spacing, accent `#8EE3C8`, focus rings). No feature flags. No new page-level routes. Keep bundle lean (no charts).

### ✅ Non‑negotiables

* Do **not** remove or break existing widgets/pages.
* Do **not** alter nav, FAB, or global themes.
* **Remove** the four quick action buttons from Welcome (redundant with FAB).
* All buttons/links must navigate to **real routes**.
* Weather must come from **project address once** and persist (lat/lon cached).

### 📁 Files to read first (no edits yet)

1. `components/dashboard/widgets/WelcomeWidget.tsx`
2. `hooks/use-api.ts` (for `useProjects`, `useTasks`, `useTodaySchedule`)
3. `components/dashboard/Widget.tsx`
4. `app/contexts/AuthContext.tsx`
5. `lib/ui/format.ts` (if referenced)
6. `prisma/schema.prisma` (check if Project has latitude/longitude)
7. `lib/api/response.ts` (success/error helpers if present)

**After reading, make Commit 0 (checkpoint):**
`commit: chore: checkpoint before Welcome widget v2 (no code changes)`

### 🧩 Milestone 1 — Server data (geocode + weather + workability)

**Create/Update:**

* If `Project` model lacks `latitude`/`longitude` **(float/decimal)**:

  * Add fields (non‑breaking, optional), generate a small migration.
* `lib/geocode.ts`

  * `geocodeAddress(address: string): Promise<{lat:number,lng:number,raw:any}>`
  * Uses **Nominatim** (`https://nominatim.openstreetmap.org/search?format=json&q=...`)
  * Rate‑limit: 1 request per call; parse first result; throw clean errors.
* `lib/weather.ts`

  * `fetchWeather(lat:number,lng:number,tz?:string)` → Open‑Meteo
  * `computeWorkability({ current, hourly }): { score:number, label:'Good'|'Fair'|'Poor', reasons:string[], bestWindow?:{start:string,end:string} }`
  * Export **narrowed** DTO for the API response.
* `app/api/v1/weather/route.ts`

  * `GET ?projectId=…` (auth required)
  * Resolve project → if no `lat/lng`, geocode `project.address`, **persist lat/lng** to Project (or a `GeoCache` table) and use them.
  * Fetch weather; compute workability; return:

    ```ts
    {
      location: { city?:string, state?:string, address:string },
      current: { tempF:number, apparentF:number, humidity:number, windMph:number, precipMmHr:number, code:number, text:string },
      workability: { score:number, label:'Good'|'Fair'|'Poor', reasons:string[], bestWindow?:{startISO:string,endISO:string} },
      today: { events:number }, // optional
      hourly: Array<{ timeISO:string, tempF:number, windMph:number, precipMmHr:number, code:number }>,
      daily: Array<{ dateISO:string, maxF:number, minF:number, precipMm:number, code:number }>
    }
    ```
  * Use `successResponse/errorResponse` helpers already present.
  * **Do not** add external libs beyond what’s already installed.

**Commit:**
`commit: feat(weather): geocode + Open‑Meteo API + workability engine with DB caching`

### 🧪 Milestone 2 — Client hook + Welcome UI

**Create:**

* `hooks/use-weather.ts`

  ```ts
  export function useWeather(projectId?: string, enabled=true) {
    return useQuery({
      queryKey: ['weather', projectId],
      queryFn: () => fetch(`/api/v1/weather?projectId=${projectId}`).then(r => r.json()),
      enabled: enabled && !!projectId,
      staleTime: 15 * 60 * 1000,
      retry: 1,
    });
  }
  ```

**Update `components/dashboard/widgets/WelcomeWidget.tsx`:**

* Keep **greeting + project name** row.
* Replace “Set up weather” row with a **Weather Hero** block:

  * Gradient background based on workability:

    * Good → `from-[#0d2420] to-[#102b25]` with mint accents
    * Fair → `from-[#2b2410] to-[#1f1a0c]` with amber accents
    * Poor → `from-[#2b1919] to-[#1f0e0e]` with red accents
  * Large temp, condition text, **Workability pill** (`Good`/`Fair`/`Poor`) with Lucide icon, micro stats (**Feels like, Wind, Humidity**).
  * Status line:

    * “**Good to work** • best \${bestWindow}”
    * or “**Caution** • \${reason1}; \${reason2}”
  * Loading skeletons & error state with **Retry**.
  * **Missing address**: small inline banner + button → `/admin/projects/${projectId}/settings#site-info`
* Keep **3 KPIs** in one row and **make them links**:

  * Due Today → `/admin/tasks?filter=due-today`
  * Overdue → `/admin/tasks?filter=overdue`
  * Events Today → `/admin/schedule?date=today`
* **Remove quick actions** (the four buttons) from this widget.

**Commit:**
`commit: feat(welcome): weather hero with workability + interactive KPIs; remove redundant quick actions`

### 🎯 Milestone 3 — Polish, a11y, docs

* Motion‑reduce friendly CSS animations (no new deps).
* `aria-live` on workability pill; `role="status"` in error.
* Update docs:

  * `FAXAS_PROPERTY/DASHBOARD_STATUS.md` → mark **Welcome Widget v2** done (Phase 2 Batch 1 uplift), note weather integration live, link to API route.
  * `FAXAS_PROPERTY/AI_RUNLOG.md` → add entries for Milestones 1–3 (what changed, files touched, screenshots paths if any).

**Commit:**
`commit: docs: update DASHBOARD_STATUS & AI_RUNLOG for Welcome v2`

### 🔍 Acceptance checks (auto‑verify before final reply)

* When project **has address**: widget shows **real weather**, workability, best window; KPIs navigate.
* When project **lacks address**: shows banner + link to project site info; no crashes.
* API returns within \~300ms after warm cache; hook caches 15m.
* No visual regressions to other widgets; glass morphism preserved.
* Lighthouse contrast still passes (dark theme).

### 🧯 Gotchas / guardrails

* Do **not** introduce heavy dependencies.
* Do **not** spin up a separate WeatherWidget card; keep weather inside Welcome.
* Keep all edits localized to the files listed; avoid global refactors.
* Code defensively (null guards around `projectId`, `address`, and API).

---

### Deliver back (final message from Claude Code)

1. Short summary of what changed + why (1–2 paragraphs).
2. List of files created/modified.
3. Exact commit SHAs for Milestones 0–3.
4. Any **TODO/Follow‑ups** (e.g., add lat/lon to admin edit form if missing).

---

## Why this will work with Opus 4.1

* **Atomic milestones** → Claude Code stays focused and commits cleanly.
* **Explicit file list** → prevents destructive edits.
* **Non‑negotiables & acceptance checks** → reduces rework.
* **Short DTO & pure TS workability** → avoids library churn.
* **No design drift** → you keep the current look while leveling up functionally.

If you’re happy with this plan, paste the **MASTER PROMPT** section into Claude Code and let it run Milestone 0–3. Once the Welcome Widget is done, we’ll repeat the same tight pattern for **Budget Health**, **Project Overview**, and **Task KPIs**.
