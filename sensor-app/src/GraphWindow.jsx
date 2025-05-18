import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './GraphWindow.css';

const GraphWindow = ({ onClose }) => {
  const [data, setData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    console.log("GraphWindow: Initializing...");
    
    // Функция подключения к WebSocket
    const connectWebSocket = () => {
      console.log("Attempting to connect to WebSocket...");
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          console.log("WebSocket raw message received:", event.data.substring(0, 100) + "...");
          const payload = JSON.parse(event.data);
          console.log("WebSocket parsed payload:", typeof payload, Array.isArray(payload));
          
          // Разные форматы данных от сервера
          if (payload.packet && Array.isArray(payload.packet)) {
            console.log(`Received MQTT packet with ${payload.packet.length} points`);
            console.log("First point:", payload.packet[0]);
            
            const newPoints = payload.packet.map(point => ({
              timestamp: point.timestamp,
              value: point.value
            }));
            
            setData(prevData => {
              // Добавляем новые точки и ограничиваем до 100 последних
              const combined = [...prevData, ...newPoints];
              console.log(`Updated data: ${combined.length} points total`);
              setLastUpdate(new Date());
              return combined.slice(-100);
            });
          } else if (Array.isArray(payload)) {
            console.log(`Received array with ${payload.length} points`);
            if (payload.length > 0) {
              console.log("First point:", payload[0]);
              setData(payload.slice(-100));
              setLastUpdate(new Date());
              console.log("Data updated from WebSocket array");
            }
          } else {
            console.warn("Unknown data format received:", payload);
          }
        } catch (error) {
          console.error("Error processing WebSocket data:", error, "Raw data:", event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log("WebSocket connection closed");
        setIsConnected(false);
        // Переподключаемся через 1 секунду
        setTimeout(connectWebSocket, 1000);
      };
    };

    // Запускаем подключение WebSocket
    connectWebSocket();

    // HTTP метод в качестве запасного варианта
    const fetchDataFallback = async () => {
      try {
        console.log("Fetching data from HTTP fallback...");
        const response = await fetch('http://localhost:8000/data');
        if (response.ok) {
          const fetchedData = await response.json();
          console.log(`HTTP data received: ${fetchedData.length} points`);
          
          // Важно: показываем данные только если их больше 0
          if (Array.isArray(fetchedData) && fetchedData.length > 0) {
            setData(prevData => {
              // Обновляем только если получили новые данные и их больше, чем у нас уже есть
              if (fetchedData.length > prevData.length) {
                setLastUpdate(new Date());
                console.log("Data updated from HTTP: more points received");
                return fetchedData.slice(-100);
              }
              return prevData;
            });
          } else {
            console.log("Empty data array received from HTTP");
          }
        } else {
          console.warn("HTTP response not OK:", response.status);
        }
      } catch (error) {
        console.error("HTTP data fetch error:", error);
      }
    };

    // Запускаем HTTP запрос сразу и периодически
    fetchDataFallback();
    const intervalId = setInterval(fetchDataFallback, 1000);

    // Очищаем ресурсы при размонтировании
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(intervalId);
    };
  }, []);

  // Форматируем временную метку для осей
  const formatTime = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return '';
    try {
      // Если это время симуляции, просто форматируем как секунды
      if (timestamp < 1000000) { // Это время симуляции, а не unix timestamp
        return `${timestamp.toFixed(1)}с`;
      }
      // Иначе это unix timestamp, преобразуем в дату
      return new Date(timestamp * 1000).toLocaleTimeString();
    } catch (e) {
      console.error("Error formatting timestamp:", timestamp, e);
      return String(timestamp);
    }
  };

  console.log(`Rendering graph with ${data.length} data points`);

  return (
    <div className="graph-window">
      <button className="close-btn" onClick={onClose}>
        Закрыть
      </button>
      
      <h2>График данных датчика</h2>
      
      <div className="connection-status">
        Статус соединения: {isConnected ? 
          <span className="connected">Подключено</span> : 
          <span className="disconnected">Отключено</span>}
        {lastUpdate && 
          <div className="last-update">
            Последнее обновление: {lastUpdate.toLocaleTimeString()}
          </div>
        }
      </div>
      
      <div className="chart-container" ref={chartRef}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                label={{ value: 'Время', position: 'insideBottomRight', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Значение', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                formatter={(value) => [value, 'Значение']}
                labelFormatter={formatTime}
              />
              <Legend />
              <Line 
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data">
            Ожидание данных...
          </div>
        )}
      </div>
      
      <div className="data-info">
        Получено точек: {data.length} | Источник: MQTT → WebSocket
        {!isConnected && <div className="reconnecting">Переподключение...</div>}
      </div>
    </div>
  );
};

export default GraphWindow;