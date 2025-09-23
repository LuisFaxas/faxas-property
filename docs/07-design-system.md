# Design System Documentation

[← Back to Main](../SOURCE_OF_TRUTH.md)

## Design Principles

- **Dark Mode Only**: Graphite-based dark theme
- **Glass Morphism**: Semi-transparent surfaces with backdrop blur
- **Mobile-First**: Responsive from 320px up
- **Touch-Optimized**: 48px minimum touch targets
- **Accessibility**: WCAG 2.1 AA compliance

## Color System

### Core Palette
**File**: `tailwind.config.ts`

```typescript
colors: {
  graphite: {
    50: '#f6f7f9',
    100: '#e8eaed',
    200: '#d4d7dd',
    300: '#b5bac3',
    400: '#909aa7',
    500: '#717c8c',
    600: '#5a6474',
    700: '#4d5560',
    800: '#434951',
    900: '#3a3f47',
    950: '#23262c'
  },
  accent: {
    DEFAULT: '#8EE3C8',
    hover: '#7CD4B9',
    active: '#6AC5AA'
  }
}
```

### Semantic Colors
```css
/* app/globals.css */
:root {
  --background: 220 20% 8%;       /* graphite-950 */
  --foreground: 0 0% 95%;          /* white/95 */
  --card: 220 15% 12%;             /* graphite-900 */
  --card-foreground: 0 0% 95%;
  --primary: 165 60% 70%;          /* accent */
  --primary-foreground: 220 20% 8%;
  --muted: 220 10% 20%;           /* graphite-800 */
  --muted-foreground: 0 0% 60%;
  --destructive: 0 84% 60%;       /* red-500 */
  --success: 142 71% 45%;         /* green-500 */
  --warning: 38 92% 50%;          /* yellow-500 */
}
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Font Sizes
| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | 16px | Labels, hints |
| `text-sm` | 14px | 20px | Body small |
| `text-base` | 16px | 24px | Body default |
| `text-lg` | 18px | 28px | Subheadings |
| `text-xl` | 20px | 28px | Headings |
| `text-2xl` | 24px | 32px | Page titles |
| `text-3xl` | 30px | 36px | Hero text |

## Spacing System

### Base Unit: 4px
```typescript
spacing: {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',  // Touch target
  16: '64px',
  20: '80px',
  24: '96px'
}
```

## Glass Morphism

### Glass Effect Classes
```css
/* app/globals.css */
.glass {
  background: rgba(20, 22, 27, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-subtle {
  background: rgba(20, 22, 27, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.glass-strong {
  background: rgba(20, 22, 27, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

## Component Patterns

### Cards
```tsx
// Standard card with glass effect
<Card className="glass rounded-xl p-6 space-y-4">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Buttons
```tsx
// Primary button
<Button variant="default" size="lg" className="min-h-[48px]">
  Action
</Button>

// Variants: default, secondary, destructive, outline, ghost, link
// Sizes: sm, default, lg, icon
```

### Form Inputs
```tsx
// Touch-optimized input
<Input
  className="h-12 px-4 text-base bg-graphite-900/50"
  placeholder="Enter value..."
/>
```

## Responsive Breakpoints

| Breakpoint | Min Width | Device |
|------------|-----------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape/Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Wide screen |

### Responsive Utilities
```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Stack on mobile, row on desktop
<div className="flex flex-col lg:flex-row gap-4">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

## Mobile Patterns

### Bottom Navigation
```css
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 h-16;
  @apply glass border-t border-white/10;
  @apply flex items-center justify-around;
  @apply z-50 safe-bottom;
}
```

### Touch Targets
```css
.touch-target {
  @apply min-h-[48px] min-w-[48px];
  @apply flex items-center justify-center;
  @apply relative;
}

.touch-target::before {
  content: '';
  @apply absolute inset-0;
  @apply -m-2; /* Expand hit area */
}
```

### Bottom Sheets
```tsx
// Mobile modal pattern
<Sheet>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
    {/* Content */}
  </SheetContent>
</Sheet>
```

## Animation System

### Transitions
```css
/* Default transition */
.transition-base {
  @apply transition-all duration-200 ease-in-out;
}

/* Smooth */
.transition-smooth {
  @apply transition-all duration-300 ease-out;
}

/* Spring */
.transition-spring {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Framer Motion
```tsx
// Fade in animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

## Icons

### Lucide React
```tsx
import { Home, Settings, User, ChevronRight } from 'lucide-react'

// Standard size: 20px
<Home className="h-5 w-5" />

// Touch target: 24px icon in 48px button
<Button size="icon" className="h-12 w-12">
  <Settings className="h-6 w-6" />
</Button>
```

## Loading States

### Skeleton Loading
```tsx
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-32 w-full" />
  <Skeleton className="h-12 w-1/2" />
</div>
```

### Spinner
```tsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
</div>
```

## Accessibility

### Focus Styles
```css
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite-950;
}
```

### ARIA Labels
```tsx
<Button aria-label="Delete task">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Keyboard Navigation
```tsx
// Tab order
<div tabIndex={0} onKeyDown={handleKeyDown}>
  {/* Navigable content */}
</div>
```

## Component Examples

### Mobile Task Card
```tsx
<div className="glass rounded-xl p-4 space-y-3 touch-target">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <h3 className="font-semibold text-base">{task.title}</h3>
      <p className="text-sm text-muted-foreground">{task.description}</p>
    </div>
    <Badge variant={task.priority}>{task.priority}</Badge>
  </div>

  <div className="flex items-center gap-2">
    <Avatar className="h-6 w-6">
      <AvatarFallback>{task.assignee[0]}</AvatarFallback>
    </Avatar>
    <span className="text-xs text-muted-foreground">
      Due {formatDate(task.dueDate)}
    </span>
  </div>
</div>
```

### Dashboard Widget
```tsx
<Card className="glass-subtle">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Total Tasks
    </CardTitle>
    <CheckCircle className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">42</div>
    <p className="text-xs text-muted-foreground">
      +20% from last month
    </p>
  </CardContent>
</Card>
```

## Design Tokens Export
```typescript
// lib/design-tokens.ts
export const tokens = {
  colors: {
    background: 'hsl(220, 20%, 8%)',
    foreground: 'hsl(0, 0%, 95%)',
    primary: 'hsl(165, 60%, 70%)',
    // ...
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    // ...
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  }
}
```

---

[Back to Main →](../SOURCE_OF_TRUTH.md)