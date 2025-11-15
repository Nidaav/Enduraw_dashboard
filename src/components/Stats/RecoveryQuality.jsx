import React, { useMemo } from 'react';
import Papa from 'papaparse';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/* ============================
   Utilitaires internes
   ============================ */
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const parseTimestamp = (v) => {
  if (!v) return null;
  const t = (typeof v === 'number') ? v : Date.parse(String(v));
  return Number.isFinite(t) ? t : null;
};

/* ============================
   Calcul des métriques
   ============================ */
const calculateRecoveryMetrics = ({ activityDataRaw, activityDataByLap }) => {
  if (!Array.isArray(activityDataRaw) || !Array.isArray(activityDataByLap)) return []; 

  // trier les laps par numéro, en s'assurant qu'ils sont numériques
  const laps = [...activityDataByLap].sort((a, b) => (safeNum(a.lap_number) - safeNum(b.lap_number)));

  // indexer les laps d'intensité (pour recherche précédent)
  const intensityLaps = laps.filter(l => (l.lap_nature || '').toLowerCase() === 'intensity'
    || (l.lap_nature || '').toLowerCase() === 'intensité');

  const recoveryLaps = laps.filter(l => (l.lap_nature || '').toLowerCase() === 'recovery'
    || (l.lap_nature || '').toLowerCase() === 'récupération'
    || (l.lap_nature || '').toLowerCase() === 'recuperation');

  let recovery_lap_count = 0; // Compteur pour le numéro de récupération

  const results = recoveryLaps.map((currentLap) => {
    recovery_lap_count += 1; // Incrémentation du numéro de récupération
    const lapNumber = safeNum(currentLap.lap_number);
    let DURATION = safeNum(currentLap.lap_duration);
    const startTs = parseTimestamp(currentLap.start_time);
    const endTs = parseTimestamp(currentLap.timestamp);
    if (!DURATION && startTs && endTs) {
      DURATION = (endTs - startTs) / 1000; // secondes
    }

    // HR_START (FC Début) : Max HR du lap de récupération actuel (currentLap), tiré des données brutes (activityDataRaw).
    // On utilise les points du lap actuel.
    let HR_START = 0;

    // Trouver tous les points de raw data pour le lap de récupération actuel
    const ptsCurrent = activityDataRaw.filter(p => safeNum(p.lap_number) === lapNumber);

    if (ptsCurrent.length) {
      // Trouver la fréquence cardiaque maximale dans ces points (le pic au début de la récupération)
      const maxHR = Math.max(...ptsCurrent.map(p => safeNum(p.heart_rate) || -Infinity));
      HR_START = (maxHR === -Infinity) ? 0 : maxHR;
    }

    // HR_END (FC Fin) : Min heart_rate dans activityDataRaw pour le lap de récupération actuel.
    let HR_END = 0;
    
    // 1. Approche robuste : Chercher le minimum HR sur la durée du lap dans les données brutes.
    if (startTs && endTs) {
      let minHR = Infinity;
      activityDataRaw.forEach(pt => {
        const t = parseTimestamp(pt.timestamp);
        if (t && t >= startTs && t <= endTs) {
          const hr = safeNum(pt.heart_rate);
          if (hr > 0 && hr < minHR) minHR = hr;
        }
      });
      HR_END = (minHR === Infinity) ? 0 : minHR;
    } 
    
    // 2. Fallback pour HR_END (Si l'approche par timestamp ne trouve rien, on utilise l'approche par lap_number)
    if (HR_END === 0 && ptsCurrent.length) {
      const minHR = Math.min(...ptsCurrent.map(p => safeNum(p.heart_rate) || Infinity));
      HR_END = (minHR === Infinity) ? 0 : minHR;
    }
    
    // NOUVEAU: 3. Fallback final pour HR_END : Prendre la dernière FC du lap pour être sûr d'avoir la FC de fin de récupération.
    if (HR_END === 0 && ptsCurrent.length) {
        // Trier les points par timestamp et prendre le dernier heart_rate
        const lastPoint = [...ptsCurrent].sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp))[0];
        HR_END = safeNum(lastPoint?.heart_rate);
    }
    
    
    const FC_DROP = (HR_START > 0 && HR_END > 0) ? (HR_START - HR_END) : 0;
    const RECOVERY_RATE = (DURATION > 0) ? (FC_DROP / DURATION) : 0;

    // Définition des séries : S1 pour les 8 premières récupérations, S2 pour les suivantes (la logique 8 / 9+ est conservée).
    const series = recovery_lap_count <= 8 ? 1 : 2; 

    return {
      lap: lapNumber, // L'ancien lap number est conservé au cas où
      recovery_lap_number: recovery_lap_count, // Le nouveau numéro de lap de récupération
      series,
      DURATION: Number(DURATION.toFixed(1)),
      HR_START: Math.round(HR_START),
      HR_END: Math.round(HR_END),
      FC_DROP: Number(FC_DROP.toFixed(1)),
      RECOVERY_RATE: Number(RECOVERY_RATE.toFixed(3))
    };
  });

  // Ne filtrer que les éléments ayant une durée > 0 et une FC de début > 0
  return results.filter(r => r.HR_START > 0 && r.DURATION > 0);
};

// --- Headers du tableau pour la Récupération ---
const RECOVERY_TABLE_HEADERS = [
  { label: 'Lap Recovery', unit: '' },
  { label: 'Duration', unit: '(s)' },
  { label: 'HR Start', unit: '(bpm)' },
  { label: 'HR End', unit: '(bpm)' },
  { label: 'HR Drop', unit: '(bpm)' },
  { label: 'Recovery rate', unit: '(bpm/s)' },
];

const RecoveryQuality = ({ activityDataRaw, activityDataByLap, showDebug = false }) => {

  const normalizedRaw = useMemo(() => {
    if (!Array.isArray(activityDataRaw)) return [];
    return activityDataRaw.map(p => ({
      timestamp: p.timestamp ?? p.time ?? p.date ?? null,
      heart_rate: safeNum(p.heart_rate ?? p.hr ?? p.heartRate),
      lap_number: safeNum(p.lap_number ?? p.lapNumber ?? p.lap)
    }));
  }, [activityDataRaw]);

  const normalizedByLap = useMemo(() => {
    if (!activityDataByLap || typeof activityDataByLap !== 'string') return [];

    const parsed = Papa.parse(activityDataByLap, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    // map rows defensivement (prend en compte noms de colonnes possibles)
    return parsed.data.map(row => ({
      lap_number: safeNum(row.lap_number ?? row.lapNumber ?? row.lap),
      lap_nature: row.lap_nature ?? row.lapNature ?? row.lap_type ?? row.type ?? '',
      max_heart_rate: safeNum(row.max_heart_rate ?? row.max_hr ?? row.maxHeartRate ?? row.max),
      lap_duration: safeNum(row.lap_duration ?? row.duration ?? row.duration_s),
      start_time: row.start_time ?? row.startTime ?? row.start,
      timestamp: row.timestamp ?? row.end_time ?? row.endTime ?? row.end
    }));
  }, [activityDataByLap]);

  // --- CALCUL METRICS ---
  const analysisData = useMemo(() => {
    if (!normalizedRaw.length || !normalizedByLap.length) return [];
    return calculateRecoveryMetrics({
      activityDataRaw: normalizedRaw,
      activityDataByLap: normalizedByLap
    });
  }, [normalizedRaw, normalizedByLap]);

  if (!analysisData.length) {
    return (
      <div className="p-6 rounded-xl bg-gray-900 text-white border border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-purple-300">Detailed Recovery Quality Analysis</h3>
        <div className="text-sm text-gray-300">
          No recovery data available for analysis.
        </div>
      </div>
    );
  }

  // Séparer S1 / S2
  const S1_data = analysisData.filter(d => d.series === 1);
  const S2_data = analysisData.filter(d => d.series === 2);
  const getAvg = (arr, k) => arr.length ? (arr.reduce((s, x) => s + (x[k] || 0), 0) / arr.length) : 0;
  
  // Utilitaire pour la comparaison (S2 vs S1)
  const formatValue = (v, dp = 2) => Number(v).toFixed(dp);
  
  const RECOVERY_SUMMARY_DATA = [
    {
      metric: 'Average HR at recovery start',
      key: 'HR_START',
      s1: formatValue(getAvg(S1_data, 'HR_START'), 0),
      s2: formatValue(getAvg(S2_data, 'HR_START'), 0),
      unit: 'bpm',
      // Trend: Drift >= 0 is considered stable/expected.
      isGoodTrend: (drift) => drift >= 0,
    },
    {
      metric: 'Average HR at recovery ending',
      key: 'HR_END',
      s1: formatValue(getAvg(S1_data, 'HR_END'), 0),
      s2: formatValue(getAvg(S2_data, 'HR_END'), 0),
      unit: 'bpm',
      // Trend: Drift <= 0 is considered stable/good.
      isGoodTrend: (drift) => drift <= 0,
    },
    {
      metric: 'Average HR drop',
      key: 'FC_DROP',
      s1: formatValue(getAvg(S1_data, 'FC_DROP'), 1),
      s2: formatValue(getAvg(S2_data, 'FC_DROP'), 1),
      unit: 'bpm',
      // Trend: Drift >= 0 is considered stable/good.
      isGoodTrend: (drift) => drift >= 0,
    },
    {
      metric: 'Average recovery rate',
      key: 'RECOVERY_RATE',
      s1: formatValue(getAvg(S1_data, 'RECOVERY_RATE'), 2),
      s2: formatValue(getAvg(S2_data, 'RECOVERY_RATE'), 2),
      unit: 'bpm/s',
      // Trend: Drift >= 0 is considered stable/good.
      isGoodTrend: (drift) => drift >= 0,
    }
  ];

  // Fonction pour obtenir la couleur de la dérive (inspiration Style Guide)
  const getDriftColor = (drift, isGoodTrend) => {
    if (drift === 0) return 'text-gray-400';
    return isGoodTrend(drift) ? 'text-green-400' : 'text-red-400';
  };

  /* ============================
      Rendu
      ============================ */
  return (
    <div className="p-6 bg-gray-900 rounded-2xl border border-gray-700 text-white space-y-8">
      
      {/* Chart Centré et Redimensionné */}
    <div style={{width: '87vw', height: '35vh'}} className="flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={analysisData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
          <XAxis dataKey="recovery_lap_number" tick={{ fill: '#ddd' }} label={{ value: 'Lap Recovery', position: 'right', offset: -110, dy: 14, fill: '#aaa' }} />
          <YAxis 
            yAxisId="hr_axis" 
            orientation="left"
            stroke="#f5a623" 
            tick={{ fill: '#f5a623' }} 
            domain={['auto', 'auto']} 
            label={{ value: 'HR (bpm)', angle: -90, position: 'insideLeft', fill: '#f5a623' }}
          />
          <YAxis 
            yAxisId="drop_axis" 
            orientation="right"
            stroke="#8884d8"
            tick={{ fill: '#8884d8' }} 
            domain={['auto', 'auto']}
            label={{ value: 'HR Drop', angle: 90, position: 'insideRight', fill: '#8884d8' }}
          />
          <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: 8 }} />
          <Legend wrapperStyle={{ color: '#ddd' }} />
          <Line yAxisId="hr_axis" type="monotone" dataKey="HR_START" stroke="#f5a623" strokeWidth={2} dot={{ r: 3 }} name="HR Start (Max Recovery Lap)" />
          <Line yAxisId="hr_axis" type="monotone" dataKey="HR_END" stroke="#50e3c2" strokeWidth={2} dot={{ r: 3 }} name="HR End (Min Recovery Lap)" />
          <Line yAxisId="drop_axis" type="monotone" dataKey="FC_DROP" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" name="HR Drop" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>

      {/* Table + Summary grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tableau détaillé (Format Style Guide) */}
        <div className="col-span-2 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Detail of Recovery Quality per Lap</h3>
          <div className="overflow-auto max-h-96">
            <table style={{
                borderCollapse: 'collapse', 
                width: '100%',
                color: '#FAFAFA', 
                fontSize: '0.9em'
              }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #555' }}>
                  {RECOVERY_TABLE_HEADERS.map((h, index) => (
                    <th 
                      key={index} 
                      scope="col"
                      style={{ 
                          padding: '10px 5px', 
                          textAlign: 'center', 
                          fontWeight: 'bold',
                          border: '1px solid #333',
                          backgroundColor: '#2A2A2A' 
                        }}>
                        {h.label} <span style={{ fontWeight: 'normal', opacity: 0.7 }}>{h.unit}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysisData.map((data, index) => {
                    // Logique pour le séparateur de série
                    const isStartOfSeries1 = data.recovery_lap_number === S1_data[0]?.recovery_lap_number;
                    const isStartOfSeries2 = S2_data.length > 0 && data.recovery_lap_number === S2_data[0]?.recovery_lap_number;

                    const seriesHeaderRow = (isStartOfSeries1 || isStartOfSeries2) && (
                        <tr key={`series-header-${data.series}`} style={{ 
                            backgroundColor: '#8884d840',
                            borderTop: isStartOfSeries2 ? '4px solid #8884d8' : 'none',
                            borderBottom: '1px solid #8884d8'
                            }}>
                            <td colSpan={RECOVERY_TABLE_HEADERS.length} style={{ 
                                padding: '5px', 
                                textAlign: 'left', 
                                fontWeight: 'bold', 
                                color: '#8884d8'
                                }}>
                                Series {data.series}
                            </td>
                        </tr>
                    );

                    // Fonction pour colorer le taux de récupération
                    const getRecoveryRateStyle = (rate) => {
                      if (rate >= 0.65) return { color: '#50e3c2' }; // Good (Green)
                      if (rate >= 0.55) return { color: '#f5a623' }; // Medium (Yellow)
                      return { color: '#FF6347' }; // Low (Red)
                    };
                    
                    // Couleur pour HR Drop: Higher drop is better
                    const getFCDropStyle = (fc_drop) => {
                         if (fc_drop >= 40) return { color: '#50e3c2' }; // Very good drop
                         if (fc_drop >= 30) return { color: '#f5a623' }; // Acceptable drop
                         return { color: '#FF6347' }; // Low drop
                    }


                    return (
                        <React.Fragment key={data.recovery_lap_number}>
                            {seriesHeaderRow}
                            <tr 
                                style={{ 
                                    borderBottom: '1px solid #333', 
                                    backgroundColor: data.recovery_lap_number % 2 === 0 ? '#1E1E1E' : '#252525' 
                                    }}>
                                <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>
                                    <span style={{ fontWeight: 'bold' }}>{data.recovery_lap_number}</span>
                                </td>
                                <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.DURATION.toFixed(1)}</td>
                                <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333', color: '#f5a623' }}>{data.HR_START}</td>
                                <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333', color: '#50e3c2' }}>{data.HR_END}</td>
                                <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333', ...getFCDropStyle(data.FC_DROP) }}>{data.FC_DROP.toFixed(1)}</td>
                                <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333', ...getRecoveryRateStyle(data.RECOVERY_RATE) }}>{data.RECOVERY_RATE.toFixed(2)}</td>
                            </tr>
                        </React.Fragment>
                        );
                    })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Synthèse Drift - Nouveau Visuel Inspiré du Style Guide */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Summary of the Drift (S2 vs. S1)</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {RECOVERY_SUMMARY_DATA.map((item, idx) => {
              const drift = Number(item.s2) - Number(item.s1);
              const driftColor = getDriftColor(drift, item.isGoodTrend);
              
              return (
                <div key={idx} style={{
                  backgroundColor: '#1E1E1E', // Dark background
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <p style={{
                    fontWeight: 'bold',
                    color: '#FAFAFA',
                    fontSize: '1.05em',
                    marginBottom: '8px'
                  }}>{item.metric}</p>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '5px',
                    fontSize: '0.9em',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px dashed #333'
                  }}>
                    <div style={{ color: '#8884d8' }}>Average S1: <span style={{ color: '#FAFAFA', fontWeight: 'bold' }}>{item.s1} {item.unit}</span></div>
                    <div style={{ color: '#f5a623' }}>Average S2: <span style={{ color: '#FAFAFA', fontWeight: 'bold' }}>{item.s2} {item.unit}</span></div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    // CHANGEMENT: justify-content: 'center' pour centrer l'ensemble
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1em',
                    // Ajout d'un espacement entre le label et la valeur (optionnel, mais améliore le centrage)
                    gap: '15px'
                  }}>
                    {/* CHANGEMENT: le label 'Drift (S2 - S1)' est maintenant une div/span standard pour le centrage */}
                    <span style={{ color: '#ddd' }}>Drift (S2 - S1)</span>
                    <span className={driftColor}>
                      {drift >= 0 ? '+' : ''}{drift.toFixed(item.key === 'HR_END' || item.key === 'HR_START' ? 0 : 2)} {item.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryQuality;