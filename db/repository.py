from sqlalchemy.orm import Session
from .models import ScenarioDB, EpisodeDB, SensorDB, PrimitiveDB
from core.scenario import Scenario, Episode
from core.primitives import ConstantPrimitive, FormulaPrimitive

class ScenarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_scenario(self, scenario: Scenario) -> int:
        db_scenario = ScenarioDB(name=scenario.name)
        self.db.add(db_scenario)
        
        for episode in scenario.episodes:
            db_episode = EpisodeDB(
                duration=episode.duration,
                is_looped=episode.is_looped,
                primitive_type=episode.primitive.__class__.__name__.lower(),
                config=self._get_primitive_config(episode.primitive),
                scenario=db_scenario
            )
            self.db.add(db_episode)
        
        self.db.commit()
        return db_scenario.id

    def _get_primitive_config(self, primitive) -> dict:
        if isinstance(primitive, ConstantPrimitive):
            return {"value": primitive.value}
        elif isinstance(primitive, FormulaPrimitive):
            return {
                "expression": primitive.expression,
                "variables": primitive.variables
            }
        return {}

# Новый репозиторий для датчиков
class SensorRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_sensors(self):
        """Получить все датчики из БД"""
        return self.db.query(SensorDB).all()

    def get_sensor(self, sensor_id: int):
        """Получить датчик по ID"""
        return self.db.query(SensorDB).filter(SensorDB.id == sensor_id).first()

    def create_sensor(self, name: str, sensor_type: str):
        """Создать новый датчик"""
        db_sensor = SensorDB(name=name, type=sensor_type)
        self.db.add(db_sensor)
        self.db.commit()
        self.db.refresh(db_sensor)
        return db_sensor

    def update_sensor(self, sensor_id: int, name: str, sensor_type: str):
        """Обновить существующий датчик"""
        db_sensor = self.get_sensor(sensor_id)
        if db_sensor:
            db_sensor.name = name
            db_sensor.type = sensor_type
            self.db.commit()
            self.db.refresh(db_sensor)
        return db_sensor

    def delete_sensor(self, sensor_id: int):
        """Удалить датчик по ID"""
        db_sensor = self.get_sensor(sensor_id)
        if db_sensor:
            self.db.delete(db_sensor)
            self.db.commit()
            return True
        return False

    def add_primitive(self, sensor_id: int, primitive_data: dict):
        """Добавить примитив к датчику"""
        db_sensor = self.get_sensor(sensor_id)
        if not db_sensor:
            return None
        
        db_primitive = PrimitiveDB(
            sensor_id=sensor_id,
            primitive_type=primitive_data.get("primitive_type"),
            config=primitive_data.get("config"),
            duration=primitive_data.get("duration"),
            is_looped=primitive_data.get("is_looped", False)
        )
        self.db.add(db_primitive)
        self.db.commit()
        self.db.refresh(db_primitive)
        return db_primitive

    def get_primitives(self, sensor_id: int):
        """Получить все примитивы для датчика"""
        return self.db.query(PrimitiveDB).filter(PrimitiveDB.sensor_id == sensor_id).all()

    def get_primitive(self, primitive_id: int):
        """Получить примитив по ID"""
        return self.db.query(PrimitiveDB).filter(PrimitiveDB.id == primitive_id).first()

    def delete_primitive(self, primitive_id: int):
        """Удалить примитив по ID"""
        primitive = self.get_primitive(primitive_id)
        if primitive:
            self.db.delete(primitive)
            self.db.commit()
            return True
        return False