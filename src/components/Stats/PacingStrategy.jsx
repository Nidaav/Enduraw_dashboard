import React from 'react';

// Données de l'analyse de stratégie d'allure (hardcodées pour correspondre au texte d'analyse)
const PACING_DATA = [
    {
        metric: 'Avg Speed (km/h)',
        fr: '21.5', // Fast Start/Relax
        pb: '21.8', // Progressive Build
        diff: '+0.3',
        conclusion: 'More effective (Higher Speed)',
        color: '#82ca9d', // Vert
    },
    {
        metric: 'HR Amplitude (bpm)',
        fr: '18.5',
        pb: '16.0',
        diff: '-2.5',
        conclusion: 'More economical (Lower Stress)',
        color: '#ffc658', // Jaune
    },
];

const PacingStrategyTable = () => {
    // Styles pour les cellules du tableau
    const cellStyle = { padding: '12px 10px', textAlign: 'center', border: '1px solid #333' };
    const headerStyle = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#2A2A2A' };
    const rowStyle = (index) => ({
        borderBottom: '1px solid #333',
        backgroundColor: index % 2 === 0 ? '#1E1E1E' : '#252525',
    });

    return (
        <div style={{
            backgroundColor: '#1E1E1E',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #333',
        }}>
            <table style={{
                borderCollapse: 'collapse',
                width: '100%',
                color: '#FAFAFA',
                fontSize: '0.9em'
            }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #555' }}>
                        <th style={{ ...headerStyle, textAlign: 'left' }}>Metric</th>
                        <th style={headerStyle}>Fast Start/Relax (F-R)</th>
                        <th style={headerStyle}>Progressive Build (P-B)</th>
                        <th style={headerStyle}>Difference (P-B vs F-R)</th>
                        <th style={headerStyle}>Conclusion</th>
                    </tr>
                </thead>
                <tbody>
                    {PACING_DATA.map((item, index) => (
                        <tr key={item.metric} style={rowStyle(index)}>
                            <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold' }}>{item.metric}</td>
                            <td style={cellStyle}>{item.fr}</td>
                            <td style={cellStyle}>{item.pb}</td>
                            <td style={{ ...cellStyle, color: item.diff.startsWith('+') ? '#82ca9d' : '#ffc658', fontWeight: 'bold' }}>
                                {item.diff}
                            </td>
                            <td style={{ ...cellStyle, color: item.color }}>
                                {item.conclusion}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PacingStrategyTable;