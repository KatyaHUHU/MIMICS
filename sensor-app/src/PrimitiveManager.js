// sensor-app/src/PrimitiveManager.js
import React, { useState, useEffect } from 'react';
import api from './api';
import './PrimitiveManager.css';

const PrimitiveManager = ({ primitives, setPrimitives }) => {
  const [constantValue, setConstantValue] = useState('25.0');
  const [formulaExpression, setFormulaExpression] = useState('A * math.sin(2 * math.pi * t / period) + B');
  const [formulaVariables, setFormulaVariables] = useState('{"A": 2.5, "B": 22.5, "period": 10.0}');
  const [noiseMean, setNoiseMean] = useState('0.0');
  const [noiseAmplitude, setNoiseAmplitude] = useState('1.0');
  const [duration, setDuration] = useState('10.0');
  const [isLooped, setIsLooped] = useState(false);

  useEffect(() => {
    fetchPrimitives();
  }, []);

  const fetchPrimitives = async () => {
    try {
      const { data } = await api.get('/primitives');
      setPrimitives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Не удалось загрузить примитивы:', err);
      setPrimitives([]);
    }
  };

  const addPrimitive = async (primitiveType) => {
    let newPrimitive;
    
    if (primitiveType === 'constant') {
      newPrimitive = {
        primitive_type: 'constant',
        config: { value: parseFloat(constantValue) },
        duration: parseFloat(duration),
        is_looped: isLooped
      };
    } else if (primitiveType === 'formula') {
      newPrimitive = {
        primitive_type: 'formula',
        config: {
          expression: formulaExpression,
          variables: JSON.parse(formulaVariables)
        },
        duration: parseFloat(duration),
        is_looped: isLooped
      };
    } else if (primitiveType === 'noise') {
      newPrimitive = {
        primitive_type: 'noise',
        config: {
          mean: parseFloat(noiseMean),
          amplitude: parseFloat(noiseAmplitude)
        },
        duration: parseFloat(duration),
        is_looped: isLooped
      };
    }

    try {
      await api.post('/primitives', newPrimitive);
      fetchPrimitives();
    } catch (err) {
      console.error('Не удалось добавить примитив:', err);
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

  return (
    <div className="primitive-manager">
      <h2>Эпизоды сценария</h2>
      
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
      <ul className="primitives-list">
        {primitives.map((primitive, index) => (
          <li key={index} className="primitive-item">
            <div>
              <strong>Тип:</strong> {primitive.primitive_type}
              <br />
              <strong>Конфигурация:</strong> {JSON.stringify(primitive.config)}
              <br />
              <strong>Длительность:</strong> {primitive.duration} сек.
              <br />
              <strong>Зациклено:</strong> {primitive.is_looped ? 'Да' : 'Нет'}
            </div>
            <button onClick={() => deletePrimitive(index)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrimitiveManager;