# Mobile Standards Guide

## Overview
This document outlines the mobile development standards for the Control Center application, based on the proven patterns implemented in the Schedule page. These standards ensure a consistent, responsive, and user-friendly mobile experience across all pages.

## Core Principles

### Mobile-First Approach
- Design and develop for mobile devices first, then enhance for larger screens
- Prioritize single-screen experiences without scrolling where possible
- Optimize for touch interactions over mouse/keyboard

### Performance First
- Minimize re-renders and state updates
- Use CSS-only solutions where possible (Tailwind classes)
- Implement proper loading states for better perceived performance

## Responsive Breakpoints

### Standard Media Queries
```typescript
// Mobile devices (phones in portrait)
const isMobile = useMediaQuery('(max-width: 768px)');

// Landscape mode (phones in horizontal orientation)
const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape) and (max-height: 430px)');

// Tablet devices
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
```

### Tailwind Breakpoints
- `sm:` - 640px and up
- `md:` - 768px and up (desktop starts here)
- `lg:` - 1024px and up
- Use `md:hidden` to show elements only on mobile

## Navigation Patterns

### Bottom Navigation Bar (Primary Pattern)
Fixed bottom navigation with integrated FAB for ergonomic one-handed use:

```tsx
// In PageShell component
<MobileBottomNav
  onFabClick={onFabClick}
  fabIcon={fabIcon}
  fabLabel={fabLabel}
  onMoreClick={() => setBottomSheetOpen(true)}
/>
```

**Standards:**
- Height: 60px fixed bottom bar
- 4 primary nav items + center FAB + "More" button
- FAB elevated with `-top-2` for prominence
- Active route indication with accent color
- Icons with labels (10px font size)
- Only visible on mobile (`md:hidden`)

### Integrated FAB Pattern
FAB is now part of the bottom navigation, not floating separately:

```tsx
// Pass FAB config to PageShell
<PageShell
  pageTitle="Schedule"
  fabIcon={Plus}
  fabLabel="Add Event"
  onFabClick={() => setIsCreateOpen(true)}
>
```

**Standards:**
- Center position in bottom nav
- Size: `h-14 w-14` (56px) 
- Elevated with shadow and `-top-2`
- Blue accent color (`bg-blue-600`)
- Contextual per page (Add Event, Add Task, etc.)

### Navigation Rail (Landscape Mode)
Collapsible sidebar for landscape orientation:

```tsx
<aside className={cn(
  "fixed left-0 top-0 h-full z-30 transition-all duration-300",
  sidebarCollapsed ? "w-14" : "w-52",
  "glass border-r border-white/10"
)}>
```

**Standards:**
- Collapsed width: 56px (w-14)
- Expanded width: 208px (w-52)
- Auto-collapse in landscape mode
- Expand on hover/tap
- Show icons only when collapsed
- Smooth transitions (300ms)

### Bottom Sheet (Overflow Menu)
Replaces side drawer for better mobile ergonomics:

```tsx
<BottomSheet
  open={bottomSheetOpen}
  onOpenChange={setBottomSheetOpen}
  title="More Options"
>
  <nav className="space-y-1">
    {/* Overflow navigation items */}
  </nav>
</BottomSheet>
```

**Standards:**
- Slides up from bottom with animation
- Swipe-to-dismiss gesture support  
- Drag handle at top for visual affordance
- Max height: 85vh to prevent full coverage
- Glass morphism effect matching theme
- Touch and mouse drag support

## Touch Interactions

### Gesture Standards
```javascript
// Calendar/Selection components
selectLongPressDelay={500}  // 500ms hold to select
eventLongPressDelay={300}   // 300ms for event interaction

// Swipe gestures
- Horizontal swipe: Navigate between months/pages
- Vertical swipe: Switch view modes
- Pinch: Zoom in/out (where applicable)
```

### Touch Target Sizing
- Minimum touch target: **48x48px**
- Spacing between targets: **8px minimum**
- Use padding instead of margin for clickable areas

### iOS-Specific Optimizations
```css
/* Remove tap highlight */
-webkit-tap-highlight-color: transparent;

/* Prevent text selection on long press */
-webkit-user-select: none;
user-select: none;
```

## Layout Standards

### Simplified Mobile Header
Streamlined top bar for better ergonomics:

```tsx
<div className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
  <ProjectSwitcher />
  <h2 className="text-center flex-1">{pageTitle}</h2>
  <Avatar />  {/* User menu dropdown */}
</div>
```

**Standards:**
- No hamburger menu (moved to bottom nav)
- Project switcher for quick project changes
- Centered page title
- User avatar with dropdown for settings/logout
- Height: 48-56px

### Single-Screen Experience
Optimize layouts to fit within viewport without scrolling:

```tsx
// Container structure
<div className="h-full flex flex-col">
  <header className="flex-shrink-0">...</header>
  <main className="flex-1 min-h-0 overflow-auto">...</main>
  <footer className="flex-shrink-0">...</footer>
</div>
```

### Spacing Guidelines
```tsx
// Mobile vs Desktop spacing
className={cn(
  "p-3 sm:p-4 lg:p-6",  // Padding
  "gap-2 sm:gap-4",      // Gaps
  "text-xs sm:text-sm"   // Text sizes
)}
```

**Mobile Spacing Scale:**
- Extra small: `p-1` (4px)
- Small: `p-2` (8px)
- Medium: `p-3` (12px)
- Large: `p-4` (16px)

### Responsive Grid Layouts
```tsx
// Responsive grid that stacks on mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
```

## Component Guidelines

### Mobile Dialogs
Full-screen dialogs on mobile, modal on desktop:

```tsx
<DialogContent className="w-full h-full sm:max-w-[500px] sm:max-h-[85vh] sm:h-auto overflow-hidden flex flex-col bg-gray-900 text-white border-0 sm:border sm:border-white/10 rounded-none sm:rounded-lg">
```

### Carousels for Mobile
Use carousels to display multiple items horizontally:

```tsx
<div className="sm:hidden overflow-x-auto">
  <div className="flex gap-3">
    {items.map(item => (
      <div className="flex-[0_0_80%] min-w-0">
        {/* Card content */}
      </div>
    ))}
  </div>
</div>
```

**Standards:**
- Show 80% of card width (peek effect)
- Include pagination dots
- Hide on larger screens (`sm:hidden`)

### Mobile-Specific Hints
Auto-hiding hints for first-time users:

```tsx
const [showHint, setShowHint] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => setShowHint(false), 3000);
  return () => clearTimeout(timer);
}, []);

{showHint && (
  <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-blue-600/80 rounded-full px-2 py-0.5 text-[9px] text-white animate-pulse">
    Hold date to add event
  </div>
)}
```

## Styling Standards

### Theme Consistency
```tsx
// Glass morphism effect
className="glass"  // Applies backdrop-blur and semi-transparent background

// Standard button colors
className="bg-blue-600 hover:bg-blue-700"  // Primary actions
className="bg-white/5 hover:bg-white/10"   // Secondary actions

// Border styles
className="border border-white/10"  // Subtle borders

// Text colors
className="text-white"        // Primary text
className="text-white/60"     // Secondary text
className="text-white/40"     // Tertiary text
```

### Animation Standards
```tsx
// Standard transitions
className="transition-all duration-300"    // Layout changes
className="transition-transform"            // Scale/rotate
className="transition-opacity duration-500" // Fade effects

// Interaction feedback
className="active:scale-95"    // Button press
className="hover:bg-white/10"  // Hover state
className="animate-pulse"       // Attention-grabbing
```

## Performance Optimization

### Loading States
Always show loading skeletons for better perceived performance:

```tsx
if (isLoading) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

### Conditional Rendering
Use conditional rendering based on device type:

```tsx
{isMobile ? (
  <MobileComponent />
) : (
  <DesktopComponent />
)}
```

### Viewport Optimization
```html
<!-- Ensure proper viewport settings in layout -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
```

## Code Examples

### Complete Mobile-Responsive Component
```tsx
export function MobileResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape) and (max-height: 430px)');
  
  // Landscape-specific layout
  if (isLandscape) {
    return <LandscapeLayout />;
  }
  
  // Regular mobile/desktop layout
  return (
    <div className={cn(
      "p-3 sm:p-4 lg:p-6",
      isMobile && "p-2"
    )}>
      {/* Header - Hidden on mobile if shown in navbar */}
      {!isMobile && <Header />}
      
      {/* Content */}
      <main className="flex-1 min-h-0 overflow-auto">
        {/* ... */}
      </main>
      
      {/* Mobile FAB */}
      {isMobile && (
        <Button className="fixed bottom-6 right-6 z-[9999] rounded-full h-14 w-14">
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
```

### Mobile Hook Pattern
```tsx
// hooks/use-mobile.ts
export function useMobileDetect() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape) and (max-height: 430px)');
  const isTouch = useMediaQuery('(pointer: coarse)');
  
  return {
    isMobile,
    isLandscape,
    isTouch,
    isPortrait: isMobile && !isLandscape
  };
}
```

## Standardized Mobile Components (v2.0)

### Universal Mobile Dialog
Use `MobileDialog` for all modals across the app:

```tsx
import { MobileDialog } from '@/components/ui/mobile';

<MobileDialog
  open={open}
  onOpenChange={setOpen}
  title="Dialog Title"
  description="Optional description"
  size="md" // sm | md | lg | full
  footer={
    <>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </>
  }
>
  {/* Content */}
</MobileDialog>
```

**Standards:**
- Automatically switches between Dialog (desktop) and Sheet (mobile)
- Bottom sheet on mobile with 90vh height
- Consistent dark theme styling
- Built-in close button
- Footer for action buttons

### Mobile Card with Swipe Actions
Use `MobileCard` for all swipeable list items:

```tsx
import { MobileCard } from '@/components/ui/mobile';

<MobileCard
  leftSwipeAction={{
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    color: 'red',
    action: handleDelete
  }}
  rightSwipeAction={{
    id: 'complete',
    label: 'Complete',
    icon: Check,
    color: 'green',
    action: handleComplete
  }}
  onTap={handleTap}
  isDimmed={isCompleted}
>
  {/* Card content */}
</MobileCard>
```

**Standards:**
- Right swipe = Primary positive action (Complete, Approve, etc.)
- Left swipe = Destructive action (Delete, Reject, etc.)
- Gradient backgrounds: green (positive), red (destructive), blue (edit), yellow (warning)
- 100px swipe threshold for action trigger
- Scale animation on execution

### Mobile Detail Sheet
Use `MobileDetailSheet` for full item details:

```tsx
import { MobileDetailSheet } from '@/components/ui/mobile';

<MobileDetailSheet
  isOpen={open}
  onClose={handleClose}
  title="Item Title"
  subtitle="Optional subtitle"
  statusBadge={{
    label: 'Active',
    className: 'bg-green-500/20 text-green-400'
  }}
  sections={[
    {
      id: 'description',
      label: 'Description',
      icon: FileText,
      value: item.description
    }
  ]}
  actions={[
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit
    }
  ]}
/>
```

**Standards:**
- 85vh height for comfortable viewing
- Sticky header with status badge
- Scrollable content area
- Fixed action buttons at bottom
- Consistent section layout with icons

### Mobile List with Sections
Use `MobileList` for organized list displays:

```tsx
import { MobileList } from '@/components/ui/mobile';

<MobileList
  sections={[
    {
      id: 'active',
      title: 'Active Items',
      items: activeItems,
      renderItem: (item) => <ItemCard item={item} />
    },
    {
      id: 'completed',
      title: 'Completed',
      items: completedItems,
      renderItem: (item) => <ItemCard item={item} />
    }
  ]}
  showProgress={true}
  progressConfig={{
    completed: completedCount,
    total: totalCount,
    label: 'tasks completed'
  }}
  showCompletedToggle={true}
  completedSectionId="completed"
  storageKey="tasks"
/>
```

**Standards:**
- Progress indicator at top with green gradient
- Collapsible sections with item counts
- Completed items hidden by default
- Preferences saved to localStorage
- Empty state support

## Swipe Gesture Standards

### Swipe Actions Pattern
```typescript
// Standard swipe action colors
const swipeColors = {
  complete: 'green',   // Positive actions
  delete: 'red',       // Destructive actions
  edit: 'blue',        // Modify actions
  archive: 'gray',     // Neutral actions
  warning: 'yellow'    // Caution actions
};

// Standard swipe thresholds
const SWIPE_THRESHOLD = 60;      // Minimum to show action
const ACTION_THRESHOLD = 100;    // Distance to trigger
const MAX_SWIPE = 150;           // Maximum swipe distance
```

### Gesture Feedback
- Visual: Gradient background reveals during swipe
- Haptic: Vibration on action trigger (if supported)
- Animation: Scale down to 95% when executing
- Resistance: 30% resistance past threshold

## Toast Notifications

### Swipe-to-Dismiss Toasts
All toasts now support upward swipe to dismiss:

```tsx
import { toast } from '@/hooks/use-toast';

toast({
  title: 'Success',
  description: 'Action completed successfully',
  variant: 'default' // or 'destructive'
});
```

**Standards:**
- Swipe up to dismiss on mobile
- 4 second auto-dismiss
- Dark theme styling (graphite-800 background)
- Visual swipe indicator bar
- Appear from top on mobile

## Progress Indicators

### Standard Progress Bar
```tsx
<div className="bg-graphite-700 rounded-full h-2">
  <div
    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
    style={{ width: `${percentage}%` }}
  />
</div>
```

**Standards:**
- Green gradient for positive progress
- 2px height for subtle appearance
- Smooth transitions (300ms)
- Always show with completion stats

## Completed/Archived Items

### Handling Pattern
```typescript
// Standard approach for completed items
const [showCompleted, setShowCompleted] = useState(() => {
  const saved = localStorage.getItem('showCompleted');
  return saved ? JSON.parse(saved) : false;
});

// Visual treatment
className={cn(
  isCompleted && 'opacity-60 line-through'
)}
```

**Standards:**
- Hidden by default
- Toggle saved to localStorage
- 60% opacity when shown
- Strikethrough text
- Grouped at bottom of list
- Show count when hidden

## Migration from Old Components

### Component Mapping
| Old Component | New Component | Migration Notes |
|---|---|---|
| `Dialog` + custom mobile | `MobileDialog` | Automatic mobile adaptation |
| `MobileTaskDialog` | `MobileDialog` | Use universal component |
| Custom swipe cards | `MobileCard` | Standardized swipe actions |
| Custom detail views | `MobileDetailSheet` | Consistent detail pattern |
| Custom list layouts | `MobileList` | Built-in section management |

### Quick Migration Example
```tsx
// Old approach
{isMobile ? (
  <CustomBottomSheet>...</CustomBottomSheet>
) : (
  <Dialog>...</Dialog>
)}

// New approach
<MobileDialog>...</MobileDialog>
```

## Testing Checklist

### Device Testing
- [ ] iPhone SE (375x667)
- [ ] iPhone 14 Pro (393x852)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Samsung Galaxy S20 (360x800)
- [ ] iPad Mini (768x1024)

### Orientation Testing
- [ ] Portrait mode functionality
- [ ] Landscape mode navigation rail
- [ ] Orientation change animations

### Interaction Testing
- [ ] Touch targets are 48px minimum
- [ ] Swipe gestures work correctly
- [ ] Long press selections function
- [ ] FAB is always accessible
- [ ] Dialogs open/close properly

### Performance Testing
- [ ] No layout shift on load
- [ ] Smooth scrolling (60fps)
- [ ] Animations don't cause jank
- [ ] Loading states appear quickly

## Implementation Checklist

When implementing mobile features:

1. **Start with mobile-first CSS** - Build for mobile, enhance for desktop
2. **Use media query hooks** - Implement responsive behavior in React
3. **Implement bottom navigation** - Use MobileBottomNav component
4. **Integrate FAB in bottom nav** - Pass config via PageShell props
5. **Use bottom sheets for overflow** - Replace side drawers on mobile
6. **Simplify mobile header** - Remove hamburger, center title
7. **Add proper content padding** - Account for bottom nav (60px)
8. **Implement loading states** - Use skeletons for perceived performance
9. **Test touch interactions** - Ensure proper gesture support
10. **Optimize for single screen** - Minimize scrolling where possible
11. **Follow spacing guidelines** - Use appropriate padding/margins
12. **Apply theme consistently** - Use glass effects and standard colors
13. **Test on real devices** - Don't rely only on browser dev tools
14. **Document exceptions** - Note any deviations from standards

## Standard Mobile Search Bar (v3.0)

### Fixed Bottom Search with Integrated Controls
Position search bar at bottom for optimal thumb reach with integrated view toggle and filter:

```tsx
{/* Mobile Fixed Bottom Search Bar with View Toggle */}
{isMobile && (
  <div className="fixed bottom-16 left-0 right-0 z-40 p-3 bg-gray-900/95 backdrop-blur-sm border-t border-white/10">
    <div className="flex gap-2">
      {/* View Toggle - Left side for thumb access */}
      <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
        <button 
          onClick={() => setViewMode('card')}
          className={cn(
            "p-2 rounded-md transition-all",
            viewMode === 'card' 
              ? "bg-blue-600 text-white" 
              : "text-white/60 hover:text-white"
          )}
          aria-label="Card view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={cn(
            "p-2 rounded-md transition-all",
            viewMode === 'list' 
              ? "bg-blue-600 text-white" 
              : "text-white/60 hover:text-white"
          )}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white h-10"
        />
      </div>

      {/* Filter Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsFilterSheetOpen(true)}
        className="relative h-10 w-10"
      >
        <Filter className="h-4 w-4" />
        {activeFilters.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-600">
            {activeFilters.length}
          </Badge>
        )}
      </Button>
    </div>
  </div>
)}
```

**Standards:**
- Fixed position at `bottom-16` (above bottom nav)
- View toggle on LEFT for easy thumb access
- Search input takes remaining space
- Filter button on RIGHT with badge for active filters
- Glass morphism background with backdrop blur
- All controls in single row for efficient space use

## KPI Carousel Pattern (v3.0)

### Looping Stats Cards with Embla Carousel
Use KPICarousel component for consistent stats display across all pages:

```tsx
import { KPICarousel } from '@/components/schedule/kpi-carousel';

{/* Mobile Stats Carousel */}
{isMobile && (
  <KPICarousel
    cards={[
      {
        title: 'Total Items',
        value: items.length,
        subtitle: 'All items',
        icon: Users,
        iconColor: 'text-white/40',
      },
      {
        title: 'Active',
        value: activeCount,
        subtitle: 'Currently active',
        icon: UserCheck,
        iconColor: 'text-green-400',
      },
      // More cards...
    ]}
    className="-mx-3"
  />
)}
```

**Features:**
- Embla Carousel with smooth touch/swipe
- 80% card width with peek effect
- Looping enabled for continuous scroll
- Pagination dots (active dot is blue and longer)
- Consistent card design with icon, title, value, subtitle
- Automatic disable on larger screens

**Card Structure:**
```typescript
interface KPICard {
  title: string;           // Card title
  value: string | number;  // Main metric
  subtitle: string;        // Description
  icon: LucideIcon;       // Icon component
  iconColor?: string;     // Icon color class
}
```

---

*Last Updated: December 2024 - Added Mobile Search Bar and KPI Carousel Standards*
*Version: 3.0*
*Changes: Added fixed bottom search bar with integrated view toggle, KPI carousel pattern with Embla integration*