import React, { useState, useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Legend 
} from 'recharts';

// Définition des métriques et de leurs propriétés
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
    // État pour la valeur sélectionnée dans le <select> ('ALL', 'S1', '1', '2', etc.)
    const [selectedValue, setSelectedValue] = useState('ALL'); 
    const [selectedMetrics, setSelectedMetrics] = useState(['speed_kmh', 'heart_rate']);
    
    // --- Prétraitement et identification des Laps disponibles ---
    const { processedData, lapOptions, seriesOptions, allOptionsMap } = useMemo(() => {
        if (!data) return { processedData: [], lapOptions: [], seriesOptions: [], allOptionsMap: {} };

        // ÉTAPE 1: Traitement initial des données
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
            temperature: point['temperature\r'] || point.temperature, 
            vertical_oscillation: point.vertical_oscillation,
            altitude: point.altitude,
            lap_number: point.lap_number,
            distance: (point.distance) / 1000,
        }));
        
        // ÉTAPE 2: Détermination des laps
        const maxLap = processed.reduce((max, point) => Math.max(max, point.lap_number || 0), 0);
        
        // Options pour les laps individuels (value en string)
        const laps = Array.from({ length: maxLap }, (_, i) => i + 1);
        const lOptions = laps.map(lap => ({ 
            value: lap.toString(), 
            label: `Lap ${lap}` 
        }));
        
        // Options pour les séries
        const sOptions = [
            { value: 'Warmup', label: 'Warm-up', laps: [1, 2, 3] },
            { value: 'S1', label: 'Serie 1', laps: Array.from({ length: 15 }, (_, i) => i + 4) },
            { value: 'S2', label: 'Serie 2', laps: Array.from({ length: 15 }, (_, i) => i + 20) },
            { value: 'Cooldown', label: 'Cool-down', laps: [35] },
            { value: 'ALL', label: 'Entire session', laps: laps },
        ];
        
        // Mappage rapide pour la logique de filtrage
        const map = {};
        [...sOptions, ...lOptions].forEach(opt => {
            map[opt.value] = opt;
        });

        return { processedData: processed, lapOptions: lOptions, seriesOptions: sOptions, allOptionsMap: map };
    }, [data]);

    // --- Calcule le tableau des laps à afficher (Array de numéros) ---
    const lapsToDisplay = useMemo(() => {
        if (selectedValue === 'ALL' && allOptionsMap['ALL']) {
            return allOptionsMap['ALL'].laps;
        }

        // Si la valeur est une série ('S1', 'Warmup', etc.)
        if (allOptionsMap[selectedValue] && allOptionsMap[selectedValue].laps) {
            return allOptionsMap[selectedValue].laps;
        }

        // Si la valeur est un lap individuel (nombre converti en string)
        const lapNumber = Number(selectedValue);
        if (lapNumber > 0) {
            return [lapNumber];
        }

        // Par défaut (devrait être 'ALL' au début)
        return allOptionsMap['ALL'] ? allOptionsMap['ALL'].laps : [];
    }, [selectedValue, allOptionsMap]);


    // --- Application du filtre Lap et création de la clé d'axe X ---
    const isSingleLapView = lapsToDisplay.length === 1 && selectedValue !== 'ALL';

    const chartData = useMemo(() => {
        let filteredData;
        
        // Si plus d'un lap est sélectionné (série ou tout)
        if (lapsToDisplay.length > 1 && selectedValue === 'ALL') {
            filteredData = processedData; 
        } else {
            // Filtre par le tableau des laps à afficher
            filteredData = processedData.filter(point => lapsToDisplay.includes(point.lap_number));
        }
        
        // Ajout de la clé 'lap_time_key' pour l'axe X
        return filteredData.map(point => ({
             ...point,
             // Utilise le temps du Lap (elapsed_time_in_lap_s) uniquement si un seul lap est sélectionné
             lap_time_key: isSingleLapView ? point.elapsed_time_in_lap_s : point.moving_elapsed_time_s
        }));

    }, [processedData, lapsToDisplay, isSingleLapView, selectedValue]);

    // Gère le changement de case à cocher (inchangé)
    const handleCheckboxChange = (key) => {
        setSelectedMetrics(prev => 
            prev.includes(key)
                ? prev.filter(item => item !== key)
                : [...prev, key]
        );
    };

    // Gère le changement de Lap/Série (met à jour le string selectedValue)
    const handleLapChange = (event) => {
        setSelectedValue(event.target.value);
    };

    const activeMetrics = Object.keys(METRICS)
        .filter(key => selectedMetrics.includes(key) && key !== 'lap_number');
    
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

    // --- Custom Tooltip (inchangé) ---
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            
            const point = payload[0].payload; 
            
            if (!point) return null;

            return (
                <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <p className="label" style={{ fontWeight: 'bold' }}>
                        Lap: {point.lap_number} | Dist: {point.distance.toFixed(2)}kms | Time: {point.elapsed_time}
                    </p>
                    {payload.map((p, i) => {
                        const metricConfig = METRICS[p.dataKey];
                        const unit = metricConfig ? metricConfig.unit : '';
                        return (
                            <p key={i} style={{ color: p.stroke, margin: '2px 0' }}>
                                {`${p.name} : ${p.dataKey === 'temperature' ? p.value : p.value !== undefined ? p.value : 'N/A'} ${unit}`}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    // --- Composant de contrôle ---
    const Controls = () => (
        <div 
            className="chart-controls" 
            style={{
                backgroundColor: '#1E1E1E', 
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #333',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
            }}
        >            
            {/* SÉLECTION DU LAP / SÉRIE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select 
                    id="lap-select" 
                    value={selectedValue} 
                    onChange={handleLapChange}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        backgroundColor: '#333',
                        color: '#FAFAFA',
                        border: '1px solid #666',
                        minWidth: '220px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="ALL">Entire session</option>
                    
                    <optgroup label="Series">
                        {/* Filtre de l'option ALL pour ne pas la dupliquer */}
                        {seriesOptions
                            .filter(opt => opt.value !== 'ALL')
                            .map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                    </optgroup>

                    <optgroup label="Individual Laps">
                        {lapOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>
            
            {/* SÉLECTION DES MÉTRIQUES */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', borderTop: '1px solid #333', paddingTop: '10px' }}>
                {Object.keys(METRICS)
                    .filter(key => key !== 'lap_number') 
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
            <Controls />
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart 
                    data={chartData} 
                    margin={{ top: 10, right: 40, left: 40, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    
                    <XAxis 
                        dataKey="lap_time_key" 
                        type="number"
                        domain={['auto', 'auto']}
                        interval="preserveStartEnd" 
                        stroke="#FAFAFA"
                        tickFormatter={(totalSeconds) => {
                            if (totalSeconds === undefined) return '';
                            const minutes = Math.floor(totalSeconds / 60);
                            const seconds = Math.floor(totalSeconds % 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        }}
                        label={{ 
                            value: isSingleLapView ? 'Lap duration (min:sec)' : 'Total duration (min:sec)', 
                            position: 'right', 
                            offset: 15, 
                            dy: 14,
                            style: { textAnchor: 'end', fill: '#FAFAFA' }
                        }}
                    />
                    
                    {/* Les Axes Y filtrés */}
                    {yAxisConfigurations}

                    <Tooltip content={<CustomTooltip chartData={chartData} />} />

                    <Legend wrapperStyle={{ color: '#FAFAFA' }} />

                    {activeAreas}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MultiMetricChart;