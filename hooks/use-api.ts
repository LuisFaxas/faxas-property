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
      toast({
        title: 'Error',
        description: error.error || 'Failed to create task',
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
        description: data.message || 'Task updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update task',
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
        description: data.message || 'Task status updated'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update task status',
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
        description: data.message || 'Tasks updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to update tasks',
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
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete task',
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
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete tasks',
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
    queryKey: ['budget', 'summary', projectId],
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
        description: data.message
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
        description: data.message || 'Contact created successfully'
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