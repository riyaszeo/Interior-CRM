import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';

interface ConsumptionChartProps {
  data: Array<{ month: string; amount: number }>;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ data }) => {
  const theme = useTheme();

  const months = data.map((d) => d.month);
  const amounts = data.map((d) => d.amount);

  return (
    <BarChart
      xAxis={[{ 
        data: months, 
        scaleType: 'band',
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
          label: 'Material Dispatched ($)',
          color: theme.palette.secondary.main,
          valueFormatter: (value) => value !== null ? `$${value.toLocaleString()}` : '',
        },
      ]}
      height={300}
      margin={{ left: 60, right: 20, top: 40, bottom: 30 }}
    />
  );
};

export default ConsumptionChart;
