import sys
from pathlib import Path

# Добавляем корень проекта в PYTHONPATH
sys.path.append(str(Path(__file__).parent))

from db.config import engine
from db.models import Base, ScenarioDB, EpisodeDB, SensorDB, PrimitiveDB

def init_db():
    # Создание всех таблиц в базе данных
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

if __name__ == "__main__":
    init_db()