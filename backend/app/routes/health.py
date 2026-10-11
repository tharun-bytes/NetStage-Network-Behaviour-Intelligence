from fastapi import APIRouter
from backend.app.config import settings
from backend.app.state import app_state
from backend.app.schemas.health import HealthResponse, SystemStatusResponse

router = APIRouter(tags=["Health & Status"])

@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return backend health check, version, and uptime."""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        runtime="Python",
        uptime_seconds=round(app_state.get_uptime(), 2),
    )

@router.get("/status", response_model=SystemStatusResponse)
def get_status() -> SystemStatusResponse:
    """Return platform status including active dataset, models, and anomaly engine."""
    return SystemStatusResponse(**app_state.get_status_summary())
