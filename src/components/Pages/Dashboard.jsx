import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivityData } from '../../hooks/useActivityData';
import SpeedChart from '../Charts/SpeedChart';
import HeartRateChart from '../Charts/HeartRateChart';
import CadenceChart from '../Charts/CadenceChart';
import VerticalOscillationChart from '../Charts/VerticalOscillationChart';
import StepLengthChart from '../Charts/StepLengthChart';
import AltitudeChart from '../Charts/AltitudeChart';
import TemperatureChart from '../Charts/TemperatureChart';
import StanceTimeChart from '../Charts/StanceTimeChart';
import MultiMetricChart from '../Charts/MultiMetricChart';
import SummaryStats from '../Stats/SummaryStats';
import MetricToggles from '../Controls/MetricToggles';

const Dashboard = ({ csvText }) => {
  
  const navigate = useNavigate();

  const handleViewPlan = () => {
    navigate('/analysis');
  };
  const {
    activityData,
    filteredData,
    stats,
    timeRange,
    setTimeRange
  } = useActivityData(csvText);

  const [visibleCharts, setVisibleCharts] = useState({
    speed: true,
    heartRate: true,
    cadence: true,
    verticalOscillation: true,
    stanceTime: true,
    stepLength: true,
    altitude: true,
    temperature: true
  });

  if (!activityData) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Your session data</h1>
        <h3>Here are the statistics from your last session</h3>
        <div className="dashboard-controls">
          <MetricToggles
            visibleCharts={visibleCharts}
            onToggleChange={setVisibleCharts}
          />
        </div>
      </header>

      <div className="stats-section">
        <SummaryStats stats={stats} />
      </div>

      <div className="button-container">
        <button onClick={handleViewPlan} className="training-plan-button">
          See the data analysis for your session
        </button>
      </div>

      <div className="charts-grid">
        {visibleCharts.speed && (
          <div className="chart-container">
            <SpeedChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}
        
        {visibleCharts.heartRate && (
          <div className="chart-container">
            <HeartRateChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}
        
        {visibleCharts.cadence && (
          <div className="chart-container">
            <CadenceChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}

        {visibleCharts.verticalOscillation && (
          <div className="chart-container">
            <VerticalOscillationChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}

        {visibleCharts.stanceTime && (
          <div className="chart-container">
            <StanceTimeChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}

        {visibleCharts.stepLength && (
          <div className="chart-container">
            <StepLengthChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}

         {visibleCharts.altitude && (
          <div className="chart-container">
            <AltitudeChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}
        
        {visibleCharts.temperature && (
          <div className="chart-container">
            <TemperatureChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
          </div>
        )}
      </div>
      <div className="button-container">
        <button onClick={handleViewPlan} className="training-plan-button">
          See the data analysis for your session
        </button>
      </div>
    </div>
  );
};

export default Dashboard;