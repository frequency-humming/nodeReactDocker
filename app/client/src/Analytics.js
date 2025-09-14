import useFetch from './useFetch';
import {processDataForChart, processDataForDonutChart} from './ProcessDataForChart';
import { Bar, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

const Analytics = () => {
  const { data,error } = useFetch();

  const barChartData = processDataForChart(data);
  const donutChartData = processDataForDonutChart(data);

  return (
    <div className="analytics">
      {error && <h2>{error}</h2>}
      {barChartData && (
        <Bar
          data={barChartData}
          options={{
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: 'rgba(255, 255, 255, 255)',
                  font: {
                    size: 15,
                  },
                },
              },
            },
          }}
        />
      )}
      {donutChartData && (
        <Doughnut
          data={donutChartData}
          options={{
            plugins: {
              legend: {
                labels: {
                  color: 'rgba(255, 255, 255, 255)',
                  font: {
                    size: 15,
                  },
                },
              },
            },
          }}
        />
      )}
    </div>
  );
};

export default Analytics;
