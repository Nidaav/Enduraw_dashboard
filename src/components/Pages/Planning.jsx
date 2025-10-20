import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Planning = () => {
    const [date, setDate] = useState(new Date());
    const [showPopup, setShowPopup] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    // Données d'entraînement
    const trainingSessions = [
        { date: '2025-10-20', workout: 'Basic endurance (1h)', details: 'Steady pace, 60-70% Max Heart Rate.' },
        { date: '2025-10-21', workout: 'Interval training session on track (5 x 1000m)', details: 'Run 5 repetitions of 1000m at 90% Max Heart Rate, with 2-minute jog recovery.' },
        { date: '2025-10-23', workout: 'Double session day : Basic endurance (30min) & Strength Training', details: 'Very light run at 60% Max Heart Rate just to deeply warm up the muscles. Then a trail-oriented strength training session. Working the legs in concentric and eccentric movements, as well as the core and overall stability.' },
        { date: '2025-10-24', workout: 'Basic endurance (45min)', details: 'Steady pace, 60-70% Max Heart Rate.' },
        { date: '2025-10-25', workout: 'Interval training session on trail (3 x 6min uphill)', details: 'Find a consistant hill. Set yourself around 85%-90% for 6 minutes, then walk/jog down for recovery. Focus on maintaining power throughout the interval.' },
        { date: '2025-10-26', workout: 'Long run (1h30)', details: 'Aerobic zone: bring a small backpack with sports drinks and food to simulate race conditions.' },
    ];

    const findWorkout = (dateString) => {
        return trainingSessions.find((s) => s.date === dateString);
    };

    const handleDayClick = (clickedDate) => {
        setDate(clickedDate);
        const dateString = clickedDate.toISOString().slice(0, 10);
        
        const session = findWorkout(dateString);

        if (session) {
            setSelectedWorkout(session);
            setShowPopup(true); 
        }
    };


    const tileContent = ({ date, view }) => {
        if (view === 'month') { 
            const session = trainingSessions.find((s) => s.date === date.toISOString().slice(0, 10));

            if (session) {
              return (
                <div className="training-dot">
                  <span className="training-label">{session.workout}</span>
                </div>
              );
            }

        }
        return null;
    };
    
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().slice(0, 10);
            const hasSession = findWorkout(dateString);
            return hasSession ? 'has-workout' : '';
        }
    };


    return (
        <div className="page-container">
            <h1>Training Plan</h1>
            <h4>Here is a suggested training program that will help you achieve your goals.</h4>
            <h4>The first week is available and free of charge. To access the rest of the plan, subscribe to Enduraw® personalized support.</h4>
            
            <div className="calendar-container">
                <Calendar 
                    onChange={setDate}
                    value={date}
                    locale="en-US"
                    view="month" 
                    showNumberOfWeeks={1} 
                    onClickDay={handleDayClick} 
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                />
            </div>

            {/* Composant Pop-up */}
            {showPopup && selectedWorkout && (
                <>
                    <div className="modal-overlay" onClick={() => setShowPopup(false)} />
                    <div className="modal-content">
                        <h2>{selectedWorkout.workout}</h2>
                        <h4><strong>Date:</strong> {new Date(selectedWorkout.date).toLocaleDateString('en-US')}</h4>
                        <h4>{selectedWorkout.details}</h4>
                        <button onClick={() => setShowPopup(false)}>
                            Close
                        </button>
                    </div>
                </>
            )}

            <h4>The proposed plan is for guidance only. It aims to improve your performance in short trail runs but does not take into account your specific physical characteristics, training load, lifestyle, or daily constraints.</h4>
            <h4>For a tailor-made plan and to discuss your goals with a coach, subscribe to Enduraw® personalized support. </h4>

            <div className="button-container">
                <button className="training-plan-button">
                    Become an Enduraw® customer
                </button>
            </div>
        </div>
    );
};

export default Planning;