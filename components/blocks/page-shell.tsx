"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Package,
  AlertTriangle,
  ClipboardList,
  ShoppingCart,
  FileBox,
  Upload,
  CreditCard,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  LucideIcon,
  GripVertical
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ProjectSwitcher } from '@/components/blocks/project-switcher'
import { useMediaQuery } from '@/hooks/use-media-query'
import { MobileBottomNav } from '@/components/blocks/mobile-bottom-nav'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { RearrangeableNavigation } from '@/components/blocks/rearrangeable-navigation'
import { usePreferencesContext, useNavigationItems } from '@/app/contexts/PreferencesContext'

interface PageShellProps {
  children: React.ReactNode
  pageTitle?: string
  userRole?: 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'
  userName?: string
  userEmail?: string
  fabIcon?: LucideIcon
  fabLabel?: string
  onFabClick?: () => void
}

// Centralized navigation item mapping - single source of truth
export const navItemMapping = {
  home: { id: 'home', adminHref: '/admin', contractorHref: '/contractor', label: 'Dashboard', icon: Home },
  tasks: { id: 'tasks', href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  'my-tasks': { id: 'my-tasks', href: '/contractor/my-tasks', label: 'My Tasks', icon: ClipboardList },
  bidding: { id: 'bidding', href: '/admin/bidding', label: 'Bidding', icon: FileText },
  bids: { id: 'bids', href: '/contractor/bids', label: 'Bids', icon: FileText },
  schedule: { id: 'schedule', href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  'my-schedule': { id: 'my-schedule', href: '/contractor/my-schedule', label: 'My Schedule', icon: Calendar },
  contacts: { id: 'contacts', href: '/admin/contacts', label: 'Contacts', icon: Users },
  budget: { id: 'budget', href: '/admin/budget', label: 'Budget', icon: DollarSign },
  procurement: { id: 'procurement', href: '/admin/procurement', label: 'Procurement', icon: ShoppingCart },
  plans: { id: 'plans', adminHref: '/admin/plans', contractorHref: '/contractor/plans', label: 'Plans', icon: FileBox },
  risks: { id: 'risks', href: '/admin/risks', label: 'Risks', icon: AlertTriangle },
  uploads: { id: 'uploads', href: '/contractor/uploads', label: 'Uploads', icon: Upload },
  invoices: { id: 'invoices', href: '/contractor/invoices', label: 'Invoices', icon: CreditCard },
  users: { id: 'users', href: '/admin/users', label: 'User Management', icon: Users },
} as const

export type NavItemId = keyof typeof navItemMapping

// Get available items based on role
export function getAvailableNavItems(role: string): NavItemId[] {
  switch (role) {
    case 'ADMIN':
    case 'STAFF':
      return ['home', 'tasks', 'bidding', 'schedule', 'contacts', 'budget', 'procurement', 'plans', 'risks', 'users']
    case 'CONTRACTOR':
      return ['home', 'my-tasks', 'bids', 'my-schedule', 'uploads', 'invoices', 'plans']
    case 'VIEWER':
    default:
      return ['home', 'tasks', 'schedule', 'contacts', 'plans']
  }
}

// Helper function to resolve navigation href based on role and item
export function resolveNavHref(id: string, isContractor: boolean): string {
  const item = navItemMapping[id as keyof typeof navItemMapping];
  if (!item) return '/';

  if ('href' in item) return item.href;
  if (isContractor && 'contractorHref' in item) return item.contractorHref;
  if (!isContractor && 'adminHref' in item) return item.adminHref;
  return '/';
}

// Legacy nav arrays for desktop sidebar
const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/bidding', label: 'Bidding', icon: FileText },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/contacts', label: 'Contacts', icon: Users },
  { href: '/admin/budget', label: 'Budget', icon: DollarSign },
  { href: '/admin/procurement', label: 'Procurement', icon: ShoppingCart },
  { href: '/admin/plans', label: 'Plans', icon: FileBox },
  { href: '/admin/risks', label: 'Risks', icon: AlertTriangle },
  { href: '/admin/users', label: 'User Management', icon: Users },
]

const contractorNavItems = [
  { href: '/contractor', label: 'Dashboard', icon: Home },
  { href: '/contractor/my-tasks', label: 'My Tasks', icon: ClipboardList },
  { href: '/contractor/my-schedule', label: 'My Schedule', icon: Calendar },
  { href: '/contractor/uploads', label: 'Uploads', icon: Upload },
  { href: '/contractor/invoices', label: 'Invoices', icon: CreditCard },
  { href: '/contractor/plans', label: 'Plans', icon: FileBox },
]

export function PageShell({ 
  children, 
  pageTitle, 
  userRole: propUserRole, 
  userName: propUserName, 
  userEmail: propUserEmail,
  fabIcon,
  fabLabel,
  onFabClick
}: PageShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, userRole: authUserRole } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape)') // Keep for mobile landscape detection
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Start collapsed by default
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [isRearranging, setIsRearranging] = useState(false)
  const { preferences, updateNavigation } = usePreferencesContext()
  const { items: navItemIds } = useNavigationItems()

  const isContractor = pathname.startsWith('/contractor')

  // Auto-collapse sidebar on desktop for cleaner initial state
  useEffect(() => {
    if (isDesktop) {
      setSidebarCollapsed(true)
    }
  }, [isDesktop])

  // Use auth context values if available, otherwise use props
  const userRole = authUserRole as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER' || propUserRole || 'VIEWER'
  const userName = user?.displayName || propUserName || 'User'
  const userEmail = user?.email || propUserEmail || 'user@example.com'

  const navItems = userRole === 'ADMIN' || userRole === 'STAFF' ? adminNavItems : contractorNavItems
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase()

  // Compute available navigation items for this user
  const availableNavIds = useMemo(() => getAvailableNavItems(userRole), [userRole])

  // Create a Set of bottom nav items for efficient lookup
  const bottomNavSet = useMemo(() => new Set(navItemIds || []), [navItemIds])

  // Compute "More" menu items - those NOT in bottom nav
  const moreMenuItems = useMemo(() => {
    return availableNavIds
      .filter(id => !bottomNavSet.has(id))
      .map(id => {
        const item = navItemMapping[id]
        // Determine correct href based on current section
        let href = item.href || ''
        if (isContractor && item.contractorHref) {
          href = item.contractorHref
        } else if (!isContractor && item.adminHref) {
          href = item.adminHref
        }
        return {
          id,
          href,
          label: item.label,
          icon: item.icon
        }
      })
      .filter(item => item.href) // Remove items without valid href
  }, [availableNavIds, bottomNavSet, isContractor])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="flex h-screen bg-graphite-900">
      {/* Sidebar / Navigation Rail */}
      <aside
        className={cn(
          "hidden md:flex flex-col glass border-r border-white/10 transition-all duration-300",
          "fixed left-0 top-0 h-full",
          sidebarCollapsed && !sidebarHovered ? "w-16" : "w-64",
          sidebarHovered && "shadow-2xl",
          // Higher z-index when expanded to appear over header
          sidebarHovered || !sidebarCollapsed ? "z-50" : "z-30"
        )}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="flex items-center h-[60px] border-b border-white/10 px-4">
          {/* Title with smooth fade animation */}
          <h2
            className={cn(
              "text-xl font-bold text-accent-500 whitespace-nowrap transition-opacity duration-300",
              sidebarCollapsed && !sidebarHovered ? "opacity-0 delay-0" : "opacity-100 delay-150"
            )}
            style={{
              transitionDelay: sidebarCollapsed && !sidebarHovered ? '0ms' : '150ms'
            }}
          >
            {isContractor ? 'Contractor Portal' : 'Admin Dashboard'}
          </h2>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            // Check exact match or if it's a sub-route (but not for dashboard which is a parent route)
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && item.href !== '/contractor' && pathname.startsWith(item.href + '/'))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg transition-colors px-3 py-2",
                  sidebarCollapsed && !sidebarHovered && "justify-center",
                  "hover:bg-white/10",
                  isActive && "bg-accent-500/20 text-accent-500",
                  !isActive && "text-white/70 hover:text-white"
                )}
                title={sidebarCollapsed && !sidebarHovered ? item.label : undefined}
              >
                <Icon className="flex-shrink-0 h-5 w-5" />
                <span
                  className={cn(
                    "transition-opacity duration-300 whitespace-nowrap",
                    sidebarCollapsed && !sidebarHovered ? "opacity-0" : "opacity-100 delay-150"
                  )}
                  style={{
                    transitionDelay: sidebarCollapsed && !sidebarHovered ? '0ms' : '150ms'
                  }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full text-white/70 hover:text-white",
                  sidebarCollapsed && !sidebarHovered ? "justify-center" : "justify-start"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-accent-500/20 text-accent-500">{initials}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "ml-3 text-left transition-opacity duration-300 overflow-hidden",
                    sidebarCollapsed && !sidebarHovered ? "opacity-0 w-0" : "opacity-100 w-auto delay-150"
                  )}
                  style={{
                    transitionDelay: sidebarCollapsed && !sidebarHovered ? '0ms' : '150ms'
                  }}
                >
                  <p className="font-medium text-sm whitespace-nowrap">{userName}</p>
                  <p className="text-white/50 text-xs whitespace-nowrap">{userRole}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Simplified Mobile Header */}
      <div
        data-ui="mobile-topbar"
        className="md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          {/* Project Switcher on mobile */}
          <ProjectSwitcher />
          
          <h2 className="font-bold text-accent-500 flex-1 text-center text-lg">
            {pageTitle || (isContractor ? 'Contractor Portal' : 'Admin Dashboard')}
          </h2>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-accent-500/20 text-accent-500">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && !isLandscape && (
        <MobileBottomNav
          onFabClick={onFabClick}
          fabIcon={fabIcon}
          fabLabel={fabLabel}
          onMoreClick={() => setBottomSheetOpen(true)}
        />
      )}

      {/* Bottom Sheet for More Items */}
      <BottomSheet
        open={bottomSheetOpen}
        onOpenChange={(open) => {
          setBottomSheetOpen(open)
          if (!open) setIsRearranging(false)
        }}
        title={isRearranging ? "" : "More Options"}
      >
        {isRearranging ? (
          <RearrangeableNavigation
            currentItems={navItemIds || []}
            availableItems={availableNavIds.map(id => {
              const item = navItemMapping[id]
              let href = item.href || ''
              if (isContractor && item.contractorHref) {
                href = item.contractorHref
              } else if (!isContractor && item.adminHref) {
                href = item.adminHref
              }
              return {
                id,
                label: item.label,
                icon: item.icon,
                href
              }
            })}
            onSave={(items) => {
              updateNavigation(items)
              setIsRearranging(false)
              setBottomSheetOpen(false)
            }}
            onCancel={() => setIsRearranging(false)}
          />
        ) : (
          <div>
            {/* Header with Rearrange button */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-semibold">More Options</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRearranging(true)}
                className="text-accent hover:bg-accent/20"
              >
                <GripVertical className="h-4 w-4 mr-2" />
                Rearrange
              </Button>
            </div>
            <nav className="space-y-1 p-4">
              {/* Show items NOT in bottom nav */}
              {moreMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setBottomSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg transition-colors px-3 py-3",
                      "hover:bg-white/10",
                      isActive && "bg-accent-500/20 text-accent-500",
                      !isActive && "text-white/70 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </BottomSheet>

      {/* Main Content */}
      <div className={cn(
        "flex-1 overflow-auto",
        "md:ml-16" // Account for collapsed sidebar width
      )}>
        {/* Desktop Header with Project Switcher */}
        <div
          data-ui="desktop-topbar"
          className="hidden md:flex sticky top-0 z-40 items-center justify-between p-4 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-black/30">
          <ProjectSwitcher />
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
        
        <main
          id="page-content"
          className={cn(
            "space-y-6 md:space-y-8",
            // TOP padding - pure CSS breakpoints (mobile-first)
            "pt-16 md:pt-4 lg:pt-6",
            // BOTTOM padding for mobile nav
            "pb-[60px] md:pb-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}