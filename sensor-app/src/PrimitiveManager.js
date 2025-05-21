// sensor-app/src/PrimitiveManager.js

import React, { useState, useEffect } from 'react';
import api from './api';
import './PrimitiveManager.css';

const PrimitiveManager = ({ primitives, setPrimitives }) => {
  // Состояния для примитивов
  const [constantValue, setConstantValue] = useState('25.0');
  const [formulaExpression, setFormulaExpression] = useState('A * math.sin(2 * math.pi * t / period) + B');
  const [formulaVariables, setFormulaVariables] = useState('{"A": 2.5, "B": 22.5, "period": 10.0}');
  const [noiseMean, setNoiseMean] = useState('0.0');
  const [noiseAmplitude, setNoiseAmplitude] = useState('1.0');
  
  // Состояния для общих настроек
  const [duration, setDuration] = useState('10.0');
  const [isLooped, setIsLooped] = useState(false);
  
  // Состояние для сообщений об ошибках/успехе
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' или 'error'

  // Функция для отображения сообщений
  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    
    // Автоматически очищаем сообщение через 5 секунд
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  // Функция валидации общих параметров
  const validateCommonParams = () => {
    const durationValue = parseFloat(duration);
    if (isNaN(durationValue)) {
      showMessage('Некорректное значение длительности', 'error');
      return false;
    }
    
    if (durationValue <= 0) {
      showMessage('Длительность должна быть больше 0', 'error');
      return false;
    }
    
    return true;
  };

  // Функция для добавления примитива
  const addPrimitive = async (primitiveType) => {
    // Валидация общих параметров
    if (!validateCommonParams()) {
      return;
    }
    
    let newPrimitive;
    let validationError = false;
    
    // Формирование примитива в зависимости от типа
    if (primitiveType === 'constant') {
      const value = parseFloat(constantValue);
      
      if (isNaN(value)) {
        showMessage('Некорректное значение константы', 'error');
        validationError = true;
      } else {
        newPrimitive = {
          primitive_type: 'constant',
          config: { value: value },
          duration: parseFloat(duration),
          is_looped: isLooped
        };
      }
    } else if (primitiveType === 'formula') {
      if (!formulaExpression.trim()) {
        showMessage('Выражение не может быть пустым', 'error');
        validationError = true;
      } else {
        try {
          const variables = JSON.parse(formulaVariables);
          newPrimitive = {
            primitive_type: 'formula',
            config: {
              expression: formulaExpression,
              variables: variables
            },
            duration: parseFloat(duration),
            is_looped: isLooped
          };
        } catch (e) {
          showMessage('Некорректный JSON для переменных формулы', 'error');
          validationError = true;
        }
      }
    } else if (primitiveType === 'noise') {
      const mean = parseFloat(noiseMean);
      const amplitude = parseFloat(noiseAmplitude);
      
      if (isNaN(mean) || isNaN(amplitude)) {
        showMessage('Некорректные параметры шума', 'error');
        validationError = true;
      } else if (amplitude < 0) {
        showMessage('Амплитуда должна быть неотрицательной', 'error');
        validationError = true;
      } else {
        newPrimitive = {
          primitive_type: 'noise',
          config: {
            mean: mean,
            amplitude: amplitude
          },
          duration: parseFloat(duration),
          is_looped: isLooped
        };
      }
    }

    // Если есть ошибки валидации, прерываем выполнение
    if (validationError) {
      return;
    }

    // ИЗМЕНЕНИЕ: Добавляем примитив локально, не вызывая API
    const updatedPrimitives = [...primitives, newPrimitive];
    setPrimitives(updatedPrimitives);
    showMessage(`Примитив типа "${primitiveType}" успешно добавлен`, 'success');
  };

  // Функция для удаления примитива
  const deletePrimitive = (index) => {
    // ИЗМЕНЕНИЕ: Удаляем примитив локально, не вызывая API
    const updatedPrimitives = [...primitives];
    updatedPrimitives.splice(index, 1);
    setPrimitives(updatedPrimitives);
    showMessage('Примитив успешно удален', 'success');
  };

  // Функция для форматирования JSON
  const formatConfig = (config) => {
    if (typeof config !== 'object') return 'Неверный формат';
    
    let result = [];
    
    if (config.value !== undefined) {
      result.push(`Значение: ${config.value}`);
    }
    
    if (config.expression) {
      result.push(`Выражение: ${config.expression}`);
      if (config.variables) {
        const vars = Object.entries(config.variables)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ');
        result.push(`Переменные: ${vars}`);
      }
    }
    
    if (config.mean !== undefined) {
      result.push(`Среднее: ${config.mean}`);
    }
    
    if (config.amplitude !== undefined) {
      result.push(`Амплитуда: ${config.amplitude}`);
    }
    
    return result.join(' | ');
  };

  // Функция для получения русского имени типа примитива
  const getPrimitiveTypeName = (type) => {
    switch (type) {
      case 'constant': return 'Константа';
      case 'formula': return 'Формула';
      case 'noise': return 'Шум';
      default: return type;
    }
  };

  return (
    <div className="primitive-manager">
      <h2>Эпизоды сценария</h2>
      
      {/* Уведомления для пользователя */}
      {message && (
        <div className={`notification ${messageType}`}>
          {message}
        </div>
      )}
      
      <div className="common-settings">
        <h3>Общие настройки</h3>
        <div>
          <label>Длительность (секунды): </label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            step="0.1"
            min="0.1"
          />
        </div>
        <div>
          <label>Зациклить: </label>
          <input
            type="checkbox"
            checked={isLooped}
            onChange={e => setIsLooped(e.target.checked)}
          />
          <span className="help-text">(Рекомендуется включить для бесконечной генерации данных)</span>
        </div>
      </div>

      <div className="primitive-section">
        <h3>Константа</h3>
        <div>
          <label>Значение: </label>
          <input
            type="number"
            value={constantValue}
            onChange={e => setConstantValue(e.target.value)}
            step="0.1"
          />
          <button onClick={() => addPrimitive('constant')}>
            Добавить константу
          </button>
        </div>
      </div>

      <div className="primitive-section">
        <h3>Тригонометрическая формула</h3>
        <div>
          <label>Выражение: </label>
          <input
            type="text"
            value={formulaExpression}
            onChange={e => setFormulaExpression(e.target.value)}
          />
        </div>
        <div>
          <label>Переменные (JSON): </label>
          <input
            type="text"
            value={formulaVariables}
            onChange={e => setFormulaVariables(e.target.value)}
          />
          <button onClick={() => addPrimitive('formula')}>
            Добавить формулу
          </button>
        </div>
        <div className="help-text">
          Пример: A * math.sin(2 * math.pi * t / period) + B, где t - время
        </div>
      </div>

      <div className="primitive-section">
        <h3>Шум</h3>
        <div>
          <label>Среднее значение: </label>
          <input
            type="number"
            value={noiseMean}
            onChange={e => setNoiseMean(e.target.value)}
            step="0.1"
          />
        </div>
        <div>
          <label>Амплитуда: </label>
          <input
            type="number"
            value={noiseAmplitude}
            onChange={e => setNoiseAmplitude(e.target.value)}
            step="0.1"
            min="0"
          />
          <button onClick={() => addPrimitive('noise')}>
            Добавить шум
          </button>
        </div>
      </div>

      <h3>Список эпизодов</h3>
      
      {primitives.length === 0 ? (
        <div className="empty-list">
          Нет добавленных эпизодов. Добавьте хотя бы один эпизод для генерации данных.
        </div>
      ) : (
        <ul className="primitives-list">
          {primitives.map((primitive, index) => (
            <li key={index} className="primitive-item">
              <div className="primitive-info">
                <div className="primitive-header">
                  <strong>{getPrimitiveTypeName(primitive.primitive_type)}</strong>
                  <span className={`duration-badge ${primitive.is_looped ? 'looped' : ''}`}>
                    {primitive.duration} с {primitive.is_looped ? '(зациклен)' : ''}
                  </span>
                </div>
                <div className="primitive-config">
                  {formatConfig(primitive.config)}
                </div>
              </div>
              <button 
                className="delete-button"
                onClick={() => deletePrimitive(index)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {primitives.length > 0 && !primitives.some(p => p.is_looped) && (
        <div className="warning-message">
          ⚠️ Внимание: Ни один эпизод не зациклен. Генерация данных остановится после завершения всех эпизодов.
        </div>
      )}
    </div>
  );
};

export default PrimitiveManager;