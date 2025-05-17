from fastapi import APIRouter, WebSocket
from fastapi.responses import JSONResponse
from data_queue import latest_data, websocket_clients, data_queue, process_data_queue

router = APIRouter()

@router.get("/data")
async def get_data():
    """Получение последних данных через HTTP"""
    return list(latest_data)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket для получения данных в реальном времени"""
    await websocket.accept()
    websocket_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Поддержка соединения
    except Exception:
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)