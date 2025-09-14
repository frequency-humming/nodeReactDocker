'use client'

import { useState, useMemo, useEffect, use } from 'react';
import Spinner from "../components/spinner";
import useAthena from "../hooks/useAthena";
import { 
  Activity, Calendar, Server, 
  AlertCircle, Clock, Globe, Zap, HardDrive, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Line, Pie} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EventLogs() {
  const [selectedTab, setSelectedTab] = useState('sites');
  const [resourceData, setResourceData] = useState<any>(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState(false);

  // Initial load - only get overview data
  const { data: sitePerformanceData, loading: sitePerformanceLoading, error: sitePerformanceError } = useAthena('getSitePerformance');

  const resourceAnalysisData = async (e: React.FormEvent) => {
    if(resourceData) {
      return;
    }
    e.preventDefault();
    setResourceLoading(true);
    try {
      const response = await fetch('/api/athena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"query": "getSiteResourceAnalysis"}),
      });
      const result = await response.json();
      setResourceData(result.results);
      setResourceLoading(false);
    } catch (error) {
      setResourceError(true);
      console.error('Error fetching site resource analysis data:', error);
    }
  }

  // Extract metrics from site performance data
  const sitesMetrics = useMemo(() => {
    if (!sitePerformanceData) return null;
    
    // Find the TOTAL row for aggregate metrics
    const totalRow = sitePerformanceData.find((row: any) => row.hour_label === 'TOTAL');
    if (!totalRow) return null;
    
    return {
      totalRequests: totalRow.requests || 0,
      errorCount: totalRow.errors || 0,
      guestUsers: totalRow.guest_users || 0,
      authenticatedUsers: totalRow.authenticated_users || 0,
      uniqueSessions: totalRow.unique_sessions || 0,
      uniqueUsers: totalRow.unique_users || 0,
      errorRate: totalRow.error_rate || 0
    };
  }, [sitePerformanceData]);

  // Extract time series data for charts
  const timeSeriesData = useMemo(() => {
    if (!sitePerformanceData) return [];
    
    // Filter out the TOTAL row and sort by hour
    return sitePerformanceData
      .filter((row: any) => row.hour_label !== 'TOTAL')
      .sort((a: any, b: any) => {
        const hourA = parseInt(a.hour_label) || 0;
        const hourB = parseInt(b.hour_label) || 0;
        return hourA - hourB;
      });
  }, [sitePerformanceData]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeMs = (ms: number) => {
    if (!ms || ms === 0) return '0ms';
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatTimeNs = (ns: number) => {
  if (!ns) return '0ms';

  const ms = ns / 1_000_000; // convert ns → ms

  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
};

  // Loading state for any tab
  const isLoading = selectedTab === 'sites' ? sitePerformanceLoading : 
                    selectedTab === 'resources' ? resourceLoading : false;
  
  // Error state for any tab
  const hasError = selectedTab === 'sites' ? sitePerformanceError : 
                   selectedTab === 'resources' ? resourceError : false;
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <CardTitle className="mb-2">Something went wrong</CardTitle>
            <p className="text-muted-foreground">Failed to load log data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals for header
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Chart.js configurations
  const requestsChartData = {
    labels: timeSeriesData.map((d: any) => `${d.hour_label}:00`),
    datasets: [
      {
        label: 'Requests',
        data: timeSeriesData.map((d: any) => d.requests),
        borderColor: '#8884d8',
        backgroundColor: 'rgba(136, 132, 216, 0.3)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Errors',
        data: timeSeriesData.map((d: any) => d.errors),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const userDistributionData = {
    labels: ['Guest Users', 'Authenticated Users'],
    datasets: [{
      data: [sitesMetrics?.guestUsers || 0, sitesMetrics?.authenticatedUsers || 0],
      backgroundColor: COLORS,
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sites Performance</h1>
              <p className="text-muted-foreground mt-1">
                Daily performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs for different views */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sites">Site Performance</TabsTrigger>
            <TabsTrigger value="resources" onClick={resourceAnalysisData}>Resource Analysis</TabsTrigger>
          </TabsList>

          {/* Sites Performance Tab */}
          <TabsContent value="sites" className="space-y-6">
            {sitesMetrics ? (
              <>
                {/* Performance Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{sitesMetrics.totalRequests.toLocaleString()}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <span>{sitesMetrics.uniqueSessions} sessions</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{sitesMetrics.errorRate.toFixed(2)}%</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <span>{sitesMetrics.errorCount} total errors</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{sitesMetrics.uniqueUsers}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <span>Active today</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{sitesMetrics.uniqueSessions}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <span>Unique sessions</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Hourly Request Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ height: '250px' }}>
                        {timeSeriesData.length > 0 ? (
                          <Line data={requestsChartData} options={chartOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            No hourly data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ height: '250px' }}>
                        <Pie data={userDistributionData} options={pieChartOptions} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">Loading Site Performance Data</CardTitle>
                  <p className="text-muted-foreground">
                    Site performance metrics will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Resource Analysis Tab */}
          <TabsContent value="resources" className="space-y-6">
            {resourceData && resourceData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Top Resource Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Top 20 resources by request volume for today
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Resource URI</th>
                          <th className="text-right py-2">Requests</th>
                          <th className="text-right py-2">Avg CPU</th>
                          <th className="text-right py-2">Avg Runtime</th>
                          <th className="text-right py-2">Avg DB Time</th>
                          <th className="text-right py-2">Total Size</th>
                          <th className="text-right py-2">Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resourceData.map((resource: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 max-w-xs truncate" title={resource.uri}>
                              {resource.uri?.split('/').slice(-3).join('/') || resource.uri || 'N/A'}
                            </td>
                            <td className="text-right py-2">{resource.request_count}</td>
                            <td className="text-right py-2">{formatTimeMs(resource.avg_cpu)}</td>
                            <td className="text-right py-2">{formatTimeMs(resource.avg_runtime)}</td>
                            <td className="text-right py-2">{formatTimeNs(resource.avg_db)}</td>
                            <td className="text-right py-2">{formatBytes(resource.total_size)}</td>
                            <td className="text-right py-2">
                              {resource.error_count > 0 ? (
                                <Badge variant="destructive">{resource.error_count}</Badge>
                              ) : (
                                <Badge variant="outline">0</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">Loading Resource Data</CardTitle>
                  <p className="text-muted-foreground">
                    Resource performance data will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}