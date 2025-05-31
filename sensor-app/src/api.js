// sensor-app/src/api.js
import axios from 'axios';

// Создаем базовый экземпляр axios с префиксом /api для эндпоинтов датчиков
const api = axios.create({
  baseURL: '/api',  // Префикс для работы с датчиками и примитивами
});

// Создаем отдельный экземпляр для корневых эндпоинтов (без префикса /api)
const rootApi = axios.create({
  baseURL: '/',  // Корневой URL для эндпоинтов генерации
});

// Методы для работы с примитивами (старые эндпоинты)
export const getPrimitives = () => api.get('/primitives');
export const addPrimitive = (primitive) => api.post('/primitives', primitive);
export const removePrimitive = (index) => api.delete(`/primitives/${index}`);

// Методы для работы с датчиками
export const getSensors = () => api.get('/sensors/');
export const getSensor = (id) => api.get(`/sensors/${id}/`);
export const createSensor = (sensor) => api.post('/sensors/', sensor);
export const updateSensor = (id, sensor) => api.put(`/sensors/${id}/`, sensor);
export const deleteSensor = (id) => api.delete(`/sensors/${id}/`);

// Методы для работы с примитивами датчиков
export const getSensorPrimitives = (sensorId) => api.get(`/sensors/${sensorId}/primitives/`);
export const addSensorPrimitive = (sensorId, primitive) => api.post(`/sensors/${sensorId}/primitives/`, primitive);
export const deleteSensorPrimitive = (primitiveId) => api.delete(`/sensors/primitives/${primitiveId}/`);

// Методы для генерации - используем rootApi без префикса /api
export const startGeneration = (request) => rootApi.post('/start', request);
export const stopGeneration = () => rootApi.post('/stop');
export const getStatus = () => rootApi.get('/status');

export default api;