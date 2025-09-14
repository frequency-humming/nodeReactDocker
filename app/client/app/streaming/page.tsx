'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Filter, Activity, Calendar, Server, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import Spinner from "../components/spinner";
import useLogs from "../hooks/useLogs";

export default function Streaming() {

  const { data, loading, error} = useLogs('streaming');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default newest first
  const [filterType, setFilterType] = useState('');

  // Group data by service, then by level + hour combination
  const groupedData = useMemo(() => {
    if (!data) return {};
    
    let filtered = data;
    if (filterType) {
      filtered = data.filter(item => 
        item.service.toLowerCase().includes(filterType.toLowerCase()) ||
        item.level.toLowerCase().includes(filterType.toLowerCase()) ||
        item.message.toLowerCase().includes(filterType.toLowerCase()) ||
        item.kafka_metadata.topic.toLowerCase().includes(filterType.toLowerCase())
      );
    }
    
    // First group by service
    const serviceGroups = filtered.reduce((acc, log) => {
      const service = log.service;
      if (!acc[service]) {
        acc[service] = [];
      }
      acc[service].push(log);
      return acc;
    }, {} as Record<string, typeof data>);

    // Then group each service by hour + level combination
    const hourlyGrouped: Record<string, any[]> = {};
    
    Object.keys(serviceGroups).forEach(service => {
      const logs = serviceGroups[service];
      
      // Create a map for hour + level combinations
      const hourlyMap = new Map();
      
      logs.forEach(log => {
        // Extract hour from timestamp
        const logDate = new Date(log.timestamp);
        const hourKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
        const key = `${hourKey}-${log.message}-${log.event.QueriedEntities}`;
        
        if (!hourlyMap.has(key)) {
          hourlyMap.set(key, {
            hour: hourKey,
            level: log.level,
            service: log.service,
            message: log.message,
            entity: log.event.QueriedEntities,
            count: 0,
            logs: [],
            topic: log.kafka_metadata.topic,
            source: log.metadata.source,
          });
        }
        
        const group = hourlyMap.get(key);
        group.count += 1;
        group.logs.push(log);
        // Keep the latest message for preview
        if (new Date(log.timestamp) > new Date(group.logs[0]?.timestamp || 0)) {
          group.latestMessage = log.message;
        }
      });
      
      // Convert map to array and sort by hour
      hourlyGrouped[service] = Array.from(hourlyMap.values()).sort((a, b) => {
        return sortOrder === 'asc' ? a.hour.localeCompare(b.hour) : b.hour.localeCompare(a.hour);
      });
    });

    // Sort service keys
    const sortedGroupKeys = Object.keys(hourlyGrouped).sort((a, b) => {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });

    const sortedGrouped: Record<string, any[]> = {};
    sortedGroupKeys.forEach(key => {
      sortedGrouped[key] = hourlyGrouped[key];
    });

    return sortedGrouped;
  }, [data, filterType, sortOrder]);

  const getLogLevelVariant = (level: string) => {
    const variants: Record<string, 'secondary' | 'destructive' | 'outline' | 'default'> = {
      'ERROR': 'destructive',
      'WARN': 'outline',
      'INFO': 'secondary',
      'DEBUG': 'default',
    };
    return variants[level.toUpperCase()] || 'default';
  };

  const getLogLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return '🔴';
      case 'WARN': return '🟡';
      case 'INFO': return '🔵';
      case 'DEBUG': return '⚪';
      default: return '📝';
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  if (error) {
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

  const totalLogs = data?.length || 0;
  const totalServices = Object.keys(groupedData).length;
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Streaming Logs</h1>
              <p className="text-muted-foreground mt-1">Monitor and analyze application logs</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {totalLogs} logs
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                {totalServices} services
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter logs..."
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={toggleSort}
                className="flex items-center gap-2"
              >
                Sort by Time
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grouped Cards */}
        {Object.keys(groupedData).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedData).map(([service, hourlyGroups]) => (
              <div key={service}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    <Server className="w-4 h-4 mr-2" />
                    {service}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {hourlyGroups.length} time period{hourlyGroups.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {hourlyGroups.map((group, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">
                            {group.count}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">Source: {group.source}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Event</span>
                          <Badge variant="outline">{group.message}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Entity</span>
                          <Badge variant="outline">{group.entity}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Level</span>
                          <Badge variant={getLogLevelVariant(group.level)}>
                            {getLogLevelIcon(group.level)} {group.level}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Count</span>
                          <div className="flex items-center gap-1 text-sm">
                            <AlertCircle className="w-3 h-3" />
                            {group.count}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Time</span>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {group.hour}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <CardTitle className="mb-2">No logs found</CardTitle>
              <p className="text-muted-foreground">
                {filterType ? 'No logs match your filter criteria.' : 'There are no logs to display at the moment.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}