import React, { useMemo } from 'react';
import Papa from 'papaparse';

/**
 * Props:
 *  - activityDataRaw: Array d'objets (filteredData). Chaque point attendu : { lap_number, speed_kmh, heart_rate, timestamp?, lap_nature? }
 *  - activityDataByLap: optional - CSV string (raw) or Array parsed providing per-lap rows with lap_number and lap_nature.
 *  - thresholdPercent: optional - seuil (%) pour classer FR vs PB (default 3)
 */

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const computeLapStats = (points) => {
  const speeds = points.map(p => safeNum(p.speed_kmh)).filter(v => v > 0);
  const hrs = points.map(p => safeNum(p.heart_rate)).filter(v => v > 0);

  if (!speeds.length || !hrs.length) return null;

  const avgSpeed = speeds.reduce((a,b) => a + b, 0) / speeds.length;
  const maxSpeed = Math.max(...speeds);
  const minSpeed = Math.min(...speeds);

  const maxHr = Math.max(...hrs);
  const minHr = Math.min(...hrs);

  const pacingDelta = avgSpeed > 0 ? ((maxSpeed - avgSpeed) / avgSpeed) * 100 : 0;
  const hrAmplitude = maxHr - minHr;

  return {
    avgSpeed,
    maxSpeed,
    minSpeed,
    pacingDelta,
    hrAmplitude
  };
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

const PacingStrategyTable = ({ activityDataRaw = [], activityDataByLap = null, thresholdPercent = 2 }) => {

  // 0) normalisation basique des points (éviter undefined)
  const normalizedRaw = useMemo(() => {
    if (!Array.isArray(activityDataRaw)) return [];
    return activityDataRaw.map(p => ({
      lap_number: safeNum(p.lap_number ?? p.lap ?? p.lapNumber),
      speed_kmh: safeNum(p.speed_kmh ?? p.speedKmh ?? p.speed),
      heart_rate: safeNum(p.heart_rate ?? p.hr ?? p.heartRate),
      timestamp: p.timestamp ?? p.time ?? p.t,
      lap_nature: p.lap_nature ?? p.lapNature ?? p.type ?? null
    }));
  }, [activityDataRaw]);

  // 1) parse by-lap CSV / object si fourni
  const normalizedByLap = useMemo(() => {
    if (!activityDataByLap) return [];
    const parsed = parseByLap(activityDataByLap);
    // map defensively
    return parsed.map(r => ({
      lap_number: safeNum(r.lap_number ?? r.lap ?? r.lapNumber),
      lap_nature: r.lap_nature ?? r.lapNature ?? r.lap_type ?? r.type ?? ''
    }));
  }, [activityDataByLap]);

  // 2) déterminer la liste des lap_numbers 'Intensity'
  const intensityLapNumbers = useMemo(() => {
    if (normalizedByLap && normalizedByLap.length) {
      return normalizedByLap
        .filter(r => {
          const n = (r.lap_nature ?? '').toString().toLowerCase();
          return n === 'intensity' || n === 'intensité' || n.includes('intens');
        })
        .map(r => safeNum(r.lap_number))
        .filter(n => n > 0)
        .sort((a,b) => a - b);
    }
    // fallback : chercher dans activityDataRaw si les points contiennent lap_nature
    const candidate = Array.from(new Set(
      normalizedRaw
        .filter(p => p.lap_nature && typeof p.lap_nature === 'string' && (
          p.lap_nature.toLowerCase().includes('intensity') ||
          p.lap_nature.toLowerCase().includes('intens')
        ))
        .map(p => safeNum(p.lap_number))
        .filter(n => n > 0)
    )).sort((a,b) => a - b);
    return candidate;
  }, [normalizedByLap, normalizedRaw]);

  // 3) grouper points par lap_number
  const pointsByLap = useMemo(() => {
    const map = new Map();
    normalizedRaw.forEach(p => {
      const lap = safeNum(p.lap_number);
      if (!map.has(lap)) map.set(lap, []);
      map.get(lap).push(p);
    });
    return map;
  }, [normalizedRaw]);

  // 4) pour chaque lap d'intensity, calcul des stats et classification
  const perLapResults = useMemo(() => {
    if (!intensityLapNumbers || intensityLapNumbers.length === 0) return [];

    const res = intensityLapNumbers.map(lapNum => {
      const pts = pointsByLap.get(lapNum) || [];
      const stats = computeLapStats(pts);
      if (!stats) {
        return {
          lap: lapNum,
          avgSpeed: 0,
          maxSpeed: 0,
          pacingDelta: 0,
          hrAmplitude: 0,
          classification: 'UNKNOWN',
        };
      }
      const classification = (stats.pacingDelta >= thresholdPercent) ? 'F-R' : 'P-B';
      return {
        lap: lapNum,
        avgSpeed: stats.avgSpeed,
        maxSpeed: stats.maxSpeed,
        pacingDelta: stats.pacingDelta,
        hrAmplitude: stats.hrAmplitude,
        classification
      };
    });

    // sort par lap
    return res.sort((a,b) => a.lap - b.lap);
  }, [intensityLapNumbers, pointsByLap, thresholdPercent]);

  // 5) regrouper FR vs PB et calculer moyennes pour résumé
  const summary = useMemo(() => {
    const fr = perLapResults.filter(r => r.classification === 'F-R');
    const pb = perLapResults.filter(r => r.classification === 'P-B');

    const mean = (arr, key) => arr.length ? arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length : 0;

    return {
      FR: {
        count: fr.length,
        avgSpeed: mean(fr, 'avgSpeed'),
        hrAmp: mean(fr, 'hrAmplitude')
      },
      PB: {
        count: pb.length,
        avgSpeed: mean(pb, 'avgSpeed'),
        hrAmp: mean(pb, 'hrAmplitude')
      }
    };
  }, [perLapResults]);

  // 6) If no intensity laps found, affichage utile
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
        <h3 style={{ marginTop: 0 }}>Détail par Lap (Intensity)</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, textAlign: 'left' }}>Lap</th>
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
                  <td style={{ ...cellStyle, textAlign: 'left', fontWeight: '600' }}>{r.lap}</td>
                  <td style={cellStyle}>{Number(r.avgSpeed).toFixed(2)}</td>
                  <td style={cellStyle}>{Number(r.maxSpeed).toFixed(2)}</td>
                  <td style={{ ...cellStyle, color: r.pacingDelta >= thresholdPercent ? '#82ca9d' : '#ffc658' }}>
                    {Number(r.pacingDelta).toFixed(2)}
                  </td>
                  <td style={cellStyle}>{Number(r.hrAmplitude).toFixed(1)}</td>
                  <td style={{ ...cellStyle, fontWeight: '700', color: r.classification === 'F-R' ? '#82ca9d' : '#50e3c2' }}>
                    {r.classification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé FR vs PB (tableau existant remanié dynamiquement) */}
      <div style={{
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 8,
        border: '1px solid #333'
      }}>
        <h3 style={{ marginTop: 0 }}>Synthèse Pacing Strategy (FR vs PB)</h3>

        <table style={{ borderCollapse: 'collapse', width: '100%', color: '#FAFAFA' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, textAlign: 'left' }}>Metric</th>
              <th style={headerStyle}>Fast Start/Relax (F-R) <div style={{ fontSize: 12, color: '#bbb' }}>{summary.FR.count} laps</div></th>
              <th style={headerStyle}>Progressive Build (P-B) <div style={{ fontSize: 12, color: '#bbb' }}>{summary.PB.count} laps</div></th>
              <th style={headerStyle}>Difference (P-B - F-R)</th>
              <th style={headerStyle}>Conclusion</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                metric: 'Avg Speed (km/h)',
                fr: summary.FR.avgSpeed,
                pb: summary.PB.avgSpeed,
                unit: 'km/h',
                betterIsHigher: true,
                color: '#82ca9d',
                conclude: (pb, fr) => pb > fr ? 'More effective (Higher Speed)' : (pb < fr ? 'Less effective' : 'Similar')
              },
              {
                metric: 'HR Amplitude (bpm)',
                fr: summary.FR.hrAmp,
                pb: summary.PB.hrAmp,
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
