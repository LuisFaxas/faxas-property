import { PageShell } from '@/components/blocks/page-shell'
import { DashboardGrid } from '@/components/blocks/dashboard-grid'
import { KPIWidget } from '@/components/blocks/kpi-widget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  ClipboardList, 
  Calendar, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react'

// This would normally come from the database
const mockData = {
  tasks: {
    today: 5,
    thisWeek: 23,
    overdue: 2
  },
  budget: {
    total: 250000,
    committed: 125000,
    exceptions: 3
  },
  contacts: {
    followUps: 4,
    new: 2
  },
  procurement: {
    dueThisWeek: 7,
    pending: 12
  },
  risks: {
    open: 5,
    high: 2
  },
  schedule: [
    { id: 1, title: 'Site Visit - Foundation', time: '9:00 AM', type: 'SITE_VISIT', status: 'PLANNED' },
    { id: 2, title: 'Contractor Meeting', time: '2:00 PM', type: 'MEETING', status: 'PLANNED' },
    { id: 3, title: 'Material Delivery', time: '4:00 PM', type: 'WORK', status: 'REQUESTED' }
  ],
  recentPlans: [
    { id: 1, name: 'Structural Plans v2.1', category: 'structural', date: '2024-01-20' },
    { id: 2, name: 'Electrical Layout', category: 'electrical', date: '2024-01-19' },
    { id: 3, name: 'Plumbing Schematic', category: 'plumbing', date: '2024-01-18' }
  ]
}

export default function AdminDashboard() {
  return (
    <PageShell userRole="ADMIN" userName="John Admin" userEmail="admin@example.com">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/60 mt-1">Miami Duplex Remodel - Mission Control</p>
        </div>

        {/* KPI Cards */}
        <DashboardGrid>
          <KPIWidget
            title="Tasks Today"
            value={mockData.tasks.today}
            subtitle={`${mockData.tasks.overdue} overdue`}
            icon={ClipboardList}
            trend={{ value: 15, isPositive: false }}
          />
          <KPIWidget
            title="Budget Committed"
            value={`$${(mockData.budget.committed / 1000).toFixed(0)}k`}
            subtitle={`of $${(mockData.budget.total / 1000).toFixed(0)}k total`}
            icon={DollarSign}
          />
          <KPIWidget
            title="Follow-ups Due"
            value={mockData.contacts.followUps}
            subtitle={`${mockData.contacts.new} new contacts`}
            icon={Users}
          />
          <KPIWidget
            title="Open Risks"
            value={mockData.risks.open}
            subtitle={`${mockData.risks.high} high priority`}
            icon={AlertTriangle}
            trend={{ value: 20, isPositive: false }}
          />
        </DashboardGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Today's Schedule</CardTitle>
              <Button size="sm" variant="ghost" className="text-accent-500">
                <Calendar className="h-4 w-4 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockData.schedule.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/50 w-16">{event.time}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{event.title}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {event.status === 'REQUESTED' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Budget Exceptions */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Budget Exceptions</CardTitle>
              <Badge variant="destructive">{mockData.budget.exceptions} items</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Concrete Work</p>
                      <p className="text-xs text-white/50 mt-1">15% over budget</p>
                    </div>
                    <span className="text-red-500 font-bold">+$3,750</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Electrical Materials</p>
                      <p className="text-xs text-white/50 mt-1">12% over budget</p>
                    </div>
                    <span className="text-red-500 font-bold">+$1,200</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Procurement Due */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Procurement This Week</CardTitle>
              <Button size="sm" variant="ghost" className="text-accent-500">
                <Package className="h-4 w-4 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded">
                  <span className="text-sm text-white">Steel Beams</span>
                  <Badge>Due in 2 days</Badge>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded">
                  <span className="text-sm text-white">HVAC Units</span>
                  <Badge>Due in 3 days</Badge>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded">
                  <span className="text-sm text-white">Windows (Custom)</span>
                  <Badge variant="secondary">Due in 5 days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest Plans */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Latest Plans</CardTitle>
              <Button size="sm" variant="ghost" className="text-accent-500">
                <FileText className="h-4 w-4 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockData.recentPlans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded">
                    <div>
                      <p className="text-sm font-medium text-white">{plan.name}</p>
                      <p className="text-xs text-white/50">{plan.category}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-accent-500/20 hover:bg-accent-500/30 text-accent-500">
                <Plus className="h-4 w-4 mr-1" />
                Invite Contractor
              </Button>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Schedule Meeting
              </Button>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Upload Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}