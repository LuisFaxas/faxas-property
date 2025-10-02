# TOKEN AUDIT - Design System vs. Actual Usage

**Project:** Miami Duplex Remodel Construction Management System
**Date:** 2025-10-01
**Purpose:** Compare design system tokens with actual component usage
**Cross-Reference:** `docs/07-design-system.md`, `tailwind.config.ts`, `app/globals.css`

---

## Executive Summary

This audit compares the defined design system tokens against actual usage in modal/overlay components. It identifies where components deviate from the design system by using hard-coded values instead of tokens.

**Key Findings:**
- ✅ **Color tokens:** Well-defined in Tailwind config (graphite scale, accent)
- ⚠️ **Spacing tokens:** Used correctly via Tailwind utilities, but no semantic modal spacing presets
- ❌ **Height tokens:** NOT defined - components use arbitrary `h-[85vh]`, `h-[90vh]` values
- ❌ **Elevation/Shadow tokens:** Only 2 defined (`shadow-lg`, `shadow-glass`), limited usage
- ⚠️ **Radius tokens:** Defined via CSS variables, but hard-coded `rounded-t-2xl` common
- ❌ **Opacity tokens:** No named opacity presets, using inline values like `/30`, `/50`, `/80`

---

## 1. Spacing Tokens

### 1.1 Design System Definition

**Source:** Tailwind default scale (base 4px)
**Evidence:** `tailwind.config.ts` (uses default Tailwind spacing)

**Standard Scale:**
```typescript
spacing: {
  0: '0px',
  1: '4px',      // 0.25rem
  2: '8px',      // 0.5rem
  3: '12px',     // 0.75rem
  4: '16px',     // 1rem
  5: '20px',     // 1.25rem
  6: '24px',     // 1.5rem
  7: '28px',     // 1.75rem
  8: '32px',     // 2rem
  10: '40px',    // 2.5rem
  12: '48px',    // 3rem (touch target minimum)
  16: '64px',    // 4rem
  20: '80px',    // 5rem
  24: '96px',    // 6rem
}
```

### 1.2 Actual Usage in Modals

**Component Padding:**
| Class | Usage Count | Use Cases | Evidence |
|-------|-------------|-----------|----------|
| `p-6` (24px) | 15+ | Dialog/Sheet content padding | `ui/dialog.tsx:40`, `ui/sheet.tsx:34` |
| `p-4` (16px) | 20+ | Mobile sheet content, action button containers | `ui/bottom-sheet.tsx:145`, `mobile/detail-sheet.tsx:152` |
| `px-4 py-3` (16px / 12px) | 10+ | Mobile sheet headers | `mobile-task-detail-sheet.tsx:125` |
| `px-6` (24px) | 8+ | Desktop content areas | `mobile/dialog.tsx:93` |

**Vertical Spacing:**
| Class | Usage Count | Use Cases | Evidence |
|-------|-------------|-----------|----------|
| `space-y-2` (8px) | 30+ | Compact vertical spacing (form fields, list items) | `mobile-task-detail-sheet.tsx`, `mobile-contact-detail-sheet.tsx` |
| `space-y-4` (16px) | 25+ | Standard vertical spacing (sections) | `mobile/detail-sheet.tsx:120` |
| `space-y-6` (24px) | 10+ | Generous vertical spacing (major sections) | `mobile-contact-detail-sheet.tsx:228` |
| `gap-4` (16px) | 20+ | Grid/flex gaps | `mobile/detail-sheet.tsx:152` |
| `gap-3` (12px) | 15+ | Button groups | `mobile-contact-detail-sheet.tsx` |
| `gap-2` (8px) | 25+ | Compact grids (badges, chips) | `mobile-filter-sheet.tsx` |

**Bottom Padding (Action Button Clearance):**
| Class | Usage Count | Use Cases | Evidence |
|-------|-------------|-----------|----------|
| `pb-24` (96px) | 5 | Scrollable content bottom padding (clears fixed action buttons) | `mobile/detail-sheet.tsx:117`, `mobile-task-detail-sheet.tsx:135` |
| `pb-safe` | 2 | Bottom safe area (iOS home indicator) | `mobile/dialog.tsx:102`, `mobile-task-dialog.tsx:88` |

**Top Padding (Drag Handle):**
| Class | Usage Count | Use Cases | Evidence |
|-------|-------------|-----------|----------|
| `pt-2` (8px) | 1 | Drag handle top spacing | `ui/bottom-sheet.tsx:118` |
| `pt-3` (12px) | 3 | Header top padding | `mobile-task-detail-sheet.tsx:125` |

### 1.3 Token Compliance

✅ **Compliant:** All spacing uses Tailwind's standard scale
✅ **No Hard-Coded:** No `px-[xx]` or `py-[xx]` spacing values found
⚠️ **Missing:** No semantic modal spacing tokens (e.g., `modal-padding`, `modal-gap`, `modal-content-bottom-clearance`)

**Recommendation:** Define semantic spacing tokens:
```typescript
// Proposed semantic tokens
spacing: {
  'modal-padding-mobile': '16px',  // p-4
  'modal-padding-desktop': '24px', // p-6
  'modal-header-gap': '12px',      // gap-3
  'modal-content-gap': '16px',     // gap-4
  'modal-section-gap': '24px',     // space-y-6
  'modal-action-clearance': '96px', // pb-24 (to clear fixed action buttons)
}
```

---

## 2. Border Radius Tokens

### 2.1 Design System Definition

**Source:** `tailwind.config.ts:66-70`, `app/globals.css:27`

**CSS Variable:**
```css
:root {
  --radius: 0.875rem;  /* 14px */
}
```

**Tailwind Utilities:**
```typescript
borderRadius: {
  lg: "var(--radius)",               // 14px
  md: "calc(var(--radius) - 2px)",   // 12px
  sm: "calc(var(--radius) - 4px)",   // 10px
}
```

### 2.2 Actual Usage in Modals

**Modal/Sheet Corners:**
| Class | Usage Count | Use Cases | Evidence |
|-------|-------------|-----------|----------|
| `rounded-t-2xl` (24px) | 10+ | Mobile bottom sheet top corners | `ui/bottom-sheet.tsx:106`, `mobile/dialog.tsx:63`, `mobile/detail-sheet.tsx:70`, `mobile-task-detail-sheet.tsx:87` |
| `sm:rounded-lg` (14px) | 5+ | Desktop dialog corners | `ui/dialog.tsx:40` |
| `rounded-lg` (14px) | 3+ | Popover/Dropdown corners | `ui/popover.tsx`, `ui/dropdown-menu.tsx` |
| `rounded-md` (12px) | 10+ | Card corners, smaller elements | `ui/card.tsx` |
| `rounded-full` | 15+ | Drag handles, badges, circular buttons | `ui/bottom-sheet.tsx:126` (drag handle), `ui/avatar.tsx`, `ui/badge.tsx` |

**Drag Handle Radius:**
```typescript
<div className="w-12 h-1 rounded-full bg-white/30" />
// Evidence: ui/bottom-sheet.tsx:126
```

### 2.3 Token Compliance

⚠️ **Partial Compliance:** Mobile sheets use hard-coded `rounded-t-2xl` instead of token
✅ **Desktop Dialogs:** Use `sm:rounded-lg` which references `--radius` variable
❌ **Inconsistency:** No token for "mobile sheet top corners" (24px)

**Hard-Coded Values:**
- `rounded-t-2xl` (24px) - Used in 10+ components
- `.glass` class defines `border-radius: 14px` (hard-coded, not using `var(--radius)`)

**Evidence:** `app/globals.css:72`
```css
.glass {
  border-radius: 14px; /* ⚠️ Hard-coded, should use var(--radius) */
}
```

**Recommendation:** Define mobile sheet radius token:
```typescript
borderRadius: {
  'sheet-mobile-top': '24px',  // rounded-t-2xl standard
}
```

Or use existing Tailwind:
```typescript
// Instead of rounded-t-2xl everywhere, standardize:
<SheetContent className="rounded-t-3xl">  // 1.5rem = 24px
```

---

## 3. Shadow & Elevation Tokens

### 3.1 Design System Definition

**Source:** `tailwind.config.ts:88-90`, `app/globals.css:69`

**Defined Shadows:**
```typescript
boxShadow: {
  glass: '0 8px 32px rgba(0,0,0,0.25)',
}
```

**Tailwind Defaults (Still Available):**
- `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `shadow`: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- `shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- `shadow-xl`: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`
- `shadow-2xl`: `0 25px 50px -12px rgb(0 0 0 / 0.25)`

### 3.2 Actual Usage in Modals

**Modal Shadows:**
| Class | Usage Count | Use Cases | Evidence |
|-------|-------------|-----------|----------|
| `shadow-lg` | 5+ | Dialog/Sheet elevation | `ui/dialog.tsx:40`, `ui/sheet.tsx:34` |
| `shadow-glass` | 1 | Glass class definition | `app/globals.css:69` (within `.glass` class) |
| **No shadow** | 7+ | Mobile sheets rely on glass/backdrop-blur | `ui/bottom-sheet.tsx` (uses `.glass` class, no explicit `shadow-*`) |

**Glass Morphism Shadow (Hard-Coded):**
```css
.glass {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
```
**Evidence:** `app/globals.css:69`

### 3.3 Token Compliance

❌ **Limited Tokens:** Only 1 custom shadow token (`shadow-glass`)
⚠️ **Inconsistent Usage:** Some modals use `shadow-lg`, others use `.glass` class
❌ **No Elevation Scale:** No defined elevation levels (e.g., elevation-1 through elevation-5)

**Recommendation:** Define elevation scale:
```typescript
boxShadow: {
  'elevation-1': '0 1px 3px rgba(0,0,0,0.12)',     // Subtle
  'elevation-2': '0 4px 8px rgba(0,0,0,0.15)',     // Card hover
  'elevation-3': '0 8px 16px rgba(0,0,0,0.18)',    // Dropdown/Popover
  'elevation-4': '0 12px 24px rgba(0,0,0,0.20)',   // Dialog/Sheet
  'elevation-5': '0 16px 32px rgba(0,0,0,0.25)',   // Modal (highest)
  'glass': '0 8px 32px rgba(0,0,0,0.25)',          // Keep existing
}
```

---

## 4. Color Tokens

### 4.1 Design System Definition

**Source:** `tailwind.config.ts:54-64`, `app/globals.css:30-50`

**Graphite Scale (Custom):**
```typescript
graphite: {
  900: '#0f1115',  // Darkest - main background
  800: '#14161b',  // Cards
  700: '#1b1e24',
  600: '#232730',
  500: '#2c313c',
  400: '#3b4150',
  300: '#4a5163',
  200: '#5a6278',
  100: '#6b7490',  // Lightest - text muted
}
```

**Accent (Custom):**
```typescript
accent: {
  DEFAULT: '#8EE3C8',
  500: '#8EE3C8',
}
```

**CSS Variables (Dark Mode - Always Active):**
```css
:root.dark {
  --background: 220 15% 7%;        /* graphite-900 */
  --foreground: 210 40% 98%;       /* white/98 */
  --card: 220 15% 9%;              /* graphite-800 */
  --popover: 220 15% 9%;
  --primary: 165 70% 75%;          /* accent */
  --muted: 220 15% 15%;
  --accent: 165 70% 75%;
  --border: 220 15% 15%;
  --input: 220 15% 15%;
  --ring: 165 70% 75%;             /* Focus ring */
}
```

### 4.2 Actual Usage in Modals

**Background Colors:**
| Token Usage | Hard-Coded Usage | Evidence |
|-------------|------------------|----------|
| `bg-background` | `bg-graphite-900` | `ui/dialog.tsx:40` vs. `mobile/detail-sheet.tsx:70` |
| `bg-card` | `bg-graphite-800` | Design system vs. actual components |
| `bg-popover` | `bg-graphite-900/95` | `ui/popover.tsx` vs. `task-filter-bar.tsx:74` |

**Backdrop Colors (Hard-Coded):**
| Hard-Coded Value | Usage Count | Evidence |
|------------------|-------------|----------|
| `bg-black/80` | 5+ | `ui/dialog.tsx:23`, `ui/sheet.tsx:24` |
| `bg-black/50` | 3+ | `ui/bottom-sheet.tsx:96`, `mobile-task-dialog.tsx:47` |

**Border Colors:**
| Token Usage | Hard-Coded Usage | Evidence |
|-------------|------------------|----------|
| `border` (CSS var) | `border-white/10` | Most components use hard-coded white/10 |
| `border-border` | Rarely used | `ui/input.tsx` |

**Text Colors:**
| Token Usage | Hard-Coded Usage | Evidence |
|-------------|------------------|----------|
| `text-foreground` | `text-white` | CSS variable vs. direct color |
| `text-muted-foreground` | `text-white/60` | CSS variable vs. hard-coded opacity |

**Drag Handle Color (Hard-Coded):**
```typescript
<div className="bg-white/30" />  // ⚠️ Hard-coded, not using token
```
**Evidence:** `ui/bottom-sheet.tsx:126`

### 4.3 Token Compliance

✅ **Color Scale Defined:** Graphite and accent scales well-defined
⚠️ **Mixed Usage:** Some components use CSS variables, others use direct `graphite-*` classes
❌ **Backdrop Hard-Coded:** All backdrop colors use `bg-black/XX` instead of tokens
❌ **Border Hard-Coded:** Most use `border-white/10` instead of `border-border`
❌ **Opacity Hard-Coded:** `.glass` class uses `rgba(20, 22, 27, 0.55)` instead of `bg-graphite-800/55`

**Hard-Coded Values Found:**
```css
/* app/globals.css:67 - .glass class */
background: rgba(20, 22, 27, 0.55);  /* ⚠️ Should be bg-graphite-800/55 */
border: 1px solid rgba(255, 255, 255, 0.08);  /* ⚠️ Should be border-white/[0.08] */
```

**Recommendation:** Standardize on Tailwind opacity syntax:
- `bg-black/50` ✅ (Good, already using this)
- `bg-graphite-800/55` (Instead of rgba)
- `border-white/10` ✅ (Good, already using this)
- Define backdrop token: `bg-modal-backdrop` → `bg-black/50`

---

## 5. Opacity Tokens

### 5.1 Design System Definition

**Source:** No explicit opacity tokens defined in config

**Tailwind Default Opacity:**
- `/10` = 10%
- `/20` = 20%
- `/30` = 30%
- `/40` = 40%
- `/50` = 50%
- `/60` = 60%
- `/70` = 70%
- `/80` = 80%
- `/90` = 90%

### 5.2 Actual Usage in Modals

**Backdrop Opacity:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `/50` | 3+ | BottomSheet backdrop | `ui/bottom-sheet.tsx:96` |
| `/80` | 5+ | Dialog/Sheet backdrop | `ui/dialog.tsx:23`, `ui/sheet.tsx:24` |

**Border Opacity:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `/10` | 20+ | Sheet borders, dividers | `ui/bottom-sheet.tsx:105`, `mobile/detail-sheet.tsx:75` |
| `/[0.08]` | 1 | `.glass` border (hard-coded) | `app/globals.css:68` |

**Text Opacity:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `/60` | 15+ | Muted text | `mobile/dialog.tsx:75`, `mobile-task-detail-sheet.tsx` |
| `/70` | 5+ | Secondary text | Various components |
| `/80` | 10+ | Label text | Various components |

**Drag Handle Opacity:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `/30` | 2 | Drag handle indicator | `ui/bottom-sheet.tsx:126`, `ui/toaster.tsx` |
| `/40` | 1 | Rearrangeable nav grip icon | `blocks/rearrangeable-navigation.tsx` |

**Background Opacity (Cards/Glass):**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `/50` | 10+ | Card backgrounds | `task-card.tsx:101`, `mobile-list-view.tsx:95` |
| `/30` | 5+ | Subtle card backgrounds | `mobile-contact-list.tsx:197` |
| `/95` | 3+ | Sticky headers with blur | `task-filter-bar.tsx:74`, `contacts/page.tsx:786` |
| `.55` | 1 | `.glass` background (hard-coded) | `app/globals.css:67` |

### 5.3 Token Compliance

❌ **No Named Tokens:** No semantic opacity tokens defined
✅ **Consistent Syntax:** Most use Tailwind `/XX` syntax
❌ **Glass Class Exception:** `.glass` uses decimal `.55` instead of `/55`

**Hard-Coded Opacity:**
```css
/* app/globals.css:67 */
.glass {
  background: rgba(20, 22, 27, 0.55);  /* ⚠️ 55% opacity, but written as .55 */
}
```

**Recommendation:** Define semantic opacity tokens:
```typescript
// Proposed semantic tokens
opacity: {
  'backdrop-light': '0.5',      // 50% - BottomSheet backdrop
  'backdrop-heavy': '0.8',      // 80% - Dialog/Sheet backdrop
  'border': '0.1',              // 10% - Borders/dividers
  'text-muted': '0.6',          // 60% - Secondary text
  'text-disabled': '0.4',       // 40% - Disabled text
  'handle': '0.3',              // 30% - Drag handles
  'glass-bg': '0.55',           // 55% - Glass morphism backgrounds
  'card-bg': '0.5',             // 50% - Card backgrounds
  'sticky-header': '0.95',      // 95% - Sticky headers with blur
}
```

---

## 6. Height Tokens

### 6.1 Design System Definition

**Source:** No height tokens defined in design system

**Tailwind Default Heights:**
- `h-screen` = `100vh`
- `h-full` = `100%`
- `h-1/2` = `50%`
- Arbitrary: `h-[XXXpx]`, `h-[XXvh]`

### 6.2 Actual Usage in Modals

**Mobile Sheet Heights:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `h-[85vh]` | 5 | Detail sheets | `mobile-detail-sheet.tsx:70`, `mobile-task-detail-sheet.tsx:87`, `mobile-contact-detail-sheet.tsx:139` |
| `h-[90vh]` | 3 | Form dialogs | `mobile/dialog.tsx:63`, `mobile-contact-dialog.tsx:50` |
| `max-h-[85vh]` | 1 | BottomSheet (with min-h) | `ui/bottom-sheet.tsx:108` |
| `h-full max-h-[calc(100vh-env(safe-area-inset-top))]` | 1 | Full-screen task dialog | `mobile-task-dialog.tsx:55` |

**Desktop Dialog Max-Heights:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `max-h-[60vh]` | 1 | Desktop dialog content scroll | `mobile/dialog.tsx:141` |
| `max-h-[90vh]` | 1 | Assign task dialog | `contacts/assign-task-dialog.tsx:116` |

**Min-Heights:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `min-h-[200px]` | 1 | BottomSheet minimum | `ui/bottom-sheet.tsx:108` |
| `min-h-[80px]` | 2 | Textareas | `ui/textarea.tsx` |
| `min-h-[400px]` | 1 | FullCalendar (mobile) | `schedule/fullcalendar-view.tsx:274` |

**Dropdown/Select Heights:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `max-h-[300px]` | 2 | Command palette, date picker | `ui/command.tsx:62`, `tasks/mobile-date-time-picker.tsx:188` |
| `max-h-[--radix-select-content-available-height]` | 1 | Select dropdown | `ui/select.tsx:77` |
| `max-h-[var(--radix-dropdown-menu-content-available-height)]` | 1 | Dropdown menu | `ui/dropdown-menu.tsx:67` |

### 6.3 Token Compliance

❌ **NO TOKENS DEFINED:** All heights are hard-coded arbitrary values
❌ **NO SEMANTIC NAMING:** No `modal-height-detail`, `modal-height-form`, etc.
⚠️ **INCONSISTENT VALUES:** 4 different values for similar use cases (80vh, 85vh, 90vh, calc)

**Recommendation:** Define semantic height tokens:
```typescript
// Proposed height tokens in tailwind.config.ts
height: {
  'modal-detail': '85vh',         // Standard detail sheet height
  'modal-form': '90vh',           // Form dialog height
  'modal-fullscreen': 'calc(100vh - env(safe-area-inset-top))',  // Full-screen with safe area
  'modal-compact': '60vh',        // Smaller modals
  'dropdown': '300px',            // Standard dropdown max-height
  'modal-min': '200px',           // Minimum sheet height
}
```

**Usage example after standardization:**
```typescript
<SheetContent className="h-modal-detail">  // Instead of h-[85vh]
<SheetContent className="h-modal-form">    // Instead of h-[90vh]
```

---

## 7. Backdrop Blur Tokens

### 7.1 Design System Definition

**Source:** Tailwind defaults, custom `backdropBlur.xs` added

**Tailwind Config:**
```typescript
backdropBlur: {
  xs: '2px',  // Custom addition
  // ... (default Tailwind: none, sm, DEFAULT, md, lg, xl, 2xl, 3xl)
}
```
**Evidence:** `tailwind.config.ts:85-87`

**Tailwind Defaults:**
- `backdrop-blur-none`: `blur(0)`
- `backdrop-blur-sm`: `blur(4px)`
- `backdrop-blur`: `blur(8px)` (default)
- `backdrop-blur-md`: `blur(12px)`
- `backdrop-blur-lg`: `blur(16px)`
- `backdrop-blur-xl`: `blur(24px)`

### 7.2 Actual Usage in Modals

**Backdrop Blur:**
| Class | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `backdrop-blur-sm` (4px) | 10+ | Modal backdrops, card backgrounds | `ui/bottom-sheet.tsx:96`, `mobile-task-dialog.tsx:47`, `task-card.tsx:101` |
| `backdrop-blur` (8px) | 5+ | Page headers, sticky elements | `blocks/page-shell.tsx:320`, `blocks/page-shell.tsx:449` |
| `backdrop-blur-md` (12px) | 1 | Contacts page bottom bar | `contacts/page.tsx:786` |

**Glass Class (Hard-Coded):**
```css
.glass {
  backdrop-filter: blur(8px);          /* Same as backdrop-blur */
  -webkit-backdrop-filter: blur(8px);  /* Safari support */
}
```
**Evidence:** `app/globals.css:70-71`

### 7.3 Token Compliance

✅ **Custom Token Added:** `backdrop-blur-xs` (2px) defined but unused
✅ **Consistent Usage:** Most components use `backdrop-blur-sm`
⚠️ **Glass Class:** Hard-codes `blur(8px)` instead of using Tailwind class

**Recommendation:** Use Tailwind utilities in `.glass` class:
```css
.glass {
  @apply backdrop-blur bg-graphite-800/55 border border-white/10;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border-radius: var(--radius);
}
```

---

## 8. Z-Index Tokens

### 8.1 Design System Definition

**Source:** No z-index tokens defined in design system

**Tailwind Defaults:**
- `z-0`: `0`
- `z-10`: `10`
- `z-20`: `20`
- `z-30`: `30`
- `z-40`: `40`
- `z-50`: `50`
- `z-auto`: `auto`

### 8.2 Actual Usage in Modals

**Z-Index Layers:**
| Value | Usage Count | Use Case | Evidence |
|-------|-------------|----------|----------|
| `z-50` | 14+ | All modals (Dialog/Sheet/Popover/Dropdown/Toast) | `ui/dialog.tsx:23,39`, `ui/sheet.tsx:24,34`, `ui/bottom-sheet.tsx:96,104` |
| `z-40` | 1 | Page header (desktop) | `blocks/page-shell.tsx:449` |
| `z-30` | 1 | Sidebar (collapsed/mobile) | `blocks/page-shell.tsx:320` |
| `z-10` | 3 | Sticky headers within modals | `mobile/detail-sheet.tsx:75` |

### 8.3 Token Compliance

✅ **Consistent Layering:** All modals use `z-50`
✅ **No Conflicts:** Clear separation between UI layers
❌ **No Semantic Tokens:** No named tokens like `z-modal`, `z-header`, `z-sidebar`

**Recommendation:** Define semantic z-index tokens:
```typescript
// Proposed z-index tokens in tailwind.config.ts
zIndex: {
  'modal': '50',           // All modals/overlays
  'header': '40',          // Page header
  'sidebar': '30',         // Navigation sidebar
  'sticky': '10',          // Sticky content within modals
  'base': '0',             // Default layer
}
```

**Usage example after standardization:**
```typescript
<DialogOverlay className="z-modal">  // Instead of z-50
<PageHeader className="z-header">    // Instead of z-40
```

---

## 9. Deviation Summary

### Critical Deviations (Hard-Coded Values)

**1. Glass Morphism Class (`app/globals.css:66-73`)**
```css
.glass {
  background: rgba(20, 22, 27, 0.55);  /* ⚠️ Should use bg-graphite-800/55 */
  border: 1px solid rgba(255, 255, 255, 0.08);  /* ⚠️ Should use border-white/[0.08] */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);  /* ⚠️ Should use backdrop-blur */
  -webkit-backdrop-filter: blur(8px);
  border-radius: 14px;  /* ⚠️ Should use var(--radius) */
}
```

**2. Height Values (No Tokens Defined)**
- `h-[85vh]` - Used 5 times (detail sheets)
- `h-[90vh]` - Used 3 times (form dialogs)
- `h-full max-h-[calc(100vh-env(safe-area-inset-top))]` - Used 1 time

**3. Backdrop Colors (Hard-Coded)**
- `bg-black/50` - BottomSheet backdrop
- `bg-black/80` - Dialog/Sheet backdrop

**4. Border Colors (Bypassing CSS Variables)**
- Most components use `border-white/10` instead of `border-border` token

### Minor Deviations

**5. Mobile Sheet Corner Radius**
- All use `rounded-t-2xl` (hard-coded 24px) instead of token

**6. Text Colors (Mixed Usage)**
- Some use `text-foreground` (token), others use `text-white` (direct)
- Some use `text-muted-foreground` (token), others use `text-white/60` (hard-coded opacity)

---

## 10. Recommendations

### Priority 1: Create Missing Tokens

**Height Tokens:**
```typescript
height: {
  'modal-detail': '85vh',
  'modal-form': '90vh',
  'modal-fullscreen': 'calc(100vh - env(safe-area-inset-top))',
  'modal-compact': '60vh',
  'dropdown': '300px',
  'modal-min': '200px',
}
```

**Opacity Tokens:**
```typescript
opacity: {
  'backdrop-light': '0.5',
  'backdrop-heavy': '0.8',
  'border': '0.1',
  'text-muted': '0.6',
  'handle': '0.3',
  'glass-bg': '0.55',
}
```

**Z-Index Tokens:**
```typescript
zIndex: {
  'modal': '50',
  'header': '40',
  'sidebar': '30',
  'sticky': '10',
}
```

**Radius Tokens:**
```typescript
borderRadius: {
  'sheet-mobile-top': '24px',  // For rounded-t-2xl standard
}
```

### Priority 2: Refactor Hard-Coded Values

**1. Fix `.glass` Class:**
```css
.glass {
  @apply bg-graphite-800/55 border border-white/[0.08] backdrop-blur;
  @apply rounded-[var(--radius)];
  box-shadow: var(--shadow-glass);
}
```

**2. Create Backdrop Token:**
```typescript
// In tailwind.config.ts
colors: {
  'modal-backdrop': 'rgba(0, 0, 0, 0.5)',
}
```

**3. Use Height Tokens:**
```typescript
// Before
<SheetContent className="h-[85vh]">

// After
<SheetContent className="h-modal-detail">
```

### Priority 3: Document Token Usage

Create `docs/DESIGN_TOKENS.md` with:
- All available tokens
- Usage examples
- When to use each token
- Migration guide from hard-coded values

---

## END OF TOKEN AUDIT

**Tokens Analyzed:** 8 categories (spacing, radius, shadow, color, opacity, height, blur, z-index)
**Hard-Coded Values Found:** 15+
**Missing Token Categories:** 3 (height, opacity semantic, z-index semantic)
**Compliance Rating:** 60% (good base, needs semantic tokens for modals)

**Next Step:** See `DEVIATIONS.md` for full inconsistency list
