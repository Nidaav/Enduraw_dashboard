import React from 'react';
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

const StepLengthChart = ({ data, timeRange }) => {
  const formatData = (data) => {
    return data.map((point, index) => ({
      index,
      timestamp: point.timestamp,
      stepLength: point.step_length,
      distance: point.distance,
      lap: point.lap_number
    }));
  };

  const chartData = formatData(data || []);

  return (
    <div className="chart">
      <h3>Stride length (mm)</h3>
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
            formatter={(value) => [`${value} mm`, 'Stride length']}
            labelFormatter={(index) => {
              const point = chartData[index];
              return point ? `` : '';
            }}
          />
          <Area 
            type="monotone" 
            dataKey="stepLength" 
            stroke="#1f77b4" 
            fill="#1f77b4" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StepLengthChart;