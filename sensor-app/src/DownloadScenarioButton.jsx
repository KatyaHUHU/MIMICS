import React from "react";
import api from './api';
import { saveAs } from "file-saver";

export default function DownloadScenarioButton({ scenario, onSuccess }) {
  const handleClick = async () => {
    try {
      // Отправляем сценарий на бекенд: получаем файл + старт генерации
      const res = await api.post('/scenario/download', scenario, { responseType: 'blob' });

      // Сохраняем файл локально
      saveAs(new Blob([res.data], { type: "application/json" }), "scenario.json");
      
      // Вызываем callback для обновления состояния в родительском компоненте
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Не удалось скачать сценарий — см. консоль.");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="download-button"
    >
      Скачать JSON и запустить
    </button>
  );
}