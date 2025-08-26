'use client';

import { useMediaQuery } from './use-media-query';

export function useResponsive() {
  // Mobile: 0-639px
  const isMobile = useMediaQuery('(max-width: 639px)');
  
  // Tablet: 640-1023px
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  
  // Small Desktop: 1024-1279px (problematic range where buttons overflow)
  const isSmallDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  
  // Medium Desktop: 1280-1535px
  const isMediumDesktop = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  
  // Large Desktop: 1536px+
  const isLargeDesktop = useMediaQuery('(min-width: 1536px)');
  
  // Combined helpers
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobileOrTablet = isMobile || isTablet;
  const isCompact = isMobile || isTablet || isSmallDesktop; // Need compact UI
  
  return {
    isMobile,
    isTablet,
    isSmallDesktop,
    isMediumDesktop,
    isLargeDesktop,
    isDesktop,
    isMobileOrTablet,
    isCompact,
    // Breakpoint values for reference
    breakpoints: {
      mobile: 640,
      tablet: 1024,
      desktop: 1280,
      large: 1536,
    }
  };
}