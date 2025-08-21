import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface KPIWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function KPIWidget({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className 
}: KPIWidgetProps) {
  return (
    <Card className={cn("glass-card glass-hover", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/70">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-accent-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-white/50 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs mt-2",
            trend.isPositive ? "text-green-500" : "text-red-500"
          )}>
            <span className="mr-1">
              {trend.isPositive ? "↑" : "↓"}
            </span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}