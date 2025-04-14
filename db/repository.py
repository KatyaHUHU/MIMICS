from sqlalchemy.orm import Session
from .models import ScenarioDB, EpisodeDB
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