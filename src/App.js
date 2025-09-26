import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import ScrollToTop from './utils/ScrollToTop';
import Dashboard from './components/Pages/Dashboard';
import Home from './components/Pages/Home';
import TrainingTips from './components/Pages/TrainingTips';
import Planning from './components/Pages/Planning';
import './App.css';

function App() {
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    fetch('/activity_data.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        setCsvText(text);
      })
      .catch(error => {
        console.error("Erreur lors du chargement du fichier CSV :", error);
      });
  }, []);

  return (
    <Router>
      <div className="App">
        <nav className="main-nav">
          <ul>
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/analysis">Session analysis</NavLink></li>
            <li><NavLink to="/tips">Feedbacks on your session</NavLink></li>
            <li><NavLink to="/planning">Proposed training plan</NavLink></li>
          </ul>
        </nav>

        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Dashboard csvText={csvText} />} />
          <Route path="/tips" element={<TrainingTips />} />
          <Route path="/planning" element={<Planning />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;