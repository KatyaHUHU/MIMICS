from collections import deque
import queue

# Общее хранилище данных
latest_data = deque(maxlen=1000)
websocket_clients = []
data_queue = queue.Queue()