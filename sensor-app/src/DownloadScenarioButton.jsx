import React from "react";
import api from './api';
import { saveAs } from "file-saver";

export default function DownloadScenarioButton() {
  const scenario = {
    name: "Temperature Sensor Simulation",
    episodes: [
      {
        primitive_type: "constant",
        config: { value: 22.5 },
        duration: 5.0,
        is_looped: false
      },
      {
        primitive_type: "formula",
        config: {
          expression: "A * Math.sin(2 * Math.PI * t / period) + B",
          variables: { A: 2.5, B: 22.5, period: 10.0 }
        },
        duration: 30.0,
        is_looped: true
      }
    ]
  };

  const handleClick = async () => {
    try {
      // Отправляем сценарий на бекенд: получаем файл + старт генерации
      const res = await api.post('/scenario/download', scenario, { responseType: 'blob' });

      // Сохраняем файл локально
      saveAs(new Blob([res.data], { type: "application/json" }), "scenario.json");
    } catch (err) {
      console.error("Download error:", err);
      alert("Не удалось скачать сценарий — см. консоль.");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white shadow-lg transition-all duration-300 ease-in-out"
    >
      Скачать JSON и запустить
    </button>
  );
}
