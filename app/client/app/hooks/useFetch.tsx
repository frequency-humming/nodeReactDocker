'use client';

import { useQuery } from '@tanstack/react-query';
import type { GuestUserData, ApiResponse, UseFetchReturn } from '@/types/types';

const useFetch = (params: string, key : string): UseFetchReturn => {
  const query = useQuery({
    queryKey: [key],
    queryFn: async (): Promise<GuestUserData[]> => {
      const response = await fetch(params);
      if (!response.ok) {
        throw new Error(`Error - status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      return result.message;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    loading: query.isLoading || query.isFetching,
    error: query.isError,
  };
};

export default useFetch;