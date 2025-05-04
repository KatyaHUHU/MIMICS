import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const GraphWindow = ({ onClose }) => {
  const [data, setData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    // Подключаемся к WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
      
      // Автопрокрутка к новым данным
      if (chartRef.current) {
        chartRef.current.scrollLeft = chartRef.current.scrollWidth;
      }
    };

    // Fallback на HTTP, если WS не работает
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/data');
        setData(await res.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    const interval = setInterval(fetchData, 1000);
    
    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <button 
        onClick={onClose}
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        Закрыть
      </button>
      
      <div ref={chartRef} style={{ overflowX: 'auto' }}>
        <LineChart
          width={800}
          height={400}
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(ts) => new Date(ts * 1000).toLocaleTimeString()}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(ts) => `Time: ${new Date(ts * 1000).toLocaleString()}`}
          />
          <Line 
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            dot={false}
          />
        </LineChart>
      </div>
      
      <div style={{ padding: 10 }}>
        Получено точек: {data.length} | Источник: MQTT → WebSocket
      </div>
    </div>
  );
};

export default GraphWindow;