import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import ScrollToTop from './utils/ScrollToTop';
import Dashboard from './components/Pages/Dashboard';
import Analysis from './components/Pages/Analysis';
import Home from './components/Pages/Home';
import TrainingTips from './components/Pages/TrainingTips';
import Planning from './components/Pages/Planning';
import './App.css';

function App() {
  const [csvText, setCsvText] = useState('');
  const [csvByLapText, setCsvByLapText] = useState('');

  useEffect(() => {
    // Chargement du fichier principal
    fetch('/activity_data.csv')
      .then(response => {
        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
        return response.text();
      })
      .then(setCsvText)
      .catch(error => console.error("Erreur lors du chargement de activity_data.csv :", error));

    // Chargement du fichier par lap
    fetch('/activity_data_by_lap.csv')
      .then(response => {
        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
        return response.text();
      })
      .then(setCsvByLapText)
      .catch(error => console.error("Erreur lors du chargement de activity_data_by_lap.csv :", error));
  }, []);

  return (
    <Router>
      <div className="App">
        <nav className="main-nav">
          <ul>
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/stats">Session stats</NavLink></li>
            <li><NavLink to="/analysis">Data analysis</NavLink></li>
            <li><NavLink to="/tips">Feedbacks on your session</NavLink></li>
            <li><NavLink to="/planning">Proposed training plan</NavLink></li>
          </ul>
        </nav>

        <ScrollToTop />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Dashboard csvText={csvText} />} />
          <Route 
            path="/analysis" 
            element={<Analysis csvText={csvText} csvByLapText={csvByLapText} />} 
          />
          <Route path="/tips" element={<TrainingTips />} />
          <Route path="/planning" element={<Planning />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;