import React,  { useMemo } from 'react';

const StatsTableByRep = ({ filteredData }) => {

  const headers = [
  { label: 'Lap', unit: '' },
  { label: 'Duration', unit: '(s)' },
  { label: 'Avg Speed', unit: '(km/h)' },
  { label: 'Max Speed', unit: '(km/h)' },
  { label: 'Avg HR', unit: '(bpm)' },
  { label: 'Max HR', unit: '(bpm)' },
  { label: 'Avg Cadence', unit: '(step/min)' },
  { label: 'Avg Stance Time', unit: '(ms)' },
  { label: 'Avg Vertical Ration', unit: '(%)' },
  ];

  // const rawPerformanceDataPerLap = [
  //     { lap: 1, series: 1, duration: 35.2, avgSpeed: 20.4, maxSpeed: 21.8, maxHR: 158, avgCadence: 192, avgVR: 7.95, avgSTP: 31.7 },
  //     { lap: 2, series: 1, duration: 34.8, avgSpeed: 20.8, maxSpeed: 22.1, maxHR: 165, avgCadence: 193, avgVR: 7.89, avgSTP: 31.3 },
  //     { lap: 3, series: 1, duration: 34.5, avgSpeed: 21.0, maxSpeed: 22.4, maxHR: 168, avgCadence: 194, avgVR: 7.85, avgSTP: 31.0 },
  //     { lap: 4, series: 1, duration: 34.2, avgSpeed: 21.2, maxSpeed: 22.6, maxHR: 171, avgCadence: 195, avgVR: 7.82, avgSTP: 30.7 },
  //     { lap: 5, series: 1, duration: 34.0, avgSpeed: 21.4, maxSpeed: 22.8, maxHR: 173, avgCadence: 195, avgVR: 7.80, avgSTP: 30.5 },
  //     { lap: 6, series: 1, duration: 33.8, avgSpeed: 21.6, maxSpeed: 23.0, maxHR: 175, avgCadence: 196, avgVR: 7.78, avgSTP: 30.3 },
  //     { lap: 7, series: 1, duration: 33.6, avgSpeed: 21.8, maxSpeed: 23.2, maxHR: 177, avgCadence: 196, avgVR: 7.75, avgSTP: 30.1 },
  //     { lap: 8, series: 1, duration: 33.4, avgSpeed: 21.9, maxSpeed: 23.4, maxHR: 179, avgCadence: 197, avgVR: 7.72, avgSTP: 29.9 },
  //     { lap: 9, series: 2, duration: 33.2, avgSpeed: 22.0, maxSpeed: 23.5, maxHR: 181, avgCadence: 197, avgVR: 7.70, avgSTP: 29.7 },
  //     { lap: 10, series: 2, duration: 33.0, avgSpeed: 22.1, maxSpeed: 23.6, maxHR: 182, avgCadence: 198, avgVR: 7.68, avgSTP: 29.6 },
  //     { lap: 11, series: 2, duration: 32.8, avgSpeed: 22.2, maxSpeed: 23.7, maxHR: 184, avgCadence: 198, avgVR: 7.66, avgSTP: 29.5 },
  //     { lap: 12, series: 2, duration: 32.7, avgSpeed: 22.3, maxSpeed: 23.8, maxHR: 185, avgCadence: 199, avgVR: 7.64, avgSTP: 29.4 },
  //     { lap: 13, series: 2, duration: 32.6, avgSpeed: 22.4, maxSpeed: 23.9, maxHR: 186, avgCadence: 199, avgVR: 7.62, avgSTP: 29.3 },
  //     { lap: 14, series: 2, duration: 32.5, avgSpeed: 22.5, maxSpeed: 24.0, maxHR: 187, avgCadence: 200, avgVR: 7.60, avgSTP: 29.2 },
  //     { lap: 15, series: 2, duration: 32.4, avgSpeed: 22.6, maxSpeed: 24.1, maxHR: 188, avgCadence: 200, avgVR: 7.58, avgSTP: 29.1 },
  //     { lap: 16, series: 2, duration: 32.3, avgSpeed: 22.7, maxSpeed: 24.2, maxHR: 189, avgCadence: 201, avgVR: 7.56, avgSTP: 29.0 },
  //   ];
  
const rawPerformanceDataPerLap = [
  { lap: 1, series: 1, duration: 38.842, avgSpeed: 17.37, maxSpeed: 20.83, avgHR: 154.0, maxHR: 175, avgCadence: 185.8, avgStanceTime: 185.6, avgVR: 6.41 },
  { lap: 2, series: 1, duration: 38.191, avgSpeed: 17.71, maxSpeed: 20.09, avgHR: 154.0, maxHR: 175, avgCadence: 182.3, avgStanceTime: 201.4, avgVR: 7.00 },
  { lap: 3, series: 1, duration: 38.216, avgSpeed: 15.97, maxSpeed: 20.25, avgHR: 167.9, maxHR: 178, avgCadence: 183.7, avgStanceTime: 202.6, avgVR: 6.74 },
  { lap: 4, series: 1, duration: 35.807, avgSpeed: 15.88, maxSpeed: 21.66, avgHR: 167.3, maxHR: 184, avgCadence: 170.4, avgStanceTime: 236.0, avgVR: 4.52 },
  { lap: 5, series: 1, duration: 36.846, avgSpeed: 17.83, maxSpeed: 20.96, avgHR: 173.7, maxHR: 185, avgCadence: 188.8, avgStanceTime: 188.4, avgVR: 6.43 },
  { lap: 6, series: 1, duration: 36.850, avgSpeed: 17.4, maxSpeed: 21.68, avgHR: 171.0, maxHR: 184, avgCadence: 188.3, avgStanceTime: 199.7, avgVR: 6.92 },
  { lap: 7, series: 1, duration: 36.954, avgSpeed: 17.27, maxSpeed: 20.83, avgHR: 173.9, maxHR: 185, avgCadence: 182.4, avgStanceTime: 221.7, avgVR: 6.44 },
  { lap: 8, series: 1, duration: 36.239, avgSpeed: 17.7, maxSpeed: 22.67, avgHR: 173.2, maxHR: 186, avgCadence: 193.6, avgStanceTime: 188.6, avgVR: 7.56 },
  { lap: 9, series: 2, duration: 37.361, avgSpeed: 16.02, maxSpeed: 21.13, avgHR: 154.6, maxHR: 180, avgCadence: 181.5, avgStanceTime: 199.4, avgVR: 8.31 },
  { lap: 10, series: 2, duration: 36.923, avgSpeed: 17.33, maxSpeed: 21.16, avgHR: 172.1, maxHR: 184, avgCadence: 186.2, avgStanceTime: 209.5, avgVR: 6.93 },
  { lap: 11, series: 2, duration: 35.968, avgSpeed: 19.51, maxSpeed: 21.53, avgHR: 173.7, maxHR: 186, avgCadence: 192.9, avgStanceTime: 187.3, avgVR: 5.78 },
  { lap: 12, series: 2, duration: 35.968, avgSpeed: 19.42, maxSpeed: 22.31, avgHR: 179.2, maxHR: 187, avgCadence: 192.3, avgStanceTime: 199.3, avgVR: 5.75 },
  { lap: 13, series: 2, duration: 35.797, avgSpeed: 19.11, maxSpeed: 22.37, avgHR: 175.7, maxHR: 188, avgCadence: 192.1, avgStanceTime: 199.2, avgVR: 5.64 },
  { lap: 14, series: 2, duration: 35.817, avgSpeed: 17.92, maxSpeed: 22.24, avgHR: 176.6, maxHR: 188, avgCadence: 191.3, avgStanceTime: 200.3, avgVR: 6.38 },
  { lap: 15, series: 2, duration: 34.609, avgSpeed: 19.04, maxSpeed: 22.94, avgHR: 176.2, maxHR: 189, avgCadence: 199.9, avgStanceTime: 187.7, avgVR: 5.74 },
  { lap: 16, series: 2, duration: 34.723, avgSpeed: 18.76, maxSpeed: 23.08, avgHR: 181.2, maxHR: 191, avgCadence: 192.9, avgStanceTime: 181.9, avgVR: 7.15 }
];

  const getSeriesSummary = (data, series) => {
      const seriesData = data.filter(d => d.series === series);
      if (seriesData.length === 0) return { avgDuration: 0, avgHR: 0, avgSpeed: 0, avgVR: 0, avgStanceTime: 0 };
      return {
          avgDuration: (seriesData.reduce((acc, curr) => acc + curr.duration, 0) / seriesData.length).toFixed(1),
          avgHR: (seriesData.reduce((acc, curr) => acc + curr.avgHR, 0) / seriesData.length).toFixed(0),
          avgSpeed: (seriesData.reduce((acc, curr) => acc + curr.avgSpeed, 0) / seriesData.length).toFixed(2),
          avgVR: (seriesData.reduce((acc, curr) => acc + curr.avgVR, 0) / seriesData.length).toFixed(2),
          avgStanceTime: (seriesData.reduce((acc, curr) => acc + curr.avgStanceTime, 0) / seriesData.length).toFixed(0),
      };
  };

  const S1 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 1), []);
  const S2 = useMemo(() => getSeriesSummary(rawPerformanceDataPerLap, 2), []);
  
  const seriesComparison = [
    { metric: 'Avg Duration (200m)', s1: S1.avgDuration, s2: S2.avgDuration, unit: 's', trend: S2.avgDuration < S1.avgDuration ? 'Improved' : 'Stable' },
    { metric: 'Avg Max HR', s1: S1.avgHR, s2: S2.avgHR, unit: 'bpm', trend: S2.avgHR > S1.avgHR ? 'Increased' : 'Stable' },
    { metric: 'Avg Speed', s1: S1.avgSpeed, s2: S2.avgSpeed, unit: 'km/h', trend: S2.avgSpeed > S1.avgSpeed ? 'Increased' : 'Stable' },
    { metric: 'Avg Vertical Ratio', s1: S1.avgVR, s2: S2.avgVR, unit: '', trend: S2.avgVR < S1.avgVR ? 'Improved' : 'Stable' },
    { metric: 'Avg Stance Time %', s1: S1.avgStanceTime, s2: S2.avgStanceTime, unit: '%', trend: S2.avgStanceTime < S1.avgStanceTime ? 'Improved' : 'Stable' },
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
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.maxSpeed}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgHR}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.maxHR}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgCadence}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgStanceTime}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', border: '1px solid #333' }}>{data.avgVR}</td>
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