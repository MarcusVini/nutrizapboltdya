import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeightLossDataPoint {
  week: string;
  weight: number;
}

interface WeightLossChartProps {
  data: WeightLossDataPoint[];
}

const WeightLossChart: React.FC<WeightLossChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey="week"
          tick={{ fill: '#666' }}
          tickLine={{ stroke: '#666' }}
          axisLine={{ stroke: '#666' }}
        />
        <YAxis
          tick={{ fill: '#666' }}
          tickLine={{ stroke: '#666' }}
          axisLine={{ stroke: '#666' }}
          label={{
            value: 'Peso (kg)',
            angle: -90,
            position: 'insideLeft',
            fill: '#666',
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ fill: '#8884d8', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default WeightLossChart; 