import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '@mui/material/styles';

interface RevenueChartProps {
  data: Array<{ month: string; amount: number }>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const theme = useTheme();
  
  const months = data.map((d) => d.month);
  const amounts = data.map((d) => d.amount);

  return (
    <LineChart
      xAxis={[{ 
        data: months, 
        scaleType: 'point',
        tickLabelStyle: {
          fill: theme.palette.text.secondary,
          fontSize: 11,
          fontWeight: 600,
        }
      }]}
      yAxis={[{
        tickLabelStyle: {
          fill: theme.palette.text.secondary,
          fontSize: 11,
        }
      }]}
      series={[
        {
          data: amounts,
          label: 'Revenue ($)',
          color: theme.palette.primary.main,
          showMark: true,
          valueFormatter: (value) => value !== null ? `$${value.toLocaleString()}` : '',
        },
      ]}
      height={300}
      margin={{ left: 60, right: 20, top: 40, bottom: 30 }}
    />
  );
};

export default RevenueChart;
