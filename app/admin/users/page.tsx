'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Shield, Users, Lock, Unlock, AlertCircle, CheckCircle, XCircle, UserCheck } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useProjects } from '@/hooks/use-api';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

import type { User } from '@prisma/client';

// Mock data for users and access
const mockUsers = [
  {
    id: '1',
    email: 'admin@schoolworldvacation.com',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
    modules: {
      dashboard: true,
      tasks: true,
      budget: true,
      schedule: true,
      procurement: true,
      plans: true,
      risks: true,
      contacts: true,
      decisions: true,
      reports: true
    },
    lastActive: new Date('2024-01-25T10:30:00'),
    createdAt: new Date('2024-01-01'),
    invitedBy: 'System'
  },
  {
    id: '2',
    email: 'contractor@example.com',
    name: 'John Contractor',
    role: 'CONTRACTOR',
    status: 'ACTIVE',
    modules: {
      dashboard: true,
      tasks: true,
      budget: false,
      schedule: true,
      procurement: false,
      plans: true,
      risks: false,
      contacts: false,
      decisions: false,
      reports: false
    },
    lastActive: new Date('2024-01-25T09:15:00'),
    createdAt: new Date('2024-01-10'),
    invitedBy: 'Admin User'
  },
  {
    id: '3',
    email: 'viewer@example.com',
    name: 'Jane Viewer',
    role: 'VIEWER',
    status: 'ACTIVE',
    modules: {
      dashboard: true,
      tasks: false,
      budget: false,
      schedule: true,
      procurement: false,
      plans: true,
      risks: false,
      contacts: false,
      decisions: false,
      reports: true
    },
    lastActive: new Date('2024-01-24T14:20:00'),
    createdAt: new Date('2024-01-15'),
    invitedBy: 'Admin User'
  },
  {
    id: '4',
    email: 'staff@example.com',
    name: 'Bob Staff',
    role: 'STAFF',
    status: 'INACTIVE',
    modules: {
      dashboard: true,
      tasks: true,
      budget: true,
      schedule: true,
      procurement: true,
      plans: true,
      risks: true,
      contacts: true,
      decisions: false,
      reports: true
    },
    lastActive: new Date('2024-01-20T11:45:00'),
    createdAt: new Date('2024-01-05'),
    invitedBy: 'Admin User'
  },
  {
    id: '5',
    email: 'pending@example.com',
    name: 'New User',
    role: 'CONTRACTOR',
    status: 'PENDING',
    modules: {
      dashboard: true,
      tasks: true,
      budget: false,
      schedule: true,
      procurement: false,
      plans: false,
      risks: false,
      contacts: false,
      decisions: false,
      reports: false
    },
    lastActive: null,
    createdAt: new Date('2024-01-25'),
    invitedBy: 'Admin User'
  }
];

const moduleDescriptions = {
  dashboard: 'View project overview and KPIs',
  tasks: 'Manage and track project tasks',
  budget: 'Access budget and financial data',
  schedule: 'View and manage project schedule',
  procurement: 'Manage procurement and orders',
  plans: 'Access project plans and documents',
  risks: 'View and manage risk assessments',
  contacts: 'Manage project contacts',
  decisions: 'Access decision logs',
  reports: 'Generate and view reports'
};

export default function UserManagementPage() {
  const { toast } = useToast();
  
  // Get current project
  const { data: projects } = useProjects();
  const currentProject = projects?.data?.[0]; // Use first project for now
  
  // API hooks
  const { data: usersData, refetch: refetchUsers } = useUsers(
    currentProject ? { projectId: currentProject.id } : undefined,
    !!currentProject
  );
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser('');
  const deleteUserMutation = useDeleteUser();
  
  // Use API data or fallback to mock data
  const initialUsers = usersData?.data?.users || mockUsers;
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Update users when API data changes
  useEffect(() => {
    if (usersData?.data?.users) {
      setUsers(usersData.data.users);
    }
  }, [usersData]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'CONTRACTOR',
    modules: {
      dashboard: true,
      tasks: false,
      budget: false,
      schedule: false,
      procurement: false,
      plans: false,
      risks: false,
      contacts: false,
      decisions: false,
      reports: false
    }
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.status === 'ACTIVE').length;
    const pendingInvites = users.filter((u: any) => u.status === 'PENDING').length;
    const adminCount = users.filter((u: any) => u.role === 'ADMIN').length;
    const contractorCount = users.filter((u: any) => u.role === 'CONTRACTOR').length;
    const recentlyActive = users.filter((u: any) => {
      if (!u.lastActive) return false;
      const hoursSinceActive = (new Date().getTime() - u.lastActive.getTime()) / (1000 * 60 * 60);
      return hoursSinceActive <= 24;
    }).length;

    return {
      totalUsers,
      activeUsers,
      pendingInvites,
      adminCount,
      contractorCount,
      recentlyActive
    };
  }, [users]);

  const handleInvite = async () => {
    if (!currentProject) {
      toast({
        title: 'Error',
        description: 'No project selected',
        variant: 'destructive'
      });
      return;
    }

    // Convert form modules to permissions format
    const permissions = Object.entries(formData.modules)
      .filter(([_, canAccess]) => canAccess)
      .map(([module]) => ({
        module: module.toUpperCase(),
        canView: true,
        canEdit: ['tasks'].includes(module) || formData.role === 'ADMIN'
      }));

    const userData = {
      email: formData.email,
      role: formData.role,
      projectId: currentProject.id,
      sendInvite: true,
      permissions
    };

    try {
      await createUserMutation.mutateAsync(userData);
      setIsInviteOpen(false);
      resetForm();
      refetchUsers();
    } catch (error) {
      // Error handled by the mutation's onError
    }
  };

  const handleEdit = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map((u: any) => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          name: formData.name,
          role: formData.role,
          modules: formData.modules
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    toast({
      title: 'Success',
      description: 'User access updated successfully',
    });
    setIsEditOpen(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedUser) return;

    setUsers(users.filter((u: any) => u.id !== selectedUser.id));
    toast({
      title: 'Success',
      description: 'User removed successfully',
    });
    setIsDeleteOpen(false);
    setSelectedUser(null);
  };

  const handleActivate = (userId: string) => {
    const updatedUsers = users.map((u: any) => {
      if (u.id === userId) {
        return { ...u, status: 'ACTIVE' };
      }
      return u;
    });
    setUsers(updatedUsers);
    toast({
      title: 'Success',
      description: 'User activated successfully',
    });
  };

  const handleDeactivate = (userId: string) => {
    const updatedUsers = users.map((u: any) => {
      if (u.id === userId) {
        return { ...u, status: 'INACTIVE' };
      }
      return u;
    });
    setUsers(updatedUsers);
    toast({
      title: 'Success',
      description: 'User deactivated',
    });
  };

  const handleResendInvite = (userId: string) => {
    toast({
      title: 'Success',
      description: 'Invitation resent successfully',
    });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'CONTRACTOR',
      modules: {
        dashboard: true,
        tasks: false,
        budget: false,
        schedule: false,
        procurement: false,
        plans: false,
        risks: false,
        contacts: false,
        decisions: false,
        reports: false
      }
    });
  };

  const openEditDialog = (user: typeof mockUsers[0]) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      modules: user.modules
    });
    setIsEditOpen(true);
  };

  const handleModuleToggle = (module: string, checked: boolean) => {
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [module]: checked
      }
    });
  };

  // Get role-based default permissions
  const getDefaultPermissions = (role: string): any => {
    switch (role) {
      case 'ADMIN':
        return Object.keys(moduleDescriptions).reduce((acc, key) => ({ ...acc, [key]: true }), {});
      case 'STAFF':
        return {
          dashboard: true,
          tasks: true,
          budget: true,
          schedule: true,
          procurement: true,
          plans: true,
          risks: true,
          contacts: true,
          decisions: false,
          reports: true
        };
      case 'CONTRACTOR':
        return {
          dashboard: true,
          tasks: true,
          budget: false,
          schedule: true,
          procurement: false,
          plans: true,
          risks: false,
          contacts: false,
          decisions: false,
          reports: false
        };
      case 'VIEWER':
        return {
          dashboard: true,
          tasks: false,
          budget: false,
          schedule: true,
          procurement: false,
          plans: true,
          risks: false,
          contacts: false,
          decisions: false,
          reports: true
        };
      default:
        return formData.modules;
    }
  };

  const columns: ColumnDef<typeof mockUsers[0]>[] = [
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
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('name')}</div>
          <div className="text-sm text-white/60">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue<string>('role');
        return (
          <Badge
            variant={
              role === 'ADMIN' ? 'destructive' :
              role === 'STAFF' ? 'default' :
              role === 'CONTRACTOR' ? 'secondary' :
              'outline'
            }
          >
            {role}
          </Badge>
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
          <div className="flex items-center gap-2">
            {status === 'ACTIVE' && <CheckCircle className="h-4 w-4 text-green-400" />}
            {status === 'INACTIVE' && <Lock className="h-4 w-4 text-red-400" />}
            {status === 'PENDING' && <AlertCircle className="h-4 w-4 text-yellow-400" />}
            <Badge
              variant={
                status === 'ACTIVE' ? 'default' :
                status === 'PENDING' ? 'secondary' :
                'destructive'
              }
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'modules',
      header: 'Access Modules',
      cell: ({ row }) => {
        const modules = row.original.modules;
        const enabledCount = Object.values(modules).filter(Boolean).length;
        const totalCount = Object.keys(modules).length;
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-white/40" />
            <span className="text-sm">
              {enabledCount}/{totalCount} modules
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'lastActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Active" />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date | null>('lastActive');
        if (!date) return <span className="text-white/40">Never</span>;
        
        const hoursAgo = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 1) return <span className="text-green-400">Active now</span>;
        if (hoursAgo < 24) return <span className="text-green-400">{Math.floor(hoursAgo)}h ago</span>;
        
        return format(date, 'MMM dd, yyyy');
      },
    },
    {
      accessorKey: 'invitedBy',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invited By" />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            {user.status === 'PENDING' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResendInvite(user.id)}
              >
                Resend
              </Button>
            )}
            {user.status === 'ACTIVE' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeactivate(user.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}
            {user.status === 'INACTIVE' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActivate(user.id)}
                className="text-green-400 hover:text-green-300"
              >
                <Unlock className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(user)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteOpen(true);
              }}
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-white/60">Manage user accounts, roles, and permissions</p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription className="text-white/60">
                  Send an invitation to join the project
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        role: value,
                        modules: getDefaultPermissions(value)
                      });
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin - Full system access</SelectItem>
                      <SelectItem value="STAFF">Staff - Manage operations</SelectItem>
                      <SelectItem value="CONTRACTOR">Contractor - Limited access</SelectItem>
                      <SelectItem value="VIEWER">Viewer - Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Module Access</Label>
                  <div className="space-y-3 rounded-lg border border-white/10 p-4">
                    {Object.entries(moduleDescriptions).map(([module, description]) => (
                      <div key={module} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium capitalize">
                            {module.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-xs text-white/60">{description}</div>
                        </div>
                        <Switch
                          checked={formData.modules[module as keyof typeof formData.modules]}
                          onCheckedChange={(checked) => handleModuleToggle(module, checked)}
                          disabled={formData.role === 'ADMIN'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite}>Send Invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total Users</CardTitle>
              <Users className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalUsers}</div>
              <p className="text-xs text-white/60 mt-1">All registered users</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.activeUsers}</div>
              <p className="text-xs text-white/60 mt-1">Currently active</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Pending Invites</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.pendingInvites}</div>
              <p className="text-xs text-white/60 mt-1">Awaiting acceptance</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Recently Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.recentlyActive}</div>
              <p className="text-xs text-white/60 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Role Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Users by role and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{metrics.adminCount}</div>
                <div className="text-sm text-white/60">Admins</div>
                <div className="text-xs text-white/40 mt-1">Full access</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {users.filter((u: any) => u.role === 'STAFF').length}
                </div>
                <div className="text-sm text-white/60">Staff</div>
                <div className="text-xs text-white/40 mt-1">Manage ops</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{metrics.contractorCount}</div>
                <div className="text-sm text-white/60">Contractors</div>
                <div className="text-xs text-white/40 mt-1">Limited access</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {users.filter((u: any) => u.role === 'VIEWER').length}
                </div>
                <div className="text-sm text-white/60">Viewers</div>
                <div className="text-xs text-white/40 mt-1">Read only</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="active">
              Active
              {metrics.activeUsers > 0 && (
                <Badge variant="default" className="ml-2">
                  {metrics.activeUsers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {metrics.pendingInvites > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {metrics.pendingInvites}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="permissions">Module Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">All Users</CardTitle>
                <CardDescription className="text-white/60">
                  Manage user access and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={users}
                  searchKey="name"
                  searchPlaceholder="Search users..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Active Users</CardTitle>
                <CardDescription className="text-white/60">
                  Users with active access to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={users.filter((u: any) => u.status === 'ACTIVE')}
                  searchKey="name"
                  searchPlaceholder="Search active users..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Pending Invitations</CardTitle>
                <CardDescription className="text-white/60">
                  Users who haven&apos;t accepted their invitation yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={users.filter((u: any) => u.status === 'PENDING')}
                  searchKey="name"
                  searchPlaceholder="Search pending users..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Module Permission Matrix</CardTitle>
                <CardDescription className="text-white/60">
                  Overview of module access by role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-4 text-white/60">Module</th>
                        <th className="text-center py-2 px-4 text-white/60">Admin</th>
                        <th className="text-center py-2 px-4 text-white/60">Staff</th>
                        <th className="text-center py-2 px-4 text-white/60">Contractor</th>
                        <th className="text-center py-2 px-4 text-white/60">Viewer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(moduleDescriptions).map(([module, description]) => {
                        const permissions = {
                          admin: getDefaultPermissions('ADMIN')[module],
                          staff: getDefaultPermissions('STAFF')[module],
                          contractor: getDefaultPermissions('CONTRACTOR')[module],
                          viewer: getDefaultPermissions('VIEWER')[module]
                        };
                        return (
                          <tr key={module} className="border-b border-white/5">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-white capitalize">
                                  {module.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-xs text-white/60">{description}</div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              {permissions.admin ? (
                                <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {permissions.staff ? (
                                <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {permissions.contractor ? (
                                <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {permissions.viewer ? (
                                <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[625px] bg-gray-900 text-white border-white/10">
            <DialogHeader>
              <DialogTitle>Edit User Access</DialogTitle>
              <DialogDescription className="text-white/60">
                Update user role and module permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-white/5 border-white/10 opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      role: value,
                      modules: getDefaultPermissions(value)
                    });
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin - Full system access</SelectItem>
                    <SelectItem value="STAFF">Staff - Manage operations</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor - Limited access</SelectItem>
                    <SelectItem value="VIEWER">Viewer - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Module Access</Label>
                <div className="space-y-3 rounded-lg border border-white/10 p-4">
                  {Object.entries(moduleDescriptions).map(([module, description]) => (
                    <div key={module} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium capitalize">
                          {module.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-xs text-white/60">{description}</div>
                      </div>
                      <Switch
                        checked={formData.modules[module as keyof typeof formData.modules]}
                        onCheckedChange={(checked) => handleModuleToggle(module, checked)}
                        disabled={formData.role === 'ADMIN'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update Access</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="bg-gray-900 text-white border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove User</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to remove &quot;{selectedUser?.name}&quot; from the project? 
                They will lose all access immediately.
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
                Remove User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageShell>
  );
}