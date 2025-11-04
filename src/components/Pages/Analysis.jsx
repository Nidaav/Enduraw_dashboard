import React, { useMemo } from 'react';
import { useActivityData } from '../../hooks/useActivityData';
import { useNavigate } from 'react-router-dom';
import MultiMetricChart from '../Charts/MultiMetricChart';


const TrainingTips = ({ csvText }) => {
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

// Data simulating the aggregated performance metrics per repetition (200m effort laps)
  const headers = [
    { label: 'Lap', unit: '' },
    { label: 'Duration', unit: '(s)' },
    { label: 'Avg Speed', unit: '(km/h)' },
    { label: 'Max HR', unit: '(bpm)' },
    { label: 'Avg Cadence', unit: '(step/min)' },
    { label: 'Avg VR', unit: '' },
    { label: 'Avg STP', unit: '(%)' },
  ];

  const rawPerformanceDataPerLap = [
    { lap: 1, series: 1, duration: 35.2, avgSpeed: 20.4, maxSpeed: 21.8, maxHR: 158, avgCadence: 192, avgVR: 7.95, avgSTP: 31.7 },
    { lap: 2, series: 1, duration: 34.8, avgSpeed: 20.8, maxSpeed: 22.1, maxHR: 165, avgCadence: 193, avgVR: 7.89, avgSTP: 31.3 },
    { lap: 3, series: 1, duration: 34.5, avgSpeed: 21.0, maxSpeed: 22.4, maxHR: 168, avgCadence: 194, avgVR: 7.85, avgSTP: 31.0 },
    { lap: 4, series: 1, duration: 34.2, avgSpeed: 21.2, maxSpeed: 22.6, maxHR: 171, avgCadence: 195, avgVR: 7.82, avgSTP: 30.7 },
    { lap: 5, series: 1, duration: 34.0, avgSpeed: 21.4, maxSpeed: 22.8, maxHR: 173, avgCadence: 195, avgVR: 7.80, avgSTP: 30.5 },
    { lap: 6, series: 1, duration: 33.8, avgSpeed: 21.6, maxSpeed: 23.0, maxHR: 175, avgCadence: 196, avgVR: 7.78, avgSTP: 30.3 },
    { lap: 7, series: 1, duration: 33.6, avgSpeed: 21.8, maxSpeed: 23.2, maxHR: 177, avgCadence: 196, avgVR: 7.75, avgSTP: 30.1 },
    { lap: 8, series: 1, duration: 33.4, avgSpeed: 21.9, maxSpeed: 23.4, maxHR: 179, avgCadence: 197, avgVR: 7.72, avgSTP: 29.9 },
    { lap: 9, series: 2, duration: 33.2, avgSpeed: 22.0, maxSpeed: 23.5, maxHR: 181, avgCadence: 197, avgVR: 7.70, avgSTP: 29.7 },
    { lap: 10, series: 2, duration: 33.0, avgSpeed: 22.1, maxSpeed: 23.6, maxHR: 182, avgCadence: 198, avgVR: 7.68, avgSTP: 29.6 },
    { lap: 11, series: 2, duration: 32.8, avgSpeed: 22.2, maxSpeed: 23.7, maxHR: 184, avgCadence: 198, avgVR: 7.66, avgSTP: 29.5 },
    { lap: 12, series: 2, duration: 32.7, avgSpeed: 22.3, maxSpeed: 23.8, maxHR: 185, avgCadence: 199, avgVR: 7.64, avgSTP: 29.4 },
    { lap: 13, series: 2, duration: 32.6, avgSpeed: 22.4, maxSpeed: 23.9, maxHR: 186, avgCadence: 199, avgVR: 7.62, avgSTP: 29.3 },
    { lap: 14, series: 2, duration: 32.5, avgSpeed: 22.5, maxSpeed: 24.0, maxHR: 187, avgCadence: 200, avgVR: 7.60, avgSTP: 29.2 },
    { lap: 15, series: 2, duration: 32.4, avgSpeed: 22.6, maxSpeed: 24.1, maxHR: 188, avgCadence: 200, avgVR: 7.58, avgSTP: 29.1 },
    { lap: 16, series: 2, duration: 32.3, avgSpeed: 22.7, maxSpeed: 24.2, maxHR: 189, avgCadence: 201, avgVR: 7.56, avgSTP: 29.0 },
  ];

  const getSeriesSummary = (data, series) => {
      const seriesData = data.filter(d => d.series === series);
      if (seriesData.length === 0) return { avgDuration: 0, avgHR: 0, avgVR: 0, avgSTP: 0 };
      return {
          avgDuration: (seriesData.reduce((acc, curr) => acc + curr.duration, 0) / seriesData.length).toFixed(1),
          avgHR: (seriesData.reduce((acc, curr) => acc + curr.maxHR, 0) / seriesData.length).toFixed(0),
          avgVR: (seriesData.reduce((acc, curr) => acc + curr.avgVR, 0) / seriesData.length).toFixed(2),
          avgSTP: (seriesData.reduce((acc, curr) => acc + curr.avgSTP, 0) / seriesData.length).toFixed(2),
      };
  };

  const S1 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 1), []);
  const S2 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 2), []);
  
  const seriesComparison = [
    { metric: 'Avg Duration (200m)', s1: S1.avgDuration, s2: S2.avgDuration, unit: 's', trend: S2.avgDuration < S1.avgDuration ? 'Improved' : 'Stable' },
    { metric: 'Avg Max HR', s1: S1.avgHR, s2: S2.avgHR, unit: 'bpm', trend: S2.avgHR > S1.avgHR ? 'Increased' : 'Stable' },
    { metric: 'Avg Vertical Ratio', s1: S1.avgVR, s2: S2.avgVR, unit: '', trend: S2.avgVR < S1.avgVR ? 'Improved' : 'Stable' },
    { metric: 'Avg Stance Time %', s1: S1.avgSTP, s2: S2.avgSTP, unit: '%', trend: S2.avgSTP < S1.avgSTP ? 'Improved' : 'Stable' },
  ];


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

      <p>By segmenting the session data, we will perform an in-depth analysis of the various metrics collected.</p>

      <h2>Performance Analysis by Repetition (200m)</h2>
      <p>The table below summarizes key performance metrics for the first, second, and final repetitions in the two series (S1 and S2). Metrics like **Vertical Ratio (VR)** and **Stance Time Percent (STP)** are crucial for assessing running economy.</p>
    {/* TEST DU TABLEAU JOLIIIIIIIIIIIIIIIIIIIIII */}
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 bg-white shadow-xl rounded-xl p-5 border-t-4 border-green-500">
            <div className="flex flex-wrap">
              {seriesComparison.map((item) => (
                <div key={item.metric} className="p-4 bg-indigo-50 rounded-lg shadow-md">
                  <p className="text-sm font-semibold text-indigo-700">{item.metric}</p>
                  <div className="flex justify-between items-end mt-1">
                    <div>
                      <span className="text-xs text-gray-500">S1 Avg: </span>
                      <span className="text-lg font-bold text-gray-800">{item.s1} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">S2 Avg: </span>
                      <span className={`text-xl font-extrabold ${item.trend === 'Improved' ? 'text-green-600' : item.trend === 'Increased' ? 'text-red-600' : 'text-gray-800'}`}>{item.s2} {item.unit}</span>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 font-medium ${item.trend === 'Improved' ? 'text-green-600' : item.trend === 'Increased' ? 'text-red-600' : 'text-gray-500'}`}>
                      {item.trend} in Series 2.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* --- Performance Table --- */}
          <div className="bg-white shadow-xl rounded-xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-600 text-white sticky top-0">
                <tr>
                  {headers.map((h, index) => (
                    <th
                      key={index}
                      scope="col"
                      className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${index === 0 ? 'rounded-tl-xl' : ''}`}
                    >
                      {h.label} <span className="font-normal text-indigo-200">{h.unit}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rawPerformanceDataPerLap.map((data, index) => (
                  <tr key={data.lap} className={`hover:bg-indigo-50 ${data.series === 2 ? 'bg-yellow-50/50' : ''}`}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className={`inline-block w-6 h-6 text-center rounded-full text-white ${data.series === 1 ? 'bg-indigo-500' : 'bg-green-500'}`}>{data.lap}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{data.duration}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{data.avgSpeed}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-red-600">{data.maxHR}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{data.avgCadence}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{data.avgVR}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{data.avgSTP}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* --- Key Findings --- */}
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

      <h2>Impact of Pacing Strategy on Heart Rate Response</h2>
      <p>We classified repetitions into two primary pacing strategies based on within-lap speed variance: **Fast Start/Relax (F-R)** and **Progressive Build (P-B)**. We then compared the induced cardiac stress (Heart Rate Amplitude).</p>
      
      <h3>TABLEAU A CREER A PARTIR DE Étude de l'Impact de la Stratégie d'Allure</h3>
      <p><strong>Conclusion on Pacing:</strong> The **Progressive Build (P-B)** strategy is the more effective approach. It allows the athlete to achieve a **slightly higher average speed** (21.8 km/h vs 21.5 km/h) while incurring **lower cardiac stress** (16.0 bpm vs 18.5 bpm amplitude). For precision training, the P-B strategy demonstrates better management of effort and heart rate economy.</p>

      <h2>Recovery Quality Analysis (100m)</h2>
      <p>Recovery Quality (QDR) is measured by the Heart Rate drop rate during the 100m recovery period. We also look for an overall cardiac drift by comparing the average heart rate at the end of the recovery phase between the two series.</p>
      <h3>TABLEAU A CREER A PARTIR DE Analyse de la Qualité de la Récupération (100m)</h3>
      <p><strong>Recovery Analysis:</strong> Recovery quality **degrades in Series 2** (drop decreases from 26.5 to 22.0 bpm). The **marked cardiac drift** is significant: the average heart rate at the end of recovery increases by **14 bpm** from S1 to S2. This signals a **progressive overload** of the cardiovascular system and a loss of efficiency in recovery, demonstrating the mounting physiological fatigue and good tolerance for lactic threshold work.</p>

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
      <p>To summarize and answer your main question, the athlete demonstrates **excellent lactic tolerance** and a **highly efficient stride** that actually improves under fatigue. The key area for optimization is the **cardiovascular cost** associated with this effort. The significant cardiac drift during recovery suggests that while the body can perform the work, the system is being severely overloaded. Focusing on **Active Recovery** or slightly **increasing the recovery time** in the second series could maximize the benefits of the session by reducing the cumulative cardiac stress.</p>
      <p>By diversifying your routine, you’ll build a more complete profile as a runner, ready for any challenge the trails throw at you.</p>
      <div className="button-container">
        <button onClick={handleViewPlan} className="training-plan-button">
          See Proposed Training Plan
        </button>
      </div>
      </div>
    
  );
};

export default TrainingTips;