import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

// Projects API hooks
export function useProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects'),
    enabled
  });
}

// Tasks API hooks
export function useTasks(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: () => apiClient.get('/tasks', { params: query }),
    enabled
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => apiClient.get(`/tasks/${id}`),
    enabled: !!id
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/tasks', data),
    onSuccess: (data, variables) => {
      // Invalidate all tasks queries (this will catch queries with different params)
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Also invalidate specific project tasks if projectId is available
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', { projectId: variables.projectId, limit: 100 }]
        });
      }
      toast({
        title: 'Success',
        description: data.data?.message || 'Task created successfully'
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible structures
      const errorMessage = error?.error // API response { error: "message" }
        || error?.message // Standard Error object
        || 'Failed to create task';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiClient.put(`/tasks/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      // Also invalidate specific project tasks if projectId is available
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', { projectId: variables.projectId, limit: 100 }]
        });
      }
      toast({
        title: 'Success',
        description: data?.data?.message || 'Task updated successfully'
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible structures
      const errorMessage = error?.error
        || error?.message
        || 'Failed to update task';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, completedAt }: any) =>
      apiClient.patch(`/tasks/${id}/status`, { status, completedAt }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'Task status updated'
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible structures
      const errorMessage = error?.error
        || error?.message
        || 'Failed to update task status';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
}

// New Task API hooks for enhanced functionality
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.patch('/tasks', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'Tasks updated successfully'
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible structures
      const errorMessage = error?.error
        || error?.message
        || 'Failed to update tasks';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
}

export function useTaskActivities(taskId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['task', taskId, 'activities'],
    queryFn: () => apiClient.get(`/tasks/${taskId}/activities`),
    enabled: enabled && !!taskId
  });
}

export function useTaskComments(taskId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['task', taskId, 'comments'],
    queryFn: () => apiClient.get(`/tasks/${taskId}/comments`),
    enabled: enabled && !!taskId
  });
}

export function useCreateTaskComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, ...data }: any) => 
      apiClient.post(`/tasks/${taskId}/comments`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      toast({
        title: 'Success',
        description: 'Comment added successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to add comment',
        variant: 'destructive'
      });
    }
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/tasks', { ...data }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.parentTaskId] });
      toast({
        title: 'Success',
        description: 'Subtask created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create subtask',
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateTaskProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, progressPercentage }: any) => 
      apiClient.patch(`/tasks/${id}`, { progressPercentage }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update progress',
        variant: 'destructive'
      });
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId?: string }) =>
      apiClient.delete(`/tasks/${id}`),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Also invalidate specific project tasks if projectId is available
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', { projectId: variables.projectId, limit: 100 }]
        });
      }
      toast({
        title: 'Success',
        description: 'Task deleted successfully'
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible structures
      const errorMessage = error?.error
        || error?.message
        || 'Failed to delete task';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { taskIds: string[]; projectId?: string }) => 
      apiClient.delete('/tasks/bulk-delete', { data: { taskIds: data.taskIds } }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Also invalidate specific project tasks if projectId is available
      if (variables.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: ['tasks', { projectId: variables.projectId, limit: 100 }] 
        });
      }
      const count = response.data?.deleted || variables.taskIds.length;
      toast({
        title: 'Success',
        description: `${count} task${count !== 1 ? 's' : ''} deleted successfully`
      });
    },
    onError: (error: any) => {
      // Extract error message from various possible structures
      const errorMessage = error?.error
        || error?.message
        || 'Failed to delete tasks';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
}

// Budget API hooks
export function useBudget(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['budget', query],
    queryFn: () => apiClient.get('/budget', { params: query }),
    enabled
  });
}

export function useBudgetSummary(projectId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['budget-summary', { projectId }],
    queryFn: () => apiClient.get('/budget/summary', { params: { projectId } }),
    enabled
  });
}

export function useBudgetExceptions(projectId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['budget', 'exceptions', projectId],
    queryFn: () => apiClient.get('/budget/exceptions', { params: { projectId } }),
    enabled
  });
}

// Schedule API hooks
export function useSchedule(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['schedule', query],
    queryFn: () => apiClient.get('/schedule', { params: query }),
    enabled
  });
}

export function useTodaysSchedule(projectId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['schedule', 'today', projectId],
    queryFn: () => apiClient.get('/schedule/today', { params: { projectId } }),
    refetchInterval: 60000, // Refresh every minute
    enabled
  });
}

export function useTodaySchedule(projectId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['schedule', 'today', projectId],
    queryFn: () => apiClient.get('/schedule/today', { params: { projectId } }),
    refetchInterval: 60000, // Refresh every minute
    enabled
  });
}

export function useScheduleEvents(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['schedule', query],
    queryFn: () => apiClient.get('/schedule', { params: query }),
    enabled
  });
}

export function useApproveScheduleEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, approved, notes }: any) => 
      apiClient.patch(`/schedule/${id}/approve`, { approved, notes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast({
        title: 'Success',
        description: data?.data?.message
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to process schedule request',
        variant: 'destructive'
      });
    }
  });
}

// Contacts API hooks
export function useContacts(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['contacts', query],
    queryFn: () => apiClient.get('/contacts', { params: query }),
    enabled
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/contacts', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'Contact created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create contact',
        variant: 'destructive'
      });
    }
  });
}

// RFP API hooks
export function useRfps(projectId: string, query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['rfps', projectId, query],
    queryFn: () => apiClient.get(`/projects/${projectId}/rfps`, { params: query }),
    enabled: !!projectId && enabled
  });
}

// RFP hook without projectId requirement - gets all RFPs across projects
export function useAllRfps(query?: any, enabled: boolean = true) {
  const projectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
  return useQuery({
    queryKey: ['rfps', { projectId }],
    queryFn: async () => {
      // First get all projects, then get RFPs for each
      const projectsResponse = await apiClient.get('/projects');
      const projects = projectsResponse.data?.data || [];

      if (projects.length === 0) return [];

      // For now, just get RFPs from the first project
      // In production, you'd want to aggregate across all projects
      const projectId = projects[0].id;
      const rfpsResponse = await apiClient.get(`/projects/${projectId}/rfps`, { params: query });
      return rfpsResponse.data?.data || [];
    },
    enabled
  });
}

export function useRfp(projectId: string, rfpId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['rfp', projectId, rfpId],
    queryFn: () => apiClient.get(`/projects/${projectId}/rfps/${rfpId}`),
    enabled: !!projectId && !!rfpId && enabled
  });
}

export function useCreateRfp(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post(`/projects/${projectId}/rfps`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfps', projectId] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'RFP created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create RFP',
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateRfp(projectId: string, rfpId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.put(`/projects/${projectId}/rfps/${rfpId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfps', projectId] });
      queryClient.invalidateQueries({ queryKey: ['rfp', projectId, rfpId] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'RFP updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update RFP',
        variant: 'destructive'
      });
    }
  });
}

export function useDeleteRfp(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rfpId: string) => apiClient.delete(`/projects/${projectId}/rfps/${rfpId}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfps', projectId] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'RFP deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete RFP',
        variant: 'destructive'
      });
    }
  });
}

export function useUpsertRfpItems(projectId: string, rfpId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { items: any[] }) => 
      apiClient.post(`/projects/${projectId}/rfps/${rfpId}/items`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfp', projectId, rfpId] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'Items updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update items',
        variant: 'destructive'
      });
    }
  });
}

export function useUploadAttachment(projectId: string, rfpId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { filename: string; mime: string; size: number; content: string }) => 
      apiClient.post(`/projects/${projectId}/rfps/${rfpId}/attachments`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfp', projectId, rfpId] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'File uploaded successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to upload file',
        variant: 'destructive'
      });
    }
  });
}

export function usePublishRfp(projectId: string, rfpId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.post(`/projects/${projectId}/rfps/${rfpId}/publish`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfps', projectId] });
      queryClient.invalidateQueries({ queryKey: ['rfp', projectId, rfpId] });
      toast({
        title: 'Success',
        description: data?.data?.message || 'RFP published successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to publish RFP',
        variant: 'destructive'
      });
    }
  });
}

// Users API hooks
export function useUsers(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => apiClient.get('/users', { params: query }),
    enabled
  });
}

export function useUser(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.get(`/users/${id}`),
    enabled: !!id && enabled
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/users', data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (variables.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: ['users', { projectId: variables.projectId }] 
        });
      }
      toast({
        title: 'Success',
        description: data.data?.message || 'User created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create user',
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.put(`/users/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast({
        title: 'Success',
        description: data.data?.message || 'User updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update user',
        variant: 'destructive'
      });
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: data.data?.message || 'User deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete user',
        variant: 'destructive'
      });
    }
  });
}

export function useUserPermissions(id: string, projectId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-permissions', id, projectId],
    queryFn: () => apiClient.get(`/users/${id}/permissions`, { 
      params: projectId ? { projectId } : {} 
    }),
    enabled: !!id && enabled
  });
}

export function useUpdateUserPermissions(id: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.put(`/users/${id}/permissions?projectId=${projectId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', id] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions', id, projectId] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Permissions updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update permissions',
        variant: 'destructive'
      });
    }
  });
}

// Vendor API hooks
export function useVendors(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['vendors', query],
    queryFn: () => apiClient.get('/api/v1/vendors', { params: query }),
    enabled
  });
}

export function useVendor(vendorId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => apiClient.get(`/api/v1/vendors/${vendorId}`),
    enabled: !!vendorId && enabled
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/vendors', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Vendor created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create vendor',
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateVendor(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.put(`/api/v1/vendors/${vendorId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Vendor updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update vendor',
        variant: 'destructive'
      });
    }
  });
}

// Bid API hooks
export function useBids(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['bids', query],
    queryFn: () => apiClient.get('/api/v1/bids', { params: query }),
    enabled
  });
}

export function useBid(bidId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['bid', bidId],
    queryFn: () => apiClient.get(`/api/v1/bids/${bidId}`),
    enabled: !!bidId && enabled
  });
}

export function useCreateBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/bids', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Bid created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create bid',
        variant: 'destructive'
      });
    }
  });
}

export function useSubmitBid(bidId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post(`/api/v1/bids/${bidId}/submit`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Bid submitted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to submit bid',
        variant: 'destructive'
      });
    }
  });
}

export function useWithdrawBid(bidId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.delete(`/api/v1/bids/${bidId}/submit`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Bid withdrawn successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to withdraw bid',
        variant: 'destructive'
      });
    }
  });
}

// Invite to RFP hook
export function useInviteToRfp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rfpId, contactIds, message }: { rfpId: string; contactIds: string[]; message?: string }) => {
      const projectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
      return apiClient.post(`/api/v1/rfps/${rfpId}/invite`,
        { contactIds, message },
        { headers: projectId ? { 'x-project-id': projectId } : {} }
      );
    },
    onSuccess: (data) => {
      const projectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
      queryClient.invalidateQueries({ queryKey: ['rfps', { projectId }] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Invitations sent successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send invitations',
        variant: 'destructive'
      });
    }
  });
}

// Update bid hook
export function useUpdateBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bidId, rfpId, data }: { bidId: string; rfpId: string; data: any }) => {
      const projectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
      return apiClient.patch(`/api/v1/bids/${bidId}`, data,
        { headers: projectId ? { 'x-project-id': projectId } : {} }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bids', { rfpId: variables.rfpId }] });
      toast({
        title: 'Success',
        description: 'Bid updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update bid',
        variant: 'destructive'
      });
    }
  });
}

// Award bid hook
export function useAwardBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bidId, rfpId, data }: { bidId: string; rfpId: string; data?: any }) => {
      const projectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
      return apiClient.post(`/api/v1/bids/${bidId}/award`, data || {},
        { headers: projectId ? { 'x-project-id': projectId } : {} }
      );
    },
    onSuccess: (_, variables) => {
      const projectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
      queryClient.invalidateQueries({ queryKey: ['bids', { rfpId: variables.rfpId }] });
      queryClient.invalidateQueries({ queryKey: ['budget', { projectId }] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary', { projectId }] });
      toast({
        title: 'Success',
        description: 'Bid awarded successfully and budget updated'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to award bid',
        variant: 'destructive'
      });
    }
  });
}

// Bid Tabulation API hooks
export function useBidTabulation(rfpId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['bid-tabulation', rfpId],
    queryFn: () => apiClient.get(`/api/v1/rfps/${rfpId}/tabulation`),
    enabled: !!rfpId && enabled,
    staleTime: 30000 // Cache for 30 seconds
  });
}

export function useApplyLeveling(rfpId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post(`/api/v1/rfps/${rfpId}/tabulation/leveling`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bid-tabulation', rfpId] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Leveling adjustments applied successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to apply leveling adjustments',
        variant: 'destructive'
      });
    }
  });
}

// Award API hooks
export function useAwards(query?: any, enabled: boolean = true) {
  return useQuery({
    queryKey: ['awards', query],
    queryFn: () => apiClient.get('/api/v1/awards', { params: query }),
    enabled
  });
}

export function useCreateAward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/awards', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
      queryClient.invalidateQueries({ queryKey: ['rfps'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast({
        title: 'Success',
        description: data.data?.message || 'Award created and commitment established successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create award',
        variant: 'destructive'
      });
    }
  });
}