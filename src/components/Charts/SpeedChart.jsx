import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

const SpeedChart = ({ data, timeRange }) => {
  const formatData = (data) => {
    return data.map((point, index) => ({
      index,
      timestamp: point.timestamp,
      speed: point.speed || point.enhanced_speed,
      distance: point.distance,
      lap: point.lap_number
    }));
  };

  const chartData = formatData(data || []);

  return (
    <div className="chart">
      <h3>Vitesse (km/h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value) => [`${value} km/h`, 'Vitesse']}
            labelFormatter={(index) => {
              const point = chartData[index];
              return point ? `Distance: ${point.distance.toFixed(2)}m - ${new Date(point.timestamp).toLocaleTimeString()}` : '';
            }}
          />
          <Line 
            type="monotone" 
            dataKey="speed" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Brush 
            dataKey="index"
            height={30}
            stroke="#8884d8"
            startIndex={Math.floor(timeRange.start * chartData.length)}
            endIndex={Math.floor(timeRange.end * chartData.length)}
            onChange={(brush) => {
              // Gérer le zoom via le parent
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpeedChart;