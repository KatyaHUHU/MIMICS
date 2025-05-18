import random
from .base import Primitive

class NoisePrimitive(Primitive):
    def __init__(self, mean: float = 0.0, amplitude: float = 1.0):
        self.mean = mean
        self.amplitude = amplitude

    def generate(self, t: float) -> float:
        # Генерация нормально распределённого шума
        return self.mean + self.amplitude * random.normalvariate(0, 1)

    def get_config(self) -> dict:
        return {
            "mean": self.mean,
            "amplitude": self.amplitude
        }