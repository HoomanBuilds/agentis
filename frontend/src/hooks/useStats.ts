import { useQuery } from '@tanstack/react-query';

interface PlatformStats {
  totalAgents: number;
  totalListings: number;
}

const fetchStats = async (): Promise<PlatformStats> => {
  const response = await fetch('/api/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  const data = await response.json();
  if (data.success) {
    return {
      totalAgents: data.totalAgents || 0,
      totalListings: data.totalListings || 0,
    };
  }
  return { totalAgents: 0, totalListings: 0 };
};

/**
 * Hook to fetch platform stats with React Query caching.
 */
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    refetchOnWindowFocus: false,
  });
}
