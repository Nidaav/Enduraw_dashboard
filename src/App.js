import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css';
import csvFilePath from './activity_data.csv';
import { useState } from 'react';

function App() {
  const setText = useState();


  const csvData = function(){
        fetch( csvFilePath )
            .then( response => response.text() )
            .then( responseText => {
                setText( responseText );
            });
    };

  return (
    <div className="App">
      <Dashboard csvData={csvData} />
    </div>
  );
}

export default App;