import React from 'react';
import { Slider } from '@mui/material';

const TimeRangeSelector = ({ timeRange, onTimeRangeChange }) => {
  const handleChange = (event, newValue) => {
    onTimeRangeChange({ start: newValue[0] / 100, end: newValue[1] / 100 });
  };

  return (
    <div className="control-group">
      <label>Plage temporelle</label>
      <Slider
        value={[timeRange.start * 100, timeRange.end * 100]}
        onChange={handleChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value}%`}
      />
    </div>
  );
};

export default TimeRangeSelector;