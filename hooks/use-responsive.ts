'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from './use-media-query';

export function useResponsive() {
  // Granular mobile breakpoints
  const isSmallMobile = useMediaQuery('(max-width: 480px)'); // Very small phones
  const isMobile = useMediaQuery('(max-width: 639px)');
  
  // Tablet breakpoints
  const isSmallTablet = useMediaQuery('(min-width: 640px) and (max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isLargeTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  
  // CRITICAL: Problem zone where buttons overflow (1024-1100px)
  const isInCriticalZone = useMediaQuery('(min-width: 1024px) and (max-width: 1100px)');
  
  // Desktop breakpoints
  const isSmallDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isMediumDesktop = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1536px)');
  const isXLDesktop = useMediaQuery('(min-width: 1920px)'); // 4K and ultra-wide
  
  // Combined helpers
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobileOrTablet = isMobile || isTablet;
  const isCompact = isMobile || isTablet || isSmallDesktop;
  
  // Special helper for calendar toolbar - Use dropdown for smaller screens and critical zone
  const needsDropdownMenu = isMobile || isTablet || isInCriticalZone;
  
  // Orientation detection
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  // Touch capability detection
  const [isTouch, setIsTouch] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setSupportsHover(window.matchMedia('(hover: hover)').matches);
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Get current breakpoint name for debugging
  const getCurrentBreakpoint = (): string => {
    if (isXLDesktop) return 'xl-desktop';
    if (isLargeDesktop) return 'large-desktop';
    if (isMediumDesktop) return 'medium-desktop';
    if (isInCriticalZone) return 'critical-zone'; // Special handling needed
    if (isSmallDesktop) return 'small-desktop';
    if (isLargeTablet) return 'large-tablet';
    if (isSmallTablet) return 'small-tablet';
    if (isSmallMobile) return 'small-mobile';
    if (isMobile) return 'mobile';
    return 'unknown';
  };
  
  // Helper to determine optimal calendar view based on screen size
  const getOptimalCalendarView = (): string => {
    if (isSmallMobile && isPortrait) return 'listWeek'; // List for very small portrait
    if (isSmallMobile && isLandscape) return 'timeGridDay'; // Day view for small mobile landscape
    if (isMobile && isPortrait) return 'dayGridMonth'; // Month for mobile portrait
    if (isMobile && isLandscape) return 'timeGridWeek'; // Week for mobile landscape
    if (isTablet) return 'timeGridWeek'; // Week view for tablets
    return 'dayGridMonth'; // Month view for desktop
  };
  
  // Helper for determining toolbar layout style - FIXED LOGIC
  const getToolbarLayout = (): 'stacked' | 'compact' | 'dropdown' | 'full' => {
    // Mobile always gets stacked/compact layout
    if (isMobile) return 'stacked';
    
    // Tablet ALWAYS gets dropdown to prevent overflow
    if (isTablet) return 'dropdown';
    
    // Critical zone (1024-1100px) ALWAYS gets dropdown
    if (isInCriticalZone) return 'dropdown';
    
    // Small desktop (1101-1279px) can use compact buttons if not in critical zone
    if (isSmallDesktop && !isInCriticalZone) return 'compact';
    
    // Medium and large desktop (1280px+) get full button layout
    if (isMediumDesktop || isLargeDesktop || isXLDesktop) return 'full';
    
    // Default to dropdown for safety
    return 'dropdown';
  };
  
  return {
    // Granular breakpoints
    isSmallMobile,
    isMobile,
    isSmallTablet,
    isTablet,
    isLargeTablet,
    isInCriticalZone, // NEW: Critical zone detection
    isSmallDesktop,
    isMediumDesktop,
    isLargeDesktop,
    isXLDesktop,
    
    // Combined helpers
    isDesktop,
    isMobileOrTablet,
    isCompact,
    needsDropdownMenu, // NEW: Specific helper for calendar toolbar
    
    // Device capabilities
    isPortrait,
    isLandscape,
    isTouch,
    supportsHover,
    
    // Utility functions
    currentBreakpoint: getCurrentBreakpoint(),
    optimalCalendarView: getOptimalCalendarView(),
    toolbarLayout: getToolbarLayout(),
    
    // Breakpoint values for reference
    breakpoints: {
      smallMobile: 480,
      mobile: 640,
      smallTablet: 768,
      tablet: 1024,
      criticalZone: 1100, // NEW: Problem zone upper bound
      desktop: 1280,
      large: 1536,
      xlarge: 1920,
    }
  };
}