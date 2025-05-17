from typing import List, Dict, Any
import json
import math
from .primitives import ConstantPrimitive, FormulaPrimitive, NoisePrimitive

class Episode:
    def __init__(self, primitive, duration: float, is_looped: bool = False):
        self.primitive = primitive
        self.duration = duration
        self.is_looped = is_looped

    def to_dict(self) -> Dict[str, Any]:
        return {
            "duration": self.duration,
            "is_looped": self.is_looped,
            "primitive_type": self.primitive.__class__.__name__.lower(),
            "config": self.primitive.get_config()
        }

class Scenario:
    def __init__(self, name: str, episodes: List[Episode]):
        self.name = name
        self.episodes = episodes
        self.current_time = 0.0
        self._validate_episodes()

    def _validate_episodes(self):
        if not self.episodes:
            raise ValueError("Scenario must have at least one episode")
        
        total_duration = sum(ep.duration for ep in self.episodes if not ep.is_looped)
        if total_duration <= 0:
            raise ValueError("Scenario must have positive duration")

    @classmethod
    def from_json(cls, config: Dict[str, Any]):
        name = config["name"]
        episodes = []
        
        for ep_config in config["episodes"]:
            primitive_type = ep_config["primitive_type"]
            config = ep_config["config"]
            
            if primitive_type == "constant":
                primitive = ConstantPrimitive(config["value"])
            elif primitive_type == "formula":
                primitive = FormulaPrimitive(
                    config["expression"],
                    config.get("variables", {})
                )
            elif primitive_type == "noise":
                primitive = NoisePrimitive(
                    config.get("mean", 0.0),
                    config.get("amplitude", 1.0)
                )
            else:
                raise ValueError(f"Unknown primitive type: {primitive_type}")
            
            episodes.append(Episode(
                primitive,
                ep_config["duration"],
                ep_config.get("is_looped", False)
            ))
        
        return cls(name, episodes)

    def get_value(self) -> float:
        """Получение текущего значения сценария"""
        if not self.episodes:
            return 0.0
        
        active_episode = None
        time_accumulator = 0.0
        
        for episode in self.episodes:
            if (self.current_time < time_accumulator + episode.duration or 
                episode.is_looped):
                active_episode = episode
                break
            time_accumulator += episode.duration
        
        if not active_episode:
            return 0.0
        
        relative_time = (self.current_time - time_accumulator) % active_episode.duration
        return active_episode.primitive.generate(relative_time)

    def advance_time(self, delta: float):
        """Продвижение времени сценария"""
        self.current_time += delta

    def to_json(self) -> Dict[str, Any]:
        """Сериализация в JSON-совместимый словарь"""
        return {
            "name": self.name,
            "episodes": [ep.to_dict() for ep in self.episodes]
        }