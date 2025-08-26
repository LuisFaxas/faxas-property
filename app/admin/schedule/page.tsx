'use client';

import { useState, useMemo, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Calendar, CalendarDays, List, CheckCircle, XCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { View as CalendarViewType } from 'react-big-calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSchedule, useTodaysSchedule, useProjects } from '@/hooks/use-api';
import { useAuth } from '@/app/contexts/AuthContext';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { FullCalendarView } from '@/components/schedule/fullcalendar-view';
import { cn } from '@/lib/utils';
import { KPICarousel } from '@/components/schedule/kpi-carousel';
import { Loader2 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

// Helper functions for date and time handling
const getDefaultDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
};

const getDefaultTime = (hoursOffset = 1) => {
  const now = new Date();
  now.setHours(now.getHours() + hoursOffset);
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`; // HH:mm
};

const combineDateAndTime = (date: string, time: string) => {
  if (!date || !time) return '';
  // Add Z for UTC timezone to match API datetime format
  return `${date}T${time}:00.000Z`;
};

const splitDateTime = (datetime: string) => {
  if (!datetime) return { date: getDefaultDate(), time: getDefaultTime() };
  const [date, timeWithZ] = datetime.split('T');
  const time = timeWithZ ? timeWithZ.substring(0, 5) : getDefaultTime();
  return { date, time };
};

// Event types for filtering
const EVENT_TYPES = [
  { value: 'WORK', label: 'Work', color: 'bg-blue-600' },
  { value: 'MEETING', label: 'Meeting', color: 'bg-purple-600' },
  { value: 'SITE_VISIT', label: 'Site Visit', color: 'bg-green-600' },
  { value: 'CALL', label: 'Call', color: 'bg-orange-600' },
  { value: 'EMAIL_FOLLOWUP', label: 'Email', color: 'bg-gray-600' },
];

export default function AdminSchedulePage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLandscape = useMediaQuery('(max-width: 932px) and (orientation: landscape) and (max-height: 430px)');
  const { toast } = useToast();
  const { user } = useAuth();
  const isReady = !!user;
  // No need for extra state - media queries handle this
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state with separate date and time fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'WORK',
    startDate: getDefaultDate(),
    startTime: getDefaultTime(1),
    endDate: getDefaultDate(),
    endTime: getDefaultTime(2),
    location: '',
    attendees: '',
    status: 'PLANNED',
    requestedBy: '',
    approvedBy: '',
    notes: '',
    projectId: ''
  });

  // Computed values for API calls
  const startDateTime = combineDateAndTime(formData.startDate, formData.startTime);
  const endDateTime = combineDateAndTime(formData.endDate, formData.endTime);

  // Fetch schedule data
  const { data: scheduleEvents, isLoading, refetch } = useSchedule(undefined, isReady);
  const { data: todaysEvents } = useTodaysSchedule(undefined, isReady);
  const { data: projectsData } = useProjects(isReady);
  
  // Set default projectId when projects are loaded
  useEffect(() => {
    if (projectsData && Array.isArray(projectsData) && projectsData.length > 0 && !formData.projectId) {
      const defaultProjectId = projectsData[0].id;
      setFormData(prev => ({ ...prev, projectId: defaultProjectId }));
    }
  }, [projectsData, formData.projectId]);

  // Filter events based on active tab and type filters
  const filteredEvents = useMemo(() => {
    let events = [];
    
    // Get events based on active tab
    if (activeTab === 'today') {
      events = todaysEvents || [];
    } else {
      events = scheduleEvents || [];
    }
    
    if (!Array.isArray(events)) return [];
    
    // Apply type filters
    if (typeFilters.length > 0) {
      events = events.filter((event: any) => typeFilters.includes(event.type));
    }
    
    return events;
  }, [scheduleEvents, todaysEvents, activeTab, typeFilters]);

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const defaultMetrics = {
      totalEvents: 0,
      todayEvents: 0,
      pendingApprovals: 0,
      upcomingWork: 0
    };

    if (!scheduleEvents || !Array.isArray(scheduleEvents)) return defaultMetrics;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      totalEvents: scheduleEvents.length,
      todayEvents: todaysEvents?.length || 0,
      pendingApprovals: scheduleEvents.filter((e: any) => e.status === 'REQUESTED').length,
      upcomingWork: scheduleEvents.filter((e: any) => {
        const eventDate = new Date(e.start || e.startTime);
        return e.type === 'WORK' && eventDate >= today && e.status === 'PLANNED';
      }).length
    };
  }, [scheduleEvents, todaysEvents]);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/schedule', {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location,
        attendees: formData.attendees.split(',').map(a => a.trim()).filter(Boolean),
        status: formData.status,
        projectId: formData.projectId
      });

      toast({
        title: 'Success',
        description: 'Schedule event created successfully',
      });

      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      await apiClient.put(`/schedule/${selectedEvent.id}`, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location,
        attendees: formData.attendees.split(',').map(a => a.trim()).filter(Boolean),
        status: formData.status,
        projectId: formData.projectId
      });

      toast({
        title: 'Success',
        description: 'Schedule event updated successfully',
      });

      setIsEditOpen(false);
      setSelectedEvent(null);
      resetForm();
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/schedule/${selectedEvent.id}`);

      toast({
        title: 'Success',
        description: 'Schedule event deleted successfully',
      });

      setIsDeleteOpen(false);
      setSelectedEvent(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      const response = await fetch(`/api/v1/schedule/${eventId}/approve`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to approve event');

      toast({
        title: 'Success',
        description: 'Event approved successfully',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve event',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      const response = await fetch(`/api/v1/schedule/${eventId}/reject`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to reject event');

      toast({
        title: 'Success',
        description: 'Event rejected',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject event',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'WORK',
      startDate: getDefaultDate(),
      startTime: getDefaultTime(1),
      endDate: getDefaultDate(),
      endTime: getDefaultTime(2),
      location: '',
      attendees: '',
      status: 'PLANNED',
      requestedBy: '',
      approvedBy: '',
      notes: '',
      projectId: projectsData && Array.isArray(projectsData) && projectsData.length > 0 ? projectsData[0].id : ''
    });
  };

  const openEditDialog = (event: any) => {
    setSelectedEvent(event);
    const startDateTime = event.start || event.startTime ? splitDateTime((event.start || event.startTime)) : { date: getDefaultDate(), time: getDefaultTime(1) };
    const endDateTime = event.end || event.endTime ? splitDateTime((event.end || event.endTime)) : { date: getDefaultDate(), time: getDefaultTime(2) };
    
    setFormData({
      title: event.title,
      description: event.description || event.notes || '',
      type: event.type || event.eventType || 'WORK',
      startDate: startDateTime.date,
      startTime: startDateTime.time,
      endDate: endDateTime.date,
      endTime: endDateTime.time,
      location: event.location || '',
      attendees: event.attendees?.join ? event.attendees.join(', ') : (event.relatedContactIds?.join ? event.relatedContactIds.join(', ') : ''),
      status: event.status || 'PLANNED',
      requestedBy: event.requestedBy || '',
      approvedBy: event.approvedBy || '',
      notes: event.notes || '',
      projectId: event.projectId || (projectsData && Array.isArray(projectsData) && projectsData.length > 0 ? projectsData[0].id : '')
    });
    setIsEditOpen(true);
  };

  // Handle calendar drag and drop
  const handleEventDrop = async ({ event, start, end }: { event: any; start: Date; end: Date }) => {
    try {
      await apiClient.put(`/schedule/${event.id}`, {
        title: event.title,
        description: event.description || event.notes,
        type: event.type,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location: event.location,
        attendees: event.attendees || event.relatedContactIds || [],
        status: event.status,
        projectId: event.projectId
      });

      toast({
        title: 'Success',
        description: 'Event rescheduled successfully',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule event',
        variant: 'destructive',
      });
    }
  };

  // Handle calendar slot selection for quick event creation
  const handleSelectSlot = (slotInfo: any) => {
    const startDate = new Date(slotInfo.start);
    const endDate = new Date(slotInfo.end);
    
    setFormData({
      ...formData,
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().substring(0, 5),
      endDate: endDate.toISOString().split('T')[0],
      endTime: endDate.toTimeString().substring(0, 5),
    });
    setIsCreateOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('title')}</div>
          {row.original.description && (
            <div className="text-sm text-white/60">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue<string>('type');
        return (
          <Badge
            variant={
              type === 'WORK' ? 'default' :
              type === 'MEETING' ? 'secondary' :
              type === 'SITE_VISIT' ? 'outline' :
              type === 'CALL' ? 'secondary' :
              type === 'EMAIL_FOLLOWUP' ? 'outline' :
              'destructive'
            }
          >
            {type.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'start',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date & Time" />
      ),
      cell: ({ row }) => {
        const startValue = row.getValue('start') || row.original.startTime;
        const endValue = row.original.end || row.original.endTime;
        
        if (!startValue) {
          return <div className="text-white/40">No date set</div>;
        }
        
        try {
          const start = new Date(startValue);
          const end = endValue ? new Date(endValue) : null;
          
          // Check if dates are valid
          if (isNaN(start.getTime())) {
            return <div className="text-white/40">Invalid date</div>;
          }
          
          return (
            <div>
              <div className="font-medium">{format(start, 'MMM dd, yyyy')}</div>
              <div className="text-sm text-white/60">
                {format(start, 'h:mm a')}
                {end && !isNaN(end.getTime()) && ` - ${format(end, 'h:mm a')}`}
              </div>
            </div>
          );
        } catch (error) {
          return <div className="text-white/40">Invalid date</div>;
        }
      },
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => row.getValue('location') || '-',
    },
    {
      accessorKey: 'attendees',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Attendees" />
      ),
      cell: ({ row }) => {
        const attendees = row.getValue<string[]>('attendees');
        if (!attendees || attendees.length === 0) return '-';
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-white/40" />
            <span>{attendees.length}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>('status');
        return (
          <Badge
            variant={
              status === 'PLANNED' ? 'default' :
              status === 'REQUESTED' ? 'secondary' :
              status === 'DONE' ? 'outline' :
              status === 'CANCELED' ? 'destructive' :
              status === 'RESCHEDULE_NEEDED' ? 'destructive' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div className="flex items-center gap-2">
            {event.status === 'PENDING' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApprove(event.id)}
                  className="text-green-400 hover:text-green-300"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(event.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(event)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedEvent(event);
                setIsDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <PageShell 
        pageTitle="Schedule"
        userRole={user?.role || 'VIEWER'} 
        userName={user?.displayName || 'User'} 
        userEmail={user?.email || ''}
      >
        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* KPI Cards Skeleton */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tabs & Calendar Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-96" />
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-0">
                <Skeleton className="h-[500px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>
    );
  }

  // Landscape-specific layout for mobile phones
  if (isLandscape) {
    return (
      <PageShell 
        pageTitle="Schedule"
        userRole={user?.role || 'VIEWER'} 
        userName={user?.displayName || 'User'} 
        userEmail={user?.email || ''}
      >
        <div className="h-full flex flex-col relative overflow-hidden">
          {/* Floating view toggle - absolute positioned */}
          <div className="absolute top-1 right-1 z-20 flex gap-1">
            <Button 
              size="icon" 
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              className="h-6 w-6 bg-black/50 backdrop-blur-sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="h-3 w-3" />
            </Button>
            <Button 
              size="icon"
              variant={viewMode === 'table' ? 'default' : 'ghost'} 
              className="h-6 w-6 bg-black/50 backdrop-blur-sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Calendar takes ALL remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {viewMode === 'calendar' ? (
              <FullCalendarView
                events={filteredEvents}
                onSelectEvent={openEditDialog}
                onSelectSlot={(start, end) => {
                  setFormData({
                    ...formData,
                    startDate: start.toISOString().split('T')[0],
                    startTime: start.toTimeString().substring(0, 5),
                    endDate: end.toISOString().split('T')[0],
                    endTime: end.toTimeString().substring(0, 5),
                  });
                  setIsCreateOpen(true);
                }}
                onEventDrop={(event, start, end) => {
                  handleUpdateEvent(event.id, { 
                    start: start.toISOString(), 
                    end: end.toISOString() 
                  });
                }}
                onEventResize={(event, start, end) => {
                  handleUpdateEvent(event.id, { 
                    start: start.toISOString(), 
                    end: end.toISOString() 
                  });
                }}
              />
            ) : (
              <div className="h-full overflow-auto">
                <DataTable 
                  columns={columns} 
                  data={filteredEvents} 
                  className="text-xs"
                />
              </div>
            )}
          </div>
          
          {/* Compact FAB */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="fixed bottom-2 right-2 z-50 rounded-full h-10 w-10 shadow-lg bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full h-full bg-gray-900 text-white border-0 rounded-none">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Create Schedule Event</DialogTitle>
                <DialogDescription className="text-white/60">
                  Add a new event to the project calendar
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                {/* Form content - same as mobile form */}
                <div className="grid gap-4 py-4 pr-2">
                  {/* ... existing form fields ... */}
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* FAB also in landscape mode for consistency */}
          <Button
            size="lg"
            className="fixed bottom-3 right-3 z-[9999] rounded-full h-10 w-10 shadow-md bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform border border-white/10 glass"
            aria-label="Add new event"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 text-white" />
          </Button>
        </div>
      </PageShell>
    );
  }

  // Regular portrait layout
  return (
    <PageShell 
      pageTitle="Schedule"
      userRole={user?.role || 'VIEWER'} 
      userName={user?.displayName || 'User'} 
      userEmail={user?.email || ''}
    >
      <div className={cn(
        "p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 h-full flex flex-col",
        isMobile && "p-2 space-y-2" // Tighter spacing on mobile
      )}>
        {/* Header - Hidden on mobile since title is in navbar */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">Schedule Management</h1>
              <p className="text-white/60 text-xs sm:text-sm lg:text-base">Manage project calendar and events</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="sm:size-default w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
            <DialogContent className="w-full h-full sm:max-w-[500px] sm:max-h-[85vh] sm:h-auto overflow-hidden flex flex-col bg-gray-900 text-white border-0 sm:border sm:border-white/10 rounded-none sm:rounded-lg">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Create Schedule Event</DialogTitle>
                <DialogDescription className="text-white/60">
                  Add a new event to the project calendar
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <div className="grid gap-4 py-4 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g., Site Inspection"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CALL">Call</SelectItem>
                        <SelectItem value="MEETING">Meeting</SelectItem>
                        <SelectItem value="SITE_VISIT">Site Visit</SelectItem>
                        <SelectItem value="WORK">Work</SelectItem>
                        <SelectItem value="EMAIL_FOLLOWUP">Email Followup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="Event details..."
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Main Site"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending Approval</SelectItem>
                        <SelectItem value="REQUESTED">Requested</SelectItem>
                        <SelectItem value="PLANNED">Planned</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                        <SelectItem value="CANCELED">Canceled</SelectItem>
                        <SelectItem value="RESCHEDULE_NEEDED">Reschedule Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Attendees (comma-separated)</Label>
                  <Input
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="John Doe, Jane Smith"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requested By</Label>
                    <Input
                      value={formData.requestedBy}
                      onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Approved By</Label>
                    <Input
                      value={formData.approvedBy}
                      onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="Name"
                    />
                  </div>
                </div>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        )}

        
        {/* Mobile Dialog for creating events */}
        {isMobile && !isLandscape && (
          <>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogContent className="w-full h-full sm:max-w-[500px] sm:max-h-[85vh] sm:h-auto overflow-hidden flex flex-col bg-gray-900 text-white border-0 sm:border sm:border-white/10 rounded-none sm:rounded-lg">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Create Schedule Event</DialogTitle>
                <DialogDescription className="text-white/60">
                  Add a new event to the project calendar
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <div className="grid gap-4 py-4 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g., Site Inspection"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CALL">Call</SelectItem>
                        <SelectItem value="MEETING">Meeting</SelectItem>
                        <SelectItem value="SITE_VISIT">Site Visit</SelectItem>
                        <SelectItem value="WORK">Work</SelectItem>
                        <SelectItem value="EMAIL_FOLLOWUP">Email Followup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="Event details..."
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Main Site"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending Approval</SelectItem>
                        <SelectItem value="REQUESTED">Requested</SelectItem>
                        <SelectItem value="PLANNED">Planned</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                        <SelectItem value="CANCELED">Canceled</SelectItem>
                        <SelectItem value="RESCHEDULE_NEEDED">Reschedule Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Attendees (comma-separated)</Label>
                  <Input
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="John Doe, Jane Smith"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requested By</Label>
                    <Input
                      value={formData.requestedBy}
                      onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Approved By</Label>
                    <Input
                      value={formData.approvedBy}
                      onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="Name"
                    />
                  </div>
                </div>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </>
        )}

        {/* KPI Cards - Hidden in landscape */}
        {!isLandscape && (
          <KPICarousel
            cards={[
            {
              title: 'Total Events',
              value: metrics.totalEvents,
              subtitle: 'All scheduled events',
              icon: Calendar,
              iconColor: 'text-white/40',
            },
            {
              title: "Today's Events",
              value: metrics.todayEvents,
              subtitle: 'Events scheduled today',
              icon: Clock,
              iconColor: 'text-white/40',
            },
            {
              title: 'Pending Approvals',
              value: metrics.pendingApprovals,
              subtitle: 'Awaiting approval',
              icon: AlertCircle,
              iconColor: 'text-yellow-400',
            },
            {
              title: 'Upcoming Work',
              value: metrics.upcomingWork,
              subtitle: 'Work sessions scheduled',
              icon: Users,
              iconColor: 'text-white/40',
            },
          ]}
          />
        )}

        {/* Tabs with View Mode Toggle - Hidden in landscape */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          {/* Mobile: Combined row for tabs and view toggle */}
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <TabsList className="bg-white/5 border-white/10 flex flex-nowrap gap-1 h-8 sm:h-10 p-1">
              <TabsTrigger value="all" className="text-[11px] sm:text-sm px-2 sm:px-3 py-1 min-w-fit">
                <span className="sm:hidden">All</span>
                <span className="hidden sm:inline">All Events</span>
              </TabsTrigger>
              <TabsTrigger value="today" className="text-[11px] sm:text-sm px-2 sm:px-3 py-1 min-w-fit">
                Today
                {metrics.todayEvents > 0 && (
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-[9px] sm:text-xs h-3.5 sm:h-5 px-1 sm:px-1.5">
                    {metrics.todayEvents}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-[11px] sm:text-sm px-2 sm:px-3 py-1 min-w-fit">
                Pending
                {metrics.pendingApprovals > 0 && (
                  <Badge variant="destructive" className="ml-1 sm:ml-2 text-[9px] sm:text-xs h-3.5 sm:h-5 px-1 sm:px-1.5">
                    {metrics.pendingApprovals}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-[11px] sm:text-sm px-2 sm:px-3 py-1 min-w-fit">
                <span className="sm:hidden">OK</span>
                <span className="hidden sm:inline">Approved</span>
              </TabsTrigger>
            </TabsList>
            
            {/* View Mode Toggle - Better spacing and alignment */}
            <div className="flex gap-0 bg-white/5 rounded-lg p-1 border border-white/10 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'h-6 px-2 sm:h-7 sm:px-3 rounded-md',
                  viewMode === 'calendar' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                title="Calendar View"
              >
                <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline text-xs ml-1.5">Calendar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                className={cn(
                  'h-6 px-2 sm:h-7 sm:px-3 rounded-md',
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                title="Table View"
              >
                <List className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline text-xs ml-1.5">Table</span>
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-1 sm:mt-2 flex-1 min-h-0 flex flex-col">
            <Card className="bg-white/5 border-white/10 flex-1 flex flex-col min-h-0">
              <CardContent className="flex-1 flex flex-col p-1 sm:p-3">
                {/* Compact Quick Filters */}
                <div className="mb-2 sm:mb-4">
                  <div className="overflow-x-auto pb-2 sm:overflow-visible">
                    <div className="flex gap-2 sm:flex-wrap min-w-max sm:min-w-0">
                      {EVENT_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          variant={typeFilters.includes(type.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newFilters = typeFilters.includes(type.value)
                              ? typeFilters.filter(t => t !== type.value)
                              : [...typeFilters, type.value];
                            setTypeFilters(newFilters);
                          }}
                          className={cn(
                            'border-white/10 transition-all flex-shrink-0 h-8 text-xs sm:text-sm',
                            typeFilters.includes(type.value)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full mr-1.5", type.color)} />
                          <span className="hidden sm:inline">{type.label}</span>
                          <span className="sm:hidden">{type.label.slice(0, 4)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {viewMode === 'calendar' ? (
                  // New FullCalendar View - Responsive for all devices
                  <FullCalendarView
                    events={filteredEvents}
                    onSelectEvent={openEditDialog}
                    onSelectSlot={(start, end) => {
                      setFormData({
                        ...formData,
                        startDate: start.toISOString().split('T')[0],
                        startTime: start.toTimeString().substring(0, 5),
                        endDate: end.toISOString().split('T')[0],
                        endTime: end.toTimeString().substring(0, 5),
                      });
                      setIsCreateOpen(true);
                    }}
                    onEventDrop={(event, start, end) => {
                      handleEventDrop({ event, start, end });
                    }}
                  />
                ) : (
                  <DataTable
                    columns={columns}
                    data={filteredEvents}
                    searchKey="title"
                    searchPlaceholder="Search events..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="w-full h-full sm:max-w-[500px] sm:max-h-[85vh] sm:h-auto overflow-hidden flex flex-col bg-gray-900 text-white border-0 sm:border sm:border-white/10 rounded-none sm:rounded-lg">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Schedule Event</DialogTitle>
              <DialogDescription className="text-white/60">
                Update event details
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <div className="grid gap-4 py-4 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CALL">Call</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="SITE_VISIT">Site Visit</SelectItem>
                      <SelectItem value="WORK">Work</SelectItem>
                      <SelectItem value="EMAIL_FOLLOWUP">Email Followup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending Approval</SelectItem>
                      <SelectItem value="REQUESTED">Requested</SelectItem>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                      <SelectItem value="CANCELED">Canceled</SelectItem>
                      <SelectItem value="RESCHEDULE_NEEDED">Reschedule Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Attendees (comma-separated)</Label>
                <Input
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-auto">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-gray-900 text-white border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mobile Floating Action Button - Remove duplicate */}
        
        {/* Mobile FAB for Add Event - Theme matched design */}
        {isMobile && !isLandscape && (
          <Button
            size="lg"
            className="fixed bottom-5 right-5 z-[9999] rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform border border-white/10 glass"
            aria-label="Add new event"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>
    </PageShell>
  );
}