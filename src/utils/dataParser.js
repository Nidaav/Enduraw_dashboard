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
  // 1. Filtrer les données pour ne conserver que les laps de type 'Intensity'
  const intensityData = data.filter(p => p.lap_nature === 'Intensity');

  // Si aucune donnée 'Intensity' n'est présente, retourne 0 ou un objet vide pour les stats spécifiques.
  if (intensityData.length === 0) {
    return {
      duration: data.length > 0 ? data[data.length - 1].elapsed_time_min_sec : '00:00',
      distance: data.length > 0 ? data[data.length - 1].distance - data[0].distance : 0,
      avgSpeed: 0,
      maxSpeed: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      elevationGain: calculateElevationGain(data.map(p => p.altitude || p.enhanced_altitude).filter(Boolean))
    };
  }

  // 2. Calculer les statistiques uniquement sur 'intensityData'
  const speeds = intensityData.map(p => p.speed_kmh).filter(Boolean);
  const heartRates = intensityData.map(p => p.heart_rate).filter(Boolean);

  const allAltitudes = data.map(p => p.altitude || p.enhanced_altitude).filter(Boolean);
  const totalDuration = data.length > 0 ? data[data.length - 1].elapsed_time_min_sec : '00:00';
  const totalDistance = data.length > 0 ? data[data.length - 1].distance - data[0].distance : 0;

  return {
    duration: totalDuration, 
    distance: totalDistance, 
    elevationGain: calculateElevationGain(allAltitudes),
    avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b) / speeds.length : 0,
    maxSpeed: Math.max(...speeds),
    avgHeartRate: heartRates.length > 0 ? heartRates.reduce((a, b) => a + b) / heartRates.length : 0,
    maxHeartRate: Math.max(...heartRates),
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