from abc import ABC, abstractmethod

class Primitive(ABC):
    @abstractmethod
    def generate(self, t: float) -> float:
        pass
    
    @abstractmethod
    def get_config(self) -> dict:
        pass