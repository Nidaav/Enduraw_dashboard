import React, { useMemo } from 'react';
import { useActivityData } from '../../hooks/useActivityData';
import { useNavigate } from 'react-router-dom';
import MultiMetricChart from '../Charts/MultiMetricChart';
import RecoveryQuality from '../Stats/RecoveryQuality';
import PacingStrategy from '../Stats/PacingStrategy';
import MultiMetricChartByLap from '../Charts/MultiMetricChartByLap';
import StatsTableByRep from '../Stats/StatsTableByRep';


const Analysis = ({ csvText, csvByLapText }) => {
  const navigate = useNavigate();
  
  const handleViewPlan = () => {
    navigate('/tips');
  };

  const {
    activityData,
    filteredData,
    timeRange,
    setTimeRange
  } = useActivityData(csvText);


  if (!activityData) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="page-container">
      <h1>Data Analysis</h1>
      <h2>The session studied is as follows: 2 × [8 × (200m at high intensity pace – 100m jog recovery)]</h2>

      <div className="chart-container">
        <MultiMetricChart data={filteredData} timeRange={timeRange} onBrushChange={setTimeRange} />
      </div>

      <p>By segmenting the data from this session by lap, we will conduct an in-depth analysis of the various metrics collected.</p>

      <h2>Performance analysis by laps</h2>

      <div className="chart-container">
        <MultiMetricChartByLap csvByLapText={csvByLapText} timeRange={timeRange} onBrushChange={setTimeRange} />
      </div>
      <p>The table below summarizes the key performance indicators for the intensity laps performed during the session and are classified into series (Serie 1 and Serie 2).</p>

      <StatsTableByRep csvByLapText={csvByLapText}/>

      <div>
        <div>
          {/* --- Performance Table --- */}

          {/* --- Key Findings  --- */}
          {/* TODO */}
          <div className="mt-10 bg-white shadow-xl rounded-xl p-6 border-t-4 border-blue-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Findings Summary</h2>
              <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                      <span className="text-blue-500 text-xl mr-2">🏃</span>
                      <div>
                          <strong className="font-semibold">Performance Improvement Under Fatigue:</strong> The athlete significantly <span className="font-bold text-green-600">improved 200m time (-0.5 s drift)</span> and **Running Economy** (VR and STP decreased) in Series 2, indicating high neuromuscular fatigue resistance.
                      </div>
                  </li>
                  <li className="flex items-start">
                      <span className="text-blue-500 text-xl mr-2">❤️</span>
                      <div>
                          <strong className="font-semibold">Cardiovascular Cost & Drift:</strong> This speed improvement came at the cost of a marked HR drift, with Max HR increasing by **+11 bpm** and recovery HR rising from **140 bpm** to **154 bpm**. This highlights the **cardiac limitation** under high repetition density.
                      </div>
                  </li>
                  <li className="flex items-start">
                      <span className="text-blue-500 text-xl mr-2">🚀</span>
                      <div>
                          <strong className="font-semibold">Optimal Pacing Strategy:</strong> The **Progressive Start** strategy (M-P) was found to be more efficient, achieving slightly higher final speeds with a **lower cardiac stress** (smaller FC amplitude) compared to the Rapid Start/Deceleration approach.
                      </div>
                  </li>
              </ul>
          </div>
        </div>
      </div>
      <p><strong>Initial Observations:</strong> Average speed improves from 20.57 to 22.15 km/h. Crucially, as intensity increases (evidenced by the rise in Max HR), the cadence increases (192 to 198 steps/min) and the Vertical Ratio (VR) decreases (7.95 to 7.60). This suggests an improvement in running efficiency and economy as the athlete finds their high-intensity stride.</p>
      
      {/* PACING STRATEGY */}
      {/* TODO */}
      <h2>Impact of Pacing Strategy on Heart Rate Response</h2>
      <p>We classified repetitions into two primary pacing strategies based on within-lap speed variance:</p>
      <p>Fast Start/Relax (F-R) and Progressive Build (P-B). We then compared the induced cardiac stress (Heart Rate Amplitude).</p>
      <PacingStrategy activityDataRaw={filteredData} activityDataByLap={csvByLapText} />
      <p><strong>Conclusion on Pacing:</strong> The **Progressive Build (P-B)** strategy is the more effective approach. It allows the athlete to achieve a **slightly higher average speed** (21.8 km/h vs 21.5 km/h) while incurring **lower cardiac stress** (16.0 bpm vs 18.5 bpm amplitude). For precision training, the P-B strategy demonstrates better management of effort and heart rate economy.</p>
      
      {/* RECOVERY QUALITY */}
      <h2>Recovery Quality Analysis (100m)</h2>
      <p>Recovery Quality is measured by the Heart Rate drop rate during the 100m recovery period. We also look for an overall cardiac drift by comparing the average heart rate at the end of the recovery phase between the two series.</p>
      <div className="chart-container">
        <RecoveryQuality activityDataRaw={filteredData} activityDataByLap={csvByLapText} />
      </div>
      <p><strong>Recovery Analysis:</strong> Recovery quality degrades in Series 2 (drop decreases from 40 to 25 bpm). The marked cardiac drift is significant: the average heart rate at the end of recovery increases by 20 bpm from S1 to S2. This signals a progressive overload of the cardiovascular system and a loss of efficiency in recovery, demonstrating the mounting physiological fatigue and good tolerance for lactic threshold work.</p>
      
      {/* GLOBAL DRIFTS */}
      {/* TODO */}
      <h2>Global Drifts Analysis (Series 1 vs. Series 2 Comparison)</h2>
      <p>Analyzing correlations across all 16 repetitions helps establish fundamental relationships between physiological stress and biomechanical efficiency.</p>
      <p>This comparison reveals the athlete's ability to repeat high-intensity efforts under fatigue (lactic tolerance).</p>
      <h3>TABLEAU A CREER A PARTIR DE Analyse des Drifts Globaux (Comparaison S1 vs S2)</h3>
      
      <h3>Correlation between Running Economy vs. Intensity: Avg Speed vs. Vertical Ratio (VR)</h3>
      <p><strong>Interpretation:</strong> This is an **excellent result** for a high-level athlete. As speed increases, the **Vertical Ratio (VR) decreases**, meaning the stride becomes **flatter, more efficient, and less wasteful** (less vertical movement). The athlete maintains or improves running economy when pushing intensity.</p>

      <h3>Correlation betweenStride Efficiency vs. Fatigue: Cadence vs. Stance Time Percent (STP)</h3>
      <p><strong>Interpretation:</strong> A higher cadence is strongly associated with a shorter time spent on the ground. This confirms a **dynamic stride and good muscular stiffness**, which is maintained remarkably well even into the second series, indicating strong **neuromuscular fatigue resistance**.</p>

      <h3>Correlation between Impact of Fatigue on Heart: Recovery HR Drift vs. Next Rep</h3>
      <p><strong>Correlation:</strong> +0.65 (Moderate to strong positive correlation)</p>
      <p><strong>Interpretation:</strong> The less the heart recovers (the higher the HR_END_OF_RECOVERY), the higher the HR_MAX reached in the subsequent repetition. **Recovery quality is the limiting factor** for effort repeatability. The coach should consider slightly longer recovery times if the goal is to keep the heart rate below a certain threshold (e.g., 140 bpm) before starting the next rep.</p>

      <h2>Recommendations </h2>
      {/* TODO */}
      <p>To summarize and answer your main question, the athlete demonstrates **excellent lactic tolerance** and a **highly efficient stride** that actually improves under fatigue. The key area for optimization is the **cardiovascular cost** associated with this effort. The significant cardiac drift during recovery suggests that while the body can perform the work, the system is being severely overloaded. Focusing on **Active Recovery** or slightly **increasing the recovery time** in the second series could maximize the benefits of the session by reducing the cumulative cardiac stress.</p>
      <p>By diversifying your routine, you’ll build a more complete profile as a runner, ready for any challenge the trails throw at you.</p>
      <div className="button-container">
        <button onClick={handleViewPlan} className="training-plan-button">
          Check out the tips from Enduraw coach
        </button>
      </div>
      </div>
    
  );
};

export default Analysis;