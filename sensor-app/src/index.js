import React from 'react';
import ReactDOM from 'react-dom/client';
import './colors.css'; // Импортируем цветовую палитру
import './index.css';
import './App.css'; // Импортируем основные стили
import App from './App';
import reportWebVitals from './reportWebVitals';
// Убираем импорт axios и настройку baseURL

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();