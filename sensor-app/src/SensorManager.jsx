// sensor-app/src/SensorManager.jsx
import React, { useEffect, useState } from 'react';
import './SensorManager.css';
import PrimitiveManager from './PrimitiveManager';
import DownloadScenarioButton from './DownloadScenarioButton';
import api from './api';

const SensorManager = () => {
  // Состояния датчиков
  const [sensors, setSensors] = useState([
    { id: 1, name: 'Датчик температуры', type: 'temperature', expanded: false },
    { id: 2, name: 'Датчик движения', type: 'motion', expanded: false },
    { id: 3, name: 'Датчик освещения', type: 'light', expanded: false },
  ]);
  const [newSensor, setNewSensor] = useState({ name: '', type: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Состояния для сценариев
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [showPrimitiveManager, setShowPrimitiveManager] = useState(false);
  const [primitives, setPrimitives] = useState([]);

  // Загрузка примитивов при первом рендере
  useEffect(() => {
    fetchPrimitives();
  }, []);

  // --- СЕТЬ: Примитивы на FastAPI (порт 8000 проксируется CRA) ---
  const fetchPrimitives = async () => {
    try {
      const { data } = await api.get('/primitives');
      setPrimitives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Не удалось загрузить примитивы:', err);
      setPrimitives([]);
    }
  };

  const deletePrimitive = async (index) => {
    try {
      const { data } = await api.delete(`/primitives/${index}`);
      setPrimitives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка при удалении примитива:', err);
    }
  };
  // ---------------------------------------------------------------

  // Работа со списком датчиков
  const handleAddSensor = () => {
    if (!newSensor.name || !newSensor.type) return;
    const sensor = {
      id: Date.now(),
      name: newSensor.name,
      type: newSensor.type,
      expanded: false,
    };
    setSensors(prev => [...prev, sensor]);
    setNewSensor({ name: '', type: '' });
    setShowAddForm(false);
  };

  const handleDeleteSensor = (id) => {
    setSensors(prev => prev.filter(s => s.id !== id));
  };

  const toggleExpand = (id) => {
    setSensors(prev =>
      prev.map(s => (s.id === id ? { ...s, expanded: !s.expanded } : s))
    );
  };

  const goToScenarioSettings = (sensor) => {
    setSelectedSensor(sensor);
    setShowPrimitiveManager(false);
  };

  const backToMainMenu = () => {
    setSelectedSensor(null);
  };

  const handleShowPrimitiveManager = () => {
    setShowPrimitiveManager(true);
  };

  // --- Рендер экрана настройки сценариев ---
  if (selectedSensor) {
    return (
      <div className="scenario-settings">
        <h2>Настройка сценариев для: {selectedSensor.name}</h2>
        <p>Тип датчика: {selectedSensor.type}</p>

        <div className="scenario-content">
          <button onClick={handleShowPrimitiveManager}>
            Настройка примитивов
          </button>
          {showPrimitiveManager && (
            <PrimitiveManager
              primitives={primitives}
              setPrimitives={setPrimitives}
            />
          )}

          <ul>
            {primitives.map((prim, idx) => (
              <li key={idx} className="primitive-item">
                {prim.name || JSON.stringify(prim)}
                <button onClick={() => deletePrimitive(idx)}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>

          {/* Кнопка «Скачать JSON и запустить генератор» */}
          <DownloadScenarioButton
            scenario={{
              name: `Сценарий: ${selectedSensor.name}`,
              episodes: primitives,
            }}
          />
        </div>

        <button onClick={backToMainMenu} className="back-btn">
          ← Назад к списку датчиков
        </button>
      </div>
    );
  }

  // --- Рендер главного экрана со списком датчиков ---
  return (
    <div className="sensor-manager">
      <h1>MIMICS</h1>

      <div className="sensor-list">
        <h2>Список датчиков</h2>
        {sensors.length === 0 ? (
          <p>Нет добавленных датчиков</p>
        ) : (
          <ul>
            {sensors.map(sensor => (
              <li key={sensor.id} className="sensor-item">
                <div
                  className="sensor-header"
                  onClick={() => toggleExpand(sensor.id)}
                >
                  <span>{sensor.name}</span>
                  <span>{sensor.expanded ? '▲' : '▼'}</span>
                </div>
                {sensor.expanded && (
                  <div className="sensor-details">
                    <p>Тип: {sensor.type}</p>
                    <p>ID: {sensor.id}</p>
                    <div className="sensor-actions">
                      <button onClick={() => goToScenarioSettings(sensor)}>
                        Настройка сценариев
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteSensor(sensor.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="add-sensor-container">
        <button
          onClick={() => setShowAddForm(prev => !prev)}
          className="add-sensor-btn"
        >
          {showAddForm ? 'Отмена' : 'Добавить датчик'}
        </button>

        {showAddForm && (
          <div className="add-sensor-form">
            <h2>Добавить новый датчик</h2>
            <input
              type="text"
              placeholder="Название датчика"
              value={newSensor.name}
              onChange={e =>
                setNewSensor(prev => ({ ...prev, name: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="Тип датчика"
              value={newSensor.type}
              onChange={e =>
                setNewSensor(prev => ({ ...prev, type: e.target.value }))
              }
            />
            <button onClick={handleAddSensor}>Добавить</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorManager;
