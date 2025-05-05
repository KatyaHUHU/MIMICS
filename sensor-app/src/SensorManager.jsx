import React, { useEffect, useState } from 'react';
import './SensorManager.css';
import PrimitiveManager from './PrimitiveManager'; // Импортируйте новый компонент

const SensorManager = () => {
    const [sensors, setSensors] = useState([
        { id: 1, name: 'Датчик температуры', type: 'temperature', expanded: false },
        { id: 2, name: 'Датчик движения', type: 'motion', expanded: false },
        { id: 3, name: 'Датчик освещения', type: 'light', expanded: false }
    ]);

    const [newSensor, setNewSensor] = useState({ name: '', type: '' });
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [showPrimitiveManager, setShowPrimitiveManager] = useState(false); // Состояние для отображения PrimitiveManager

    const handleAddSensor = () => {
        if (newSensor.name && newSensor.type) {
            const sensor = {
                id: Date.now(),
                name: newSensor.name,
                type: newSensor.type,
                expanded: false
            };
            setSensors([...sensors, sensor]);
            setNewSensor({ name: '', type: '' });
            setShowAddForm(false);
        }
    };

    const handleDeleteSensor = (id) => {
        setSensors(sensors.filter(sensor => sensor.id !== id));
    };

    const toggleExpand = (id) => {
        setSensors(sensors.map(sensor =>
            sensor.id === id ? { ...sensor, expanded: !sensor.expanded } : sensor
        ));
    };

    const goToScenarioSettings = (sensor) => {
        setSelectedSensor(sensor);
    };

    const backToMainMenu = () => {
        setSelectedSensor(null);
    };

    const handleShowPrimitiveManager = () => {
        setShowPrimitiveManager(true); // Показать PrimitiveManager
    };

    const [primitives, setPrimitives] = useState([]);

    useEffect(() => {
        fetchPrimitives();
    }, []);

    const fetchPrimitives = async () => {
        try {
            const response = await fetch('http://localhost:5000/primitives');

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Ошибка сети: ${response.status} ${response.statusText} - ${errorMessage}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                console.warn('Полученные данные пусты');
                // Можно установить состояние с пустым массивом или оставить его прежним
                setPrimitives([]);
                return;
            }

            setPrimitives(data);
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            // Можно также добавить обработку отображения ошибки пользователю
        }
    };

    const deletePrimitive = async (index) => {
        const response = await fetch(`http://localhost:5000/primitives/${index}`, {
            method: 'DELETE',
        });

        const data = await response.json();
        setPrimitives(data);
    };

    const downloadJSON = async () => {
        // Если primitives еще не загружены, загружаем их только на поврежденной странице
        if (primitives.length === 0) {
            await fetchPrimitives();
        }

        if (primitives.length === 0) {
            console.error('Нет данных для загрузки');
            return; // Не загружать файл, если данных нет
        }

        console.log(primitives); // Проверка содержимого primitives
        const dataStr = JSON.stringify(primitives, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'primitives.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (selectedSensor) {
        return (
            <div className="scenario-settings">
                <h2>Настройка сценариев для: {selectedSensor.name}</h2>
                <p>Тип датчика: {selectedSensor.type}</p>
                <div className="scenario-content">
                    <button onClick={handleShowPrimitiveManager}>Настройка сценариев</button>
                    {showPrimitiveManager && <PrimitiveManager />} {/* Показать форму настройки сценариев */}

                    <ul>
                        {primitives.map((primitive, index) => (
                            <li key={index}>
                                {primitive.name}
                                <button onClick={() => deletePrimitive(index)}>Удалить</button>
                            </li>
                        ))}
                    </ul>
                    <button onClick={downloadJSON}>Скачать настройки сценария JSON</button> {/* Кнопка для скачивания */}

                </div>
                <button onClick={backToMainMenu}>Назад к списку датчиков</button>

            </div>
        );
    }

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
                                                onClick={() => handleDeleteSensor(sensor.id)}
                                                className="delete-btn"
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

            <div className="button-container">
                <button onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Отмена' : 'Добавить датчик'}
                </button>
            </div>

            {showAddForm && (
                <div className="add-sensor-form">
                    <h2>Добавить новый датчик</h2>
                    <input
                        type="text"
                        placeholder="Название датчика"
                        value={newSensor.name}
                        onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Тип датчика"
                        value={newSensor.type}
                        onChange={(e) => setNewSensor({ ...newSensor, type: e.target.value })}
                    />
                    <button onClick={handleAddSensor}>Добавить</button>
                </div>
            )}

        </div>
    );
};

export default SensorManager;

