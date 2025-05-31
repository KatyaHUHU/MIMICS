import React from "react";
import { startGeneration } from './api';

// Компонент для запуска генерации данных
export default function StartGenerationButton({ scenario, onSuccess }) {
  const handleClick = async () => {
    try {
      // Создаем запрос на запуск генерации
      const startRequest = {
        scenario: scenario,
        frequency: 10, // Частота в Гц
        packets: 2     // Пакетов в секунду
      };
      
      // Используем функцию startGeneration вместо прямого вызова api.post
      const response = await startGeneration(startRequest);
      
      console.log("Генерация запущена:", response.data);
      
      // Вызываем callback для обновления UI
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      console.error("Ошибка запуска генерации:", err);
      alert("Не удалось запустить генерацию — см. консоль.");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="start-button"
    >
      Запустить генерацию
    </button>
  );
}