'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Filter, Users, Calendar, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Spinner from "@/components/spinner";
import useFetch from "@/hooks/useFetch";

export default function HomePage() {
  
  const { data, loading, error} = useFetch('/api', 'guestUsers');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState('');

  const groupedData = useMemo(() => {
    if (!data) return {};
    
    let filtered = data;
    if (filterType) {
      filtered = data.filter(item => 
        item.Image.toLowerCase().includes(filterType.toLowerCase()) ||
        item.App.toLowerCase().includes(filterType.toLowerCase()) ||
        item.User.toLowerCase().includes(filterType.toLowerCase())
      );
    }
    
    // First group by image type
    const imageGroups = filtered.reduce((acc, user) => {
      const imageType = user.Image;
      if (!acc[imageType]) {
        acc[imageType] = [];
      }
      acc[imageType].push(user);
      return acc;
    }, {} as Record<string, typeof data>);

    const monthlyGrouped: Record<string, any[]> = {};
    
    Object.keys(imageGroups).forEach(imageType => {
      const users = imageGroups[imageType];
      
      const monthlyMap = new Map();
      
      users.forEach(user => {

        const datePart = user.Date.split(',')[0]; 
        const [month, day, year] = datePart.split('/');
        const yearKey = `${year}`;
        const key = `${year}-${user.App}-${user.Login}-${user.User}`;
 
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            month: yearKey,
            app: user.App,
            login: user.Login,
            user: user.User,
            count: 0,
            events: []
          });
        }
        
        const group = monthlyMap.get(key);
        group.count += 1;
        group.events.push(user);
      });
      
      // Convert map to array and sort by month
      monthlyGrouped[imageType] = Array.from(monthlyMap.values()).sort((a, b) => {
        return sortOrder === 'asc' ? a.month.localeCompare(b.month) : b.month.localeCompare(a.month);
      });
    });

    // Sort image type keys
    const sortedGroupKeys = Object.keys(monthlyGrouped).sort((a, b) => {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });

    const sortedGrouped: Record<string, any[]> = {};
    sortedGroupKeys.forEach(key => {
      sortedGrouped[key] = monthlyGrouped[key];
    });

    return sortedGrouped;
  }, [data, filterType, sortOrder]);

  const getLoginTypeVariant = (type: string) => {
    const variants: Record<string, 'secondary' | 'destructive' | 'outline'> = {
      'off platform': 'outline',
      'guest user': 'secondary',
    };
    return variants[type.toLowerCase()] || 'destructive';
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  if (loading) {
    return (
      <Spinner />
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <CardTitle className="mb-2">Something went wrong</CardTitle>
            <p className="text-muted-foreground">Failed to load data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = data?.length || 0;
  const totalImageTypes = Object.keys(groupedData).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Guest Users</h1>
              <p className="text-muted-foreground mt-1">Manage and view user activity</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {totalImageTypes} image types
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
                  placeholder="Filter users..."
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
                Sort by Image Type
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grouped Cards */}
        {Object.keys(groupedData).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedData).map(([imageType, monthlyGroups]) => (
              <div key={imageType}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    <Camera className="w-4 h-4 mr-2" />
                    {imageType}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {monthlyGroups.length} month{monthlyGroups.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {monthlyGroups.map((group, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">
                            {group.count}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{group.user}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">App</span>
                          <Badge variant="outline">{group.app}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Login Type</span>
                          <Badge variant={getLoginTypeVariant(group.login)}>
                            {group.login}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Events</span>
                        <div className="flex items-center gap-1 text-sm">
                          {group.count}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {group.month}
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
              <CardTitle className="mb-2">No users found</CardTitle>
              <p className="text-muted-foreground">
                {filterType ? 'No users match your filter criteria.' : 'There are no guest users to display at the moment.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}