import React from 'react';

const SummaryStats = ({ stats }) => {
  if (!stats) return null;

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const statCards = [
    { label: 'Time in motion ', value: stats.duration, unit: '(min)' },
    { label: 'Distance ', value: (stats.distance / 1000).toFixed(2), unit: '(km)' },
    { label: 'Average speed ', value: stats.avgSpeed.toFixed(1), unit: '(km/h)' },
    { label: 'Max speed ', value: stats.maxSpeed.toFixed(1), unit: '(km/h)' },
    { label: 'Average HR ', value: stats.avgHeartRate.toFixed(0), unit: '(bpm)' },
    { label: 'Max HR ', value: stats.maxHeartRate.toFixed(0), unit: '(bpm)' },
    { label: 'Elevation gain ', value: stats.elevationGain.toFixed(0), unit: '(m+)' }
  ];

  const statsContainerStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '20px',
  };

  return (
    <div style={statsContainerStyle} className="stats-section">
      {statCards.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-label">{stat.label} {stat.unit}</div>
          <div className="stat-value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;