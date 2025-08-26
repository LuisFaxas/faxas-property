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

---

*Last Updated: Based on Schedule page implementation*
*Version: 1.0*