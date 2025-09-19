'use client';

import React, { useState, useEffect } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Smartphone,
  User,
  Navigation2,
  Moon,
  Sun,
  Monitor,
  Type,
  Layout,
  ChevronRight,
  Check,
  RotateCcw,
  Globe,
  Clock,
  Calendar,
  Languages,
  Zap,
  Fingerprint,
  Wifi,
  WifiOff,
  Database,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  MoreVertical,
  Home,
  ClipboardList,
  FileText,
  Users,
  DollarSign,
  ShoppingCart,
  FileBox,
  AlertTriangle,
  Upload,
  CreditCard
} from 'lucide-react';

// Navigation item icons mapping
const navIconMap: Record<string, any> = {
  home: Home,
  tasks: ClipboardList,
  'my-tasks': ClipboardList,
  bidding: FileText,
  bids: FileText,
  schedule: Calendar,
  'my-schedule': Calendar,
  contacts: Users,
  budget: DollarSign,
  procurement: ShoppingCart,
  plans: FileBox,
  risks: AlertTriangle,
  uploads: Upload,
  invoices: CreditCard
};

// Enhanced Navigation Customizer Component
const NavigationCustomizer = () => {
  const { preferences, updateNavigation, loading } = usePreferencesContext();
  const { userRole } = useAuth();
  const [selectedItems, setSelectedItems] = useState<string[]>(
    preferences?.mobileNavItems || ['home', 'tasks', 'schedule']
  );
  const [isSaving, setIsSaving] = useState(false);

  // Available items based on user role with Lucide icons
  const availableItems = {
    ADMIN: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'tasks', label: 'Tasks', icon: ClipboardList },
      { id: 'bidding', label: 'Bidding', icon: FileText },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'budget', label: 'Budget', icon: DollarSign },
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
      { id: 'plans', label: 'Plans', icon: FileBox },
      { id: 'risks', label: 'Risks', icon: AlertTriangle }
    ],
    STAFF: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'tasks', label: 'Tasks', icon: ClipboardList },
      { id: 'bidding', label: 'Bidding', icon: FileText },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'budget', label: 'Budget', icon: DollarSign },
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
      { id: 'plans', label: 'Plans', icon: FileBox }
    ],
    CONTRACTOR: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'my-tasks', label: 'My Tasks', icon: ClipboardList },
      { id: 'bids', label: 'Bids', icon: FileText },
      { id: 'my-schedule', label: 'Schedule', icon: Calendar },
      { id: 'uploads', label: 'Uploads', icon: Upload },
      { id: 'invoices', label: 'Invoices', icon: CreditCard },
      { id: 'plans', label: 'Plans', icon: FileBox }
    ],
    VIEWER: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'tasks', label: 'Tasks', icon: ClipboardList },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'plans', label: 'Plans', icon: FileBox }
    ]
  };

  const items = availableItems[userRole as keyof typeof availableItems] || availableItems.VIEWER;

  useEffect(() => {
    if (preferences?.mobileNavItems) {
      setSelectedItems(preferences.mobileNavItems);
    }
  }, [preferences?.mobileNavItems]);

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      if (selectedItems.length > 1) {
        setSelectedItems(selectedItems.filter(id => id !== itemId));
      } else {
        toast({
          title: 'Minimum items required',
          description: 'You must have at least one navigation item selected',
          variant: 'destructive'
        });
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

  const handleSave = async () => {
    if (selectedItems.length !== 3) {
      toast({
        title: 'Invalid selection',
        description: 'Please select exactly 3 navigation items',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateNavigation(selectedItems);
      toast({
        title: 'Navigation updated',
        description: 'Your navigation preferences have been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save navigation preferences',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <Label className="text-sm text-muted-foreground mb-3 block">Preview</Label>
        <div className="flex items-center justify-around">
          {selectedItems.map((itemId) => {
            const item = items.find(i => i.id === itemId);
            if (!item) return null;
            const Icon = item.icon;
            return (
              <div key={itemId} className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-lg bg-white/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            );
          })}
          {selectedItems.length < 3 && Array(3 - selectedItems.length).fill(0).map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center gap-1 opacity-30">
              <div className="p-2 rounded-lg border-2 border-dashed border-white/20">
                <div className="h-5 w-5" />
              </div>
              <span className="text-[10px] text-muted-foreground">Empty</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Select Navigation Items</Label>
          <span className="text-sm text-muted-foreground">
            {selectedItems.length}/3 selected
          </span>
        </div>

        <div className="grid gap-2">
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            const isDisabled = !isSelected && selectedItems.length >= 3;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && toggleItem(item.id)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? "bg-accent/20 border-accent shadow-lg shadow-accent/20"
                    : isDisabled
                    ? "opacity-40 cursor-not-allowed bg-white/5 border-white/10"
                    : "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isSelected ? "bg-accent/20" : "bg-white/10"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      isSelected ? "text-accent" : "text-white/70"
                    )} />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {isSelected ? 'Selected' : isDisabled ? 'Maximum reached' : 'Click to select'}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="p-1 rounded-full bg-accent">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={selectedItems.length !== 3 || isSaving}
        className="w-full bg-accent hover:bg-accent/90"
      >
        {isSaving ? 'Saving...' : 'Save Navigation'}
      </Button>
    </div>
  );
};

// Settings sections with proper icons
const settingsSections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'navigation', label: 'Navigation', icon: Navigation2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'profile', label: 'Profile', icon: User }
];

export default function SettingsPage() {
  const { user, userRole } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const [activeSection, setActiveSection] = useState('general');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetContent, setBottomSheetContent] = useState<string | null>(null);

  const {
    preferences,
    loading,
    updatePreference,
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
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Language
                </Label>
                <Select
                  value={preferences?.language || 'en'}
                  onValueChange={(value) => updatePreference('language', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Timezone
                </Label>
                <Select
                  value={preferences?.timezone || 'America/New_York'}
                  onValueChange={(value) => updatePreference('timezone', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Format
                </Label>
                <Select
                  value={preferences?.dateFormat || 'MM/dd/yyyy'}
                  onValueChange={(value) => updatePreference('dateFormat', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    <SelectItem value="dd.MM.yyyy">DD.MM.YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <Label>24-Hour Time</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Use 24-hour time format instead of AM/PM
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
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'auto', icon: Monitor, label: 'System' }
                ].map((theme) => {
                  const Icon = theme.icon;
                  const isActive = preferences?.theme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => switchTheme(theme.value as any)}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isActive
                          ? "bg-accent/20 border-accent"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Icon className={cn(
                        "h-6 w-6 mx-auto mb-2",
                        isActive ? "text-accent" : "text-white/70"
                      )} />
                      <span className="text-sm">{theme.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Font Size
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {['small', 'medium', 'large', 'xl'].map((size) => {
                  const isActive = preferences?.fontSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => updatePreference('fontSize', size as any)}
                      className={cn(
                        "py-2 px-3 rounded-lg border capitalize transition-all",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isActive
                          ? "bg-accent/20 border-accent"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      style={{ fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : size === 'xl' ? '18px' : '14px' }}
                    >
                      {size === 'xl' ? 'XL' : size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Density */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Display Density
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {['compact', 'comfortable', 'spacious'].map((density) => {
                  const isActive = preferences?.density === density;
                  return (
                    <button
                      key={density}
                      onClick={() => updatePreference('density', density as any)}
                      className={cn(
                        "py-3 px-4 rounded-lg border capitalize transition-all",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isActive
                          ? "bg-accent/20 border-accent"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {density}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
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

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-accent" />
                    <Label>Email Notifications</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Receive updates and alerts via email
                  </div>
                </div>
                <Switch
                  checked={preferences?.emailNotifications || false}
                  onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-accent" />
                    <Label>Push Notifications</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </div>
                </div>
                <Switch
                  checked={preferences?.pushNotifications || false}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    <Label>SMS Notifications</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Receive urgent alerts via text message
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
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Profile Visibility
                </Label>
                <Select
                  value={preferences?.profileVisibility || 'team'}
                  onValueChange={(value) => updatePreference('profileVisibility', value as any)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="team">Team Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    <Label>Activity Status</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Show when you're active to team members
                  </div>
                </div>
                <Switch
                  checked={preferences?.activityStatus || false}
                  onCheckedChange={(checked) => updatePreference('activityStatus', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Session Timeout
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[preferences?.sessionTimeout || 30]}
                      onValueChange={([value]) => updatePreference('sessionTimeout', value)}
                      min={5}
                      max={120}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16 text-right">
                      {preferences?.sessionTimeout || 30} min
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Automatically log out after this period of inactivity
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'mobile':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    <Label>Swipe Actions</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Enable swipe gestures for quick actions
                  </div>
                </div>
                <Switch
                  checked={preferences?.swipeActions !== false}
                  onCheckedChange={(checked) => updatePreference('swipeActions', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-accent" />
                    <Label>Haptic Feedback</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Vibration feedback for actions
                  </div>
                </div>
                <Switch
                  checked={preferences?.hapticFeedback !== false}
                  onCheckedChange={(checked) => updatePreference('hapticFeedback', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-accent" />
                    <Label>Biometric Authentication</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Use fingerprint or face unlock
                  </div>
                </div>
                <Switch
                  checked={preferences?.biometricAuth || false}
                  onCheckedChange={(checked) => updatePreference('biometricAuth', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-accent" />
                    <Label>Offline Mode</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cache data for offline access
                  </div>
                </div>
                <Switch
                  checked={preferences?.offlineMode !== false}
                  onCheckedChange={(checked) => updatePreference('offlineMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent" />
                    <Label>Data Saver</Label>
                  </div>
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
            <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center">
                <User className="h-8 w-8 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{user?.displayName || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="mt-1">{userRole}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono mt-1">{user?.uid}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <Label className="text-xs text-muted-foreground">Account Created</Label>
                <p className="text-sm mt-1">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Unknown'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <Label className="text-xs text-muted-foreground">Last Sign In</Label>
                <p className="text-sm mt-1">
                  {user?.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                      })
                    : 'Unknown'}
                </p>
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
        <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-black/20">
          <div className="p-4 border-b border-white/10 bg-black/20 backdrop-blur">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your preferences
            </p>
          </div>

          <div className="flex-1 overflow-auto p-4 pb-20">
            <div className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className="w-full group"
                  >
                    <Card className="glass-card border-white/10 hover:border-accent/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 group-hover:from-accent/30 group-hover:to-accent/20 transition-colors">
                              <Icon className="h-5 w-5 text-accent" />
                            </div>
                            <span className="font-medium">{section.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all settings to defaults?')) {
                    resetPreferences();
                    toast({
                      title: 'Settings reset',
                      description: 'All settings have been reset to defaults',
                    });
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>

          {/* Bottom Sheet for Settings Sections */}
          <BottomSheet
            isOpen={bottomSheetOpen}
            onClose={() => {
              setBottomSheetOpen(false);
              setBottomSheetContent(null);
            }}
            title={settingsSections.find(s => s.id === bottomSheetContent)?.label || 'Settings'}
          >
            <div className="p-4 pb-8 max-h-[70vh] overflow-auto">
              {bottomSheetContent && renderSectionContent(bottomSheetContent)}
            </div>
          </BottomSheet>
        </div>
      ) : (
        // Desktop Layout
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your application settings and preferences
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all settings to defaults?')) {
                      resetPreferences();
                      toast({
                        title: 'Settings reset',
                        description: 'All settings have been reset to defaults',
                      });
                    }
                  }}
                  className="text-red-600"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className={cn(
              "w-full",
              isTablet ? "flex flex-wrap h-auto gap-1 p-1" : "grid grid-cols-7"
            )}>
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className={cn(
                      "data-[state=active]:bg-accent data-[state=active]:text-white",
                      isTablet && "flex-1 min-w-[120px]"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className={cn(isTablet && "hidden lg:inline")}>
                      {section.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {settingsSections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="mt-6">
                <Card className="glass-card border-white/10">
                  <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent">
                    <CardTitle>{section.label} Settings</CardTitle>
                    <CardDescription>
                      Configure your {section.label.toLowerCase()} preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {renderSectionContent(section.id)}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </PageShell>
  );
}