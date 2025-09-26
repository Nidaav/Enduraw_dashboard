import React from 'react';
import { useNavigate } from 'react-router-dom';

const TrainingTips = () => {
  const navigate = useNavigate();

  const handleViewPlan = () => {
    navigate('/planning');
  };

  const listGestion = {
    width:"40vw",
    marginLeft:"30vw",
    display:"flex",
    flexWrap:"wrap",
  }
  return (
    <div className="page-container">
      <h1>Session Summary</h1>
      <h2>Workout: 2 × [8 × (200 m at VO2 max pace – 100 m jog recovery)]</h2>
      
      <p><strong>Pace:</strong> Speed increased gradually throughout the reps. Early intervals were run in about 38 seconds, dropping to 36 seconds, with a final top speed of 23.1 km/h.</p>
      <p><strong>Heart Rate:</strong> Recovery between efforts remained effective but became more challenging as the session progressed, which is normal. A peak of 192 bpm shows an excellent ability to sustain high intensity.</p>
      <p><strong>Vertical Oscillation:</strong> Average oscillation decreased from 103 mm at the start to 89 mm at the end—around a 14 mm (≈14 %) drop—consistent with neuromuscular fatigue.</p>
      <p><strong>Cadence & Stride Length:</strong> Both remained stable throughout which is great.</p>
      <p><strong>Conditions:</strong>  Warm temperatures likely accelerated muscular and nervous fatigue.</p>
      <p><strong>Elevation Data:</strong>  Sadly it doesn't seem reliable (noticed a 6 meter difference on a flat track during series).</p>

      <h2>Analysis & Insights</h2>
      <p>The session was very well executed. You are clearly accustomed to short, high-intensity efforts that target VMA. This is valuable because research shows that, even in trail running, vVO₂max and VO₂max remain strong predictors of short-distance performance 
      <i> (Pastor et al., 2022; Waal et al., 2021)</i>.</p>
      <p>However, for trail-specific progress, a few key points stand out:</p>
      <p><strong>Energy Systems:</strong>  In a 20 km trail race with 1,000 m of elevation gain, the aerobic system dominates. It takes 1–3 minutes to become the primary energy source. Intervals longer than 200 m would better train this system.</p>
      <p><strong>Uphill Power:</strong> Essential for maintaining pace and efficiency on steep climbs, as it directly impacts your ability to generate force against gravity.</p>
      <p><strong>Threshold Work:</strong> Improves your lactate threshold, allowing you to sustain a faster pace for longer periods without fatigue setting in.</p>
      <p><strong>Running Economy:</strong> Enhances the efficiency of your running form, reducing the energy cost of running so you can cover more distance with less effort.</p>
      <p><strong>Eccentric Strength:</strong> Crucial for absorbing the downward forces during descents, protecting your muscles from damage and maintaining a high pace on downhill sections.</p>
      <p><strong>Proprioception:</strong> Your body's ability to sense its position, which is vital for navigating technical terrain and preventing ankle sprains and falls.</p>

      <h2>Recommendations </h2>
      <p><strong>Diversify Your Sessions:</strong>  Go beyond the track. Add longer intervals to build aerobic capacity, and integrate hill workouts to target specific demands of trail running. Uphill sessions build power, while downhill training enhances eccentric strength and resilience.</p>
      <p><strong>Strength Training:</strong> Incorporate dedicated lower-body and core work. This is crucial for:</p>
      <ul style={listGestion}>
      <li>
        <p><strong>Power & Resilience:</strong> To handle climbs and technical terrain efficiently.</p>
      </li>
      <li>
        <p><strong>Injury Prevention:</strong> Strengthening key muscles around the knees and ankles, which are heavily stressed on trails.</p>
      </li>
      <li>
        <p><strong>Running Economy:</strong> Improving your ability to maintain good form and use less energy.</p>
      </li>
      </ul>
      <p><strong>Cross-Training:</strong> Consider adding other activities like hiking or cycling. These can help build endurance without the high impact of running, promoting active recovery and reducing injury risk.</p>

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