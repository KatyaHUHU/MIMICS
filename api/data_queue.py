from collections import deque
import queue
import asyncio

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
        
        # Потокобезопасная операция, которая работает в любом потоке
        data_queue.put(data)
    except Exception as e:
        print(f"Error adding data to queue: {e}")

async def process_data_queue():
    """Асинхронная задача для обработки данных и отправки в WebSocket"""
    while True:
        try:
            # Проверяем очередь, не блокируя поток
            if not data_queue.empty():
                # Получаем данные из очереди
                data = data_queue.get(block=False)
                
                # Отправляем всем подключенным клиентам
                clients_to_remove = []
                for i, client in enumerate(websocket_clients):
                    try:
                        await client.send_json(data)
                    except Exception:
                        clients_to_remove.append(i)
                
                # Удаляем отключенных клиентов (в обратном порядке)
                for i in sorted(clients_to_remove, reverse=True):
                    websocket_clients.pop(i)
                
                # Отмечаем задачу как выполненную
                data_queue.task_done()
            
            # Небольшая пауза, чтобы не загружать CPU
            await asyncio.sleep(0.1)
        except queue.Empty:
            # Если очередь пуста, просто ждем
            await asyncio.sleep(0.1)
        except Exception as e:
            print(f"Error in process_data_queue: {e}")
            await asyncio.sleep(0.1)