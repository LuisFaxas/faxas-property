import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: data.message || 'Task created successfully'
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
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
    mutationFn: ({ id, status }: any) => apiClient.patch(`/tasks/${id}/status`, { status }),
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