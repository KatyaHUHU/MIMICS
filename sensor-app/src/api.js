// sensor-app/src/api.js
import axios from 'axios';

// Используем относительный путь вместо абсолютного
// Это позволит proxy в package.json работать правильно
const api = axios.create({
  baseURL: '/api',  // Изменено с 'http://localhost:8000' на '/api'
});

// Методы для работы с примитивами (старые эндпоинты)
export const getPrimitives = () => api.get('/primitives');
export const addPrimitive = (primitive) => api.post('/primitives', primitive);
export const removePrimitive = (index) => api.delete(`/primitives/${index}`);

// Методы для работы с датчиками - добавляем trailing slash
export const getSensors = () => api.get('/sensors/');  // Добавлен trailing slash
export const getSensor = (id) => api.get(`/sensors/${id}/`);
export const createSensor = (sensor) => api.post('/sensors/', sensor);
export const updateSensor = (id, sensor) => api.put(`/sensors/${id}/`, sensor);
export const deleteSensor = (id) => api.delete(`/sensors/${id}/`);

// Методы для работы с примитивами датчиков
export const getSensorPrimitives = (sensorId) => api.get(`/sensors/${sensorId}/primitives/`);
export const addSensorPrimitive = (sensorId, primitive) => api.post(`/sensors/${sensorId}/primitives/`, primitive);
export const deleteSensorPrimitive = (primitiveId) => api.delete(`/sensors/primitives/${primitiveId}/`);

// Методы для генерации - эти остаются без /api префикса
export const startGeneration = (request) => axios.post('/start', request);
export const stopGeneration = () => axios.post('/stop');
export const getStatus = () => axios.get('/status');

export default api;