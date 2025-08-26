# Responsive Components Documentation

## Overview
This document describes the reusable responsive components and hooks created for the Control Center application. These components are designed to work seamlessly across all device sizes and can be used throughout the application.

## Components

### 1. AdaptiveToolbar
**Location:** `components/ui/adaptive-toolbar.tsx`

A responsive toolbar that automatically switches between button groups and dropdown menus based on screen size.

#### Features:
- Automatically detects critical breakpoints (1024-1100px) where buttons would overflow
- Supports icons, labels, and tooltips
- Three modes: auto, buttons, dropdown
- Customizable button variants and sizes
- Overflow menu for additional options

#### Usage:
```tsx
import { AdaptiveToolbar } from '@/components/ui/adaptive-toolbar';

const viewOptions = [
  { value: 'grid', label: 'Grid View', icon: Grid },
  { value: 'list', label: 'List View', icon: List },
];

<AdaptiveToolbar
  options={viewOptions}
  value={selectedView}
  onChange={setSelectedView}
  forceMode="auto" // auto | buttons | dropdown
  maxVisibleButtons={4}
/>
```

## Hooks

### 1. useResponsive
**Location:** `hooks/use-responsive.ts`

Enhanced responsive hook with granular breakpoint detection and utilities.

#### Key Features:
- Detects critical zone (1024-1100px) where UI elements commonly overflow
- Provides layout helpers (toolbarLayout, optimalCalendarView)
- Touch device detection
- Orientation detection
- Current breakpoint name

#### Breakpoints:
- `smallMobile`: 0-480px
- `mobile`: 0-639px
- `tablet`: 640-1023px
- `criticalZone`: 1024-1100px (⚠️ Problem zone)
- `smallDesktop`: 1024-1279px
- `mediumDesktop`: 1280-1535px
- `largeDesktop`: 1536px+
- `xlDesktop`: 1920px+

#### Usage:
```tsx
import { useResponsive } from '@/hooks/use-responsive';

const { 
  isMobile,
  isInCriticalZone, // true at 1024-1100px
  needsDropdownMenu,
  toolbarLayout, // 'stacked' | 'compact' | 'dropdown' | 'full'
  isTouch,
  currentBreakpoint
} = useResponsive();
```

### 2. useSwipeGestures
**Location:** `hooks/use-swipe-gestures.ts`

Adds swipe gesture support to any component, perfect for mobile navigation.

#### Features:
- Directional swipe detection (left, right, up, down)
- Customizable threshold
- Mouse drag support for desktop
- Prevent scroll during swipe option

#### Usage:
```tsx
import { useSwipeGestures } from '@/hooks/use-swipe-gestures';

const swipeHandlers = useSwipeGestures({
  onSwipeLeft: () => navigateNext(),
  onSwipeRight: () => navigatePrevious(),
  threshold: 75,
  enabled: isMobile,
});

<div {...swipeHandlers}>
  {/* Swipeable content */}
</div>
```

### 3. useCalendarSwipe
**Location:** `hooks/use-swipe-gestures.ts`

Specialized swipe hook for calendar navigation.

#### Usage:
```tsx
import { useCalendarSwipe } from '@/hooks/use-swipe-gestures';

const swipeHandlers = useCalendarSwipe(
  handlePrevMonth,
  handleNextMonth,
  (direction) => changeView(direction) // optional vertical swipe
);
```

## CSS Utilities

### Critical Breakpoint Fix
**Location:** `styles/fullcalendar.css`

Special CSS media queries to handle the 1050px overflow issue:

```css
/* Critical Breakpoint Fix - Prevents button overflow at 1050px */
@media (min-width: 1024px) and (max-width: 1100px) {
  .calendar-toolbar-buttons {
    display: none !important;
  }
  .calendar-toolbar-dropdown {
    display: flex !important;
  }
}
```

## Best Practices

### 1. Always Check Critical Zone
When implementing toolbars or button groups, always check for the critical zone:
```tsx
const shouldUseDropdown = isInCriticalZone || needsDropdownMenu;
```

### 2. Progressive Enhancement
Start with mobile experience and enhance for larger screens:
```tsx
const layout = isMobile ? 'stacked' : 
               isTablet ? 'compact' :
               isInCriticalZone ? 'dropdown' :
               'full';
```

### 3. Touch-First Interactions
Enable swipe gestures for touch devices:
```tsx
if (isTouch) {
  // Add swipe handlers
  return <SwipeableComponent />;
}
```

### 4. Responsive Text
Use short labels on smaller screens:
```tsx
const label = isMobile ? option.shortLabel : option.label;
```

## Testing

### Test Page
**Location:** `/admin/test-responsive`

Visit this page to test all responsive breakpoints and see real-time breakpoint detection.

### Key Test Points:
1. **320px** - Minimum mobile width
2. **480px** - Small mobile breakpoint
3. **640px** - Tablet starts
4. **768px** - Large tablet
5. **1024px** - Desktop starts
6. **1050px** - ⚠️ Critical zone (buttons overflow)
7. **1100px** - Critical zone ends
8. **1280px** - Medium desktop
9. **1536px** - Large desktop
10. **1920px** - 4K/Ultra-wide

## Dependencies

### Required Packages:
```json
{
  "react-swipeable": "^7.0.2"  // Touch gesture support
}
```

## Migration Guide

### Updating Existing Components:
1. Replace static breakpoint checks with `useResponsive` hook
2. Replace button groups with `AdaptiveToolbar` for automatic overflow handling
3. Add swipe gestures to mobile views using `useSwipeGestures`
4. Test at 1050px width to ensure no overflow issues

### Example Migration:
```tsx
// Before:
const isMobile = window.innerWidth < 640;
{isMobile ? <Dropdown /> : <ButtonGroup />}

// After:
const { needsDropdownMenu } = useResponsive();
<AdaptiveToolbar 
  options={options}
  value={value}
  onChange={onChange}
/>
```

## Known Issues & Solutions

### Issue: Buttons overflow at ~1050px
**Solution:** The critical zone (1024-1100px) is now detected and automatically uses dropdown menu.

### Issue: Touch gestures not working
**Solution:** Ensure `isTouch` is checked and swipe handlers are properly spread on the container element.

### Issue: Transitions too jarring
**Solution:** Added smooth CSS transitions with 300ms duration for all responsive changes.

## Future Enhancements
- [ ] Add pinch-to-zoom gestures
- [ ] Implement smart button prioritization (show most used buttons)
- [ ] Add keyboard shortcuts for desktop
- [ ] Create responsive data table component
- [ ] Add responsive chart components