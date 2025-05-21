from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ScenarioDB(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    episodes = relationship("EpisodeDB", back_populates="scenario")

class EpisodeDB(Base):
    __tablename__ = "episodes"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"))
    duration = Column(Float)
    is_looped = Column(Boolean)
    primitive_type = Column(String)
    config = Column(JSON)
    scenario = relationship("ScenarioDB", back_populates="episodes")

# Новые модели для датчиков
class SensorDB(Base):
    __tablename__ = "sensors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) 
    primitives = relationship("PrimitiveDB", back_populates="sensor", cascade="all, delete-orphan")

class PrimitiveDB(Base):
    __tablename__ = "primitives"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="CASCADE"))
    primitive_type = Column(String, nullable=False)
    config = Column(JSON, nullable=False)
    duration = Column(Float, nullable=False)
    is_looped = Column(Boolean, default=False)
    sensor = relationship("SensorDB", back_populates="primitives")