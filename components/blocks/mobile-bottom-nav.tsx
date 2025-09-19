"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNavigationItems } from '@/app/contexts/PreferencesContext'
import { useAuth } from '@/app/contexts/AuthContext'
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

// Navigation item mapping
const navItemMapping: Record<string, { href: string; label: string; icon: LucideIcon; adminHref?: string; contractorHref?: string }> = {
  home: {
    href: '/admin',
    adminHref: '/admin',
    contractorHref: '/contractor',
    label: 'Home',
    icon: Home
  },
  tasks: {
    href: '/admin/tasks',
    label: 'Tasks',
    icon: ClipboardList
  },
  'my-tasks': {
    href: '/contractor/my-tasks',
    label: 'My Tasks',
    icon: ClipboardList
  },
  bidding: {
    href: '/admin/bidding',
    label: 'Bidding',
    icon: FileText
  },
  bids: {
    href: '/contractor/bids',
    label: 'Bids',
    icon: FileText
  },
  schedule: {
    href: '/admin/schedule',
    label: 'Schedule',
    icon: Calendar
  },
  'my-schedule': {
    href: '/contractor/my-schedule',
    label: 'Schedule',
    icon: Calendar
  },
  contacts: {
    href: '/admin/contacts',
    label: 'Contacts',
    icon: Users
  },
  budget: {
    href: '/admin/budget',
    label: 'Budget',
    icon: DollarSign
  },
  procurement: {
    href: '/admin/procurement',
    label: 'Procurement',
    icon: ShoppingCart
  },
  plans: {
    href: '/admin/plans',
    adminHref: '/admin/plans',
    contractorHref: '/contractor/plans',
    label: 'Plans',
    icon: FileBox
  },
  risks: {
    href: '/admin/risks',
    label: 'Risks',
    icon: AlertTriangle
  },
  uploads: {
    href: '/contractor/uploads',
    label: 'Uploads',
    icon: Upload
  },
  invoices: {
    href: '/contractor/invoices',
    label: 'Invoices',
    icon: CreditCard
  }
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
  const navItems = navItemIds.map(itemId => {
    const mappedItem = navItemMapping[itemId]
    if (!mappedItem) return null

    // Use appropriate href based on section
    let href = mappedItem.href
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