import React, { useState, useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Legend 
} from 'recharts';

// Définition des métriques et de leurs propriétés (inchangée)
const METRICS = {
    speed_kmh: { name: 'Speed', color: '#8884d8', unit: 'km/h', yId: 'speed', type: 'monotone', domain: ['auto', 'auto'] },
    heart_rate: { name: 'HR', color: '#a53862ff', unit: 'bpm', yId: 'hr', type: 'monotone', domain: ['auto', 'auto'] },
    cadence: { name: 'Cadence', color: '#a4de6c', unit: 'spm', yId: 'cadence', type: 'monotone', domain: ['auto', 'auto'] },
    stance_time: { name: 'Stance Time', color: '#ff7300', unit: '%', yId: 'stance_stime', type: 'monotone', domain: ['auto', 'auto'] },
    step_length: { name: 'Step Length', color: '#1f77b4', unit: 'mm', yId: 'step_length', type: 'monotone', domain: ['auto', 'auto'] },
    vertical_oscillation: { name: 'Vertical oscillation', color: '#9467bd', unit: 'mm', yId: 'vertical_oscillation', type: 'monotone', domain: ['auto', 'auto'] },
    temperature: { name: 'Temperature', color: '#ffc658', unit: '°C', yId: 'temp', type: 'monotone', domain: ['auto', 'auto'] },
    altitude: { name: 'Altitude', color: '#00c49f', unit: 'm', yId: 'alt', type: 'monotone', domain: ['auto', 'auto'] },
    // Lap devient un outil de filtrage.
    lap_number: { name: 'Lap', color: '#f54291', isFilter: true } 
};


const MultiMetricChart = ({ data }) => {
    const [selectedLap, setSelectedLap] = useState(0); 
    const [selectedMetrics, setSelectedMetrics] = useState(['speed_kmh', 'heart_rate']);
    
    // --- Prétraitement et identification des Laps disponibles ---
    const { processedData, availableLaps } = useMemo(() => {
        if (!data) return { processedData: [], availableLaps: [] };

        const processed = data.map((point, index) => ({
            index,
            elapsed_time: point.elapsed_time_min_sec,
            moving_elapsed_time_s: point.moving_elapsed_time_s || index,
            elapsed_time_in_lap_s: point.elapsed_time_in_lap_s || 0,
            speed_kmh: point.speed_kmh,
            heart_rate: point.heart_rate,
            cadence: point.cadence_step_per_min,
            stance_time: point.stance_time_percent,
            step_length: point.step_length,
            temperature: point.temperature,
            vertical_oscillation: point.vertical_oscillation,
            altitude: point.altitude,
            lap_number: point.lap_number,
            distance: (point.distance) / 1000,
        }));
        
        const laps = [...new Set(processed.map(p => p.lap_number))]
            .filter(n => n !== undefined && n !== null)
            .sort((a, b) => a - b);
            
        return { processedData: processed, availableLaps: laps };

    }, [data]);
    
    // --- Application du filtre Lap et création de la clé d'axe X ---
    const chartData = useMemo(() => {
        let filteredData;
        
        if (selectedLap === 0) {
            filteredData = processedData; 
        } else {
            filteredData = processedData.filter(point => point.lap_number === selectedLap);
        }
        
        // Ajout de la clé 'lap_time_key' qui sera utilisée pour l'axe X.
        // Cela garantit que le temps du Lap commence à 0 lorsque nous zoomons.
        return filteredData.map(point => ({
             ...point,
             lap_time_key: selectedLap === 0 ? point.moving_elapsed_time_s : point.elapsed_time_in_lap_s
        }));

    }, [processedData, selectedLap]);


    // Gère le changement de case à cocher (inchangé)
    const handleCheckboxChange = (key) => {
        setSelectedMetrics(prev => 
            prev.includes(key)
                ? prev.filter(item => item !== key)
                : [...prev, key]
        );
    };

    // Gère le changement de Lap (inchangé)
    const handleLapChange = (event) => {
        setSelectedLap(Number(event.target.value));
    };


    // Filtre les objets METRICS pour n'avoir que ceux sélectionnés
    const activeMetrics = Object.keys(METRICS)
        .filter(key => selectedMetrics.includes(key) && key !== 'lap_number');

    
    // --- Configuration des Axes Y (inchangé) ---
    const yAxisConfigurations = activeMetrics
        .map((key, index) => {
            const metric = METRICS[key];
            const orientation = index % 2 === 0 ? 'left' : 'right';
            const stroke = metric.color;

            return (
                <YAxis 
                    key={metric.yId}
                    yAxisId={metric.yId}
                    orientation={orientation}
                    stroke={stroke}
                    domain={metric.domain}
                    tickFormatter={(value) => `${value}`}
                    label={{ 
                        value: metric.unit, 
                        position: 'top', 
                        offset: -10, 
                        angle: orientation === 'left' ? -90 : 90, 
                        style: { textAnchor: 'middle' },
                        dx: orientation === 'left' ? -20 : 20
                    }}
                />
            );
        });

    // --- Rendu des Tracés (Area) (inchangé) ---
    const activeAreas = activeMetrics.map(key => {
        const metric = METRICS[key];
        return (
            <Area
                key={key}
                yAxisId={metric.yId}
                type={metric.type}
                dataKey={key}
                name={metric.name}
                stroke={metric.color}
                fill={metric.color}
                fillOpacity={0.5}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={true}
            />
        );
    });

    // --- CORRECTION CLÉ 2: Custom Tooltip ---
    const CustomTooltip = ({ active, payload, label }) => {
        // Le Tooltip doit s'afficher si 'active' est vrai et qu'il y a des données.
        if (active && payload && payload.length) {
            
            // CORRECTION: Récupérer le point de données complet à partir du payload[0].payload, 
            // car l'index ('label') n'est pas fiable avec un axe X de type 'number'.
            const point = payload[0].payload; 
            
            if (!point) return null;

            return (
                <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <p className="label" style={{ fontWeight: 'bold' }}>
                        Lap: {point.lap_number} | Dist: {point.distance.toFixed(2)}kms | Temps: {point.elapsed_time}
                    </p>
                    {payload.map((p, i) => {
                        const metricConfig = METRICS[p.dataKey];
                        const unit = metricConfig ? metricConfig.unit : '';
                        return (
                            <p key={i} style={{ color: p.stroke, margin: '2px 0' }}>
                                {`${p.name} : ${p.value !== undefined ? p.value.toFixed(2) : 'N/A'} ${unit}`}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    // Composant de contrôle avec les Checkboxes et le Sélecteur de Lap (inchangé)
    const Controls = () => (
        <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* SÉLECTION DU LAP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="lap-select" style={{ fontWeight: 'bold' }}>Zoom Lap :</label>
                <select 
                    id="lap-select" 
                    value={selectedLap} 
                    onChange={handleLapChange}
                    style={{ padding: '5px', borderRadius: '4px' }}
                >
                    <option value={0}>Toute la séance</option>
                    {availableLaps.map(lap => (
                        <option key={lap} value={lap}>Lap {lap}</option>
                    ))}
                </select>
            </div>
            
            {/* SÉLECTION DES MÉTRIQUES */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                {Object.keys(METRICS)
                    .filter(key => key !== 'lap_number') // Exclure le lap_number des checkboxes
                    .map(key => (
                    <label key={key} style={{ color: METRICS[key].color, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={selectedMetrics.includes(key)}
                            onChange={() => handleCheckboxChange(key)}
                            style={{ accentColor: METRICS[key].color, marginRight: '5px' }}
                        />
                        {METRICS[key].name}
                    </label>
                ))}
            </div>
        </div>
    );


    return (
        <div className="chart">
            <h3>Analyse Multi-Métriques</h3>
            <Controls />
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart 
                    data={chartData} 
                    margin={{ top: 10, right: 40, left: 40, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* --- CORRECTION CLÉ 1: Axe X --- */}
                    <XAxis 
                        dataKey="lap_time_key" // Utiliser la clé qui contient le temps du lap en secondes
                        type="number" // Clé importante pour que Recharts traite la donnée comme un axe de temps continu
                        domain={['auto', 'auto']}
                        interval="preserveStartEnd" // Meilleur intervalle pour les axes de type 'number'
                        // Formatter la valeur (qui est en secondes) en min:sec
                        tickFormatter={(totalSeconds) => {
                            if (totalSeconds === undefined) return '';
                            const minutes = Math.floor(totalSeconds / 60);
                            const seconds = Math.floor(totalSeconds % 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        }}
                        label={{ 
                            value: selectedLap === 0 ? 'Temps Total (min:sec)' : 'Temps du Lap (min:sec)', 
                            position: 'right', 
                            offset: 15, 
                            dy: 14,
                            style: { textAnchor: 'end' }
                        }}
                    />
                    
                    {/* Les Axes Y filtrés */}
                    {yAxisConfigurations}

                    {/* Le Tooltip corrigé */}
                    <Tooltip content={<CustomTooltip chartData={chartData} />} />

                    <Legend />

                    {activeAreas}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MultiMetricChart;