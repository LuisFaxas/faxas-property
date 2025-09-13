import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useWeather(projectId?: string, enabled = true) {
  return useQuery({
    queryKey: ['weather', projectId],
    queryFn: async () => {
      const data = await apiClient.get(`/weather?projectId=${projectId}`);
      return data;
    },
    enabled: enabled && !!projectId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1
  });
}