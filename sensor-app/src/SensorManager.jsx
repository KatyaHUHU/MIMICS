// sensor-app/src/SensorManager.jsx
import React, { useEffect, useState } from 'react';
import './SensorManager.css';
import PrimitiveManager from './PrimitiveManager';
import DownloadScenarioButton from './DownloadScenarioButton';
import GraphWindow from './GraphWindow';
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
  
  // Состояние для отображения графика
  const [showGraph, setShowGraph] = useState(false);
  
  // Состояние для отслеживания статуса генерации
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Загрузка примитивов при первом рендере
  useEffect(() => {
    fetchPrimitives();
    // Проверим текущий статус генерации при загрузке
    checkGenerationStatus();
  }, []);

  // Функция для проверки статуса генерации
  const checkGenerationStatus = async () => {
    try {
      const { data } = await api.get('/status');
      setIsGenerating(data.is_running);
    } catch (err) {
      console.error('Не удалось получить статус генерации:', err);
    }
  };

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
  
  // Функция для остановки генерации
  const stopGeneration = async () => {
    try {
      const { data } = await api.post('/stop');
      setIsGenerating(false);
      setStatusMessage('Генерация остановлена');
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
      
      console.log('Генерация остановлена:', data);
    } catch (err) {
      console.error('Ошибка при остановке генерации:', err);
      setStatusMessage('Ошибка при остановке генерации');
    }
  };
  
  // Функция для запуска генерации (через DownloadScenarioButton)
  const startGeneration = () => {
    setIsGenerating(true);
    setStatusMessage('Генерация запущена');
    
    // Скрываем сообщение через 3 секунды
    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
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
    // Проверяем статус генерации при переходе на экран настройки
    checkGenerationStatus();
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

        {statusMessage && (
          <div className={`status-message ${isGenerating ? 'success' : 'warning'}`}>
            {statusMessage}
          </div>
        )}
        
        <div className="generation-status">
          <div className={`status-indicator ${isGenerating ? 'active' : 'inactive'}`}>
            <div className="status-dot"></div>
            <span>Статус генерации: {isGenerating ? 'Активна' : 'Остановлена'}</span>
          </div>
        </div>

        <div className="scenario-content">
          <button 
            className="mimics-button primary"
            onClick={handleShowPrimitiveManager}
          >
            Настройка эпизодов
          </button>
          
          {showPrimitiveManager && (
            <PrimitiveManager
              primitives={primitives}
              setPrimitives={setPrimitives}
            />
          )}

          {primitives.length > 0 && (
            <div className="primitives-list">
              <h3>Эпизоды сценария</h3>
              {primitives.map((prim, idx) => (
                <div key={idx} className="primitive-item">
                  <div>
                    <strong>
                      {prim.primitive_type === 'constant' ? 'Константа' : 
                       prim.primitive_type === 'formula' ? 'Формула' : 
                       prim.primitive_type === 'noise' ? 'Шум' : 
                       prim.primitive_type}
                    </strong>
                    <p>{JSON.stringify(prim.config)}</p>
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => deletePrimitive(idx)}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="buttons-container">
            {/* Кнопка «Скачать JSON и запустить генератор» */}
            <DownloadScenarioButton
              scenario={{
                name: `Сценарий: ${selectedSensor.name}`,
                episodes: primitives,
              }}
              onSuccess={startGeneration}
            />
            
            {/* Кнопка остановки генерации */}
            {isGenerating && (
              <button 
                onClick={stopGeneration}
                className="stop-button"
              >
                Остановить генерацию
              </button>
            )}
            
            {/* Кнопка просмотра графика */}
            <button 
              onClick={() => setShowGraph(true)}
              className="view-graph-btn"
            >
              Просмотр графика данных
            </button>
          </div>
        </div>

        <button onClick={backToMainMenu} className="back-btn">
          ← Назад к списку датчиков
        </button>
        
        {/* Окно с графиком (отображается поверх текущего экрана) */}
        {showGraph && (
          <GraphWindow onClose={() => setShowGraph(false)} />
        )}
      </div>
    );
  }

  // --- Рендер главного экрана со списком датчиков ---
  return (
    <div className="sensor-manager">
      <div className="sensor-list">
        <h2>Список датчиков</h2>
        {sensors.length === 0 ? (
          <div className="empty-list">
            <p>Нет добавленных датчиков</p>
            <p>Добавьте датчик, чтобы начать работу</p>
          </div>
        ) : (
          <ul>
            {sensors.map(sensor => (
              <li key={sensor.id} className="sensor-item">
                <div
                  className={`sensor-header ${sensor.expanded ? 'expanded' : ''}`}
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
                      <button 
                        onClick={() => goToScenarioSettings(sensor)}
                        className="secondary"
                      >
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
      
      <div className="control-panel">
        <button 
          onClick={() => setShowGraph(true)}
          className="view-graph-btn"
        >
          Просмотр графика данных
        </button>
      </div>
      
      {/* Окно с графиком (отображается поверх текущего экрана) */}
      {showGraph && (
        <GraphWindow onClose={() => setShowGraph(false)} />
      )}
    </div>
  );
};

export default SensorManager;