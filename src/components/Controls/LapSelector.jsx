import React from 'react';

const LapSelector = ({ laps, selectedLap, onLapChange }) => {
  return (
    <div className="control-group">
      <label>Lap</label>
      <select 
        value={selectedLap} 
        onChange={(e) => onLapChange(e.target.value)}
        className="lap-selector"
      >
        <option value="all">Every laps</option>
        {laps.map(lap => (
          <option key={lap.number} value={lap.number.toString()}>
            Lap {lap.number}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LapSelector