import React, { useState } from 'react';
import { useActivityData } from '../hooks/useActivityData';
import SpeedChart from './Charts/SpeedChart';
import HeartRateChart from './Charts/HeartRateChart';
import AltitudeChart from './Charts/AltitudeChart';
import CadenceChart from './Charts/CadenceChart';
import TemperatureChart from './Charts/TemperatureChart';
import SummaryStats from './Stats/SummaryStats';
import LapSelector from './Controls/LapSelector';
import TimeRangeSelector from './Controls/TimeRangeSelector';
import MetricToggles from './Controls/MetricToggles';
// import './Dashboard.css';

const Dashboard = ({ csvData }) => {
  const {
    activityData,
    filteredData,
    stats,
    selectedLap,
    setSelectedLap,
    timeRange,
    setTimeRange
  } = useActivityData(csvData);

  const [visibleCharts, setVisibleCharts] = useState({
    speed: true,
    heartRate: true,
    altitude: true,
    cadence: true,
    temperature: false
  });

  if (!activityData) {
    return <div className="loading">Chargement des données...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Analyse d'Entraînement</h1>
        <div className="dashboard-controls">
          <LapSelector 
            laps={activityData.laps}
            selectedLap={selectedLap}
            onLapChange={setSelectedLap}
          />
          <TimeRangeSelector
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
          <MetricToggles
            visibleCharts={visibleCharts}
            onToggleChange={setVisibleCharts}
          />
        </div>
      </header>

      <div className="stats-section">
        <SummaryStats stats={stats} />
      </div>

      <div className="charts-grid">
        {visibleCharts.speed && (
          <div className="chart-container">
            <SpeedChart data={filteredData} timeRange={timeRange} />
          </div>
        )}
        
        {visibleCharts.heartRate && (
          <div className="chart-container">
            <HeartRateChart data={filteredData} timeRange={timeRange} />
          </div>
        )}
        
        {visibleCharts.altitude && (
          <div className="chart-container">
            <AltitudeChart data={filteredData} timeRange={timeRange} />
          </div>
        )}
        
        {visibleCharts.cadence && (
          <div className="chart-container">
            <CadenceChart data={filteredData} timeRange={timeRange} />
          </div>
        )}
        
        {visibleCharts.temperature && (
          <div className="chart-container">
            <TemperatureChart data={filteredData} timeRange={timeRange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;