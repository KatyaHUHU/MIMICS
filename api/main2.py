from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import paho.mqtt.client as mqtt
import json
from collections import deque
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Хранилище данных
latest_data = deque(maxlen=1000)
websocket_clients = []

# MQTT конфиг
MQTT_BROKER = "test.mosquitto.org"
MQTT_TOPIC = "mimics/sensor_data"

def on_mqtt_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker")
    client.subscribe(MQTT_TOPIC)

def on_mqtt_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        
        # Сохраняем все точки из packet
        for point in data["packet"]:
            latest_data.append({
                "timestamp": point["timestamp"],
                "value": point["value"]
            })
        
        # Отправляем через WebSocket
        asyncio.run(notify_websockets())
    except Exception as e:
        print("MQTT error:", e)

async def notify_websockets():
    for ws in websocket_clients:
        try:
            await ws.send_json(list(latest_data))
        except:
            websocket_clients.remove(ws)

# Инициализация MQTT
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_mqtt_connect
mqtt_client.on_message = on_mqtt_message
mqtt_client.connect(MQTT_BROKER, 1883, 60)
mqtt_client.loop_start()

@app.get("/data")
async def get_data():
    return list(latest_data)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Просто поддерживаем соединение
    except:
        websocket_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)