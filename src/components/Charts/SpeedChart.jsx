import React, { useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Bar, ComposedChart, Cell 
} from 'recharts';

// 1. Définition des phases de la séance et de leurs couleurs
const SESSION_PHASES = [
    { name: 'Échauffement', startLap: 0, endLap: 3, color: '#4CAF50' }, // Vert
    { name: 'Série 1', startLap: 4, endLap: 18, color: '#2196F3' },     // Bleu
    { name: 'Série 2', startLap: 20, endLap: 34, color: '#FF9800' },    // Orange
    { name: 'Retour au calme', startLap: 35, endLap: 35, color: '#F44336' }, // Rouge
];

// Fonction utilitaire pour obtenir la couleur de la phase
const getPhaseColor = (lapNumber) => {
    // Si la donnée n'a pas de lap, ou si c'est une transition, utiliser le gris par défaut
    if (lapNumber === undefined || lapNumber === null) return '#ccc'; 

    const phase = SESSION_PHASES.find(p => lapNumber >= p.startLap && lapNumber <= p.endLap);
    
    // Gérer les laps non définis dans une phase (ex: lap 18)
    if (!phase) return '#ccc'; // Gris pour les transitions/laps hors phase

    return phase.color;
};

// Custom Tooltip pour afficher le contexte de la phase
const CustomTooltip = ({ active, payload, label, chartData }) => {
    if (active && payload && payload.length) {
        const point = chartData[label];
        if (!point) return null;

        // Chercher la phase pour le lap actuel
        const currentPhase = SESSION_PHASES.find(p => 
            point.lap >= p.startLap && point.lap <= p.endLap
        );

        // On affiche les données de Vitesse (Area) et la phase (Bar)
        const speedPayload = payload.find(p => p.dataKey === 'speed');

        return (
            <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold' }}>
                    {point.distance.toFixed(2)} kms - {point.elapsed_time} min
                </p>
                {currentPhase && (
                    <p style={{ color: currentPhase.color, fontWeight: 'bold', margin: '5px 0' }}>
                        Phase: {currentPhase.name}
                    </p>
                )}
                {speedPayload && (
                    <p style={{ color: speedPayload.stroke }}>
                        Vitesse: {speedPayload.value ? `${speedPayload.value.toFixed(2)} km/h` : 'N/A'}
                    </p>
                )}
            </div>
        );
    }
    return null;
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
            // 2. Clé pour le BarChart de fond (toujours à 1 pour remplir)
            background_bar: 1, 
        }));
    }, [data]);

    return (
        <div className="chart">
            <h3>Vitesse (km/h) et Contexte de Séance</h3>
            <ResponsiveContainer width="100%" height={300}>
                {/* Utiliser ComposedChart pour combiner Area et Bar */}
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* Axe X (Temps) - inchangé */}
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
                    
                    {/* Axe Y de Vitesse (principal) */}
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
                    
                    {/* Axe Y pour le graphique de fond (caché) */}
                    <YAxis
                        yAxisId="background"
                        orientation="right"
                        domain={[0, 1]} // Domaine de 0 à 1 pour que la barre soit pleine hauteur
                        hide={true}     // IMPORTANT: Cacher cet axe
                    />

                    {/* Tooltip personnalisé */}
                    <Tooltip
                        content={<CustomTooltip chartData={chartData} />}
                    />

                    {/* 3. BarChart de fond (phase de la séance) */}
                    <Bar 
                        yAxisId="background"
                        dataKey="background_bar" 
                        // fill="#ccc" // Couleur de base
                        isAnimationActive={false}
                        // Espacement des barres: minGap={0} pour qu'elles se touchent
                        barCategoryGap={10} 
                        barGap={10}
                    >
                        {/* Cellules pour appliquer les couleurs de phase */}
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={getPhaseColor(entry.lap)} 
                                // Rendre les barres légèrement transparentes pour voir la grille
                                fillOpacity={0.5}
                            />
                        ))}
                    </Bar>

                    {/* 4. AreaChart de Vitesse (premier plan) */}
                    <Area 
                        yAxisId="speed" // Lier à l'axe de vitesse
                        type="monotone" 
                        dataKey="speed" 
                        stroke="#8884d8"
                        fill="#8884d8" 
                        fillOpacity={0.7} // Moins d'opacité pour mieux voir le fond
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                    
                    {/* (Optionnel) Ajout du Brush si vous en avez besoin */}
                    {/* <Brush dataKey="index" height={30} stroke="#8884d8" /> */}

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