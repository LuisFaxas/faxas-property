'use client';

import { PageShell } from '@/components/blocks/page-shell';
import { DashboardGrid } from '@/components/blocks/dashboard-grid';
import { KPIWidget } from '@/components/blocks/kpi-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, 
  Calendar, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Package,
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  useTasks, 
  useBudgetSummary, 
  useBudgetExceptions, 
  useTodaySchedule,
  useContacts 
} from '@/hooks/use-api';
import { useEffect, useState } from 'react';
import { Task, Contact } from '@/types';

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  type: string;
  status: string;
}

interface BudgetException {
  id: string;
  name: string;
  variancePercent: number;
  variance: number;
}

function LoadingCard() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  // Default to miami-duplex project - in future this should come from ProjectContext
  const projectId = 'miami-duplex';
  const [isReady, setIsReady] = useState(false);

  // Wait for auth to be ready before making API calls
  useEffect(() => {
    if (!authLoading && user) {
      // Give a small delay to ensure token is ready
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);

  // Fetch real data using React Query - only when ready
  const { data: tasksData } = useTasks({ 
    projectId,
    limit: 100 
  }, isReady);
  
  const { data: budgetSummary, isLoading: budgetLoading } = useBudgetSummary(projectId, isReady);
  const { data: budgetExceptions, isLoading: exceptionsLoading } = useBudgetExceptions(projectId, isReady);
  const { data: todaySchedule, isLoading: scheduleLoading } = useTodaySchedule(projectId, isReady);
  const { data: contactsData } = useContacts({ 
    projectId,
    status: 'ACTIVE'
  }, isReady);

  // Calculate task metrics
  const taskMetrics = tasksData ? {
    today: tasksData.data?.filter((t: Task) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const today = new Date();
      return due.toDateString() === today.toDateString();
    }).length || 0,
    thisWeek: tasksData.data?.filter((t: Task) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const today = new Date();
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return due >= today && due <= weekFromNow;
    }).length || 0,
    overdue: tasksData.data?.filter((t: Task) => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
    ).length || 0
  } : { today: 0, thisWeek: 0, overdue: 0 };

  // Calculate contact metrics
  const contactMetrics = contactsData ? {
    followUps: contactsData.data?.filter((c: Contact & {status?: string}) => c.status === 'FOLLOW_UP').length || 0,
    new: contactsData.data?.filter((c: Contact) => {
      const created = new Date(c.createdAt);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return created > dayAgo;
    }).length || 0
  } : { followUps: 0, new: 0 };

  // Mock data for features not yet implemented
  const mockData = {
    risks: {
      open: 5,
      high: 2
    },
    procurement: [
      { id: 1, name: 'Steel Beams', dueInDays: 2 },
      { id: 2, name: 'HVAC Units', dueInDays: 3 },
      { id: 3, name: 'Windows (Custom)', dueInDays: 5 }
    ],
    recentPlans: [
      { id: 1, name: 'Structural Plans v2.1', category: 'structural', date: '2024-01-20' },
      { id: 2, name: 'Electrical Layout', category: 'electrical', date: '2024-01-19' },
      { id: 3, name: 'Plumbing Schematic', category: 'plumbing', date: '2024-01-18' }
    ]
  };
  
  return (
    <PageShell 
      userRole={(userRole || 'VIEWER') as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'} 
      userName={user?.displayName || 'User'} 
      userEmail={user?.email || ''}>
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
            value={taskMetrics.today}
            subtitle={`${taskMetrics.overdue} overdue`}
            icon={ClipboardList}
            trend={{ value: taskMetrics.overdue > 0 ? taskMetrics.overdue : 0, isPositive: false }}
          />
          <KPIWidget
            title="Budget Committed"
            value={budgetLoading ? '...' : `$${((budgetSummary?.data?.totalCommitted || 0) / 1000).toFixed(0)}k`}
            subtitle={budgetLoading ? '...' : `of $${((budgetSummary?.data?.totalBudget || 0) / 1000).toFixed(0)}k total`}
            icon={DollarSign}
          />
          <KPIWidget
            title="Follow-ups Due"
            value={contactMetrics.followUps}
            subtitle={`${contactMetrics.new} new contacts`}
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
              <CardTitle className="text-white">Today&apos;s Schedule</CardTitle>
              <Button size="sm" variant="ghost" className="text-accent-500">
                <Calendar className="h-4 w-4 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduleLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : todaySchedule?.data && todaySchedule.data.length > 0 ? (
                todaySchedule.data.map((event: ScheduleEvent) => (
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
                ))
              ) : (
                <p className="text-white/50 text-sm">No events scheduled for today</p>
              )}
            </CardContent>
          </Card>

          {/* Budget Exceptions */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Budget Exceptions</CardTitle>
              <Badge variant="destructive">
                {exceptionsLoading ? '...' : `${budgetExceptions?.data?.length || 0} items`}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exceptionsLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : budgetExceptions?.data && budgetExceptions.data.length > 0 ? (
                  budgetExceptions.data.slice(0, 3).map((item: BudgetException) => (
                    <div key={item.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-xs text-white/50 mt-1">
                            {item.variancePercent.toFixed(0)}% over budget
                          </p>
                        </div>
                        <span className="text-red-500 font-bold">
                          +${item.variance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/50 text-sm">No budget exceptions</p>
                )}
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
                {mockData.procurement.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded">
                    <span className="text-sm text-white">{item.name}</span>
                    <Badge>Due in {item.dueInDays} days</Badge>
                  </div>
                ))}
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