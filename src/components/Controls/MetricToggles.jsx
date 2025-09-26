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
      <label>Metrics displayed</label>
      <div className="metric-toggles">
        {Object.entries(visibleCharts).map(([chart, isVisible]) => (
          <label key={chart} className="toggle-label">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={() => toggleChart(chart)}
            />
            {chart === 'speed' && 'Speed (km/h)'}
            {chart === 'heartRate' && 'Heart rate (bpm)'}
            {chart === 'cadence' && 'Cadence (rpm)'}
            {chart === 'verticalOscillation' && 'Vertical oscillation (mm)'}
            {chart === 'stepLength' && 'Stride length (mm)'}
            {chart === 'altitude' && 'Altitude (m)'}
            {chart === 'temperature' && 'Temperature (°C)'}
          </label>
        ))}
      </div>
    </div>
  );
};

export default MetricToggles;