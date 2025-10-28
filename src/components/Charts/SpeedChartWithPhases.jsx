import React, { useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Bar, ComposedChart, Cell 
} from 'recharts';

// 1. Définition des phases de la séance et de leurs couleurs (INCHANGÉ)
const SESSION_PHASES = [
    { name: 'Échauffement', startLap: 0, endLap: 3, color: '#4CAF50' },
    { name: 'Série 1', startLap: 4, endLap: 18, color: '#FF9800' },
    { name: 'Série 2', startLap: 20, endLap: 34, color: '#FF9800' },
    { name: 'Retour au calme', startLap: 35, endLap: 35, color: '#c0b950ff' },
];

// Fonction utilitaire pour obtenir la couleur de la phase (INCHANGÉ)
const getPhaseColor = (lapNumber) => {
    if (lapNumber === undefined || lapNumber === null) return '#ccc'; 

    const phase = SESSION_PHASES.find(p => lapNumber >= p.startLap && lapNumber <= p.endLap);
    
    if (!phase) return '#ccc'; 

    return phase.color;
};


const SpeedChart = ({ data, timeRange, onBrushChange }) => {
    
    // Utiliser useMemo pour optimiser le calcul des données du graphique
    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map((point, index) => ({
            index,
            elapsed_time: point.elapsed_time_min_sec,
            speed: point.speed_kmh,
            distance: (point.distance) / 1000,
            lap: point.lap_number,
            background_bar: 1, 
        }));
    }, [data]);

    return (
        <div className="chart">
            <h3>Vitesse (km/h) et Contexte de Séance</h3>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* Axe X (Temps) */}
                    <XAxis 
                        dataKey="index"
                        interval={75}
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
                    
                    {/* Axes Y */}
                    <YAxis 
                        yAxisId="speed"
                        domain={['auto', 'auto']}
                        label={{ 
                            value: 'km/h', 
                            position: 'top', 
                            offset: 5, 
                            angle: -90,
                            dy: 22,
                            dx: -20,
                        }}
                    />
                    <YAxis
                        yAxisId="background"
                        orientation="right"
                        domain={[0, 1]} 
                        hide={true} 
                    />
                    <Tooltip
                        formatter={(value) => [`${value} km/h`, 'Speed']}
                        labelFormatter={(index) => {
                        const point = chartData[index];
                        return point ? `${point.distance.toFixed(2)} kms - ${point.elapsed_time} min` : '';
                        }}
                    />

                    {/* BarChart de fond (phase de la séance) */}
                    <Bar 
                        yAxisId="background"
                        dataKey="background_bar" 
                        isAnimationActive={false}
                        barCategoryGap={10} 
                        barGap={10}
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={getPhaseColor(entry.lap)} 
                                fillOpacity={0.5}
                            />
                        ))}
                    </Bar>

                    {/* AreaChart de Vitesse (premier plan) */}
                    <Area 
                        yAxisId="speed"
                        type="monotone" 
                        dataKey="speed" 
                        stroke="#8884d8"
                        fill="#8884d8" 
                        fillOpacity={0.7} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
            
            {/* Légende manuelle pour les phases */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '12px' }}>
                {SESSION_PHASES.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center' }}>
                        <span 
                            style={{ 
                                display: 'inline-block', 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: p.color, 
                                opacity: 0.4, 
                                marginRight: '5px',
                                border: '1px solid #ccc' 
                            }}
                        ></span>
                        {p.name} (Laps {p.startLap}-{p.endLap})
                    </div>
                ))}
            </div>

        </div>
    );
};

export default SpeedChart;