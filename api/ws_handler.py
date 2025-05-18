from fastapi import APIRouter, WebSocket
from fastapi.responses import JSONResponse
import logging
import sys
from pathlib import Path

# Устанавливаем корректный путь импорта
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Импортируем из текущего модуля
from data_queue import latest_data, websocket_clients, data_queue, process_data_queue

logger = logging.getLogger("WSHandler")

router = APIRouter()

@router.get("/data")
async def get_data():
    """Получение последних данных через HTTP"""
    data_list = list(latest_data)
    logger.info(f"HTTP запрос /data - возвращаем {len(data_list)} точек")
    return data_list

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket для получения данных в реальном времени"""
    await websocket.accept()
    websocket_clients.append(websocket)
    logger.info(f"WebSocket: Клиент подключен, всего клиентов: {len(websocket_clients)}")
    
    # Сразу отправляем текущие данные при подключении
    if latest_data:
        try:
            await websocket.send_json(list(latest_data))
            logger.info(f"WebSocket: Отправлены начальные данные клиенту ({len(latest_data)} точек)")
        except Exception as e:
            logger.error(f"WebSocket: Ошибка отправки начальных данных: {e}")
    
    try:
        while True:
            # Поддерживаем соединение
            await websocket.receive_text()
    except Exception as e:
        logger.error(f"WebSocket: Ошибка соединения: {e}")
    finally:
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)
            logger.info(f"WebSocket: Клиент отключен, осталось клиентов: {len(websocket_clients)}")