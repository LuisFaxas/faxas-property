'use client';

import React, { useState } from 'react';
import { PageShell } from '@/components/blocks/page-shell';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/app/contexts/AuthContext';
import { usePreferencesContext } from '@/app/contexts/PreferencesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Smartphone,
  User,
  Navigation,
  Moon,
  Sun,
  Monitor,
  Type,
  Layout,
  Gauge,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  Save
} from 'lucide-react';

// Navigation Customizer Component
const NavigationCustomizer = () => {
  const { preferences, updateNavigation, loading } = usePreferencesContext();
  const { userRole } = useAuth();
  const [selectedItems, setSelectedItems] = useState<string[]>(
    preferences?.mobileNavItems || ['home', 'tasks', 'schedule']
  );

  // Available items based on user role
  const availableItems = {
    ADMIN: [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'tasks', label: 'Tasks', icon: '📋' },
      { id: 'bidding', label: 'Bidding', icon: '📄' },
      { id: 'schedule', label: 'Schedule', icon: '📅' },
      { id: 'contacts', label: 'Contacts', icon: '👥' },
      { id: 'budget', label: 'Budget', icon: '💰' },
      { id: 'procurement', label: 'Procurement', icon: '🛒' },
      { id: 'plans', label: 'Plans', icon: '📐' },
      { id: 'risks', label: 'Risks', icon: '⚠️' }
    ],
    STAFF: [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'tasks', label: 'Tasks', icon: '📋' },
      { id: 'bidding', label: 'Bidding', icon: '📄' },
      { id: 'schedule', label: 'Schedule', icon: '📅' },
      { id: 'contacts', label: 'Contacts', icon: '👥' },
      { id: 'budget', label: 'Budget', icon: '💰' },
      { id: 'procurement', label: 'Procurement', icon: '🛒' },
      { id: 'plans', label: 'Plans', icon: '📐' }
    ],
    CONTRACTOR: [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'my-tasks', label: 'My Tasks', icon: '📋' },
      { id: 'bids', label: 'Bids', icon: '📄' },
      { id: 'my-schedule', label: 'Schedule', icon: '📅' },
      { id: 'uploads', label: 'Uploads', icon: '📤' },
      { id: 'invoices', label: 'Invoices', icon: '💳' },
      { id: 'plans', label: 'Plans', icon: '📐' }
    ],
    VIEWER: [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'tasks', label: 'Tasks', icon: '📋' },
      { id: 'schedule', label: 'Schedule', icon: '📅' },
      { id: 'contacts', label: 'Contacts', icon: '👥' },
      { id: 'plans', label: 'Plans', icon: '📐' }
    ]
  };

  const items = availableItems[userRole as keyof typeof availableItems] || availableItems.VIEWER;

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      if (selectedItems.length > 3) {
        setSelectedItems(selectedItems.filter(id => id !== itemId));
      }
    } else {
      if (selectedItems.length < 3) {
        setSelectedItems([...selectedItems, itemId]);
      } else {
        toast({
          title: 'Maximum items reached',
          description: 'You can only select 3 navigation items',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSave = () => {
    updateNavigation(selectedItems);
    toast({
      title: 'Navigation updated',
      description: 'Your navigation preferences have been saved'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select 3 items to appear in your bottom navigation
      </div>

      <div className="grid gap-2">
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const isDisabled = !isSelected && selectedItems.length >= 3;

          return (
            <div
              key={item.id}
              onClick={() => !isDisabled && toggleItem(item.id)}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer",
                isSelected
                  ? "bg-accent/10 border-accent"
                  : isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {isSelected && (
                <Check className="h-5 w-5 text-accent" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {selectedItems.length}/3 items selected
        </div>
        <Button
          onClick={handleSave}
          disabled={selectedItems.length !== 3}
          className="bg-accent hover:bg-accent/90"
        >
          Save Navigation
        </Button>
      </div>
    </div>
  );
};

// Settings sections for mobile
const settingsSections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'profile', label: 'Profile', icon: User }
];

export default function SettingsPage() {
  const { user, userRole } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeSection, setActiveSection] = useState('general');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetContent, setBottomSheetContent] = useState<string | null>(null);

  const {
    preferences,
    loading,
    updatePreference,
    updatePreferences,
    resetPreferences,
    switchTheme
  } = usePreferencesContext();

  const handleSectionClick = (sectionId: string) => {
    if (isMobile) {
      setBottomSheetContent(sectionId);
      setBottomSheetOpen(true);
    } else {
      setActiveSection(sectionId);
    }
  };

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={preferences?.language || 'en'}
                  onValueChange={(value) => updatePreference('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={preferences?.timezone || 'America/New_York'}
                  onValueChange={(value) => updatePreference('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={preferences?.dateFormat || 'MM/dd/yyyy'}
                  onValueChange={(value) => updatePreference('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>24-Hour Time</Label>
                  <div className="text-sm text-muted-foreground">
                    Use 24-hour time format
                  </div>
                </div>
                <Switch
                  checked={preferences?.timeFormat === '24h'}
                  onCheckedChange={(checked) =>
                    updatePreference('timeFormat', checked ? '24h' : '12h')
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <RadioGroup
                  value={preferences?.theme || 'dark'}
                  onValueChange={(value) => switchTheme(value as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Font Size
                </Label>
                <RadioGroup
                  value={preferences?.fontSize || 'medium'}
                  onValueChange={(value) => updatePreference('fontSize', value as any)}
                >
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center">
                      <RadioGroupItem value="small" id="small" className="sr-only" />
                      <Label
                        htmlFor="small"
                        className="flex-1 cursor-pointer text-center p-2 rounded border hover:bg-accent/10"
                      >
                        Small
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="medium" id="medium" className="sr-only" />
                      <Label
                        htmlFor="medium"
                        className="flex-1 cursor-pointer text-center p-2 rounded border hover:bg-accent/10"
                      >
                        Medium
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="large" id="large" className="sr-only" />
                      <Label
                        htmlFor="large"
                        className="flex-1 cursor-pointer text-center p-2 rounded border hover:bg-accent/10"
                      >
                        Large
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="xl" id="xl" className="sr-only" />
                      <Label
                        htmlFor="xl"
                        className="flex-1 cursor-pointer text-center p-2 rounded border hover:bg-accent/10"
                      >
                        XL
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Display Density
                </Label>
                <RadioGroup
                  value={preferences?.density || 'comfortable'}
                  onValueChange={(value) => updatePreference('density', value as any)}
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center">
                      <RadioGroupItem value="compact" id="compact" className="sr-only" />
                      <Label
                        htmlFor="compact"
                        className="flex-1 cursor-pointer text-center p-2 rounded border hover:bg-accent/10"
                      >
                        Compact
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="comfortable" id="comfortable" className="sr-only" />
                      <Label
                        htmlFor="comfortable"
                        className="flex-1 cursor-pointer text-center p-2 rounded border hover:bg-accent/10"
                      >
                        Comfortable
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="spacious" id="spacious" className="sr-only" />
                      <Label
                        htmlFor="spacious"
                        className="flex-1 cursor-pointer text-center p-2 rounded border hover:bg-accent/10"
                      >
                        Spacious
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Contrast</Label>
                  <div className="text-sm text-muted-foreground">
                    Increase contrast for better visibility
                  </div>
                </div>
                <Switch
                  checked={preferences?.highContrast || false}
                  onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduce Motion</Label>
                  <div className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </div>
                </div>
                <Switch
                  checked={preferences?.reduceMotion || false}
                  onCheckedChange={(checked) => updatePreference('reduceMotion', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'navigation':
        return <NavigationCustomizer />;

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive updates via email
                  </div>
                </div>
                <Switch
                  checked={preferences?.emailNotifications || false}
                  onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </div>
                </div>
                <Switch
                  checked={preferences?.pushNotifications || false}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive text message notifications
                  </div>
                </div>
                <Switch
                  checked={preferences?.smsNotifications || false}
                  onCheckedChange={(checked) => updatePreference('smsNotifications', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Digest Frequency</Label>
                <Select
                  value={preferences?.digestFrequency || 'daily'}
                  onValueChange={(value) => updatePreference('digestFrequency', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select
                  value={preferences?.profileVisibility || 'team'}
                  onValueChange={(value) => updatePreference('profileVisibility', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="team">Team Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Show when you're active
                  </div>
                </div>
                <Switch
                  checked={preferences?.activityStatus || false}
                  onCheckedChange={(checked) => updatePreference('activityStatus', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[preferences?.sessionTimeout || 30]}
                    onValueChange={([value]) => updatePreference('sessionTimeout', value)}
                    min={5}
                    max={120}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">
                    {preferences?.sessionTimeout || 30}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'mobile':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Swipe Actions</Label>
                  <div className="text-sm text-muted-foreground">
                    Enable swipe gestures for quick actions
                  </div>
                </div>
                <Switch
                  checked={preferences?.swipeActions || false}
                  onCheckedChange={(checked) => updatePreference('swipeActions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Haptic Feedback</Label>
                  <div className="text-sm text-muted-foreground">
                    Vibration feedback for actions
                  </div>
                </div>
                <Switch
                  checked={preferences?.hapticFeedback || false}
                  onCheckedChange={(checked) => updatePreference('hapticFeedback', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Biometric Authentication</Label>
                  <div className="text-sm text-muted-foreground">
                    Use fingerprint or face unlock
                  </div>
                </div>
                <Switch
                  checked={preferences?.biometricAuth || false}
                  onCheckedChange={(checked) => updatePreference('biometricAuth', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offline Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Cache data for offline access
                  </div>
                </div>
                <Switch
                  checked={preferences?.offlineMode || false}
                  onCheckedChange={(checked) => updatePreference('offlineMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Saver</Label>
                  <div className="text-sm text-muted-foreground">
                    Reduce data usage on mobile networks
                  </div>
                </div>
                <Switch
                  checked={preferences?.dataSaver || false}
                  onCheckedChange={(checked) => updatePreference('dataSaver', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="text-sm font-medium">{user?.displayName || 'Not set'}</div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="text-sm font-medium">{user?.email}</div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Badge variant="outline">{userRole}</Badge>
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <div className="text-sm font-medium">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {isMobile ? (
        // Mobile Layout
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your preferences
            </p>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card
                    key={section.id}
                    className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSectionClick(section.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-accent" />
                          <span className="font-medium">{section.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={resetPreferences}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>

          {/* Bottom Sheet for Settings Sections */}
          <BottomSheet
            isOpen={bottomSheetOpen}
            onClose={() => setBottomSheetOpen(false)}
            title={settingsSections.find(s => s.id === bottomSheetContent)?.label || 'Settings'}
          >
            <div className="p-4">
              {bottomSheetContent && renderSectionContent(bottomSheetContent)}
            </div>
          </BottomSheet>
        </div>
      ) : (
        // Desktop Layout
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your application settings and preferences
            </p>
          </div>

          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="grid grid-cols-7 w-full">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger key={section.id} value={section.id}>
                    <Icon className="h-4 w-4 mr-2" />
                    {section.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {settingsSections.map((section) => (
              <TabsContent key={section.id} value={section.id}>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>{section.label} Settings</CardTitle>
                    <CardDescription>
                      Configure your {section.label.toLowerCase()} preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderSectionContent(section.id)}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetPreferences}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}