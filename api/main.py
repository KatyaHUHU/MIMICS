import sys
from pathlib import Path
import logging
import json
import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.background import BackgroundTask

# Добавляем корень проекта в PYTHONPATH
sys.path.append(str(Path(__file__).parent.parent))

from core.mqtt_client import MQTTPublisher
from core.data_generator import DataGenerator
from schemas import ScenarioSchema, StartRequest

# Логирование
logging.basicConfig(
    level=logging.DEBUG,
    format="%(levelname)s:%(name)s:%(message)s"
)

logger = logging.getLogger("API")

# Инициализация FastAPI
app = FastAPI(title="MIMICS Data Generator API v2")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Импортируем и регистрируем WebSocket маршруты
from ws_handler import router as ws_router, process_data_queue
app.include_router(ws_router)

# Примитивы (эпизоды) — временное хранилище
primitives_data = []

@app.get("/primitives")
async def list_primitives():
    return primitives_data

@app.post("/primitives")
async def create_primitive(primitive: dict):
    primitives_data.append(primitive)
    return primitives_data

@app.delete("/primitives/{index}")
async def delete_primitive(index: int):
    if 0 <= index < len(primitives_data):
        primitives_data.pop(index)
        return primitives_data
    raise HTTPException(status_code=404, detail="Primitive not found")

# Конфигурация MQTT
MQTT_CONFIG = {
    "broker": "broker.emqx.io",
    "port":   1883,
    "topic":  "mimics/sensor_data",
    "username": "",
    "password": "",
    "qos": 1,
}

# Плейсхолдеры для MQTT и генератора, инициализируются при старте
mqtt_publisher: MQTTPublisher
data_generator: DataGenerator

@app.on_event("startup")
async def startup_event():
    global mqtt_publisher, data_generator
    
    # Инициализация MQTT и генератора данных
    mqtt_publisher = MQTTPublisher(MQTT_CONFIG)
    data_generator = DataGenerator(mqtt_publisher)
    logger.info(f"MQTT: Connected to broker {MQTT_CONFIG['broker']}:{MQTT_CONFIG['port']}")
    
    # Запускаем фоновую задачу обработки очереди данных для WebSocket
    asyncio.create_task(process_data_queue())

@app.get("/")
async def root():
    return {"status": "running", "service": "MIMICS Data Generator API v2"}

@app.post("/start", response_class=JSONResponse)
async def start_generation(req: StartRequest):
    try:
        if data_generator.is_running():
            data_generator.stop()
        data_generator.start_stream(
            scenario_config=req.scenario.dict(),
            frequency_hz=req.frequency,
            packets_per_sec=req.packets,
        )
        return {"status": "started"}
    except Exception as e:
        logger.exception("Start error")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop", response_class=JSONResponse)
async def stop_generation():
    data_generator.stop()
    return {"status": "stopped"}

@app.get("/status", response_class=JSONResponse)
async def get_status():
    return {"is_running": data_generator.is_running()}

@app.post("/scenario/download", response_class=Response)
async def download_scenario(scenario: ScenarioSchema):
    # Сериализация сценария в JSON
    json_bytes: bytes = json.dumps(
        scenario.dict(), ensure_ascii=False, indent=2
    ).encode()
    headers = {"Content-Disposition": 'attachment; filename="scenario.json"'}
    # Фоновая задача запуска генерации
    task = BackgroundTask(
        data_generator.start_stream,
        scenario_config=scenario.dict(),
        frequency_hz=10,
        packets_per_sec=2,
    )
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers=headers,
        background=task,
    )

if __name__ == "__main__":  # Для запуска без Uvicorn CLI
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)