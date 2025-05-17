// sensor-app/src/PrimitiveManager.js
import React, { useState, useEffect } from 'react';
import api from './api';   // ← единый экземпляр axios с baseURL=http://localhost:8000

const PrimitiveManager = ({ primitives, setPrimitives }) => {
  const [constant, setConstant] = useState('');
  const [trigFunction, setTrigFunction] = useState('');
  const [noiseMin, setNoiseMin] = useState('');
  const [noiseMax, setNoiseMax] = useState('');

  // Загружаем эпизоды (примитивы) из FastAPI
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

  const addPrimitive = async (type) => {
    let newPrimitive;
    if (type === 'constant') {
      newPrimitive = { type, value: constant };
      setConstant('');
    } else if (type === 'trigonometric') {
      newPrimitive = { type, formula: trigFunction };
      setTrigFunction('');
    } else if (type === 'noise') {
      newPrimitive = { type, min: noiseMin, max: noiseMax };
      setNoiseMin('');
      setNoiseMax('');
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
    <div>
      <h2>Добавление эпизодов</h2>

      <div>
        <h3>Константа</h3>
        <input
          type="number"
          value={constant}
          onChange={e => setConstant(e.target.value)}
        />
        <button onClick={() => addPrimitive('constant')}>
          Добавить константу
        </button>
      </div>

      <div>
        <h3>Тригонометрическая формула</h3>
        <select
          value={trigFunction}
          onChange={e => setTrigFunction(e.target.value)}
        >
          <option value="">Выберите формулу</option>
          <option value="cos()">cos()</option>
          <option value="sin()">sin()</option>
          <option value="tg()">tg()</option>
          <option value="ctg()">ctg()</option>
        </select>
        <button onClick={() => addPrimitive('trigonometric')}>
          Добавить тригонометрическую формулу
        </button>
      </div>

      <div>
        <h3>Шум</h3>
        <input
          type="number"
          placeholder="Минимум"
          value={noiseMin}
          onChange={e => setNoiseMin(e.target.value)}
        />
        <input
          type="number"
          placeholder="Максимум"
          value={noiseMax}
          onChange={e => setNoiseMax(e.target.value)}
        />
        <button onClick={() => addPrimitive('noise')}>
          Добавить шум
        </button>
      </div>

      <h3>Список эпизодов</h3>
      <ul>
        {primitives.map((primitive, index) => (
          <li key={index}>
            {primitive.type === 'constant' && `Константа: ${primitive.value}`}
            {primitive.type === 'trigonometric' && `Форма: ${primitive.formula}`}
            {primitive.type === 'noise' && `Шум: min=${primitive.min}, max=${primitive.max}`}
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
