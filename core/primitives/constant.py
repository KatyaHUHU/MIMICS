from .base import Primitive

class ConstantPrimitive(Primitive):
    def __init__(self, value: float):
        self.value = value

    def generate(self, t: float) -> float:
        return self.value

    def get_config(self) -> dict:
        return {"value": self.value}