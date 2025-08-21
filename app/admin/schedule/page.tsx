'use client';

import { useState, useMemo } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
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
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSchedule, useTodaysSchedule } from '@/hooks/use-api';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

export default function AdminSchedulePage() {
  const { toast } = useToast();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'WORK',
    startTime: '',
    endTime: '',
    location: '',
    attendees: '',
    status: 'SCHEDULED',
    requestedBy: '',
    approvedBy: '',
    notes: ''
  });

  // Fetch schedule data
  const { data: scheduleEvents, isLoading, refetch } = useSchedule();
  const { data: todaysEvents } = useTodaysSchedule();

  // Filter events based on active tab
  const filteredEvents = useMemo(() => {
    if (!scheduleEvents || !Array.isArray(scheduleEvents)) return [];
    
    switch (activeTab) {
      case 'today':
        return todaysEvents || [];
      case 'pending':
        return scheduleEvents.filter((event: any) => event.status === 'REQUESTED');
      case 'approved':
        return scheduleEvents.filter((event: any) => event.status === 'PLANNED');
      default:
        return scheduleEvents;
    }
  }, [scheduleEvents, todaysEvents, activeTab]);

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
    try {
      const response = await fetch('/api/v1/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attendees: formData.attendees.split(',').map(a => a.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error('Failed to create event');

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
    }
  };

  const handleEdit = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/v1/schedule/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attendees: formData.attendees.split(',').map(a => a.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error('Failed to update event');

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
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/v1/schedule/${selectedEvent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

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
      eventType: 'WORK',
      startTime: '',
      endTime: '',
      location: '',
      attendees: '',
      status: 'SCHEDULED',
      requestedBy: '',
      approvedBy: '',
      notes: ''
    });
  };

  const openEditDialog = (event: any) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      eventType: event.eventType,
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: new Date(event.endTime).toISOString().slice(0, 16),
      location: event.location || '',
      attendees: event.attendees?.join(', ') || '',
      status: event.status,
      requestedBy: event.requestedBy || '',
      approvedBy: event.approvedBy || '',
      notes: event.notes || ''
    });
    setIsEditOpen(true);
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
      accessorKey: 'eventType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue<string>('eventType');
        return (
          <Badge
            variant={
              type === 'WORK' ? 'default' :
              type === 'MEETING' ? 'secondary' :
              type === 'INSPECTION' ? 'outline' :
              'destructive'
            }
          >
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'startTime',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date & Time" />
      ),
      cell: ({ row }) => {
        const start = new Date(row.getValue('startTime'));
        const end = new Date(row.original.endTime);
        return (
          <div>
            <div className="font-medium">{format(start, 'MMM dd, yyyy')}</div>
            <div className="text-sm text-white/60">
              {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
            </div>
          </div>
        );
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
              status === 'APPROVED' ? 'default' :
              status === 'SCHEDULED' ? 'secondary' :
              status === 'COMPLETED' ? 'outline' :
              status === 'CANCELLED' ? 'destructive' :
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

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Schedule Management</h1>
            <p className="text-white/60">Manage project calendar and events</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Create Schedule Event</DialogTitle>
                <DialogDescription className="text-white/60">
                  Add a new event to the project calendar
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="e.g., Site Inspection"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORK">Work</SelectItem>
                        <SelectItem value="MEETING">Meeting</SelectItem>
                        <SelectItem value="INSPECTION">Inspection</SelectItem>
                        <SelectItem value="DELIVERY">Delivery</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Attendees (comma-separated)</Label>
                  <Input
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    className="bg-white/5 border-white/10"
                    placeholder="John Doe, Jane Smith"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalEvents}</div>
              <p className="text-xs text-white/60 mt-1">All scheduled events</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Today&apos;s Events</CardTitle>
              <Clock className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.todayEvents}</div>
              <p className="text-xs text-white/60 mt-1">Events scheduled today</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.pendingApprovals}</div>
              <p className="text-xs text-white/60 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Upcoming Work</CardTitle>
              <Users className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.upcomingWork}</div>
              <p className="text-xs text-white/60 mt-1">Work sessions scheduled</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="today">
              Today
              {metrics.todayEvents > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {metrics.todayEvents}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {metrics.pendingApprovals > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.pendingApprovals}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  {activeTab === 'all' && 'All Schedule Events'}
                  {activeTab === 'today' && "Today's Schedule"}
                  {activeTab === 'pending' && 'Pending Approvals'}
                  {activeTab === 'approved' && 'Approved Events'}
                </CardTitle>
                <CardDescription className="text-white/60">
                  {activeTab === 'all' && 'Complete list of all scheduled events'}
                  {activeTab === 'today' && 'Events happening today'}
                  {activeTab === 'pending' && 'Events awaiting approval'}
                  {activeTab === 'approved' && 'Events that have been approved'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredEvents}
                  searchKey="title"
                  searchPlaceholder="Search events..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Edit Schedule Event</DialogTitle>
              <DialogDescription className="text-white/60">
                Update event details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORK">Work</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="INSPECTION">Inspection</SelectItem>
                      <SelectItem value="DELIVERY">Delivery</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-white/5 border-white/10"
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
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Attendees (comma-separated)</Label>
                <Input
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
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
      </div>
    </PageShell>
  );
}