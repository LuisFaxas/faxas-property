'use client';

import { useState } from 'react';
import { PageShell } from '@/components/blocks/page-shell';
import { Widget } from '@/components/dashboard/Widget';
import { QuickActionsSheet } from '@/components/dashboard/QuickActionsSheet';
import { WelcomeWidget } from '@/components/dashboard/widgets/WelcomeWidget';
import { ProjectOverviewWidget } from '@/components/dashboard/widgets/ProjectOverviewWidget';
import { BudgetHealthWidget } from '@/components/dashboard/widgets/BudgetHealthWidget';
import { TaskKPIsWidget } from '@/components/dashboard/widgets/TaskKPIsWidget';
import { TodayScheduleWidget } from '@/components/dashboard/widgets/TodayScheduleWidget';
import { PriorityTasksWidget } from '@/components/dashboard/widgets/PriorityTasksWidget';
import { BudgetExceptionsWidget } from '@/components/dashboard/widgets/BudgetExceptionsWidget';
import { useAuth } from '@/app/contexts/AuthContext';
import { Plus } from 'lucide-react';

export default function AdminDashboard() {
  const { user, userRole } = useAuth();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  return (
    <>
      <PageShell 
        userRole={(userRole || 'VIEWER') as 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'} 
        userName={user?.displayName || 'User'} 
        userEmail={user?.email || ''}
        onFabClick={() => setQuickActionsOpen(true)}
        fabIcon={Plus}
        fabLabel="Quick Actions"
      >
        {/* Main content with safe area padding for mobile */}
        <div className="p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom)+88px)] space-y-4 md:space-y-6">
          {/* Hero Zone - Welcome and Budget Health */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-6">
            {/* Welcome Widget - Hero Card */}
            <div className="lg:col-span-2">
              <WelcomeWidget />
            </div>

            {/* Budget Health - Hero Card */}
            <div className="lg:col-span-2">
              <BudgetHealthWidget />
            </div>
          </div>

          {/* Row 2 - Project Overview and Task KPIs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-6">
            {/* Project Overview without budget */}
            <div className="lg:col-span-2">
              <ProjectOverviewWidget showBudget={false} />
            </div>

            {/* Task KPIs */}
            <div className="lg:col-span-2">
              <TaskKPIsWidget />
            </div>
          </div>

          {/* Activity Zone - 2 medium cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <TodayScheduleWidget />
            </div>

            {/* Priority Tasks */}
            <div className="lg:col-span-2">
              <PriorityTasksWidget />
            </div>
          </div>

          {/* Status Zone - 4 smaller cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-6">
            <BudgetExceptionsWidget />

            <Widget>
              <h3 className="text-sm font-medium text-white mb-2">Procurement</h3>
              <p className="text-white/60 text-sm">Pipeline status</p>
            </Widget>

            <Widget>
              <h3 className="text-sm font-medium text-white mb-2">Team & Vendors</h3>
              <p className="text-white/60 text-sm">Active contacts</p>
            </Widget>

            <Widget>
              <h3 className="text-sm font-medium text-white mb-2">Weather</h3>
              <p className="text-white/60 text-sm">Today&apos;s forecast</p>
            </Widget>
          </div>
        </div>
      </PageShell>

      {/* Quick Actions Sheet */}
      <QuickActionsSheet 
        open={quickActionsOpen} 
        onOpenChange={setQuickActionsOpen} 
      />
    </>
  );
}