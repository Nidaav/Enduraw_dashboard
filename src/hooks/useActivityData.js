import { useState, useEffect, useMemo, useCallback } from 'react';
import { parseActivityData, calculateStats, detectLaps } from '../utils/dataParser';

export const useActivityData = (csvData) => {
    const [activityData, setActivityData] = useState(null);
    const [selectedLap, setSelectedLap] = useState('all');
    const [timeRange, setTimeRange] = useState({ start: 0, end: 1 });

    useEffect(() => {
        if (csvData) {
            const parsedData = parseActivityData(csvData);
            setActivityData(parsedData);
        }
    }, [csvData]);

    const handleLapChange = useCallback((lapValue) => {
        setSelectedLap(lapValue);   
        // Réinitialiser la plage temporelle lorsque le lap change
        setTimeRange({ start: 0, end: 1 });
    }, []);

    const filteredData = useMemo(() => {
        if (!activityData) return null;
        
        let filtered = activityData.points;
        
        // Filtrage par lap
        if (selectedLap !== 'all') {
            const lapNumber = parseInt(selectedLap, 10);
            filtered = filtered.filter(point => point.lap_number === lapNumber);
        }
        
        // Filtrage par plage temporelle
        const totalPoints = filtered.length;
        const startIndex = Math.floor(timeRange.start * totalPoints);
        const endIndex = Math.floor(timeRange.end * totalPoints);
        
        return filtered.slice(startIndex, endIndex);
    }, [activityData, selectedLap, timeRange]);

    const stats = useMemo(() => {
        return filteredData ? calculateStats(filteredData) : null;
    }, [filteredData]);

    return {
        activityData,
        filteredData,
        stats,
        selectedLap,
        setSelectedLap: handleLapChange,
        timeRange,
        setTimeRange
    };
};