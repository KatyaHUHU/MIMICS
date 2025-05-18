from collections import deque
import queue
import asyncio
import logging

# Настройка логирования
logger = logging.getLogger("WSQueue")

# Хранилище данных для HTTP API
latest_data = deque(maxlen=1000)
# Список WebSocket-клиентов
websocket_clients = []
# Обычная потокобезопасная очередь (не asyncio.Queue)
data_queue = queue.Queue()

def add_data_to_queue(data):
    """Добавляет данные в очередь из любого потока"""
    try:
        # Сохраняем данные для HTTP доступа
        if isinstance(data, dict) and "packet" in data:
            for point in data["packet"]:
                latest_data.append({
                    "timestamp": point["timestamp"],
                    "value": point["value"]
                })
            logger.info(f"HTTP: Добавлено {len(data['packet'])} точек в latest_data, всего: {len(latest_data)}")
        
        # Потокобезопасная операция, которая работает в любом потоке
        data_queue.put(data)
        logger.info(f"Данные добавлены в очередь, размер очереди: {data_queue.qsize()}")
    except Exception as e:
        logger.error(f"Error adding data to queue: {e}")
        import traceback
        logger.error(traceback.format_exc())

async def process_data_queue():
    """Асинхронная задача для обработки данных и отправки в WebSocket"""
    logger.info("WebSocket background task started")
    while True:
        try:
            # Проверяем очередь, не блокируя поток
            if not data_queue.empty():
                # Получаем данные из очереди
                data = data_queue.get(block=False)
                logger.info(f"WebSocket: Обработка данных из очереди, клиентов: {len(websocket_clients)}")
                
                # Отправляем всем подключенным клиентам
                clients_to_remove = []
                for i, client in enumerate(websocket_clients):
                    try:
                        await client.send_json(data)
                        logger.info(f"WebSocket: Данные отправлены клиенту #{i}")
                    except Exception as e:
                        logger.error(f"WebSocket: Ошибка отправки клиенту #{i}: {e}")
                        clients_to_remove.append(i)
                
                # Удаляем отключенных клиентов (в обратном порядке)
                for i in sorted(clients_to_remove, reverse=True):
                    logger.warning(f"WebSocket: Удаление отключенного клиента #{i}")
                    websocket_clients.pop(i)
                
                # Отмечаем задачу как выполненную
                data_queue.task_done()
            
            # Небольшая пауза, чтобы не загружать CPU
            await asyncio.sleep(0.1)
        except queue.Empty:
            # Если очередь пуста, просто ждем
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Error in process_data_queue: {e}")
            import traceback
            logger.error(traceback.format_exc())
            await asyncio.sleep(0.1)