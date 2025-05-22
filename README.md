# 🎯 MIMICS - Система имитации работы датчиков

**MIMICS** (Modular IoT Mimicking and Control System) — это полнофункциональная система для имитации работы IoT датчиков с возможностью создания сложных сценариев поведения через графический NoCode интерфейс.

### 📊 **Гибкие сценарии генерации данных**
- **Константы** — постоянные значения
- **Тригонометрические формулы** — синусоиды, косинусы с настраиваемыми параметрами
- **Шум** — нормально распределенные случайные значения
- **Комбинированные сценарии** — последовательности из разных примитивов

### 🔄 **Real-time данные**
- Генерация данных в реальном времени
- Передача через MQTT протокол
- WebSocket для мгновенного отображения в браузере
- Настраиваемая частота генерации (Hz) и размер пакетов

### 📈 **Визуализация и мониторинг**
- Интерактивные графики в реальном времени
- Статистика по сгенерированным данным
- Индикаторы статуса работы системы

### 🏗️ **Масштабируемость**
- Неограниченное количество датчиков
- Поддержка множественных клиентов
- Циклические и одноразовые сценарии

## 🏛️ Архитектура системы

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│  FastAPI Backend │◄──►│  PostgreSQL DB  │
│   (Port 3000)   │    │   (Port 8000)    │    │   (Port 1234)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐
         │              │   MQTT Broker    │
         │              │ (broker.emqx.io) │
         │              └──────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   WebSocket     │    │  MQTT Clients    │
│  (Real-time)    │    │   (External)     │
└─────────────────┘    └──────────────────┘
```

### **Компоненты:**
- **Frontend**: React 19 с современным UI/UX
- **Backend**: FastAPI с асинхронной обработкой
- **Database**: PostgreSQL для хранения конфигураций
- **Message Broker**: MQTT для IoT протокола
- **Real-time**: WebSocket для live обновлений

## 📋 Требования

### **Системные требования:**
- **OS**: Windows 10/11, macOS, Linux
- **RAM**: минимум 4GB, рекомендуется 8GB
- **Storage**: 2GB свободного места

### **Программное обеспечение:**
- **Python**: 3.9+ (рекомендуется 3.11)
- **Node.js**: 16+ (рекомендуется 18+)
- **Docker Desktop**: для PostgreSQL базы данных
- **Git**: для клонирования репозитория

## 🚀 Быстрый старт

### **1. Автоматическая установка (рекомендуется)**

```bash
# Клонируйте репозиторий
git clone https://github.com/your-username/MIMICS.git
cd MIMICS

# Запустите автоматический лаунчер
python launcher.py
```

Лаунчер автоматически:
- ✅ Проверит зависимости
- ✅ Создаст виртуальное окружение Python
- ✅ Установит все зависимости
- ✅ Запустит базу данных в Docker
- ✅ Инициализирует таблицы БД
- ✅ Запустит backend и frontend
- ✅ Откроет браузер на http://localhost:3000

### **2. Ручная установка**

<details>
<summary>Нажмите для подробной инструкции</summary>

```bash
# 1. Клонирование репозитория
git clone https://github.com/your-username/MIMICS.git
cd MIMICS

# 2. Установка Python зависимостей
python -m venv venv
source venv/bin/activate  # Linux/macOS
# или
venv\Scripts\activate     # Windows

pip install -r requirements.txt

# 3. Установка Node.js зависимостей
cd sensor-app
npm install
cd ..

# 4. Запуск базы данных
docker-compose up -d

# 5. Инициализация БД
python db_init.py

# 6. Запуск backend (терминал 1)
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# 7. Запуск frontend (терминал 2)
cd sensor-app
npm start
```

</details>

## 🎮 Использование

### **Создание датчика**
1. Откройте http://localhost:3000
2. Нажмите **"Добавить датчик"**
3. Введите название и тип датчика
4. Нажмите **"Добавить"**

### **Настройка сценария**
1. Выберите датчик из списка
2. Нажмите **"Настройка сценариев"**
3. Нажмите **"Настройка эпизодов"**
4. Добавьте примитивы:
   - **Константа**: фиксированное значение
   - **Формула**: математическое выражение (например: `A * math.sin(2 * math.pi * t / period) + B`)
   - **Шум**: случайные значения с заданным распределением

### **Запуск генерации**
1. Настройте общие параметры (длительность, зацикливание)
2. Нажмите **"Запустить генерацию"**
3. Откройте **"Показать график"** для визуализации

### **Экспорт конфигурации**
- Нажмите **"Загрузить JSON"** для сохранения сценария
- Файл можно использовать для восстановления или программного доступа

## 📡 API Documentation

### **Основные эндпоинты:**

#### **Датчики**
```http
GET    /api/sensors           # Список всех датчиков
POST   /api/sensors           # Создание датчика
GET    /api/sensors/{id}      # Получение датчика
PUT    /api/sensors/{id}      # Обновление датчика
DELETE /api/sensors/{id}      # Удаление датчика
```

#### **Примитивы**
```http
GET    /api/sensors/{id}/primitives        # Примитивы датчика
POST   /api/sensors/{id}/primitives        # Добавление примитива
DELETE /api/sensors/primitives/{id}        # Удаление примитива
```

#### **Генерация данных**
```http
POST   /start     # Запуск генерации
POST   /stop      # Остановка генерации
GET    /status    # Статус генератора
```

#### **WebSocket**
```http
WS     /ws        # Real-time данные
GET    /data      # HTTP получение данных
```

### **Примеры запросов:**

<details>
<summary>Создание датчика</summary>

```bash
curl -X POST "http://localhost:8000/api/sensors" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Temperature Sensor",
    "type": "temperature"
  }'
```

</details>

<details>
<summary>Добавление примитива</summary>

```bash
curl -X POST "http://localhost:8000/api/sensors/1/primitives" \
  -H "Content-Type: application/json" \
  -d '{
    "primitive_type": "formula",
    "config": {
      "expression": "A * math.sin(2 * math.pi * t / period) + B",
      "variables": {"A": 2.5, "B": 22.5, "period": 10.0}
    },
    "duration": 30.0,
    "is_looped": true
  }'
```

</details>

<details>
<summary>Запуск генерации</summary>

```bash
curl -X POST "http://localhost:8000/start" \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": {
      "name": "Test Scenario",
      "episodes": [...]
    },
    "frequency": 10,
    "packets": 2
  }'
```

</details>

## 🔧 Конфигурация

### **Переменные окружения (.env)**
```bash
# База данных
DATABASE_URL=postgresql://postgres:postgres@localhost:1234/mimics_database

# MQTT (опционально)
MQTT_BROKER=broker.emqx.io
MQTT_PORT=1883
MQTT_TOPIC=mimics/sensor_data
```

### **MQTT конфигурация (config/mqtt_config.json)**
```json
{
  "broker": "broker.emqx.io",
  "port": 1883,
  "topic": "mimics/sensor_data",
  "username": "",
  "password": "",
  "qos": 1
}
```

## 🧪 Примеры сценариев

### **1. Температурный датчик**
```json
{
  "name": "Temperature Sensor Simulation",
  "episodes": [
    {
      "primitive_type": "constant",
      "config": {"value": 22.5},
      "duration": 5.0,
      "is_looped": false
    },
    {
      "primitive_type": "formula",
      "config": {
        "expression": "A * math.sin(2 * math.pi * t / period) + B",
        "variables": {"A": 2.5, "B": 22.5, "period": 10.0}
      },
      "duration": 30.0,
      "is_looped": true
    }
  ]
}
```

### **2. Датчик с шумом**
```json
{
  "name": "Noisy Sensor",
  "episodes": [
    {
      "primitive_type": "noise",
      "config": {
        "mean": 100.0,
        "amplitude": 5.0
      },
      "duration": 0,
      "is_looped": true
    }
  ]
}
```

## 🛠️ Troubleshooting

### **Распространенные проблемы:**

#### **🔴 "Не удается найти указанный файл" при установке**
```bash
# Решение 1: Запуск от администратора
# Решение 2: Проверка PATH для Node.js
where npm
where node

# Решение 3: Ручная установка
cd sensor-app
npm.cmd install  # Windows
npm install      # Linux/macOS
```

#### **🔴 "Docker не запускается"**
```bash
# Проверьте статус Docker Desktop
docker --version
docker-compose --version

# Перезапустите Docker Desktop
# Или установите с официального сайта: https://docker.com
```

#### **🔴 "Порт уже используется"**
```bash
# Освободите порты 3000, 8000, 1234
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# Или используйте лаунчер для автоматической очистки
python launcher.py --clean
```

#### **🔴 "WebSocket не подключается"**
- Проверьте, что backend запущен на порту 8000
- Откройте http://localhost:8000/docs для проверки API
- Проверьте логи в консоли браузера (F12)

### **Логи и отладка:**
```bash
# Логи backend
uvicorn api.main:app --reload --log-level debug

# Логи frontend
# Откройте Developer Tools (F12) в браузере

# Логи Docker
docker-compose logs -f
```

## Разработка

### **Структура проекта:**
```
MIMICS/
├── 📁 api/                 # FastAPI Backend
│   ├── main.py            # Главный файл API
│   ├── sensors.py         # Управление датчиками
│   ├── ws_handler.py      # WebSocket обработчик
│   └── schemas.py         # Pydantic модели
├── 📁 core/               # Бизнес-логика
│   ├── data_generator.py  # Генератор данных
│   ├── mqtt_client.py     # MQTT клиент
│   ├── scenario.py        # Сценарии
│   └── primitives/        # Примитивы генерации
├── 📁 db/                 # База данных
│   ├── models.py          # SQLAlchemy модели
│   ├── repository.py      # Репозитории
│   └── config.py          # Конфигурация БД
├── 📁 sensor-app/         # React Frontend
│   ├── src/
│   │   ├── SensorManager.jsx
│   │   ├── PrimitiveManager.js
│   │   ├── GraphWindow.jsx
│   │   └── api.js
│   └── package.json
├── 📁 config/             # Конфигурационные файлы
├── launcher.py            # Автоматический лаунчер
├── requirements.txt       # Python зависимости
└── docker-compose.yml     # Docker композиция
```

### **Запуск в режиме разработки:**
```bash
# Backend с hot-reload
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Frontend с hot-reload
cd sensor-app
npm start

# База данных
docker-compose up -d
```

### **Тестирование:**
```bash
# Python тесты
pytest

# Frontend тесты
cd sensor-app
npm test
```

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

---

**Сделано с ❤️**