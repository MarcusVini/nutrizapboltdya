import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface WeightChartProps {
  currentWeight: number;
  targetWeight: number;
  timeframeInDays: number;
}

const WeightChart: React.FC<WeightChartProps> = ({ currentWeight, targetWeight, timeframeInDays }) => {
  const generateChartData = () => {
    const weightDiff = currentWeight - targetWeight;
    const dailyLoss = weightDiff / timeframeInDays;
    const points = 5; // Número de pontos no gráfico
    const interval = timeframeInDays / (points - 1);

    return Array.from({ length: points }, (_, index) => {
      const days = Math.round(interval * index);
      const weight = currentWeight - (dailyLoss * days);
      
      return {
        days: days === 0 ? 'Hoje' : `Dia ${days}`,
        weight: Math.round(weight * 10) / 10,
      };
    });
  };

  const data = generateChartData();

  return (
    <div className="w-full h-[600px] bg-white rounded-xl shadow-sm p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 80, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="days"
            stroke="#666"
            tick={{ fill: '#666', fontSize: 16 }}
            dy={10}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: '#666', fontSize: 16 }}
            domain={['auto', 'auto']}
            label={{ 
              value: 'Peso (kg)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: '16px' }
            }}
            dx={-10}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '16px',
              padding: '10px'
            }}
            formatter={(value: number) => [`${value} kg`, 'Peso']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#2563eb"
            strokeWidth={4}
            dot={{
              stroke: '#2563eb',
              strokeWidth: 3,
              r: 8,
              fill: 'white'
            }}
            activeDot={{
              stroke: '#2563eb',
              strokeWidth: 3,
              r: 10,
              fill: '#2563eb'
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart; 