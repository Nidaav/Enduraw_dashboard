import React, { useMemo } from 'react';
import Papa from 'papaparse';

/**
 * Props:
 *  - activityDataRaw: Array d'objets (filteredData). Chaque point attendu : { lap_number, speed_kmh, heart_rate, timestamp?, lap_nature? }
 *  - activityDataByLap: optional - CSV string (raw) or Array parsed providing per-lap rows with lap_number and lap_nature.
 *  - thresholdPercent: optional - seuil (%) pour classer Steady vs Unsteady (DEFAULT 9.15)
 */

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Fonction pour extraire l'Amplitude HR (inchangée)
const computeHrAmplitude = (points) => {
    const hrs = points.map(p => safeNum(p.heart_rate)).filter(v => v > 0);

    if (!hrs.length) return { maxHr: 0, minHr: 0, hrAmplitude: 0 };

    const maxHr = Math.max(...hrs);
    const minHr = Math.min(...hrs);
    const hrAmplitude = maxHr - minHr;
    
    return { maxHr, minHr, hrAmplitude };
};

const parseByLap = (activityDataByLap) => {
  if (!activityDataByLap) return [];
  if (Array.isArray(activityDataByLap)) return activityDataByLap;
  // assume string CSV
  const parsed = Papa.parse(activityDataByLap, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });
  return parsed.data;
};

// ⭐ Mise à jour de la valeur par défaut pour le seuil (median 9.15)
const DEFAULT_THRESHOLD = 9.15;

const PacingStrategyTable = ({ activityDataRaw = [], activityDataByLap = null, thresholdPercent = DEFAULT_THRESHOLD }) => {

  // 1) parse by-lap CSV pour les métriques et lap_nature
  const normalizedByLap = useMemo(() => {
    if (!activityDataByLap) return [];
    const parsed = parseByLap(activityDataByLap);
    
    return parsed.map(r => ({
      lap_number: safeNum(r.lap_number ?? r.lap ?? r.lapNumber),
      lap_nature: r.lap_nature ?? r.lapNature ?? r.lap_type ?? r.type ?? '',
      // Récupération des vitesses depuis activityDataByLap (le CSV)
      avg_speed_kmh: safeNum(r.avg_speed_kmh),
      max_speed_kmh: safeNum(r.max_speed_kmh),
    }));
  }, [activityDataByLap]);

  // 2) déterminer la liste des laps 'Intensity' et les données de vitesse associées
  const intensityLapsData = useMemo(() => {
    return normalizedByLap
      .filter(r => {
        const n = (r.lap_nature ?? '').toString().toLowerCase();
        return n === 'intensity' || n === 'intensité' || n.includes('intens');
      })
      .filter(r => r.lap_number > 0) // Assure un lap_number valide
      .sort((a,b) => a.lap_number - b.lap_number);
  }, [normalizedByLap]);

  // 3) grouper points par lap_number pour les autres métriques (comme HR)
  const pointsByLap = useMemo(() => {
    const map = new Map();
    activityDataRaw.forEach(p => {
      const lap = safeNum(p.lap_number);
      if (!map.has(lap)) map.set(lap, []);
      map.get(lap).push(p);
    });
    return map;
  }, [activityDataRaw]);

  // 4) pour chaque lap d'intensity, calcul des stats et classification
  const perLapResults = useMemo(() => {
    if (!intensityLapsData || intensityLapsData.length === 0) return [];

    const res = intensityLapsData.map((lapData, index) => {
      const lapNum = lapData.lap_number;
      const pts = pointsByLap.get(lapNum) || [];
      
      // Vitesse: Vient du CSV d'analyse par tour (source de vérité)
      const avgSpeed = lapData.avg_speed_kmh;
      const maxSpeed = lapData.max_speed_kmh;

      // HR: Calculée à partir des points bruts (pour l'amplitude)
      const hrStats = computeHrAmplitude(pts);

      // Calcul du Pacing Delta (%) : (MaxSpeed - AvgSpeed) / AvgSpeed x 100
      const pacingDelta = avgSpeed > 0 ? ((maxSpeed - avgSpeed) / avgSpeed) * 100 : 0;
      const hrAmplitude = hrStats.hrAmplitude;
      
      // ⭐ Inversion de la logique de classification : 
      // Unsteady Pace (Vitesse irrégulière) si Pacing Delta >= Seuil
      // Steady Pace (Vitesse régulière) si Pacing Delta < Seuil
      const classification = (pacingDelta >= thresholdPercent) ? 'UnsteadyPace' : 'SteadyPace';
      
      return {
        lap: index + 1,
        originalLap: lapNum,
        avgSpeed,
        maxSpeed,
        pacingDelta,
        hrAmplitude,
        classification
      };
    });

    return res;
  }, [intensityLapsData, pointsByLap, thresholdPercent]);

  // 5) regrouper Steady vs Unsteady et calculer moyennes pour résumé
  const summary = useMemo(() => {
    const unsteady = perLapResults.filter(r => r.classification === 'UnsteadyPace');
    const steady = perLapResults.filter(r => r.classification === 'SteadyPace');

    const mean = (arr, key) => arr.length ? arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length : 0;

    return {
      Unsteady: {
        count: unsteady.length,
        avgSpeed: mean(unsteady, 'avgSpeed'),
        hrAmp: mean(unsteady, 'hrAmplitude')
      },
      Steady: {
        count: steady.length,
        avgSpeed: mean(steady, 'avgSpeed'),
        hrAmp: mean(steady, 'hrAmplitude')
      }
    };
  }, [perLapResults]);

  // 6) If no intensity laps found, affichage utile (inchangé)
  if (!perLapResults.length) {
    return (
      <div style={{
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 8,
        border: '1px solid #333',
        color: '#FAFAFA'
      }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Pacing Strategy — Analyse</h3>
        <div style={{ color: '#d0d0d0' }}>
          Aucun lap d'intensity détecté. Vérifie que :
          <ul style={{ marginTop: 8 }}>
            <li>Le CSV / filteredData contient des champs <code>lap_number</code> et/ou <code>lap_nature</code>.</li>
            <li>Si tu utilises <code>activityDataByLap</code>, que la colonne <code>lap_nature</code> contient "Intensity".</li>
          </ul>
          Tu peux aussi ajuster le <code>thresholdPercent</code>.
        </div>
      </div>
    );
  }

  // Table styles (conservés comme demandé)
  const cellStyle = { padding: '10px 8px', textAlign: 'center', border: '1px solid #333' };
  const headerStyle = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#2A2A2A' };
  const rowBg = i => ({ backgroundColor: i % 2 === 0 ? '#1E1E1E' : '#252525' });

  return (
    <div style={{ color: '#FAFAFA', fontSize: '0.95rem' }}>
      {/* Détail par lap intensity */}
      <div style={{
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 8,
        border: '1px solid #333',
        marginBottom: 16
      }}>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle  }}>Répétition</th>
                <th style={headerStyle}>Avg Speed (km/h)</th>
                <th style={headerStyle}>Max Speed (km/h)</th>
                <th style={headerStyle}>Pacing Δ (%)</th>
                <th style={headerStyle}>HR Amplitude (bpm)</th>
                <th style={headerStyle}>Classification</th>
              </tr>
            </thead>
            <tbody>
              {perLapResults.map((r, i) => (
                <tr key={r.lap} style={rowBg(i)}>
                  <td style={{ ...cellStyle, fontWeight: '600' }}>{r.lap}</td>
                  <td style={cellStyle}>{Number(r.avgSpeed).toFixed(2)}</td>
                  <td style={cellStyle}>{Number(r.maxSpeed).toFixed(2)}</td>
                  <td style={{ ...cellStyle, color: r.pacingDelta >= thresholdPercent ? '#ffc658' : '#82ca9d' }}>
                    {Number(r.pacingDelta).toFixed(2)}
                  </td>
                  <td style={cellStyle}>{Number(r.hrAmplitude).toFixed(1)}</td>
                  <td style={{ ...cellStyle, fontWeight: '700', color: r.classification === 'UnsteadyPace' ? '#ffc658' : '#82ca9d' }}>
                    {r.classification === 'UnsteadyPace' ? 'Unsteady' : 'Steady'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé Steady vs Unsteady */}
      <div style={{
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 8,
        border: '1px solid #333'
      }}>
        <h3 style={{ marginTop: 0 }}> Summary of the pace strategy (Steady vs Unsteady)</h3>

        <table style={{ borderCollapse: 'collapse', width: '100%', color: '#FAFAFA' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, textAlign: 'left' }}>Metric</th>
              <th style={headerStyle}>Unsteady Pace <div style={{ fontSize: 12, color: '#bbb' }}>{summary.Unsteady.count} laps</div></th>
              <th style={headerStyle}>Steady Pace <div style={{ fontSize: 12, color: '#bbb' }}>{summary.Steady.count} laps</div></th>
              <th style={headerStyle}>Difference (Steady - Unsteady)</th>
              <th style={headerStyle}>Conclusion</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                metric: 'Avg Speed (km/h)',
                fr: summary.Unsteady.avgSpeed,
                pb: summary.Steady.avgSpeed,
                unit: 'km/h',
                betterIsHigher: true,
                color: '#82ca9d',
                conclude: (pb, fr) => pb > fr ? 'More effective (Higher Speed)' : (pb < fr ? 'Less effective' : 'Similar')
              },
              {
                metric: 'HR Amplitude (bpm)',
                fr: summary.Unsteady.hrAmp, 
                pb: summary.Steady.hrAmp,
                unit: 'bpm',
                betterIsHigher: false,
                color: '#ffc658',
                conclude: (pb, fr) => pb < fr ? 'More economical (Lower Stress)' : (pb > fr ? 'Higher Stress' : 'Similar')
              }
            ].map((item, idx) => {
              const diff = (item.pb || 0) - (item.fr || 0);
              const diffText = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
              return (
                <tr key={item.metric} style={rowBg(idx)}>
                  <td style={{ ...cellStyle, textAlign: 'left', fontWeight: '700' }}>{item.metric}</td>
                  <td style={cellStyle}>{(item.fr || 0).toFixed(item.unit === 'bpm' ? 1 : 2)} {item.unit}</td>
                  <td style={cellStyle}>{(item.pb || 0).toFixed(item.unit === 'bpm' ? 1 : 2)} {item.unit}</td>
                  {/* La différence est toujours calculée Steady (pb) - Unsteady (fr) */}
                  <td style={{ ...cellStyle, color: diff >= 0 ? '#82ca9d' : '#ffc658', fontWeight: '700' }}>{diffText} {item.unit}</td>
                  <td style={{ ...cellStyle, color: item.color }}>{item.conclude(item.pb || 0, item.fr || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PacingStrategyTable;