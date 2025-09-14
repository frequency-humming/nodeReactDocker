'use client';

import { useQuery } from '@tanstack/react-query';

const useAthena = (query: string): any => {
  if(!query) {
    return { data: null, loading: false, error: null };
  }
  const queryResult = useQuery({
    queryKey: [query],
    queryFn: async (): Promise<any> => {
      const response = await fetch('/api/athena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error(`Error - status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Athena query result:', result);
      return result.results;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: queryResult.data,
    loading: queryResult.isLoading || queryResult.isFetching,
    error: queryResult.isError,
  };
};

export default useAthena;