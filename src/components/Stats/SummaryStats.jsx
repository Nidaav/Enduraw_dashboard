import React from 'react';

const SummaryStats = ({ stats }) => {
  if (!stats) return null;

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const statCards = [
    { label: 'Durée', value: formatDuration(stats.duration), unit: '' },
    { label: 'Distance', value: (stats.distance / 1000).toFixed(2), unit: 'km' },
    { label: 'Vitesse moy.', value: stats.avgSpeed.toFixed(1), unit: 'km/h' },
    { label: 'Vitesse max', value: stats.maxSpeed.toFixed(1), unit: 'km/h' },
    { label: 'FC moy.', value: stats.avgHeartRate.toFixed(0), unit: 'bpm' },
    { label: 'Dénivelé+', value: stats.elevationGain.toFixed(0), unit: 'm' }
  ];

  return (
    <div className="stats-section">
      {statCards.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label} {stat.unit}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;