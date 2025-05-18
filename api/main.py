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
project_root = Path(__file__).parent.parent.absolute()
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Импорты из проекта
from core.mqtt_client import MQTTPublisher
from core.data_generator import DataGenerator
from schemas import ScenarioSchema, StartRequest

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG,
    format="%(levelname)s:%(name)s:%(message)s"
)

logger = logging.getLogger("API")

# Инициализация FastAPI
app = FastAPI(title="MIMICS Data Generator API v2")

# CORS - разрешаем запросы с любых источников
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Явно импортируем модули для работы с данными и WebSocket
from api.data_queue import latest_data, websocket_clients, data_queue, process_data_queue
from api.ws_handler import router as ws_router

# Регистрируем маршруты WebSocket
app.include_router(ws_router)

# Примитивы (эпизоды) — временное хранилище
primitives_data = []

@app.get("/primitives")
async def list_primitives():
    """Получение списка всех примитивов"""
    return primitives_data

@app.post("/primitives")
async def create_primitive(primitive: dict):
    """Добавление нового примитива"""
    # Проверяем длительность
    if "duration" in primitive and primitive["duration"] <= 0:
        raise HTTPException(status_code=400, detail="Duration must be greater than 0")
    
    primitives_data.append(primitive)
    logger.info(f"Added new primitive: {primitive['primitive_type']}")
    return primitives_data

@app.delete("/primitives/{index}")
async def delete_primitive(index: int):
    """Удаление примитива по индексу"""
    if 0 <= index < len(primitives_data):
        deleted = primitives_data.pop(index)
        logger.info(f"Deleted primitive at index {index}: {deleted['primitive_type']}")
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
    """Выполняется при запуске сервера"""
    global mqtt_publisher, data_generator
    
    # Инициализация MQTT и генератора данных
    mqtt_publisher = MQTTPublisher(MQTT_CONFIG)
    data_generator = DataGenerator(mqtt_publisher)
    logger.info(f"MQTT: Connected to broker {MQTT_CONFIG['broker']}:{MQTT_CONFIG['port']}")
    
    # Запускаем фоновую задачу обработки очереди данных для WebSocket
    background_task = asyncio.create_task(process_data_queue())
    logger.info("WebSocket background task started")

@app.get("/")
async def root():
    """Информация о сервисе"""
    return {
        "status": "running", 
        "service": "MIMICS Data Generator API v2",
        "websocket_clients": len(websocket_clients),
        "data_points": len(latest_data)
    }

@app.post("/start", response_class=JSONResponse)
async def start_generation(req: StartRequest):
    """Запуск генерации данных"""
    try:
        # Проверяем валидность сценария
        if not req.scenario.episodes:
            raise ValueError("Scenario must have at least one episode")
        
        has_valid_looped = any(ep.get("is_looped", False) and ep.get("duration", 0) > 0 
                              for ep in req.scenario.episodes)
        
        total_non_looped_duration = sum(ep.get("duration", 0) 
                                       for ep in req.scenario.episodes 
                                       if not ep.get("is_looped", False))
        
        if not has_valid_looped and total_non_looped_duration <= 0:
            raise ValueError("Scenario must have either a looped episode with positive duration " 
                             "or non-looped episodes with positive total duration")
        
        # Останавливаем текущую генерацию, если она запущена
        if data_generator.is_running():
            data_generator.stop()
            logger.info("Stopping current data generation")
        
        # Запускаем новую генерацию
        data_generator.start_stream(
            scenario_config=req.scenario.dict(),
            frequency_hz=req.frequency,
            packets_per_sec=req.packets,
        )
        logger.info(f"Started generation with {len(req.scenario.episodes)} episodes")
        return {"status": "started", "scenario": req.scenario.name}
    except ValueError as e:
        logger.exception("Scenario validation error")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Start error")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop", response_class=JSONResponse)
async def stop_generation():
    """Остановка генерации данных"""
    data_generator.stop()
    logger.info("Generation stopped")
    return {"status": "stopped"}

@app.get("/status", response_class=JSONResponse)
async def get_status():
    """Получение статуса генератора"""
    return {
        "is_running": data_generator.is_running(),
        "data_points": len(latest_data),
        "websocket_clients": len(websocket_clients)
    }

@app.post("/scenario/download", response_class=Response)
async def download_scenario(scenario: ScenarioSchema):
    """
    Скачать сценарий как JSON файл и запустить генерацию данных.
    Этот эндпоинт вызывается при нажатии на кнопку "Скачать JSON и запустить".
    """
    # Проверяем валидность сценария
    if not scenario.episodes:
        raise HTTPException(status_code=400, detail="Scenario must have at least one episode")
    
    has_valid_looped = any(ep.get("is_looped", False) and ep.get("duration", 0) > 0 
                           for ep in scenario.episodes)
    
    total_non_looped_duration = sum(ep.get("duration", 0) 
                                   for ep in scenario.episodes 
                                   if not ep.get("is_looped", False))
    
    if not has_valid_looped and total_non_looped_duration <= 0:
        raise HTTPException(status_code=400, 
                          detail="Scenario must have either a looped episode with positive duration " 
                                "or non-looped episodes with positive total duration")
    
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
    
    logger.info(f"Downloading scenario and starting generation: {scenario.name}")
    
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers=headers,
        background=task,
    )

@app.on_event("shutdown")
async def shutdown_event():
    """Выполняется при завершении работы сервера"""
    # Останавливаем генерацию данных
    if data_generator.is_running():
        data_generator.stop()
    
    # Отключаемся от MQTT брокера
    mqtt_publisher.shutdown()
    logger.info("Server shutdown, resources cleaned up")

if __name__ == "__main__":  # Для запуска без Uvicorn CLI
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)