from fastapi import APIRouter
from app.api.v1.endpoints import forecasts, costs

api_router = APIRouter()

api_router.include_router(forecasts.router, prefix="/forecasts", tags=["forecasts"])
api_router.include_router(costs.router, prefix="/costs", tags=["costs"])
