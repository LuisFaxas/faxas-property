"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  ClipboardList,
  Calendar,
  FileText,
  Grid3x3,
  Plus
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface MobileBottomNavProps {
  onFabClick?: () => void
  fabIcon?: LucideIcon
  fabLabel?: string
  onMoreClick?: () => void
}

const primaryNavItems: NavItem[] = [
  { href: '/admin', label: 'Home', icon: Home },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/bidding', label: 'Bidding', icon: FileText },
]

export function MobileBottomNav({ 
  onFabClick,
  fabIcon: FabIcon = Plus,
  fabLabel = "Add",
  onMoreClick
}: MobileBottomNavProps) {
  const pathname = usePathname()
  
  // Check if we're in contractor section
  const isContractor = pathname.startsWith('/contractor')

  // Use appropriate nav items based on user section
  const navItems = isContractor ? [
    { href: '/contractor', label: 'Home', icon: Home },
    { href: '/contractor/my-tasks', label: 'Tasks', icon: ClipboardList },
    { href: '/contractor/bids', label: 'Bids', icon: FileText },
  ] : primaryNavItems

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="flex items-center justify-around h-[60px] px-2">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && item.href !== '/contractor' && pathname.startsWith(item.href + '/'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] rounded-lg transition-colors",
                "hover:bg-white/10 active:scale-95",
                isActive && "text-accent-500",
                !isActive && "text-white/70"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Center FAB */}
        <div className="relative">
          <Button
            size="lg"
            onClick={onFabClick}
            className="relative -top-2 rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform border border-white/10"
            aria-label={fabLabel}
          >
            <FabIcon className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Third nav item */}
        {navItems[2] && (() => {
          const item = navItems[2]
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && item.href !== '/contractor' && pathname.startsWith(item.href + '/'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] rounded-lg transition-colors",
                "hover:bg-white/10 active:scale-95",
                isActive && "text-accent-500",
                !isActive && "text-white/70"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })()}

        {/* More button */}
        <button
          onClick={onMoreClick}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] rounded-lg transition-colors",
            "hover:bg-white/10 active:scale-95",
            "text-white/70"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}