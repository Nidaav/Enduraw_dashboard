import React from 'react';
import logo from './logo.svg';
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
       <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      {/* <Dashboard csvData={csvData} /> */}
    </div>
  );
}

export default App;