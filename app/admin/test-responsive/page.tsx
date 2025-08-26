'use client';

import { useResponsive } from '@/hooks/use-responsive';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdaptiveToolbar } from '@/components/ui/adaptive-toolbar';
import { Calendar, List, Grid, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function TestResponsivePage() {
  const responsive = useResponsive();
  const [selectedView, setSelectedView] = useState('grid');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const viewOptions = [
    { value: 'grid', label: 'Grid View', shortLabel: 'Grid', icon: Grid },
    { value: 'list', label: 'List View', shortLabel: 'List', icon: List },
    { value: 'calendar', label: 'Calendar View', shortLabel: 'Cal', icon: Calendar },
    { value: 'settings', label: 'Settings', shortLabel: 'Set', icon: Settings },
  ];

  const breakpointStatus = [
    { name: 'Small Mobile', query: 'isSmallMobile', active: responsive.isSmallMobile, range: '0-480px' },
    { name: 'Mobile', query: 'isMobile', active: responsive.isMobile, range: '0-639px' },
    { name: 'Small Tablet', query: 'isSmallTablet', active: responsive.isSmallTablet, range: '640-767px' },
    { name: 'Tablet', query: 'isTablet', active: responsive.isTablet, range: '640-1023px' },
    { name: 'Large Tablet', query: 'isLargeTablet', active: responsive.isLargeTablet, range: '768-1023px' },
    { name: 'Critical Zone', query: 'isInCriticalZone', active: responsive.isInCriticalZone, range: '1024-1100px', critical: true },
    { name: 'Small Desktop', query: 'isSmallDesktop', active: responsive.isSmallDesktop, range: '1024-1279px' },
    { name: 'Medium Desktop', query: 'isMediumDesktop', active: responsive.isMediumDesktop, range: '1280-1535px' },
    { name: 'Large Desktop', query: 'isLargeDesktop', active: responsive.isLargeDesktop, range: '1536px+' },
    { name: 'XL Desktop', query: 'isXLDesktop', active: responsive.isXLDesktop, range: '1920px+' },
  ];

  return (
    <PageShell
      userRole="ADMIN"
      userName="Test User"
      userEmail="test@example.com"
    >
      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Responsive Breakpoint Testing
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Current Window: {windowSize.width} x {windowSize.height}px
          </p>
        </div>

        {/* Current Breakpoint Display */}
        <Card className="bg-blue-600/10 border-blue-600/50">
          <CardHeader>
            <CardTitle className="text-blue-400">Current Breakpoint</CardTitle>
            <CardDescription className="text-white">
              <span className="text-2xl font-bold text-blue-300">
                {responsive.currentBreakpoint}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Toolbar Layout:</span>
                <Badge className="ml-2">{responsive.toolbarLayout}</Badge>
              </div>
              <div>
                <span className="text-white/60">Optimal Calendar View:</span>
                <Badge className="ml-2">{responsive.optimalCalendarView}</Badge>
              </div>
              <div>
                <span className="text-white/60">Needs Dropdown:</span>
                <Badge variant={responsive.needsDropdownMenu ? 'destructive' : 'outline'} className="ml-2">
                  {String(responsive.needsDropdownMenu)}
                </Badge>
              </div>
              <div>
                <span className="text-white/60">Touch Device:</span>
                <Badge variant={responsive.isTouch ? 'default' : 'outline'} className="ml-2">
                  {String(responsive.isTouch)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakpoint Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Breakpoint Status</CardTitle>
            <CardDescription>Active breakpoints are highlighted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {breakpointStatus.map((bp) => (
                <div
                  key={bp.query}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    bp.active 
                      ? bp.critical 
                        ? "bg-orange-500/20 border-orange-500"
                        : "bg-green-500/20 border-green-500" 
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-medium",
                      bp.critical && bp.active && "text-orange-400"
                    )}>
                      {bp.name}
                    </span>
                    <Badge variant={bp.active ? "default" : "outline"} className="text-xs">
                      {bp.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-xs text-white/60 mt-1">{bp.range}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Adaptive Toolbar */}
        <Card>
          <CardHeader>
            <CardTitle>Adaptive Toolbar Test</CardTitle>
            <CardDescription>
              Toolbar should switch to dropdown at 1024-1100px (Critical Zone)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-white/60 mb-2">Auto Mode (Default):</p>
              <AdaptiveToolbar
                options={viewOptions}
                value={selectedView}
                onChange={setSelectedView}
                label="View"
              />
            </div>
            
            <div>
              <p className="text-sm text-white/60 mb-2">Force Buttons:</p>
              <AdaptiveToolbar
                options={viewOptions}
                value={selectedView}
                onChange={setSelectedView}
                forceMode="buttons"
                maxVisibleButtons={3}
              />
            </div>
            
            <div>
              <p className="text-sm text-white/60 mb-2">Force Dropdown:</p>
              <AdaptiveToolbar
                options={viewOptions}
                value={selectedView}
                onChange={setSelectedView}
                forceMode="dropdown"
              />
            </div>
          </CardContent>
        </Card>

        {/* Responsive Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Design Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">Mobile</Badge>
                <div className="text-white/70">
                  Stacked layouts, large touch targets (44px min), swipe gestures enabled
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-orange-600">1024-1100px</Badge>
                <div className="text-white/70">
                  <span className="font-semibold text-orange-400">Critical Zone:</span> Always use dropdown menu to prevent button overflow
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">Tablet</Badge>
                <div className="text-white/70">
                  Compact single-row layouts, medium touch targets, hybrid navigation
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">Desktop</Badge>
                <div className="text-white/70">
                  Full button layouts, hover states, keyboard shortcuts, dense information display
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Zone Indicator */}
        <div className={cn(
          "fixed bottom-4 right-4 p-3 rounded-lg shadow-lg z-50",
          responsive.isInCriticalZone 
            ? "bg-orange-600 animate-pulse" 
            : "bg-gray-800"
        )}>
          <div className="text-xs font-mono text-white">
            {windowSize.width}px x {windowSize.height}px
          </div>
          {responsive.isInCriticalZone && (
            <div className="text-xs text-white mt-1">
              ⚠️ Critical Zone Active
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}