import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/stats');
  };

  return (
    <div className="home-container">
      <h1 className="home-title">ANALYZE YOUR PERFORMANCES WITH ENDURAW<span className="registered-symbol">®</span></h1>
      <p className="home-subtitle">Make data accessible and bring lisibility to our sports.</p>
      <p className="home-subtitle">Made for the best athletes in the world. Why not you ?</p>
      <span className='make-some-space'></span>
      <p className="home-subtitle">The analysis of your last session is ready.</p>
      <button className="start-button" onClick={handleStart}>
        Get Started
      </button>
    </div>
  );
};

export default Home;