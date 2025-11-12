import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Papa from 'papaparse';

// --- Définition des métriques disponibles ---
const METRICS = {
  avg_speed_kmh: { name: 'Speed', color: '#8884d8', unit: 'km/h', yId: 'speed', type: 'monotone', domain: ['auto', 'auto'] },
  avg_heart_rate: { name: 'Heart Rate', color: '#a53862ff', unit: 'bpm', yId: 'hr', type: 'monotone', domain: ['auto', 'auto'] },
  avg_cadence: { name: 'Cadence', color: '#a4de6c', unit: 'spm', yId: 'cad', type: 'monotone', domain: ['auto', 'auto'] },
  avg_step_length: { name: 'Step Length', color: '#1f77b4', unit: 'mm', yId: 'step_length', type: 'monotone', domain: ['auto', 'auto'] },
  avg_stance_time: { name: 'Stance Time', color: '#ff7300', unit: 'ms', yId: 'stance_stime', type: 'monotone', domain: ['auto', 'auto'] },
  avg_stance_time_percent: { name: 'Stance Time Percent', color: '#daa377ff', unit: '%', yId: 'stance_stime_percent', type: 'monotone', domain: ['auto', 'auto'] },
  avg_vertical_oscillation: { name: 'Vertical oscillation', color: '#9467bd', unit: 'mm', yId: 'vertical_oscillation', type: 'monotone', domain: ['auto', 'auto'] },
  avg_vertical_ratio: { name: 'Vertical ratio', color: '#b88be2ff', unit: '', yId: 'vertical_ratio', type: 'monotone', domain: ['auto', 'auto'] },
};

// --- Composant principal ---
const LapPerformanceChart = ({ csvByLapText }) => {
  const [selectedMetrics, setSelectedMetrics] = useState(['avg_speed_kmh', 'avg_heart_rate']);

  // --- Parsing CSV ---
  const lapData = useMemo(() => {
    if (!csvByLapText) return [];

    const parsed = Papa.parse(csvByLapText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    return parsed.data.map(row => ({
      lap_number: Number(row.lap_number),
      lap_nature: row.lap_nature,
      avg_heart_rate: Number(row.avg_heart_rate),
      avg_speed_kmh: Number(row.avg_speed_kmh),
      avg_cadence: Number(row.avg_running_cadence_step_per_min),
      avg_step_length: Number(row.avg_step_length),
      avg_stance_time: Number(row.avg_stance_time),
      avg_stance_time_percent: Number(row.avg_stance_time_percent),
      avg_vertical_oscillation: Number(row.avg_vertical_oscillation),
      avg_vertical_ratio: Number(row.avg_vertical_ratio),
    }));
  }, [csvByLapText]);

  // --- Gère les cases à cocher ---
  const handleCheckboxChange = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // --- Tooltip personnalisé ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = lapData.find(d => d.lap_number === label);
      if (!data) return null;
      return (
        <div style={{ backgroundColor: "#1a1a1a", padding: '10px', border: '1px solid #ccc' }}>
          <p style={{ fontWeight: 'bold' }}>Lap {label} — {data.lap_nature}</p>
          {selectedMetrics.map(key => (
            <p key={key} style={{ color: METRICS[key].color }}>
              {METRICS[key].name}: {data[key]} {METRICS[key].unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- Génération dynamique des axes Y ---
  const yAxes = selectedMetrics.map((key, i) => {
    const metric = METRICS[key];
    const orientation = i % 2 === 0 ? 'left' : 'right';
    return (
      <YAxis
        key={metric.yId}
        yAxisId={metric.yId}
        orientation={orientation}
        stroke={metric.color}
        domain={metric.domain}
        label={{
          value: metric.unit,
          angle: orientation === 'left' ? -90 : 90,
          position: orientation === 'left' ? 'insideLeft' : 'insideRight',
          fill: metric.color,
        }}
      />
    );
  });

  // --- Lignes dynamiques selon métriques cochées ---
  const activeLines = selectedMetrics.map(key => {
    const metric = METRICS[key];
    return (
      <Line
        key={key}
        yAxisId={metric.yId}
        type={metric.type}
        dataKey={key}
        stroke={metric.color}
        strokeWidth={2}
        dot={true}
        activeDot={{ r: 4 }}
        name={metric.name}
      />
    );
  });

  // --- Si pas de data ---
  if (!lapData || lapData.length === 0) {
    return <div>Chargement des données de laps...</div>;
  }

  return (
    <div style={{ color: '#fafafa' }}>

      {/* Zone de contrôle des métriques */}
      <div style={{
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        backgroundColor: '#1E1E1E',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        {Object.keys(METRICS).map(key => (
          <label key={key} style={{ color: METRICS[key].color }}>
            <input
              type="checkbox"
              checked={selectedMetrics.includes(key)}
              onChange={() => handleCheckboxChange(key)}
              style={{ accentColor: METRICS[key].color, marginRight: '6px' }}
            />
            {METRICS[key].name}
          </label>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={lapData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="lap_number"
            stroke="#fafafa"
            label={{ value: 'Lap Number', position: 'right', offset: 15, dy: 14, style: { textAnchor: 'end', fill: '#FAFAFA' } }}
          />
          {yAxes}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {activeLines}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LapPerformanceChart;
