// sensor-app/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Методы для работы с примитивами (старые эндпоинты)
export const getPrimitives = () => api.get('/primitives');
export const addPrimitive = (primitive) => api.post('/primitives', primitive);
export const removePrimitive = (index) => api.delete(`/primitives/${index}`);

// Методы для работы с датчиками (новые эндпоинты)
export const getSensors = () => api.get('/api/sensors');
export const getSensor = (id) => api.get(`/api/sensors/${id}`);
export const createSensor = (sensor) => api.post('/api/sensors', sensor);
export const updateSensor = (id, sensor) => api.put(`/api/sensors/${id}`, sensor);
export const deleteSensor = (id) => api.delete(`/api/sensors/${id}`);

// Методы для работы с примитивами датчиков (новые эндпоинты)
export const getSensorPrimitives = (sensorId) => api.get(`/api/sensors/${sensorId}/primitives`);
export const addSensorPrimitive = (sensorId, primitive) => api.post(`/api/sensors/${sensorId}/primitives`, primitive);
export const deleteSensorPrimitive = (primitiveId) => api.delete(`/api/sensors/primitives/${primitiveId}`);

// Методы для генерации
export const startGeneration = (request) => api.post('/start', request);
export const stopGeneration = () => api.post('/stop');
export const getStatus = () => api.get('/status');

export default api;