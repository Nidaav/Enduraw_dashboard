import React from 'react';

const MetricToggles = ({ visibleCharts, onToggleChange }) => {
  const toggleChart = (chartName) => {
    onToggleChange({
      ...visibleCharts,
      [chartName]: !visibleCharts[chartName]
    });
  };

  return (
    <div className="control-group">
      <label>Métriques affichées</label>
      <div className="metric-toggles">
        {Object.entries(visibleCharts).map(([chart, isVisible]) => (
          <label key={chart} className="toggle-label">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={() => toggleChart(chart)}
            />
            {chart === 'speed' && 'Vitesse'}
            {chart === 'heartRate' && 'FC'}
            {chart === 'altitude' && 'Altitude'}
            {chart === 'cadence' && 'Cadence'}
            {chart === 'temperature' && 'Température'}
          </label>
        ))}
      </div>
    </div>
  );
};

export default MetricToggles;