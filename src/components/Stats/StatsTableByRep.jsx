import React,  { useMemo } from 'react';

const StatsTableByRep = ({ filteredData }) => {

  const headers = [
  { label: 'Lap', unit: '' },
  { label: 'Duration', unit: '(s)' },
  { label: 'Avg Speed', unit: '(km/h)' },
  { label: 'Max HR', unit: '(bpm)' },
  { label: 'Avg Cadence', unit: '(step/min)' },
  { label: 'Avg VR', unit: '' },
  { label: 'Avg STP', unit: '(%)' },
  ];

  const rawPerformanceDataPerLap = [
      { lap: 1, series: 1, duration: 35.2, avgSpeed: 20.4, maxSpeed: 21.8, maxHR: 158, avgCadence: 192, avgVR: 7.95, avgSTP: 31.7 },
      { lap: 2, series: 1, duration: 34.8, avgSpeed: 20.8, maxSpeed: 22.1, maxHR: 165, avgCadence: 193, avgVR: 7.89, avgSTP: 31.3 },
      { lap: 3, series: 1, duration: 34.5, avgSpeed: 21.0, maxSpeed: 22.4, maxHR: 168, avgCadence: 194, avgVR: 7.85, avgSTP: 31.0 },
      { lap: 4, series: 1, duration: 34.2, avgSpeed: 21.2, maxSpeed: 22.6, maxHR: 171, avgCadence: 195, avgVR: 7.82, avgSTP: 30.7 },
      { lap: 5, series: 1, duration: 34.0, avgSpeed: 21.4, maxSpeed: 22.8, maxHR: 173, avgCadence: 195, avgVR: 7.80, avgSTP: 30.5 },
      { lap: 6, series: 1, duration: 33.8, avgSpeed: 21.6, maxSpeed: 23.0, maxHR: 175, avgCadence: 196, avgVR: 7.78, avgSTP: 30.3 },
      { lap: 7, series: 1, duration: 33.6, avgSpeed: 21.8, maxSpeed: 23.2, maxHR: 177, avgCadence: 196, avgVR: 7.75, avgSTP: 30.1 },
      { lap: 8, series: 1, duration: 33.4, avgSpeed: 21.9, maxSpeed: 23.4, maxHR: 179, avgCadence: 197, avgVR: 7.72, avgSTP: 29.9 },
      { lap: 9, series: 2, duration: 33.2, avgSpeed: 22.0, maxSpeed: 23.5, maxHR: 181, avgCadence: 197, avgVR: 7.70, avgSTP: 29.7 },
      { lap: 10, series: 2, duration: 33.0, avgSpeed: 22.1, maxSpeed: 23.6, maxHR: 182, avgCadence: 198, avgVR: 7.68, avgSTP: 29.6 },
      { lap: 11, series: 2, duration: 32.8, avgSpeed: 22.2, maxSpeed: 23.7, maxHR: 184, avgCadence: 198, avgVR: 7.66, avgSTP: 29.5 },
      { lap: 12, series: 2, duration: 32.7, avgSpeed: 22.3, maxSpeed: 23.8, maxHR: 185, avgCadence: 199, avgVR: 7.64, avgSTP: 29.4 },
      { lap: 13, series: 2, duration: 32.6, avgSpeed: 22.4, maxSpeed: 23.9, maxHR: 186, avgCadence: 199, avgVR: 7.62, avgSTP: 29.3 },
      { lap: 14, series: 2, duration: 32.5, avgSpeed: 22.5, maxSpeed: 24.0, maxHR: 187, avgCadence: 200, avgVR: 7.60, avgSTP: 29.2 },
      { lap: 15, series: 2, duration: 32.4, avgSpeed: 22.6, maxSpeed: 24.1, maxHR: 188, avgCadence: 200, avgVR: 7.58, avgSTP: 29.1 },
      { lap: 16, series: 2, duration: 32.3, avgSpeed: 22.7, maxSpeed: 24.2, maxHR: 189, avgCadence: 201, avgVR: 7.56, avgSTP: 29.0 },
    ];
  
  const getSeriesSummary = (data, series) => {
      const seriesData = data.filter(d => d.series === series);
      if (seriesData.length === 0) return { avgDuration: 0, avgHR: 0, avgVR: 0, avgSTP: 0 };
      return {
          avgDuration: (seriesData.reduce((acc, curr) => acc + curr.duration, 0) / seriesData.length).toFixed(1),
          avgHR: (seriesData.reduce((acc, curr) => acc + curr.maxHR, 0) / seriesData.length).toFixed(0),
          avgVR: (seriesData.reduce((acc, curr) => acc + curr.avgVR, 0) / seriesData.length).toFixed(2),
          avgSTP: (seriesData.reduce((acc, curr) => acc + curr.avgSTP, 0) / seriesData.length).toFixed(2),
      };
  };

  const S1 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 1), []);
  const S2 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 2), []);
  
  const seriesComparison = [
    { metric: 'Avg Duration (200m)', s1: S1.avgDuration, s2: S2.avgDuration, unit: 's', trend: S2.avgDuration < S1.avgDuration ? 'Improved' : 'Stable' },
    { metric: 'Avg Max HR', s1: S1.avgHR, s2: S2.avgHR, unit: 'bpm', trend: S2.avgHR > S1.avgHR ? 'Increased' : 'Stable' },
    { metric: 'Avg Vertical Ratio', s1: S1.avgVR, s2: S2.avgVR, unit: '', trend: S2.avgVR < S1.avgVR ? 'Improved' : 'Stable' },
    { metric: 'Avg Stance Time %', s1: S1.avgSTP, s2: S2.avgSTP, unit: '%', trend: S2.avgSTP < S1.avgSTP ? 'Improved' : 'Stable' },
  ];


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
            const isStartOfSeries2 = data.lap === 9;
            const seriesHeaderRow = (isStartOfSeries1 || isStartOfSeries2) && (
              <tr key={`series-header-${data.series}`} style={{ 
                backgroundColor: '#8884d840',
                borderTop: isStartOfSeries2 ? '4px solid #8884d8' : 'none',
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
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.duration}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgSpeed}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.maxHR}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgCadence}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgVR}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgSTP}</td>
                </tr>
              </React.Fragment>
              );
          })}
        </tbody>
      </table>
    </div>

    {/* Overall stats */}
    <h2>Inter-series comparison of key metrics</h2>
    <div>
      <div style={{
        backgroundColor: '#1E1E1E', 
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #333',
        display: 'flex', 
        flexDirection: 'row',
        justifyContent: 'space-between',
        }}>
        {seriesComparison.map((item) => (
          <div key={item.metric} style={{fontWeight: 'bold'}}>
            <p>{item.metric}</p>
            <div>
              <div>
                <span style={{color: '#8884d8'}}>S1 Avg: </span>
                <span>{item.s1} {item.unit}</span>
              </div>
              <div>
                <span style={{color: '#8884d8'}}>S2 Avg: </span>
                <span>{item.s2} {item.unit}</span>
              </div>
            </div>
            <p>{item.trend} in Series 2.</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)};

export default StatsTableByRep;