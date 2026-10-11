from .health import router as health_router
from .datasets import router as datasets_router
from .models import router as models_router
from .predictions import router as predictions_router
from .anomalies import router as anomalies_router
from .explanations import router as explanations_router
from .reports import router as reports_router
from .copilot import router as copilot_router
from .investigations import router as investigations_router
from .auth import router as auth_router

__all__ = [
    "health_router",
    "datasets_router",
    "models_router",
    "predictions_router",
    "anomalies_router",
    "explanations_router",
    "reports_router",
    "copilot_router",
    "investigations_router",
    "auth_router",
]


