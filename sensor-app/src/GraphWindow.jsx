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
          console.log("WebSocket message received:", event.data.substring(0, 100) + "...");
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
              setLastUpdate(new Date());
              return combined.slice(-100);
            });
          } else if (Array.isArray(payload)) {
            console.log(`Received array with ${payload.length} points`);
            if (payload.length > 0) {
              setData(payload.slice(-100));
              setLastUpdate(new Date());
            }
          } else {
            console.warn("Unknown data format received:", payload);
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
        console.log("Fetching data from HTTP fallback...");
        const response = await fetch('http://localhost:8000/data');
        if (response.ok) {
          const fetchedData = await response.json();
          console.log(`HTTP data received: ${fetchedData.length} points`);
          
          // Показываем данные только если их больше 0
          if (Array.isArray(fetchedData) && fetchedData.length > 0) {
            setData(prevData => {
              // Обновляем только если получили новые данные и их больше, чем у нас уже есть
              if (fetchedData.length > prevData.length) {
                setLastUpdate(new Date());
                return fetchedData.slice(-100);
              }
              return prevData;
            });
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
      // Если это время симуляции, просто форматируем как секунды
      if (timestamp < 1000000) { // Это время симуляции, а не unix timestamp
        return `${timestamp.toFixed(1)}с`;
      }
      // Иначе это unix timestamp, преобразуем в дату
      return new Date(timestamp * 1000).toLocaleTimeString();
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return String(timestamp);
    }
  };

  return (
    <div className="graph-overlay">
      <div className="graph-window">
        <div className="graph-header">
          <h2>График данных датчика</h2>
          <button className="close-btn" onClick={onClose}></button>
        </div>
        
        <div className="graph-content">
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span>{isConnected ? 'Подключено' : 'Отключено'}</span>
            </div>
            
            {lastUpdate && (
              <div className="last-update">
                Обновлено: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            
            {!isConnected && (
              <div className="reconnecting">
                Переподключение...
              </div>
            )}
          </div>
          
          <div className="chart-container" ref={chartRef}>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    label={{ value: 'Время', position: 'insideBottomRight', offset: -10 }}
                    stroke="#757575"
                  />
                  <YAxis 
                    label={{ value: 'Значение', angle: -90, position: 'insideLeft' }}
                    domain={['auto', 'auto']}
                    stroke="#757575"
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Значение']}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Line 
                    type="monotone"
                    dataKey="value"
                    stroke="#7E57C2"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#7E57C2', stroke: '#fff' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <div className="no-data-icon">📊</div>
                <div className="no-data-text">Ожидание данных...</div>
              </div>
            )}
          </div>
          
          <div className="data-info">
            <div>
              Количество точек: <span className="data-info-value">{data.length}</span>
            </div>
            <div>
              Источник: <span className="data-info-value">MQTT → WebSocket</span>
            </div>
          </div>
          
          <div className="data-actions">
            <button onClick={() => window.location.reload()}>
              Обновить данные
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphWindow;