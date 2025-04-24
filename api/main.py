import sys
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi import FastAPI
from core.mqtt_client import MQTTPublisher
from core.data_generator import DataGenerator

# Добавляем корень проекта в пути импорта
sys.path.append(str(Path(__file__).parent.parent))

# Импортируем модули из core
from core.mqtt_client import MQTTPublisher
from core.data_generator import DataGenerator

# Настройка логгера
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API")

# Инициализация FastAPI
app = FastAPI(title="MIMICS Data Generator API")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Конфигурация MQTT
MQTT_CONFIG = {
    "broker": "test.mosquitto.org",
    "port": 1883,
    "topic": "sensors/mimics_v1",
    "username": "",
    "password": "",
    "qos": 0
}

# Инициализация компонентов
mqtt_publisher = MQTTPublisher(MQTT_CONFIG)
data_generator = DataGenerator(mqtt_publisher)

@app.get("/")
async def root():
    """Проверка работоспособности API"""
    return {"status": "running", "service": "MIMICS Data Generator"}

@app.post("/start")
async def start_generation(frequency: int = 10, packets: int = 2):
    """Запуск генерации данных"""
    try:
        # Здесь должен быть ваш конфиг сценария
        scenario_config = {
            "name": "Default Scenario",
            "episodes": [
                {
                    "duration": 10.0,
                    "is_looped": True,
                    "primitive_type": "formula",
                    "config": {
                        "expression": "5*math.sin(t)",
                        "variables": {}
                    }
                }
            ]
        }
        
        data_generator.start_stream(
            scenario_config=scenario_config,
            frequency_hz=frequency,
            packets_per_sec=packets
        )
        return {"status": "started"}
    except Exception as e:
        logger.error(f"Start error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/stop")
async def stop_generation():
    """Остановка генерации данных"""
    data_generator.stop()
    return {"status": "stopped"}

@app.get("/status")
async def get_status():
    """Получение статуса генерации"""
    return {"is_running": data_generator.is_running()}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket для реального времени"""
    await websocket.accept()
    try:
        while True:
            # Здесь можно реализовать передачу данных
            await websocket.receive_text()
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)