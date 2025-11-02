import React from 'react';
import { useActivityData } from '../../hooks/useActivityData';
import { useNavigate } from 'react-router-dom';
import MultiMetricChart from '../Charts/MultiMetricChart';


const TrainingTips = ({ csvText }) => {
  const navigate = useNavigate();

  const handleViewPlan = () => {
    navigate('/planning');
  };

  const {
    activityData,
    filteredData,
    timeRange,
    setTimeRange
  } = useActivityData(csvText);

  const listGestion = {
    width:"40vw",
    marginLeft:"30vw",
    display:"flex",
    flexWrap:"wrap",
  }

  if (!activityData) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="page-container">
      <h1>Data Analysis</h1>
      <h2>The session studied is as follows: 2 × [8 × (200m around the VO2 max pace – 100m jog recovery)]</h2>
      

      <div className="chart-container">
        <MultiMetricChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
      </div>

      <h2>Analysis & Insights</h2>
      
      <h2>Recommendations </h2>
      <p>To summarize and answer your main question, track work is an excellent progression tool for precision training, but your progress will benefit from more trail-specific sessions to fully meet your performance goals. By diversifying your routine, you’ll build a more complete profile as a runner, ready for any challenge the trails throw at you.</p> 
      <div className="button-container">
        <button onClick={handleViewPlan} className="training-plan-button">
          See Proposed Training Plan
        </button>
      </div>
      </div>
    
  );
};

export default TrainingTips;