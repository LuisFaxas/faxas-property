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
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  LucideIcon
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ProjectSwitcher } from '@/components/blocks/project-switcher'
import { useMediaQuery } from '@/hooks/use-media-query'
import { MobileBottomNav } from '@/components/blocks/mobile-bottom-nav'
import { BottomSheet } from '@/components/ui/bottom-sheet'

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

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/contacts', label: 'Contacts', icon: Users },
  { href: '/admin/budget', label: 'Budget', icon: DollarSign },
  { href: '/admin/procurement', label: 'Procurement', icon: Package },
  { href: '/admin/plans', label: 'Plans', icon: FileText },
  { href: '/admin/risks', label: 'Risks', icon: AlertTriangle },
  { href: '/admin/users', label: 'User Management', icon: Users },
]

const contractorNavItems = [
  { href: '/contractor', label: 'Dashboard', icon: Home },
  { href: '/contractor/my-tasks', label: 'My Tasks', icon: ClipboardList },
  { href: '/contractor/my-schedule', label: 'My Schedule', icon: Calendar },
  { href: '/contractor/uploads', label: 'Uploads', icon: FileText },
  { href: '/contractor/invoices', label: 'Invoices', icon: DollarSign },
  { href: '/contractor/plans', label: 'Plans', icon: FileText },
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
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape)')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  
  // Auto-collapse sidebar when entering landscape
  useEffect(() => {
    if (isLandscape) {
      setSidebarCollapsed(true)
    }
  }, [isLandscape])

  // Use auth context values if available, otherwise use props
  const userRole = authUserRole as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER' || propUserRole || 'VIEWER'
  const userName = user?.displayName || propUserName || 'User'
  const userEmail = user?.email || propUserEmail || 'user@example.com'

  const navItems = userRole === 'ADMIN' || userRole === 'STAFF' ? adminNavItems : contractorNavItems
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase()

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
          isLandscape && "fixed left-0 top-0 h-full z-30",
          sidebarCollapsed ? "w-16" : "w-64",
          isLandscape && sidebarCollapsed && !sidebarHovered && "w-14",
          isLandscape && (sidebarHovered || !sidebarCollapsed) && "w-52 shadow-2xl"
        )}
        onMouseEnter={() => isLandscape && setSidebarHovered(true)}
        onMouseLeave={() => isLandscape && setSidebarHovered(false)}
      >
        <div className={cn(
          "flex items-center justify-between border-b border-white/10",
          isLandscape ? "p-2" : "p-4"
        )}>
          {(!sidebarCollapsed || sidebarHovered) && !isLandscape && (
            <h2 className="text-xl font-bold text-accent-500">Control Center</h2>
          )}
          {isLandscape && (sidebarHovered || !sidebarCollapsed) && (
            <h2 className="text-lg font-bold text-accent-500">Menu</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "text-white/70 hover:text-white",
              isLandscape && sidebarCollapsed && !sidebarHovered && "mx-auto"
            )}
          >
            {sidebarCollapsed && !sidebarHovered ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
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
                  "flex items-center gap-3 rounded-lg transition-colors",
                  isLandscape ? "px-2 py-1.5" : "px-3 py-2",
                  isLandscape && sidebarCollapsed && !sidebarHovered && "justify-center",
                  "hover:bg-white/10",
                  isActive && "bg-accent-500/20 text-accent-500",
                  !isActive && "text-white/70 hover:text-white"
                )}
                title={(sidebarCollapsed && !sidebarHovered) ? item.label : undefined}
              >
                <Icon className={cn(
                  "flex-shrink-0",
                  isLandscape ? "h-4 w-4" : "h-5 w-5"
                )} />
                {(!sidebarCollapsed || sidebarHovered) && (
                  <span className={cn(
                    isLandscape && "text-sm"
                  )}>{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={cn(
          "border-t border-white/10",
          isLandscape ? "p-2" : "p-4"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full text-white/70 hover:text-white",
                  isLandscape && sidebarCollapsed && !sidebarHovered ? "justify-center" : "justify-start"
                )}
              >
                <Avatar className={cn(
                  isLandscape ? "h-6 w-6" : "h-8 w-8"
                )}>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-accent-500/20 text-accent-500">{initials}</AvatarFallback>
                </Avatar>
                {(!sidebarCollapsed || sidebarHovered) && (
                  <div className="ml-3 text-left">
                    <p className={cn(
                      "font-medium",
                      isLandscape ? "text-xs" : "text-sm"
                    )}>{userName}</p>
                    <p className={cn(
                      "text-white/50",
                      isLandscape ? "text-[10px]" : "text-xs"
                    )}>{userRole}</p>
                  </div>
                )}
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
      <div className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/10",
        isLandscape && "py-0"
      )}>
        <div className={cn(
          "flex items-center justify-between p-4",
          isLandscape && "p-2"
        )}>
          {/* Project Switcher on mobile */}
          <ProjectSwitcher />
          
          <h2 className={cn(
            "font-bold text-accent-500 flex-1 text-center",
            isLandscape ? "text-sm" : "text-lg"
          )}>{pageTitle || 'Control Center'}</h2>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Avatar className={isLandscape ? "h-6 w-6" : "h-8 w-8"}>
                  <AvatarImage src="" />
                  <AvatarFallback className={cn(
                    "bg-accent-500/20 text-accent-500",
                    isLandscape && "text-[10px]"
                  )}>{initials}</AvatarFallback>
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
        onOpenChange={setBottomSheetOpen}
        title="More Options"
      >
        <nav className="space-y-1">
          {/* Show remaining nav items that aren't in bottom nav */}
          {navItems.slice(3).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
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
      </BottomSheet>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto",
        isLandscape && "ml-14"
      )}>
        {/* Desktop Header with Project Switcher */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-white/10 glass">
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
        
        <div className={cn(
          "md:pt-0 pt-16",
          isLandscape && "pt-10",
          isMobile && !isLandscape && "pb-[60px]" // Account for bottom nav height
        )}>
          {children}
        </div>
      </main>
    </div>
  )
}