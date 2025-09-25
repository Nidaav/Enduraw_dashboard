import { useState, useCallback } from 'react';

export const useChartZoom = (initialRange = { start: 0, end: 1 }) => {
  const [zoomRange, setZoomRange] = useState(initialRange);

  const handleZoom = useCallback((newRange) => {
    setZoomRange(newRange);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomRange({ start: 0, end: 1 });
  }, []);

  return {
    zoomRange,
    handleZoom,
    resetZoom
  };
};