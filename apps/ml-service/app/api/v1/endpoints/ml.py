from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta

from app.services.ml_service import MLService
from app.core.auth import get_current_user
from app.schemas.forecast import ForecastRequest, ForecastResponse, TrainingRequest, TrainingResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/train", response_model=TrainingResponse)
async def train_model(
    request: TrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Train a new ML model for demand forecasting or cost prediction
    """
    try:
        ml_service = MLService()
        
        # Start training in background
        background_tasks.add_task(
            ml_service.train_model,
            request.model_type,
            request.item_id,
            request.vendor_id,
            request.tenant_id,
            request.parameters
        )
        
        logger.info(f"Training started for {request.model_type} model")
        
        return TrainingResponse(
            status="training_started",
            message="Model training has been initiated",
            training_id=f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error starting training: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate forecast predictions using trained models
    """
    try:
        ml_service = MLService()
        
        forecast = await ml_service.generate_forecast(
            request.model_type,
            request.item_id,
            request.vendor_id,
            request.tenant_id,
            request.forecast_horizon,
            request.parameters
        )
        
        logger.info(f"Forecast generated for {request.model_type}")
        
        return ForecastResponse(
            status="success",
            forecast_id=f"fc_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            predictions=forecast,
            metadata={
                "model_type": request.model_type,
                "forecast_horizon": request.forecast_horizon,
                "generated_at": datetime.now(),
                "confidence_level": request.parameters.get("confidence_level", 0.95)
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

@router.get("/models/{tenant_id}")
async def list_models(
    tenant_id: str,
    model_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    List available trained models for a tenant
    """
    try:
        ml_service = MLService()
        models = await ml_service.list_models(tenant_id, model_type)
        
        return {
            "status": "success",
            "models": models,
            "total": len(models)
        }
        
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@router.get("/models/{tenant_id}/{model_id}")
async def get_model_info(
    tenant_id: str,
    model_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific model
    """
    try:
        ml_service = MLService()
        model_info = await ml_service.get_model_info(tenant_id, model_id)
        
        if not model_info:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return {
            "status": "success",
            "model": model_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@router.delete("/models/{tenant_id}/{model_id}")
async def delete_model(
    tenant_id: str,
    model_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a trained model
    """
    try:
        ml_service = MLService()
        await ml_service.delete_model(tenant_id, model_id)
        
        logger.info(f"Model {model_id} deleted for tenant {tenant_id}")
        
        return {
            "status": "success",
            "message": "Model deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")

@router.post("/models/{tenant_id}/{model_id}/retrain")
async def retrain_model(
    tenant_id: str,
    model_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrain an existing model with new data
    """
    try:
        ml_service = MLService()
        
        # Start retraining in background
        background_tasks.add_task(
            ml_service.retrain_model,
            tenant_id,
            model_id
        )
        
        logger.info(f"Retraining started for model {model_id}")
        
        return {
            "status": "retraining_started",
            "message": "Model retraining has been initiated",
            "model_id": model_id,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error starting retraining: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@router.get("/performance/{tenant_id}")
async def get_model_performance(
    tenant_id: str,
    model_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get performance metrics for models
    """
    try:
        ml_service = MLService()
        performance = await ml_service.get_model_performance(tenant_id, model_type)
        
        return {
            "status": "success",
            "performance": performance
        }
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")

@router.post("/batch-forecast")
async def batch_forecast(
    requests: List[ForecastRequest],
    current_user: dict = Depends(get_current_user)
):
    """
    Generate forecasts for multiple items/vendors in batch
    """
    try:
        ml_service = MLService()
        results = []
        
        for request in requests:
            try:
                forecast = await ml_service.generate_forecast(
                    request.model_type,
                    request.item_id,
                    request.vendor_id,
                    request.tenant_id,
                    request.forecast_horizon,
                    request.parameters
                )
                
                results.append({
                    "request": request,
                    "status": "success",
                    "forecast": forecast
                })
                
            except Exception as e:
                results.append({
                    "request": request,
                    "status": "failed",
                    "error": str(e)
                })
        
        return {
            "status": "completed",
            "results": results,
            "total_requests": len(requests),
            "successful": len([r for r in results if r["status"] == "success"]),
            "failed": len([r for r in results if r["status"] == "failed"])
        }
        
    except Exception as e:
        logger.error(f"Error in batch forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch forecast failed: {str(e)}")
