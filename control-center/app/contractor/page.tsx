"use client"

import { PageShell } from '@/components/blocks/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Upload,
  FileText,
  DollarSign,
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  File,
  MapPin,
  Phone
} from 'lucide-react'
import { useState } from 'react'

// Mock data for contractor view
const mockData = {
  tasks: [
    { id: 1, title: 'Install electrical conduits', status: 'in_progress', dueDate: '2024-01-22' },
    { id: 2, title: 'Complete foundation waterproofing', status: 'new', dueDate: '2024-01-23' },
    { id: 3, title: 'Submit progress photos', status: 'new', dueDate: '2024-01-21' }
  ],
  schedule: [
    { id: 1, title: 'Site Visit', date: '2024-01-22', time: '9:00 AM', status: 'PLANNED' },
    { id: 2, title: 'Material Delivery', date: '2024-01-23', time: '2:00 PM', status: 'PLANNED' },
    { id: 3, title: 'Inspection', date: '2024-01-24', time: '10:00 AM', status: 'REQUESTED' }
  ],
  recentInvoices: [
    { id: 1, amount: 5000, status: 'APPROVED', date: '2024-01-15' },
    { id: 2, amount: 3500, status: 'UNDER_REVIEW', date: '2024-01-18' },
    { id: 3, amount: 2800, status: 'RECEIVED', date: '2024-01-20' }
  ],
  allowedModules: {
    TASKS: true,
    SCHEDULE: true,
    PLANS: true,
    UPLOADS: true,
    INVOICES: true
  }
}

export default function ContractorDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'text-green-500'
      case 'UNDER_REVIEW': return 'text-yellow-500'
      case 'RECEIVED': return 'text-blue-500'
      case 'REJECTED': return 'text-red-500'
      default: return 'text-white/50'
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch(status) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-white/50" />
    }
  }

  return (
    <PageShell userRole="CONTRACTOR" userName="Mike Contractor" userEmail="contractor@example.com">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Contractor Dashboard</h1>
          <p className="text-white/60 mt-1">Miami Duplex Remodel</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockData.allowedModules.SCHEDULE && (
            <Card className="glass-card glass-hover cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Request</p>
                    <p className="text-lg font-semibold text-white">Site Visit</p>
                  </div>
                  <MapPin className="h-8 w-8 text-accent-500" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {mockData.allowedModules.INVOICES && (
            <Card className="glass-card glass-hover cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Upload</p>
                    <p className="text-lg font-semibold text-white">Invoice</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-accent-500" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {mockData.allowedModules.UPLOADS && (
            <Card className="glass-card glass-hover cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Upload</p>
                    <p className="text-lg font-semibold text-white">Files/Photos</p>
                  </div>
                  <Camera className="h-8 w-8 text-accent-500" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {mockData.allowedModules.SCHEDULE && (
            <Card className="glass-card glass-hover cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Request</p>
                    <p className="text-lg font-semibold text-white">Meeting</p>
                  </div>
                  <Phone className="h-8 w-8 text-accent-500" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="glass w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {mockData.allowedModules.TASKS && <TabsTrigger value="tasks">My Tasks</TabsTrigger>}
            {mockData.allowedModules.SCHEDULE && <TabsTrigger value="schedule">My Schedule</TabsTrigger>}
            {mockData.allowedModules.INVOICES && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Tasks */}
              {mockData.allowedModules.TASKS && (
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">My Tasks</CardTitle>
                    <Badge>{mockData.tasks.length} active</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockData.tasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        {getTaskStatusIcon(task.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{task.title}</p>
                          <p className="text-xs text-white/50 mt-1">Due: {task.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* My Schedule */}
              {mockData.allowedModules.SCHEDULE && (
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Upcoming Schedule</CardTitle>
                    <Calendar className="h-4 w-4 text-accent-500" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockData.schedule.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          <p className="text-xs text-white/50">{event.date} at {event.time}</p>
                        </div>
                        <Badge variant={event.status === 'REQUESTED' ? 'secondary' : 'default'}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Invoices */}
            {mockData.allowedModules.INVOICES && (
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Recent Invoices</CardTitle>
                  <Button size="sm" className="bg-accent-500/20 hover:bg-accent-500/30 text-accent-500">
                    <Plus className="h-4 w-4 mr-1" />
                    Upload Invoice
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockData.recentInvoices.map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <DollarSign className="h-5 w-5 text-white/50" />
                          <div>
                            <p className="text-sm font-medium text-white">${invoice.amount.toLocaleString()}</p>
                            <p className="text-xs text-white/50">Submitted {invoice.date}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">All My Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      {getTaskStatusIcon(task.status)}
                      <div className="flex-1">
                        <p className="font-medium text-white">{task.title}</p>
                        <p className="text-sm text-white/50 mt-1">Due: {task.dueDate}</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">
                            Mark Complete
                          </Button>
                          <Button size="sm" variant="ghost">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">My Schedule</CardTitle>
                <Button className="bg-accent-500/20 hover:bg-accent-500/30 text-accent-500">
                  <Plus className="h-4 w-4 mr-1" />
                  Request Time
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.schedule.map(event => (
                    <div key={event.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{event.title}</p>
                          <p className="text-sm text-white/50 mt-1">{event.date} at {event.time}</p>
                        </div>
                        <Badge variant={event.status === 'REQUESTED' ? 'secondary' : 'default'}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Invoice Management</CardTitle>
                <Button className="bg-accent-500/20 hover:bg-accent-500/30 text-accent-500">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload New Invoice
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.recentInvoices.map(invoice => (
                    <div key={invoice.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">${invoice.amount.toLocaleString()}</p>
                          <p className="text-sm text-white/50 mt-1">Submitted {invoice.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.replace('_', ' ')}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  )
}