'use client';

import { useQuery } from '@tanstack/react-query';
import type { LogEntry, LogsApiResponse, UseLogsReturn} from '@/types/types';

const useLogs = ( key : String): UseLogsReturn => {

  const query = useQuery({
    queryKey: ['logs',key],
    queryFn: async (): Promise<LogEntry[]> => {
    
      const url = `/api/logs/?key=${key}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error - status: ${response.status}`);
      }
      
      const result: LogsApiResponse = await response.json();
      console.log(`Fetched ${result.message.length} logs`);
      
      return result.message;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: query.data,
    loading: query.isLoading || query.isFetching,
    error: query.isError
  };
};

export default useLogs;