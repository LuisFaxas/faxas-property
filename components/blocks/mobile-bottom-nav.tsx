"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNavigationItems } from '@/app/contexts/PreferencesContext'
import { useAuth } from '@/app/contexts/AuthContext'
import { navItemMapping } from '@/components/blocks/page-shell'
import {
  Home,
  ClipboardList,
  Calendar,
  FileText,
  Grid3x3,
  Plus,
  Users,
  DollarSign,
  ShoppingCart,
  FileBox,
  AlertTriangle,
  Upload,
  CreditCard,
  FolderOpen
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { useMemo } from 'react'

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

export function MobileBottomNav({
  onFabClick,
  fabIcon: FabIcon = Plus,
  fabLabel = "Add",
  onMoreClick
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const { userRole } = useAuth()
  const { items: navItemIds } = useNavigationItems()

  // Check if we're in contractor section
  const isContractor = pathname.startsWith('/contractor')

  // Build nav items from preferences
  const navItems = useMemo(() => {
    // Take exactly the 3 items from preferences (or fewer if not set)
    const items = navItemIds.slice(0, 3)

    return items.map(itemId => {
      const mappedItem = navItemMapping[itemId]
      if (!mappedItem) return null

      // Use appropriate href based on section
      let href = mappedItem.href || ''
      if (isContractor && mappedItem.contractorHref) {
        href = mappedItem.contractorHref
      } else if (!isContractor && mappedItem.adminHref) {
        href = mappedItem.adminHref
      }

      return {
        href,
        label: mappedItem.label,
        icon: mappedItem.icon
      }
    }).filter(Boolean) as NavItem[]
  }, [navItemIds, isContractor])

  // Ensure we always render 3 slots even if some are empty
  const renderNavItem = (index: number) => {
    const item = navItems[index]
    if (!item) return <div className="min-w-[60px]" /> // Empty spacer

    const Icon = item.icon
    const isActive = pathname === item.href ||
      (item.href !== '/admin' && item.href !== '/contractor' && pathname.startsWith(item.href + '/'))

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] min-h-[48px] rounded-lg transition-colors",
          "hover:bg-white/10 active:scale-95",
          isActive && "text-accent-500",
          !isActive && "text-white/70"
        )}
        aria-label={item.label}
      >
        <Icon className="h-5 w-5" />
        <span className="text-[10px] font-medium">{item.label}</span>
      </Link>
    )
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10" aria-label="Mobile navigation">
      <div className="flex items-center justify-around h-[60px] px-2">
        {/* First nav item */}
        {renderNavItem(0)}

        {/* Second nav item */}
        {renderNavItem(1)}

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
        {renderNavItem(2)}

        {/* More button */}
        <button
          onClick={onMoreClick}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] min-h-[48px] rounded-lg transition-colors",
            "hover:bg-white/10 active:scale-95",
            "text-white/70"
          )}
          aria-label="More navigation options"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}