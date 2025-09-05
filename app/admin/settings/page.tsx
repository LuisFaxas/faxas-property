'use client';

import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import { 
  Settings, 
  Building2, 
  Plug, 
  Server,
  Plus,
  Search,
  MoreVertical,
  Archive,
  Copy,
  Trash2,
  Edit,
  Star,
  StarOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/blocks/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProjects } from '@/hooks/use-api';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import type { ColumnDef } from '@tanstack/react-table';

// Project types
const PROJECT_TYPES = [
  { value: 'NEW_CONSTRUCTION', label: 'New Construction' },
  { value: 'RENOVATION', label: 'Renovation' },
  { value: 'ADDITION', label: 'Addition' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
];

const PROJECT_STATUSES = [
  { value: 'PLANNING', label: 'Planning', color: 'bg-gray-500' },
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-500' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-blue-500' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-gray-400' },
];

const PROJECT_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
];

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  
  // Project management states
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  
  // Form states for project
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    projectType: 'RENOVATION',
    status: 'PLANNING',
    startDate: '',
    targetEndDate: '',
    address: '',
    siteDetails: '',
    totalBudget: '',
    contingency: '10',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    color: '#3B82F6',
  });

  // Wait for auth to be ready
  useEffect(() => {
    if (!authLoading && user) {
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading, refetch: refetchProjects } = useProjects(isReady);
  
  // Handle create project
  const handleCreateProject = async () => {
    try {
      await apiClient.post('/projects', {
        ...projectForm,
        totalBudget: projectForm.totalBudget ? parseFloat(projectForm.totalBudget) : null,
        contingency: projectForm.contingency ? parseFloat(projectForm.contingency) : null,
      });
      
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      
      setIsCreateDialogOpen(false);
      setProjectForm({
        name: '',
        description: '',
        projectType: 'RENOVATION',
        status: 'PLANNING',
        startDate: '',
        targetEndDate: '',
        address: '',
        siteDetails: '',
        totalBudget: '',
        contingency: '10',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        color: '#3B82F6',
      });
      refetchProjects();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error instanceof Error ? error.message : 'Failed to create project'),
        variant: 'destructive',
      });
    }
  };

  // Handle edit project
  const handleEditProject = async () => {
    if (!selectedProject) return;
    
    try {
      await apiClient.put(`/projects/${selectedProject.id}`, {
        ...projectForm,
        totalBudget: projectForm.totalBudget ? parseFloat(projectForm.totalBudget) : null,
        contingency: projectForm.contingency ? parseFloat(projectForm.contingency) : null,
      });
      
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      refetchProjects();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error instanceof Error ? error.message : 'Failed to update project'),
        variant: 'destructive',
      });
    }
  };

  // Handle delete project
  const handleDeleteProject = async (projectId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
      
      setDeleteProjectId(null);
      refetchProjects();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error instanceof Error ? error.message : 'Failed to delete project'),
        variant: 'destructive',
      });
    }
  };

  // Handle archive project
  const handleArchiveProject = async (projectId: string) => {
    try {
      await apiClient.post(`/projects/${projectId}/archive`);
      
      toast({
        title: 'Success',
        description: 'Project archived successfully',
      });
      
      refetchProjects();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error instanceof Error ? error.message : 'Failed to archive project'),
        variant: 'destructive',
      });
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (projectId: string, isFavorite: boolean) => {
    try {
      await apiClient.post(`/projects/${projectId}/favorite`, { isFavorite: !isFavorite });
      
      toast({
        title: 'Success',
        description: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      });
      
      refetchProjects();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error instanceof Error ? error.message : 'Failed to update favorite status'),
        variant: 'destructive',
      });
    }
  };

  // Define columns for projects table
  const projectColumns: ColumnDef<Project>[] = [
    {
      accessorKey: 'isFavorite',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleFavorite(row.original.id, row.original.isFavorite)}
        >
          {row.original.isFavorite ? (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff className="h-4 w-4 text-gray-400" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.color && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: row.original.color }}
            />
          )}
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = PROJECT_STATUSES.find(s => s.value === row.getValue('status'));
        return (
          <Badge className={`${status?.color} text-white`}>
            {status?.label || row.getValue('status')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'projectType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = PROJECT_TYPES.find(t => t.value === row.getValue('projectType'));
        return <span>{type?.label || row.getValue('projectType')}</span>;
      },
    },
    {
      accessorKey: 'clientName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Client" />
      ),
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('startDate');
        return date ? format(new Date(date as string), 'MMM dd, yyyy') : '-';
      },
    },
    {
      accessorKey: 'targetEndDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Target End" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('targetEndDate');
        return date ? format(new Date(date as string), 'MMM dd, yyyy') : '-';
      },
    },
    {
      accessorKey: 'totalBudget',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Budget" />
      ),
      cell: ({ row }) => {
        const budget = row.getValue('totalBudget');
        return budget ? `$${Number(budget).toLocaleString()}` : '-';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const project = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedProject(project);
                  setProjectForm({
                    name: project.name || '',
                    description: project.description || '',
                    projectType: project.projectType || 'RENOVATION',
                    status: project.status || 'PLANNING',
                    startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
                    targetEndDate: project.targetEndDate ? format(new Date(project.targetEndDate), 'yyyy-MM-dd') : '',
                    address: project.address || '',
                    siteDetails: project.siteDetails || '',
                    totalBudget: project.totalBudget?.toString() || '',
                    contingency: project.contingency?.toString() || '10',
                    clientName: project.clientName || '',
                    clientEmail: project.clientEmail || '',
                    clientPhone: project.clientPhone || '',
                    color: project.color || '#3B82F6',
                  });
                  setIsEditDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Clone project:', project.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleArchiveProject(project.id)}
                disabled={project.status === 'ARCHIVED'}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteProjectId(project.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filter projects based on search
  const filteredProjects = projectsData?.filter((project: Project) =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.address?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and configurations
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Project Management</CardTitle>
                  <CardDescription>
                    Manage all your construction projects in one place
                  </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent-500 hover:bg-accent-600">
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>
                        Enter the details for your new construction project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Project Name *</Label>
                          <Input
                            id="name"
                            value={projectForm.name}
                            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                            placeholder="e.g., Miami Beach Renovation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="projectType">Project Type</Label>
                          <Select
                            value={projectForm.projectType}
                            onValueChange={(value) => setProjectForm({ ...projectForm, projectType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={projectForm.description}
                          onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                          placeholder="Brief project description..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={projectForm.status}
                            onValueChange={(value) => setProjectForm({ ...projectForm, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECT_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="color">Project Color</Label>
                          <Select
                            value={projectForm.color}
                            onValueChange={(value) => setProjectForm({ ...projectForm, color: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECT_COLORS.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded" 
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={projectForm.startDate}
                            onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="targetEndDate">Target End Date</Label>
                          <Input
                            id="targetEndDate"
                            type="date"
                            value={projectForm.targetEndDate}
                            onChange={(e) => setProjectForm({ ...projectForm, targetEndDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Project Address</Label>
                        <Input
                          id="address"
                          value={projectForm.address}
                          onChange={(e) => setProjectForm({ ...projectForm, address: e.target.value })}
                          placeholder="e.g., 123 Ocean Drive, Miami Beach, FL 33139"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="totalBudget">Total Budget ($)</Label>
                          <Input
                            id="totalBudget"
                            type="number"
                            value={projectForm.totalBudget}
                            onChange={(e) => setProjectForm({ ...projectForm, totalBudget: e.target.value })}
                            placeholder="e.g., 500000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contingency">Contingency (%)</Label>
                          <Input
                            id="contingency"
                            type="number"
                            value={projectForm.contingency}
                            onChange={(e) => setProjectForm({ ...projectForm, contingency: e.target.value })}
                            placeholder="e.g., 10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientName">Client Name</Label>
                          <Input
                            id="clientName"
                            value={projectForm.clientName}
                            onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                            placeholder="e.g., John Smith"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail">Client Email</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={projectForm.clientEmail}
                            onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })}
                            placeholder="e.g., client@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientPhone">Client Phone</Label>
                          <Input
                            id="clientPhone"
                            value={projectForm.clientPhone}
                            onChange={(e) => setProjectForm({ ...projectForm, clientPhone: e.target.value })}
                            placeholder="e.g., (305) 555-0123"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateProject}
                        disabled={!projectForm.name}
                        className="bg-accent-500 hover:bg-accent-600"
                      >
                        Create Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <DataTable
                  columns={projectColumns}
                  data={filteredProjects}
                  isLoading={projectsLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Organization Settings</CardTitle>
              <CardDescription>
                Configure your company information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-white/50 text-center py-8">
                Organization settings coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Integrations</CardTitle>
              <CardDescription>
                Connect with external services and tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-white/50 text-center py-8">
                Integration settings coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-white/50 text-center py-8">
                System settings coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name *</Label>
                <Input
                  id="edit-name"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g., Miami Beach Renovation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-projectType">Project Type</Label>
                <Select
                  value={projectForm.projectType}
                  onValueChange={(value) => setProjectForm({ ...projectForm, projectType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Brief project description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={projectForm.status}
                  onValueChange={(value) => setProjectForm({ ...projectForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Project Color</Label>
                <Select
                  value={projectForm.color}
                  onValueChange={(value) => setProjectForm({ ...projectForm, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-targetEndDate">Target End Date</Label>
                <Input
                  id="edit-targetEndDate"
                  type="date"
                  value={projectForm.targetEndDate}
                  onChange={(e) => setProjectForm({ ...projectForm, targetEndDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Project Address</Label>
              <Input
                id="edit-address"
                value={projectForm.address}
                onChange={(e) => setProjectForm({ ...projectForm, address: e.target.value })}
                placeholder="e.g., 123 Ocean Drive, Miami Beach, FL 33139"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-totalBudget">Total Budget ($)</Label>
                <Input
                  id="edit-totalBudget"
                  type="number"
                  value={projectForm.totalBudget}
                  onChange={(e) => setProjectForm({ ...projectForm, totalBudget: e.target.value })}
                  placeholder="e.g., 500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contingency">Contingency (%)</Label>
                <Input
                  id="edit-contingency"
                  type="number"
                  value={projectForm.contingency}
                  onChange={(e) => setProjectForm({ ...projectForm, contingency: e.target.value })}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-clientName">Client Name</Label>
                <Input
                  id="edit-clientName"
                  value={projectForm.clientName}
                  onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-clientEmail">Client Email</Label>
                <Input
                  id="edit-clientEmail"
                  type="email"
                  value={projectForm.clientEmail}
                  onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })}
                  placeholder="e.g., client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-clientPhone">Client Phone</Label>
                <Input
                  id="edit-clientPhone"
                  value={projectForm.clientPhone}
                  onChange={(e) => setProjectForm({ ...projectForm, clientPhone: e.target.value })}
                  placeholder="e.g., (305) 555-0123"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditProject}
              disabled={!projectForm.name}
              className="bg-accent-500 hover:bg-accent-600"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated data including tasks, budget items, and documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && handleDeleteProject(deleteProjectId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageShell>
  );
}