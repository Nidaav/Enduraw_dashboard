import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

const HeartRateChart = ({ data, timeRange }) => {
  const formatData = (data) => {
    return data.map((point, index) => ({
      index,
      elapsed_time: point.elapsed_time_min_sec,
      heartRate: point.heart_rate,
      distance: (point.distance)/1000,
      lap: point.lap_number
    }));
  };

  const chartData = formatData(data || []);

  return (
    <div className="chart">
      <h3>Heart Rate (bpm)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="index"
            interval={75}
            tickFormatter={(value) => {
              const point = chartData[value];
              return point ? point.elapsed_time : '';
            }}
            label={{ 
              value: 'min:sec', 
              position: 'right', 
              offset: 15, 
              dy: 14,
              style: { textAnchor: 'end' }
            }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            label={{ 
                value: 'bpm', 
                position: 'top', 
                offset: 5, 
                angle: -90,
                dy: 22,
                dx: -20,
             }}
          />
          <Tooltip
            formatter={(value) => [`${value} bpm`, 'Heart Rate']}
            labelFormatter={(index) => {
              const point = chartData[index];
              return point ? `${point.distance.toFixed(2)} kms - ${point.elapsed_time} min` : '';
            }}
          />
          <Area 
            type="monotone" 
            dataKey="heartRate" 
            stroke="#ff7300"
            fill="#ff7300" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeartRateChart;