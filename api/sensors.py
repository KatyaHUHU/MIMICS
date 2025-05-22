from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db.config import get_db
from db.repository import SensorRepository

# Схемы данных для API
class PrimitiveBase(BaseModel):
    primitive_type: str
    config: dict
    duration: float
    is_looped: bool = False

class PrimitiveCreate(PrimitiveBase):
    pass

class PrimitiveResponse(PrimitiveBase):
    id: int
    sensor_id: int

    class Config:
        orm_mode = True

class SensorBase(BaseModel):
    name: str
    type: str

class SensorCreate(SensorBase):
    pass

class SensorResponse(SensorBase):
    id: int
    
    class Config:
        orm_mode = True

class SensorDetailResponse(SensorResponse):
    primitives: List[PrimitiveResponse] = []

# Создаем маршрутизатор
router = APIRouter(prefix="/api/sensors", tags=["sensors"])

# Эндпоинты для работы с датчиками
@router.get("/", response_model=List[SensorResponse])
def get_all_sensors(db: Session = Depends(get_db)):
    """Получить список всех датчиков"""
    repo = SensorRepository(db)
    return repo.get_all_sensors()

@router.post("/", response_model=SensorResponse)
def create_sensor(sensor: SensorCreate, db: Session = Depends(get_db)):
    """Создать новый датчик"""
    repo = SensorRepository(db)
    return repo.create_sensor(sensor.name, sensor.type)

@router.get("/{sensor_id}", response_model=SensorDetailResponse)
def get_sensor(sensor_id: int, db: Session = Depends(get_db)):
    """Получить датчик по ID с его примитивами"""
    repo = SensorRepository(db)
    db_sensor = repo.get_sensor(sensor_id)
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    return db_sensor

@router.put("/{sensor_id}", response_model=SensorResponse)
def update_sensor(sensor_id: int, sensor: SensorCreate, db: Session = Depends(get_db)):
    """Обновить существующий датчик"""
    repo = SensorRepository(db)
    db_sensor = repo.update_sensor(sensor_id, sensor.name, sensor.type)
    if not db_sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    return db_sensor

@router.delete("/{sensor_id}")
def delete_sensor(sensor_id: int, db: Session = Depends(get_db)):
    """Удалить датчик по ID"""
    repo = SensorRepository(db)
    if not repo.delete_sensor(sensor_id):
        raise HTTPException(status_code=404, detail="Датчик не найден")
    return {"success": True}

# Эндпоинты для работы с примитивами
@router.get("/{sensor_id}/primitives", response_model=List[PrimitiveResponse])
def get_sensor_primitives(sensor_id: int, db: Session = Depends(get_db)):
    """Получить все примитивы для датчика"""
    repo = SensorRepository(db)
    if not repo.get_sensor(sensor_id):
        raise HTTPException(status_code=404, detail="Датчик не найден")
    return repo.get_primitives(sensor_id)

@router.post("/{sensor_id}/primitives", response_model=PrimitiveResponse)
def add_sensor_primitive(sensor_id: int, primitive: PrimitiveCreate, db: Session = Depends(get_db)):
    """Добавить примитив к датчику"""
    repo = SensorRepository(db)
    db_primitive = repo.add_primitive(sensor_id, primitive.dict())
    if not db_primitive:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    return db_primitive

@router.delete("/primitives/{primitive_id}")
def delete_primitive(primitive_id: int, db: Session = Depends(get_db)):
    """Удалить примитив по ID"""
    repo = SensorRepository(db)
    if not repo.delete_primitive(primitive_id):
        raise HTTPException(status_code=404, detail="Примитив не найден")
    return {"success": True}