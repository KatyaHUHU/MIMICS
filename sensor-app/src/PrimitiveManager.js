import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PrimitiveManager = () => {
    const [primitives, setPrimitives] = useState([]);
    const [constant, setConstant] = useState('');
    const [trigFunction, setTrigFunction] = useState('');
    const [noiseMin, setNoiseMin] = useState('');
    const [noiseMax, setNoiseMax] = useState('');

    useEffect(() => {
        fetchPrimitives();
    }, []);

    const fetchPrimitives = async () => {
        const response = await axios.get('http://localhost:5000/primitives');
        setPrimitives(response.data);
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
        await axios.post('http://localhost:5000/primitives', newPrimitive);
        fetchPrimitives();
    };

    const deletePrimitive = async (index) => {
        await axios.delete(`http://localhost:5000/primitives/${index}`);
        fetchPrimitives();
    };

    return (
        <div>
            <h2>Добавление примитивов</h2>
            <div>
                <h3>Константа</h3>
                <input
                    type="number"
                    value={constant}
                    onChange={e => setConstant(e.target.value)}
                />
                <button onClick={() => addPrimitive('constant')}>Добавить константу</button>
            </div>

            <div>
                <h3>Тригонометрическая формула</h3>
                <select value={trigFunction} onChange={e => setTrigFunction(e.target.value)}>
                    <option value="">Выберите формулу</option>
                    <option value="cos()">cos()</option>
                    <option value="sin()">sin()</option>
                    <option value="tg()">tg()</option>
                    <option value="ctg()">ctg()</option>
                </select>
                <button onClick={() => addPrimitive('trigonometric')}>Добавить тригонометрическую формулу</button>
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
                <button onClick={() => addPrimitive('noise')}>Добавить шум</button>
            </div>

            <h3>Список примитивов</h3>
            <ul>
                {primitives.map((primitive, index) => (
                    <li key={index}>
                        {primitive.type === 'constant' && `Константа: ${primitive.value}`}
                        {primitive.type === 'trigonometric' && `Форма: ${primitive.formula}`}
                        {primitive.type === 'noise' && `Шум: min=${primitive.min}, max=${primitive.max}`}
                        <button onClick={() => deletePrimitive(index)}>Удалить</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PrimitiveManager;
