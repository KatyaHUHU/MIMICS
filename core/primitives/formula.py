import math
from .base import Primitive

class FormulaPrimitive(Primitive):
    def __init__(self, expression: str, variables: dict = None):
        self.expression = expression
        self.variables = variables or {}

    def generate(self, t: float) -> float:
        try:
            return eval(
                self.expression,
                {"math": math, "t": t},
                self.variables
            )
        except Exception:
            return 0.0

    def get_config(self) -> dict:
        return {
            "expression": self.expression,
            "variables": self.variables
        }