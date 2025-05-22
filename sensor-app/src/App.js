// src/App.js
import React from "react";
import SensorManager from "./SensorManager";
import "./App.css";

function App() {
  return (
    <div className="App">
      {/* Шапка приложения в стиле MIMICS - без лишних кнопок */}
      <header className="mimics-header">
        <div className="mimics-logo">MIMICS</div>
      </header>

      <div className="mimics-container">
        <SensorManager />
      </div>
    </div>
  );
}

export default App;