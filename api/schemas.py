from pydantic import BaseModel, Field
from typing import Dict, Any

class ScenarioSchema(BaseModel):
    name: str = Field(..., example="Temperature Sensor Simulation")
    episodes: list[Dict[str, Any]]

class StartRequest(BaseModel):
    scenario: ScenarioSchema
    frequency: int = Field(10, gt=0, example=10)
    packets: int = Field(2, gt=0, example=2)
