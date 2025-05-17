// src/App.js
import React from "react";
import SensorManager from "./SensorManager";

function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "20px",
      backgroundColor: "#f3f4f6"
    }}>
      <SensorManager />
    </div>
  );
}

export default App;
