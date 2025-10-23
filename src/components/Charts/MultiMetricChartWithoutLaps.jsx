import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from 'recharts';

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
    // lap_number: { name: 'Lap', color: '#f54291', isFilter: true } 
};

const MultiMetricChart = ({ data }) => {
    // État pour stocker les clés des métriques sélectionnées (par défaut, rien)
    const [selectedMetrics, setSelectedMetrics] = useState(['speed_kmh', 'heart_rate']);

    // Prétraitement des données (similaire à vos autres composants)
    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map((point, index) => ({
            index,
            elapsed_time: point.elapsed_time_min_sec,
            // Assurez-vous que toutes les métriques utilisées sont mappées ici
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
    }, [data]);

    // Gère le changement de case à cocher
    const handleCheckboxChange = (key) => {
        setSelectedMetrics(prev => 
            prev.includes(key)
                ? prev.filter(item => item !== key)
                : [...prev, key]
        );
    };

    // Filtre les objets METRICS pour n'avoir que ceux sélectionnés
    const activeMetrics = Object.keys(METRICS).filter(key => selectedMetrics.includes(key));

    // Récupère les configurations des axes Y actifs
    const activeYAxes = activeMetrics.map(key => METRICS[key].yId);
    
    // Pour placer les axes Y correctement (gauche/droite)
    const yAxisConfigurations = activeMetrics.map((key, index) => {
        const metric = METRICS[key];
        // Alterner l'orientation pour éviter le chevauchement (gauche/droite)
        const orientation = index % 2 === 0 ? 'left' : 'right';
        const stroke = metric.color;

        return (
            <YAxis 
                key={metric.yId}
                yAxisId={metric.yId}
                orientation={orientation}
                stroke={stroke}
                domain={metric.domain}
                // Si la métrique a explicitement demandé à cacher l'axe (comme les laps)
                hide={!!metric.hideAxis}
                tickFormatter={(value) => `${value}`} // Simplifie l'affichage du tick
                label={{ 
                    value: metric.unit, 
                    position: 'top', 
                    offset: -10, 
                    angle: orientation === 'left' ? -90 : 90, 
                    style: { textAnchor: 'middle' },
                    // Ajustement des décalages pour la lisibilité
                    dx: orientation === 'left' ? -20 : 20
                }}
            />
        );
    });

    // Construit les composants Area actifs
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
                connectNulls={true} // Optionnel: pour relier les points s'il y a des 'null' (ex: température)
            />
        );
    });

    // Custom Tooltip pour afficher les données des métriques actives
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const index = label;
            const point = chartData[index];

            return (
                <div style={{ backgroundColor: '#1a1a1a', padding: '4px', border: '1px solid #ccc' }}>
                    <p className="label">
                        Distance : {point ? point.distance.toFixed(2) : ''}km - Temps : {point ? point.elapsed_time : ''}
                    </p>
                    {payload.map((p, i) => {
                        // Utilise l'unité définie dans METRICS pour l'affichage
                        const metricConfig = METRICS[p.dataKey];
                        const unit = metricConfig ? metricConfig.unit : '';
                        return (
                            <p key={i} style={{ color: p.stroke }}>
                                {`${p.name} : ${p.value !== undefined ? p.value.toFixed(2) : 'N/A'} ${unit}`}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    // Composant de contrôle avec les Checkboxes
    const CheckboxControls = () => (
        <div style={{ marginBottom: '10px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {Object.keys(METRICS).map(key => (
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
    );

    return (
        <div className="chart">
            <h3>Analyse Multi-Métriques</h3>
            <CheckboxControls />
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart 
                    data={chartData} 
                    margin={{ top: 10, right: 40, left: 40, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* Axe X (Temps) */}
                    <XAxis 
                        dataKey="index"
                        interval={75} // Intervalle par défaut pour le temps
                        tickFormatter={(value) => {
                            const point = chartData[value];
                            return point ? point.elapsed_time : '';
                        }}
                        label={{ 
                            value: 'min:sec', 
                            position: 'right', 
                            offset: 15, 
                            dy: 14,
                            style: { textAnchor: 'end' }
                        }}
                    />
                    
                    {/* Les Axes Y générés dynamiquement */}
                    {yAxisConfigurations}

                    {/* Le Tooltip personnalisé */}
                    <Tooltip content={<CustomTooltip chartData={chartData} />} />

                    {/* La Légende (très importante pour le contexte des couleurs) */}
                    <Legend />

                    {/* Les Tracés de données générés dynamiquement */}
                    {activeAreas}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MultiMetricChart;