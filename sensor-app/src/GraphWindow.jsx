import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './GraphWindow.css';

const GraphWindow = ({ onClose }) => {
  const [data, setData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
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
          console.log("WebSocket message received", event.data.substring(0, 100) + "...");
          const payload = JSON.parse(event.data);
          
          // Разные форматы данных от сервера
          if (payload.packet && Array.isArray(payload.packet)) {
            console.log(`Received MQTT packet with ${payload.packet.length} points`);
            
            const newPoints = payload.packet.map(point => ({
              timestamp: point.timestamp,
              value: point.value
            }));
            
            setData(prevData => {
              // Добавляем новые точки и ограничиваем до 100 последних
              const combined = [...prevData, ...newPoints];
              return combined.slice(-100);
            });
          } else if (Array.isArray(payload)) {
            console.log(`Received array with ${payload.length} points`);
            setData(payload.slice(-100));
          }
        } catch (error) {
          console.error("Error processing WebSocket data:", error);
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
        const response = await fetch('http://localhost:8000/data');
        if (response.ok) {
          const fetchedData = await response.json();
          console.log(`HTTP data received: ${fetchedData.length} points`);
          
          if (Array.isArray(fetchedData) && fetchedData.length > 0) {
            setData(fetchedData.slice(-100));
          }
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
      return new Date(timestamp * 1000).toLocaleTimeString();
    } catch (e) {
      return timestamp.toString();
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