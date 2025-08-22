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
  Menu
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface PageShellProps {
  children: React.ReactNode
  userRole?: 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'
  userName?: string
  userEmail?: string
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
  { href: '/admin/access', label: 'Access Control', icon: Settings },
]

const contractorNavItems = [
  { href: '/contractor', label: 'Dashboard', icon: Home },
  { href: '/contractor/my-tasks', label: 'My Tasks', icon: ClipboardList },
  { href: '/contractor/my-schedule', label: 'My Schedule', icon: Calendar },
  { href: '/contractor/uploads', label: 'Uploads', icon: FileText },
  { href: '/contractor/invoices', label: 'Invoices', icon: DollarSign },
  { href: '/contractor/plans', label: 'Plans', icon: FileText },
]

export function PageShell({ children, userRole: propUserRole, userName: propUserName, userEmail: propUserEmail }: PageShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, userRole: authUserRole } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col glass border-r border-white/10 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <h2 className="text-xl font-bold text-accent-500">Control Center</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-white/70 hover:text-white"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-white/10",
                  isActive && "bg-accent-500/20 text-accent-500",
                  !isActive && "text-white/70 hover:text-white"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-accent-500/20 text-accent-500">{initials}</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-white/50">{userRole}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
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

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white/70 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold text-accent-500">Control Center</h2>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-accent-500/20 text-accent-500">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 h-full glass border-r border-white/10" onClick={(e) => e.stopPropagation()}>
            <nav className="p-4 space-y-1 mt-16">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
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
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="md:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  )
}