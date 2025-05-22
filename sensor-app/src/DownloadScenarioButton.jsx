import React from "react";
import api from './api';
import { saveAs } from "file-saver";

// Компонент для скачивания JSON без запуска генерации
export default function DownloadScenarioButton({ scenario }) {
  const handleClick = async () => {
    try {
      // Преобразуем сценарий в JSON
      const jsonContent = JSON.stringify(scenario, null, 2);
      
      // Создаем и скачиваем файл
      const blob = new Blob([jsonContent], { type: "application/json" });
      saveAs(blob, "scenario.json");
      
      console.log("JSON успешно скачан");
    } catch (err) {
      console.error("Ошибка скачивания:", err);
      alert("Не удалось скачать сценарий — см. консоль.");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="download-button"
    >
      Загрузить JSON
    </button>
  );
}