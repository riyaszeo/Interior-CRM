import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { useTheme } from '@mui/material/styles';

interface ProjectStatusChartProps {
  data: Array<{ id: number; value: number; label: string }>;
}

export const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ data }) => {
  const theme = useTheme();

  // Custom colors matching status indicators
  const statusColors = [
    theme.palette.info.main,    // Active
    theme.palette.primary.main, // In Progress
    theme.palette.success.main, // Completed
    theme.palette.warning.main, // Pending
  ];

  return (
    <PieChart
      series={[
        {
          data: data.map((item, index) => ({
            ...item,
            color: statusColors[index % statusColors.length],
          })),
          innerRadius: 50,
          outerRadius: 90,
          paddingAngle: 4,
          cornerRadius: 6,
          cx: 120, // push left to make space for legend
        },
      ]}
      height={300}
      slotProps={{
        legend: {
          direction: 'vertical',
          position: { vertical: 'middle', horizontal: 'end' },
        },
      }}
    />
  );
};

export default ProjectStatusChart;
