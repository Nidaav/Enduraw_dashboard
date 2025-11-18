import React, { useMemo } from 'react';

// Assurez-vous que PapaParse est installé (npm install papaparse ou yarn add papaparse)
import Papa from 'papaparse'; 

// --- Définition des métriques et des mappings pour le parsing ---

// Mappage des colonnes du CSV vers les clés JS attendues par le composant
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

const StatsTableByRep = ({ csvByLapText }) => { 

    const headers = [
        { label: 'Lap', unit: '' },
        { label: 'Duration', unit: '(s)' },
        { label: 'Avg Speed', unit: '(km/h)' },
        { label: 'Max Speed', unit: '(km/h)' },
        { label: 'Avg HR', unit: '(bpm)' },
        { label: 'Max HR', unit: '(bpm)' },
        { label: 'Avg Cadence', unit: '(step/min)' },
        { label: 'Avg Step Length', unit: '(mm)' },
        { label: 'Avg Stance Time', unit: '(ms)' },
        { label: 'Avg Stance Time %', unit: '(%)' },
        { label: 'Avg Vertical Ratio', unit: '' },
    ];

    // 1. Parsing et Transformation des données CSV
    const rawPerformanceDataPerLap = useMemo(() => {
        if (!csvByLapText) return [];

        const parsed = Papa.parse(csvByLapText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
        });

        // Filtrer uniquement les laps d'intensité
        const intensityLaps = parsed.data.filter(row => row.lap_nature === 'Intensity');

        // Transformer et formater les données
        return intensityLaps.map((row, index) => {
            const lap_num = index + 1;
            
            // Création de la série (Série 1 : laps 1-8, Série 2 : laps 9-16, etc. / 8 laps par série)
            const series_num = Math.floor(index / 8) + 1; 

            // Helper to get the correct CSV column name from the JS key
            const getCsvColumn = (jsKey) => Object.keys(COLUMN_MAPPING).find(key => COLUMN_MAPPING[key] === jsKey);

            const data = {
                lap: lap_num,
                series: series_num,
                // Appliquer les mappings et le formatage. On convertit en nombre pour les agrégations.
                // Attention: Les toFixed() ici servent à garantir la précision stockée AVANT agrégation.
                duration: Number(parseFloat(row[getCsvColumn('duration')] || 0).toFixed(3)),
                avgSpeed: Number(parseFloat(row[getCsvColumn('avgSpeed')] || 0).toFixed(2)),
                maxSpeed: Number(parseFloat(row[getCsvColumn('maxSpeed')] || 0).toFixed(2)),
                avgHR: Number(parseFloat(row[getCsvColumn('avgHR')] || 0).toFixed(0)),
                maxHR: Number(parseFloat(row[getCsvColumn('maxHR')] || 0).toFixed(0)),
                avgCadence: Number(parseFloat(row[getCsvColumn('avgCadence')] || 0).toFixed(1)),
                avgStepLength: Number(parseFloat(row[getCsvColumn('avgStepLength')] || 0).toFixed(0)),
                avgStanceTime: Number(parseFloat(row[getCsvColumn('avgStanceTime')] || 0).toFixed(1)),
                avgSTP: Number(parseFloat(row[getCsvColumn('avgSTP')] || 0).toFixed(2)),
                avgVR: Number(parseFloat(row[getCsvColumn('avgVR')] || 0).toFixed(2)),
            };

            return data;
        });
    }, [csvByLapText]);

    // 2. Fonctions de résumé et agrégations
    const getSeriesSummary = (data, series) => {
        const seriesData = data.filter(d => d.series === series);
        if (seriesData.length === 0) return { avgDuration: 0, avgHR: 0, avgSpeed: 0, avgVR: 0, avgSTP: 0, avgCadence: 0, avgStepLength: 0, avgStanceTime: 0 };
        return {
            // Note: Les calculs sont faits sur les nombres, le .toFixed est pour le formatage final
            avgDuration: (seriesData.reduce((acc, curr) => acc + curr.duration, 0) / seriesData.length).toFixed(1),
            avgSpeed: (seriesData.reduce((acc, curr) => acc + curr.avgSpeed, 0) / seriesData.length).toFixed(2),
            avgHR: (seriesData.reduce((acc, curr) => acc + curr.avgHR, 0) / seriesData.length).toFixed(0),
            avgCadence: (seriesData.reduce((acc, curr) => acc + curr.avgCadence, 0) / seriesData.length).toFixed(2), 
            avgStepLength: (seriesData.reduce((acc, curr) => acc + curr.avgStepLength, 0) / seriesData.length).toFixed(2), 
            avgStanceTime: (seriesData.reduce((acc, curr) => acc + curr.avgStanceTime, 0) / seriesData.length).toFixed(1), 
            avgSTP: (seriesData.reduce((acc, curr) => acc + curr.avgSTP, 0) / seriesData.length).toFixed(1), 
            avgVR: (seriesData.reduce((acc, curr) => acc + curr.avgVR, 0) / seriesData.length).toFixed(2),
        };
    };

    const S1 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 1), [rawPerformanceDataPerLap]);
    const S2 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 2), [rawPerformanceDataPerLap]);
    
    // 3. Comparaison inter-séries (incluant le calcul du Drift)
    const seriesComparison = useMemo(() => {
        // Fonction pour calculer le drift (valeur absolue et pourcentage)
        // Prend en entrée les chaînes de caractères formatées (ex: '37.2', '35.9')
        const calculateDrift = (s1Str, s2Str) => {
            const s1Num = Number(s1Str);
            const s2Num = Number(s2Str);
            const driftAbsolute = s2Num - s1Num;
            // Drift Percent (%) = (Moyenne S2 - Moyenne S1) / Moyenne S1 x 100
            const driftPercent = s1Num !== 0 ? ((s2Num - s1Num) / s1Num) * 100 : 0;
            return {
                driftAbsolute: driftAbsolute.toFixed(2), // Formatage à 2 décimales pour l'affichage
                driftPercent: driftPercent.toFixed(2),   // Formatage à 2 décimales pour l'affichage
            };
        };

        const comparisonData = [
            { metric: 'Avg Duration', s1: S1.avgDuration, s2: S2.avgDuration, unit: 's', trend: Number(S2.avgDuration) < Number(S1.avgDuration) ? 'Improved' : 'Stable' },
            { metric: 'Avg Speed', s1: S1.avgSpeed, s2: S2.avgSpeed, unit: 'km/h', trend: Number(S2.avgSpeed) > Number(S1.avgSpeed) ? 'Increased' : 'Stable' },
            { metric: 'Avg Heart Rate', s1: S1.avgHR, s2: S2.avgHR, unit: 'bpm', trend: Number(S2.avgHR) > Number(S1.avgHR) ? 'Increased' : 'Stable' },
            { metric: 'Avg Cadence', s1: S1.avgCadence, s2: S2.avgCadence, unit: 'spm', trend: Number(S2.avgCadence) > Number(S1.avgCadence) ? 'Increased' : 'Stable' },
            { metric: 'Avg Step length', s1: S1.avgStepLength, s2: S2.avgStepLength, unit: 'mm', trend: Number(S2.avgStepLength) > Number(S1.avgStepLength) ? 'Increased' : 'Stable' },
            { metric: 'Avg Stance time', s1: S1.avgStanceTime, s2: S2.avgStanceTime, unit: 'ms', trend: Number(S2.avgStanceTime) < Number(S1.avgStanceTime) ? 'Improved' : 'Stable' },
            { metric: 'Avg Stance time percent', s1: S1.avgSTP, s2: S2.avgSTP, unit: '%', trend: Number(S2.avgSTP) < Number(S1.avgSTP) ? 'Improved' : 'Stable' },
            { metric: 'Avg Vertical ratio', s1: S1.avgVR, s2: S2.avgVR, unit: '', trend: Number(S2.avgVR) < Number(S1.avgVR) ? 'Improved' : 'Stable' },
        ];

        return comparisonData.map(item => ({
            ...item,
            // Ajout des valeurs de drift calculées
            drift: calculateDrift(item.s1, item.s2),
        }));
    }, [S1, S2]);

    if (!rawPerformanceDataPerLap || rawPerformanceDataPerLap.length === 0) {
        return <div>
            <p style={{color: '#fff'}}>Loading lap intensity data...</p>
        </div>;
    }

    // 4. Rendu de la table (mis à jour pour afficher toutes les colonnes des headers)
    return (
        <div className='MAIN'>
            <div style={{
                backgroundColor: '#1E1E1E', 
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #333',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                }}>
                <table style={{
                    borderCollapse: 'collapse', 
                    width: '100%',
                    color: '#FAFAFA', 
                    fontSize: '0.9em'
                    }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #555' }}>
                            {headers.map((h, index) => (
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
                        {rawPerformanceDataPerLap.map((data, index) => {
                            const isStartOfSeries1 = data.lap === 1;
                            const isStartOfSeries2 = data.lap === 9; // Dépend de la taille de la série (ici 8)
                            const seriesHeaderRow = (isStartOfSeries1 || isStartOfSeries2) && (
                                <tr key={`series-header-${data.series}`} style={{ 
                                    backgroundColor: '#8884d840',
                                    borderTop: '4px solid #8884d8',
                                    borderBottom: '1px solid #8884d8'
                                    }}>
                                    <td colSpan={headers.length} style={{ 
                                        padding: '5px', 
                                        textAlign: 'left', 
                                        fontWeight: 'bold', 
                                        color: '#8884d8'
                                        }}>
                                        Serie {data.series}
                                    </td>
                                </tr>
                            );
                            return (
                                <React.Fragment key={data.lap}>
                                    {seriesHeaderRow}
                                    <tr 
                                        style={{ 
                                            borderBottom: '1px solid #333', 
                                            backgroundColor: index % 2 === 0 ? '#1E1E1E' : '#252525' 
                                            }}>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>
                                            <span style={{ fontWeight: 'bold' }}>{data.lap}</span>
                                        </td>
                                        {/* Utilisation de toFixed() pour formater les nombres pour l'affichage */}
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.duration.toFixed(1)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgSpeed.toFixed(2)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.maxSpeed.toFixed(2)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgHR.toFixed(0)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.maxHR.toFixed(0)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgCadence.toFixed(1)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgStepLength.toFixed(0)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgStanceTime.toFixed(1)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgSTP.toFixed(2)}</td>
                                        <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgVR.toFixed(2)}</td>
                                    </tr>
                                </React.Fragment>
                                );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default StatsTableByRep;