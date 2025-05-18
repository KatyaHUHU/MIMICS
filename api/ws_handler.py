from fastapi import APIRouter, WebSocket
from fastapi.responses import JSONResponse
import logging
import sys
from pathlib import Path

# Устанавливаем корректный путь импорта
project_root = Path(__file__).parent.parent.absolute()
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Импортируем общее состояние
from api.shared_state import latest_data, websocket_clients, data_queue

logger = logging.getLogger("WSHandler")

router = APIRouter()

@router.get("/data")
async def get_data():
    """Получение последних данных через HTTP"""
    data_list = list(latest_data)
    logger.info(f"HTTP запрос /data - возвращаем {len(data_list)} точек")
    if data_list:
        logger.debug(f"Первые 3 точки: {data_list[:3]}")
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
            data_list = list(latest_data)  # Создаем копию для отправки
            logger.debug(f"Отправляем начальные данные: {len(data_list)} точек")
            await websocket.send_json(data_list)
            logger.info(f"WebSocket: Отправлены начальные данные клиенту ({len(data_list)} точек)")
            if data_list:
                logger.debug(f"Первая точка отправленных данных: {data_list[0]}")
        except Exception as e:
            logger.error(f"WebSocket: Ошибка отправки начальных данных: {e}")
    else:
        logger.warning("WebSocket: Нет данных для отправки новому клиенту")
    
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