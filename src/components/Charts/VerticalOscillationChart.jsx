import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VerticalOscillationChart = ({ data, timeRange }) => {
  const formatData = (data) => {
    return data.map((point, index) => ({
      index,
      timestamp: point.timestamp,
      verticalOscillation: point.vertical_oscillation,
      distance: point.distance,
      lap: point.lap_number
    }));
  };

  const chartData = formatData(data || []);

  return (
    <div className="chart">
      <h3>Vertical oscillation (mm)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="index"
            tickFormatter={(value) => {
              const point = chartData[value];
              return point ? new Date(point.timestamp).toLocaleTimeString() : '';
            }}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip
            formatter={(value) => [`${value} mm`, 'Vertical oscillation']}
            labelFormatter={(index) => {
              const point = chartData[index];
              return point ? `Distance: ${point.distance.toFixed(2)}m - ${new Date(point.timestamp).toLocaleTimeString()}` : '';
            }}
          />
          <Area 
            type="monotone" 
            dataKey="verticalOscillation" 
            stroke="#9467bd"
            fill="#9467bd" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VerticalOscillationChart;