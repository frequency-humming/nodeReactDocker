'use client';

import { Bar, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GuestUserData, ChartData } from '@/types/types';

// Chart processing functions (keep the same)
const processDataForChart = (data: GuestUserData[] | undefined): ChartData | null => {
  if (!data || !data.length) return null;

  const imageTypes: { [key: string]: number } = {};
  data.forEach((row) => {
    const imageType = row.Image;
    if (imageTypes[imageType]) {
      imageTypes[imageType] += 1;
    } else {
      imageTypes[imageType] = 1;
    }
  });

  const labels = Object.keys(imageTypes);
  const values = Object.values(imageTypes);

  return {
    labels,
    datasets: [
      {
        label: 'Stats by Image Type',
        data: values,
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(153, 102, 255, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

const processDataForDonutChart = (data: GuestUserData[] | undefined): ChartData | null => {
  if (!data || !data.length) return null;

  const dates: { [key: string]: number } = {};
  data.forEach((row) => {

    const datePart = row.Date.split(',')[0]; 
    const [month, day, year] = datePart.split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}`;
    
    if (dates[formattedDate]) {
      dates[formattedDate] += 1;
    } else {
      dates[formattedDate] = 1;
    }
  });

  const labels = Object.keys(dates);
  const values = Object.values(dates);

  return {
    labels,
    datasets: [
      {
        label: 'Stats by Date',
        data: values,
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(153, 102, 255, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

// Analytics component
const Analytics = ({data, error}: {data: GuestUserData[] | undefined, error: boolean}) => {

  const barChartData = processDataForChart(data);
  const donutChartData = processDataForDonutChart(data);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <CardTitle className="mb-2">Error loading data</CardTitle>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data && data.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground text-6xl mb-4">📊</div>
            <CardTitle className="mb-2">No data available</CardTitle>
            <p className="text-muted-foreground">There's no data to display in the charts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visual insights from user data</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Bar Chart */}
          {barChartData && (
            <Card>
              <CardHeader>
                <CardTitle>Usage by Image Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                      plugins: {
                        legend: {
                          labels: {
                            font: {
                              size: 12,
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Donut Chart */}
          {donutChartData && (
            <Card>
              <CardHeader>
                <CardTitle>Activity by Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-80 h-80">
                    <Doughnut
                      data={donutChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: {
                                size: 12,
                              },
                              padding: 20,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;