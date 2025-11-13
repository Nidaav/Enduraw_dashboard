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

  // trier les laps par numéro
  const laps = [...activityDataByLap].sort((a, b) => (a.lap_number - b.lap_number));

  // indexer les laps d'intensité (pour recherche précédent)
  const intensityLaps = laps.filter(l => (l.lap_nature || '').toLowerCase() === 'intensity'
    || (l.lap_nature || '').toLowerCase() === 'intensité');

  const recoveryLaps = laps.filter(l => (l.lap_nature || '').toLowerCase() === 'recovery'
    || (l.lap_nature || '').toLowerCase() === 'récupération'
    || (l.lap_nature || '').toLowerCase() === 'recuperation');

  const results = recoveryLaps.map((currentLap) => {
    const lapNumber = safeNum(currentLap.lap_number);

    // trouver le dernier lap d'intensité avec lap_number < lapNumber (le plus proche)
    const prevIntensity = [...intensityLaps]
      .filter(l => safeNum(l.lap_number) < lapNumber)
      .sort((a, b) => safeNum(b.lap_number) - safeNum(a.lap_number))[0] || null;

    // Durée : prefer lap_duration, sinon tenter différence entre timestamp et start_time
    let DURATION = safeNum(currentLap.lap_duration);
    const startTs = parseTimestamp(currentLap.start_time);
    const endTs = parseTimestamp(currentLap.timestamp);
    if (!DURATION && startTs && endTs) {
      DURATION = (endTs - startTs) / 1000; // secondes
    }

    // HR_START : max_heart_rate from prevIntensity, fallback 0
    const HR_START = prevIntensity ? (safeNum(prevIntensity.max_heart_rate) || safeNum(prevIntensity.max_hr) || safeNum(prevIntensity.avg_heart_rate) || 0) : 0;

    // HR_END : min heart_rate in activityDataRaw between startTime and endTime
    let HR_END = 0;
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
    } else {
      // fallback : chercher dans activityDataRaw par lap_number égal
      const pts = activityDataRaw.filter(p => safeNum(p.lap_number) === lapNumber);
      if (pts.length) {
        const minHR = Math.min(...pts.map(p => safeNum(p.heart_rate) || Infinity));
        HR_END = (minHR === Infinity) ? 0 : minHR;
      } else {
        HR_END = 0;
      }
    }

    const FC_DROP = (HR_START > 0 && HR_END > 0) ? (HR_START - HR_END) : 0;
    const RECOVERY_RATE = (DURATION > 0) ? (FC_DROP / DURATION) : 0;

    const series = lapNumber <= 17 ? 1 : 2; // règle existante — ajuste si besoin

    return {
      lap: lapNumber,
      series,
      DURATION: Number(DURATION.toFixed(1)),
      HR_START: Math.round(HR_START),
      HR_END: Math.round(HR_END),
      FC_DROP: Number(FC_DROP.toFixed(1)),
      RECOVERY_RATE: Number(RECOVERY_RATE.toFixed(3))
    };
  });

  // filtrer les éléments sans HR_START
  return results.filter(r => r.HR_START > 0);
};

/* ============================
   Composant RecoveryQuality
   Props:
     - activityDataRaw: tableau JSON (filteredData)
     - activityDataByLap: csv brut (string)
   ============================ */
const RecoveryQuality = ({ activityDataRaw, activityDataByLap, showDebug = false }) => {

  // --- NORMALISATION activityDataRaw (déjà parsé) ---
  const normalizedRaw = useMemo(() => {
    if (!Array.isArray(activityDataRaw)) return [];
    return activityDataRaw.map(p => ({
      timestamp: p.timestamp ?? p.time ?? p.date ?? null,
      heart_rate: safeNum(p.heart_rate ?? p.hr ?? p.heartRate),
      lap_number: safeNum(p.lap_number ?? p.lapNumber ?? p.lap)
    }));
  }, [activityDataRaw]);

  // --- PARSING activityDataByLap (CSV brut) ---
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

  if (showDebug) {
    console.debug('normalizedRaw', normalizedRaw.slice(0,3));
    console.debug('normalizedByLap', normalizedByLap.slice(0,6));
    console.debug('analysisData', analysisData);
  }

  if (!analysisData.length) {
    return (
      <div className="p-6 rounded-xl bg-gray-900 text-white border border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-purple-300">Analyse Détaillée de la Qualité de Récupération</h3>
        <div className="text-sm text-gray-300">
          Aucune donnée de récupération disponible pour l'analyse. Vérifie :
          <ul className="list-disc ml-5 mt-2">
            <li>Que <code>activityDataRaw</code> est bien un tableau d'objets (filteredData).</li>
            <li>Que <code>activityDataByLap</code> est bien un CSV (string).</li>
            <li>Que les colonnes <code>timestamp</code>, <code>heart_rate</code> (raw) et <code>lap_number</code> existent.</li>
          </ul>
        </div>
      </div>
    );
  }

  // Séparer S1 / S2
  const S1 = analysisData.filter(d => d.series === 1);
  const S2 = analysisData.filter(d => d.series === 2);
  const getAvg = (arr, k) => arr.length ? (arr.reduce((s, x) => s + (x[k] || 0), 0) / arr.length) : 0;

  const RECOVERY_SUMMARY_DATA = [
    {
      metric: 'Baisse FC Moy. (S2-S1)',
      value1: getAvg(S1, 'FC_DROP'),
      value2: getAvg(S2, 'FC_DROP'),
      unit: 'bpm',
      isGoodTrend: d => d >= 0,
      description1: 'Chute FC Moy. (S1)',
      description2: 'Chute FC Moy. (S2)'
    },
    {
      metric: 'FC Fin Récup. Moy. (S2-S1)',
      value1: getAvg(S1, 'HR_END'),
      value2: getAvg(S2, 'HR_END'),
      unit: 'bpm',
      isGoodTrend: d => d <= 0,
      description1: 'FC Fin (S1)',
      description2: 'FC Fin (S2)'
    },
    {
      metric: 'Taux Récup. Moy. (S2-S1)',
      value1: getAvg(S1, 'RECOVERY_RATE'),
      value2: getAvg(S2, 'RECOVERY_RATE'),
      unit: 'bpm/s',
      isGoodTrend: d => d <= 0,
      description1: 'Taux Récup. (S1)',
      description2: 'Taux Récup. (S2)'
    }
  ];

  const getRecoveryRateColor = rate =>
    rate >= 0.65 ? 'text-green-400 font-bold' : rate >= 0.55 ? 'text-yellow-400' : 'text-red-400 font-bold';

  const getDriftColor = (drift, isGoodTrend) => (drift === 0 ? 'text-gray-400' : (isGoodTrend(drift) ? 'text-green-400' : 'text-red-400'));

  /* ============================
     Rendu
     ============================ */
  return (
    <div className="p-6 bg-gray-900 rounded-2xl border border-gray-700 text-white space-y-8">
      <h2 className="text-3xl font-extrabold text-purple-400">Analyse Détaillée de la Qualité de Récupération 🏃</h2>

      {/* Chart */}
      <div className="w-full h-96 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analysisData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
            <XAxis dataKey="lap" tick={{ fill: '#ddd' }} label={{ value: 'Lap', position: 'bottom', fill: '#aaa' }} />
            <YAxis tick={{ fill: '#ddd' }} label={{ value: 'bpm', angle: -90, position: 'insideLeft', fill: '#aaa' }} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: '#ddd' }} />
            <Line type="monotone" dataKey="HR_START" stroke="#f5a623" strokeWidth={2} dot={{ r: 3 }} name="FC Début (HR_MAX prev)" />
            <Line type="monotone" dataKey="HR_END" stroke="#50e3c2" strokeWidth={2} dot={{ r: 3 }} name="FC Fin (HR_MIN lap)" />
            <Line type="monotone" dataKey="FC_DROP" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" name="Chute FC" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table + Summary grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau détaillé */}
        <div className="col-span-2 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Détail de la Qualité de Récupération par Lap</h3>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="text-gray-400">
                <tr className="border-b border-gray-700">
                  <th className="py-2 text-left">Série / Lap</th>
                  <th className="py-2 text-center">Durée (s)</th>
                  <th className="py-2 text-center">FC Début</th>
                  <th className="py-2 text-center">FC Fin</th>
                  <th className="py-2 text-center">FC Drop</th>
                  <th className="py-2 text-center">Taux Récup. (bpm/s)</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.map((d) => (
                  <tr key={d.lap} className="border-b border-gray-800 hover:bg-gray-700/40">
                    <td className="py-2">{d.series} / {d.lap}</td>
                    <td className="py-2 text-center">{d.DURATION.toFixed(1)}</td>
                    <td className="py-2 text-center text-yellow-400">{d.HR_START}</td>
                    <td className="py-2 text-center text-red-400">{d.HR_END}</td>
                    <td className="py-2 text-center text-green-400">{d.FC_DROP}</td>
                    <td className={`py-2 text-center ${getRecoveryRateColor(d.RECOVERY_RATE)}`}>{d.RECOVERY_RATE.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Synthèse Drift */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Synthèse de la Dérive (S2 vs S1)</h3>
          <div className="space-y-4">
            {RECOVERY_SUMMARY_DATA.map((item, idx) => {
              const drift = item.value2 - item.value1;
              return (
                <div key={idx} className="bg-gray-900 p-3 rounded-md border border-gray-700">
                  <div className="text-sm text-gray-300 mb-2">{item.metric}</div>
                  <div className="text-xs text-gray-400">
                    <div className="flex justify-between"><span>{item.description1} (S1)</span><span className="text-green-400">{item.value1.toFixed(2)} {item.unit}</span></div>
                    <div className="flex justify-between"><span>{item.description2} (S2)</span><span className="text-red-400">{item.value2.toFixed(2)} {item.unit}</span></div>
                    <div className="flex justify-between mt-2 border-t border-gray-700 pt-2">
                      <span className="font-semibold">Drift (S2 - S1)</span>
                      <span className={`font-bold ${getDriftColor(drift, item.isGoodTrend)}`}>{drift >= 0 ? '+' : ''}{drift.toFixed(2)} {item.unit}</span>
                    </div>
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
