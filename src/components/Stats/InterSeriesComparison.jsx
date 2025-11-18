// InterSeriesComparison.jsx
import React, { useMemo } from "react";
import Papa from "papaparse";

const COLUMN_MAPPING = {
    'lap_duration': 'duration',
    'avg_speed_kmh': 'avgSpeed',
    'max_speed_kmh': 'maxSpeed',
    'avg_heart_rate': 'avgHR',
    'max_heart_rate': 'maxHR',
    'avg_running_cadence_step_per_min': 'avgCadence',
    'avg_step_length': 'avgStepLength',
    'avg_stance_time': 'avgStanceTime',
    'avg_stance_time_percent': 'avgSTP',
    'avg_vertical_ratio': 'avgVR',
};

export default function InterSeriesComparison({ csvByLapText }) {

    // Parse & extract intensity laps
    const intensityData = useMemo(() => {
        if (!csvByLapText) return [];

        const parsed = Papa.parse(csvByLapText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
        });

        const intensityLaps = parsed.data.filter(r => r.lap_nature === "Intensity");

        return intensityLaps.map((row, index) => {
            const getCsvColumn = (jsKey) =>
                Object.keys(COLUMN_MAPPING).find(key => COLUMN_MAPPING[key] === jsKey);

            return {
                series: Math.floor(index / 8) + 1,
                duration: Number(row[getCsvColumn("duration")] || 0),
                avgSpeed: Number(row[getCsvColumn("avgSpeed")] || 0),
                avgHR: Number(row[getCsvColumn("avgHR")] || 0),
                avgCadence: Number(row[getCsvColumn("avgCadence")] || 0),
                avgStepLength: Number(row[getCsvColumn("avgStepLength")] || 0),
                avgStanceTime: Number(row[getCsvColumn("avgStanceTime")] || 0),
                avgSTP: Number(row[getCsvColumn("avgSTP")] || 0),
                avgVR: Number(row[getCsvColumn("avgVR")] || 0),
            };
        });
    }, [csvByLapText]);

    // Compute per-series averages
    const computeSeries = (seriesNum) => {
        const laps = intensityData.filter(d => d.series === seriesNum);
        if (laps.length === 0) return null;

        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

        return {
            duration: avg(laps.map(l => l.duration)),
            avgSpeed: avg(laps.map(l => l.avgSpeed)),
            avgHR: avg(laps.map(l => l.avgHR)),
            avgCadence: avg(laps.map(l => l.avgCadence)),
            avgStepLength: avg(laps.map(l => l.avgStepLength)),
            avgStanceTime: avg(laps.map(l => l.avgStanceTime)),
            avgSTP: avg(laps.map(l => l.avgSTP)),
            avgVR: avg(laps.map(l => l.avgVR)),
        };
    };

    const S1 = useMemo(() => computeSeries(1), [intensityData]);
    const S2 = useMemo(() => computeSeries(2), [intensityData]);

    if (!S1 || !S2) {
        return <p style={{ color: "#fff" }}>No comparison data available.</p>;
    }

    const metrics = [
        { key: "duration", label: "Avg Duration (s)" },
        { key: "avgSpeed", label: "Avg Speed (km/h)" },
        { key: "avgHR", label: "Avg Heart Rate (bpm)" },
        { key: "avgCadence", label: "Avg Cadence (spm)" },
        { key: "avgStepLength", label: "Avg Step Length (mm)" },
        { key: "avgStanceTime", label: "Avg Stance Time (ms)" },
        { key: "avgSTP", label: "Avg Stance Time (%)" },
        { key: "avgVR", label: "Avg Vertical Ratio" },
    ];

    const computeDrift = (v1, v2) => {
        const driftAbs = v2 - v1;
        const driftPct = (driftAbs / v1) * 100;
        return {
            abs: driftAbs.toFixed(2),
            pct: driftPct.toFixed(2)
        };
    };

    const comparison = metrics.map(m => ({
        metric: m.label,
        s1: S1[m.key].toFixed(2),
        s2: S2[m.key].toFixed(2),
        drift: computeDrift(S1[m.key], S2[m.key])
    }));

    return (
        <div>
            <h2>Inter-series comparison & global drifts of key metrics</h2>

            <div style={{
                backgroundColor: "#1E1E1E",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #333",
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
            }}>
                {comparison.map(item => (
                    <div key={item.metric} style={{ minWidth: "180px", fontWeight: 'bold' }}>
                        <p style={{
                            margin: 0,
                            marginBottom: "10px",
                            color: "#FAFAFA",
                            fontWeight: "bold",
                            borderBottom: "1px solid #333",
                            paddingBottom: "5px"
                        }}>
                            {item.metric}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div><span style={{ color: "#8884d8" }}>S1: </span>{item.s1}</div>
                            <div><span style={{ color: "#8884d8" }}>S2: </span>{item.s2}</div>
                            <div><span style={{ color: "#8884d8" }}>Drift: </span>{item.drift.abs}</div>
                            <div><span style={{ color: "#8884d8" }}>Drift %: </span>{item.drift.pct}%</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
