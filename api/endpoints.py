from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from db.config import get_db
from db.repository import ScenarioRepository
from core.scenario import Scenario, Episode
from core.primitives.constant import ConstantPrimitive
import json

app = FastAPI()

@app.post("/scenarios")
def create_scenario(name: str, db: Session = Depends(get_db)):
    # Пример создания сценария
    scenario = Scenario(
        name=name,
        episodes=[
            Episode(ConstantPrimitive(25.0), duration=10.0)
        ]
    )
    repo = ScenarioRepository(db)
    scenario_id = repo.save_scenario(scenario)
    return {"id": scenario_id}

@app.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    # Получение сценария из БД
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario