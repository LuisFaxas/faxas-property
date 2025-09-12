'use client';

import { useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProjects, useTasks, useTodaySchedule } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Calendar, Clock, AlertCircle, Plus, Upload, Users, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function WelcomeWidget() {
  const { user } = useAuth();
  const { data: projects } = useProjects();
  
  // Get active project or fall back to first
  const activeProject = projects?.find(p => p.status === 'ACTIVE') || projects?.[0];
  const projectId = activeProject?.id;
  
  // Fetch data with proper guards
  const { data: tasks } = useTasks({ projectId }, !!projectId);
  const { data: todaySchedule } = useTodaySchedule(projectId, !!projectId);
  
  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);
  
  // Format today's date
  const todayDate = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);
  
  // Calculate quick metrics client-side
  const metrics = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return { dueToday: 0, overdue: 0 };
    }
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const dueToday = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      const open = t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      return open && d >= startOfToday && d <= endOfToday;
    }).length;
    
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      const open = t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      return open && d < startOfToday;
    }).length;
    
    return { dueToday, overdue };
  }, [tasks]);
  
  // Count today's events
  const todayEvents = Array.isArray(todaySchedule) 
    ? todaySchedule.length 
    : todaySchedule?.items?.length || 0;
  
  return (
    <Widget>
      <div className="space-y-4">
        {/* Greeting line */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            {greeting}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h2>
          <p className="text-sm text-white/60">
            {todayDate} • {activeProject ? activeProject.name.substring(0, 30) : 'No active project'}
            {activeProject?.name.length > 30 && '...'}
          </p>
        </div>
        
        {/* Weather row - stub for now */}
        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
          <Cloud className="h-4 w-4 text-white/40" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            type="button"
            className="h-auto p-0 text-xs text-white/60 hover:text-white focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/schedule">
              Set up weather →
            </Link>
          </Button>
        </div>
        
        {/* Quick metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-1 rounded-lg bg-yellow-400/10">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.dueToday}</p>
            <p className="text-xs text-white/60">Due Today</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-1 rounded-lg bg-red-400/10">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.overdue}</p>
            <p className="text-xs text-white/60">Overdue</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-1 rounded-lg bg-[#8EE3C8]/10">
              <Calendar className="h-5 w-5 text-[#8EE3C8]" />
            </div>
            <p className="text-2xl font-bold text-white">{todayEvents}</p>
            <p className="text-xs text-white/60">Events</p>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            type="button"
            className="justify-start focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/tasks/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="sm"
            type="button"
            className="justify-start focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/schedule/new">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Event
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="sm"
            type="button"
            className="justify-start focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/contacts/new">
              <Users className="h-4 w-4 mr-2" />
              Add Contact
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="sm"
            type="button"
            className="justify-start focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/documents">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>
    </Widget>
  );
}