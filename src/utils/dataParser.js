export const parseActivityData = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  const points = lines.slice(1).map(line => {
    const values = line.split(',');
    const point = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      point[header] = parseValue(value);
    });
    
    return point;
  }).filter(point => point.timestamp);

  const laps = detectLaps(points);
  
  return { points, laps };
};

const parseValue = (value) => {
  if (!value || value === '') return null;
  
  // Parse les nombres
  if (!isNaN(value)) return parseFloat(value);
  
  // Parse les dates
  if (value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    return new Date(value).getTime();
  }
  
  return value;
};

export const detectLaps = (points) => {

  const lapNumbers = [...new Set(points.map(p => p["lap_number "]).filter(Boolean))];
  // const lapNumbers = [...new Set(points.map(p => p["lap_number "]).filter(p => p !== null && p !== undefined))];

  return lapNumbers.map(lapNumber => {
    const lapPoints = points.filter(p => p.lap_number === lapNumber);
    return {
      number: lapNumber,
      startTime: lapPoints[0]?.timestamp,
      endTime: lapPoints[lapPoints.length - 1]?.timestamp,
      pointCount: lapPoints.length
    };
  });
};

export const calculateStats = (data) => {
  const speeds = data.map(p => p.speed || p.enhanced_speed).filter(Boolean);
  const speedsInKmH = speeds.map(s => s * 3.6);
  const heartRates = data.map(p => p.heart_rate).filter(Boolean);
  const altitudes = data.map(p => p.altitude || p.enhanced_altitude).filter(Boolean);

  return {
    duration: data.length > 0 ? data[data.length - 1].timestamp - data[0].timestamp : 0,
    distance: data.length > 0 ? data[data.length - 1].distance - data[0].distance : 0,
    avgSpeed: speedsInKmH.length > 0 ? speedsInKmH.reduce((a, b) => a + b) / speedsInKmH.length : 0,
    maxSpeed: Math.max(...speedsInKmH),
    avgHeartRate: heartRates.length > 0 ? heartRates.reduce((a, b) => a + b) / heartRates.length : 0,
    maxHeartRate: Math.max(...heartRates),
    elevationGain: calculateElevationGain(altitudes)
  };
};

const calculateElevationGain = (altitudes) => {
  let gain = 0;
  for (let i = 1; i < altitudes.length; i++) {
    const diff = altitudes[i] - altitudes[i - 1];
    if (diff > 0) gain += diff;
  }
  return gain;
};