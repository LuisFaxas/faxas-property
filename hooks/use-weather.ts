import { useQuery } from '@tanstack/react-query';

export function useWeather(projectId?: string, enabled = true) {
  return useQuery({
    queryKey: ['weather', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/weather?projectId=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch weather');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: enabled && !!projectId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1
  });
}