// API Data Types
export interface GuestUserData {
  Id: string;
  App: string;
  User: string;
  Image: string;
  Login: string;
  Date: string;
}

export interface ApiResponse {
  message: GuestUserData[];
}

// Hook Return Types
export interface UseFetchReturn {
  data: GuestUserData[] | undefined;
  error: boolean;
  loading: boolean;
}

// Chart Data Types
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  service: string;
  message: string;
  requestId: string;
  event : any;
  metadata: {
    source: string;
    version: string;
  };
  kafka_metadata: {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    receivedAt: string;
  };
}

export interface BatchMetadata {
  timestamp: string;
  count: number;
  reason: string;
  topics: string[];
  services: string[];
  levels: string[];
  timespan: {
    first: string;
    last: string;
  };
}

export interface LogBatch {
  batch_metadata: BatchMetadata;
  logs: LogEntry[];
}

export interface LogsApiResponse {
  message: LogEntry[];
  totalBatches: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface UseLogsReturn {
  data: LogEntry[] | undefined;
  loading: boolean;
  error: boolean;
}

export interface UseLogsOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  enabled?: boolean;
}
