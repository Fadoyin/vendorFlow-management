from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
import logging

from app.services.enhanced_ml_service import EnhancedMLService, ForecastMethod

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize enhanced ML service
ml_service = EnhancedMLService()

class ForecastMethodEnum(str, Enum):
    aws_forecast = "aws_forecast"
    prophet = "prophet" 
    xgboost = "xgboost"
    hybrid = "hybrid"
    auto = "auto"

class ForecastRequest(BaseModel):
    tenant_id: str = Field(..., description="Tenant identifier")
    item_id: str = Field(..., description="Item identifier") 
    vendor_id: str = Field(..., description="Vendor identifier")
    forecast_horizon: int = Field(30, ge=1, le=365, description="Forecast horizon in days")
    method: Optional[ForecastMethodEnum] = Field(None, description="Preferred forecasting method")
    force_method: bool = Field(False, description="Force use of specified method")
    include_confidence: bool = Field(True, description="Include confidence intervals")

class ForecastResponse(BaseModel):
    method: str = Field(..., description="Method used for forecasting")
    forecast_horizon: int = Field(..., description="Forecast horizon in days")
    predictions: List[Dict[str, Any]] = Field(..., description="Forecast predictions")
    confidence_intervals: List[Dict[str, Any]] = Field(..., description="Confidence intervals")
    metadata: Dict[str, Any] = Field(..., description="Forecast metadata")
    quality_metrics: Dict[str, Any] = Field(..., description="Quality metrics")
    generated_at: str = Field(..., description="Generation timestamp")
    status: str = Field(..., description="Forecast status")

class AccuracyRequest(BaseModel):
    tenant_id: str = Field(..., description="Tenant identifier")
    item_id: str = Field(..., description="Item identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    evaluation_days: int = Field(30, ge=7, le=90, description="Days to evaluate")

class AccuracyResponse(BaseModel):
    accuracy_metrics: Dict[str, float] = Field(..., description="Accuracy metrics")
    evaluation_period: Dict[str, Any] = Field(..., description="Evaluation period info")
    method_used: str = Field(..., description="Method used for evaluation")
    data_points_compared: int = Field(..., description="Number of data points compared")
    generated_at: str = Field(..., description="Generation timestamp")

@router.post("/generate", response_model=ForecastResponse)
async def generate_demand_forecast(request: ForecastRequest):
    """
    Generate demand forecast using AWS Forecast or local models
    
    This endpoint intelligently selects the best forecasting method based on:
    - Data quality and quantity
    - AWS Forecast availability  
    - Resource constraints
    - User preferences
    """
    try:
        logger.info(f"Generating forecast for item {request.item_id} using method {request.method}")
        
        # Convert method enum to ForecastMethod
        method = None
        if request.method and request.method != ForecastMethodEnum.auto:
            method = ForecastMethod(request.method.value)
        
        # Generate forecast
        result = await ml_service.generate_forecast(
            tenant_id=request.tenant_id,
            item_id=request.item_id,
            vendor_id=request.vendor_id,
            forecast_horizon=request.forecast_horizon,
            method=method,
            force_method=request.force_method
        )
        
        logger.info(f"Forecast generated successfully for item {request.item_id}")
        return ForecastResponse(**result)
        
    except Exception as e:
        logger.error(f"Forecast generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

@router.post("/aws-forecast", response_model=ForecastResponse)
async def generate_aws_forecast(request: ForecastRequest):
    """
    Generate forecast specifically using AWS Forecast service
    
    This endpoint forces the use of AWS Forecast and will fail if:
    - Insufficient data quality
    - AWS Forecast is not configured
    - Resource limits are exceeded
    """
    try:
        logger.info(f"Generating AWS Forecast for item {request.item_id}")
        
        result = await ml_service.generate_forecast(
            tenant_id=request.tenant_id,
            item_id=request.item_id,
            vendor_id=request.vendor_id,
            forecast_horizon=request.forecast_horizon,
            method=ForecastMethod.AWS_FORECAST,
            force_method=True
        )
        
        logger.info(f"AWS Forecast generated successfully for item {request.item_id}")
        return ForecastResponse(**result)
        
    except Exception as e:
        logger.error(f"AWS Forecast generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AWS Forecast generation failed: {str(e)}")

@router.post("/prophet", response_model=ForecastResponse)
async def generate_prophet_forecast(request: ForecastRequest):
    """
    Generate forecast using local Prophet model
    
    This endpoint uses the Prophet time series forecasting model
    running locally. Good for quick forecasts when AWS Forecast
    is not available or not needed.
    """
    try:
        logger.info(f"Generating Prophet forecast for item {request.item_id}")
        
        result = await ml_service.generate_forecast(
            tenant_id=request.tenant_id,
            item_id=request.item_id,
            vendor_id=request.vendor_id,
            forecast_horizon=request.forecast_horizon,
            method=ForecastMethod.PROPHET,
            force_method=True
        )
        
        logger.info(f"Prophet forecast generated successfully for item {request.item_id}")
        return ForecastResponse(**result)
        
    except Exception as e:
        logger.error(f"Prophet forecast generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prophet forecast generation failed: {str(e)}")

@router.post("/hybrid", response_model=ForecastResponse)
async def generate_hybrid_forecast(request: ForecastRequest):
    """
    Generate forecast using hybrid approach (AWS Forecast + Prophet)
    
    This endpoint runs both AWS Forecast and Prophet in parallel,
    then intelligently combines the results for improved accuracy.
    """
    try:
        logger.info(f"Generating hybrid forecast for item {request.item_id}")
        
        result = await ml_service.generate_forecast(
            tenant_id=request.tenant_id,
            item_id=request.item_id,
            vendor_id=request.vendor_id,
            forecast_horizon=request.forecast_horizon,
            method=ForecastMethod.HYBRID,
            force_method=True
        )
        
        logger.info(f"Hybrid forecast generated successfully for item {request.item_id}")
        return ForecastResponse(**result)
        
    except Exception as e:
        logger.error(f"Hybrid forecast generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Hybrid forecast generation failed: {str(e)}")

@router.post("/accuracy", response_model=AccuracyResponse)
async def evaluate_forecast_accuracy(request: AccuracyRequest):
    """
    Evaluate forecast accuracy by comparing predictions with actual values
    
    This endpoint helps assess the performance of different forecasting
    methods by calculating metrics like MAPE, RMSE, and R².
    """
    try:
        logger.info(f"Evaluating forecast accuracy for item {request.item_id}")
        
        result = await ml_service.get_forecast_accuracy(
            tenant_id=request.tenant_id,
            item_id=request.item_id,
            vendor_id=request.vendor_id,
            days_back=request.evaluation_days
        )
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        logger.info(f"Accuracy evaluation completed for item {request.item_id}")
        return AccuracyResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Accuracy evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Accuracy evaluation failed: {str(e)}")

@router.get("/status")
async def get_forecast_service_status():
    """
    Get the status of all forecasting services
    
    Returns information about:
    - AWS Forecast availability and current usage
    - Local model status
    - Resource utilization
    """
    try:
        status = await ml_service.get_service_status()
        return status
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.delete("/cleanup")
async def cleanup_forecast_resources(
    tenant_id: Optional[str] = Query(None, description="Specific tenant to clean up"),
    max_age_hours: int = Query(24, ge=1, le=168, description="Maximum age in hours")
):
    """
    Clean up old AWS Forecast resources to manage costs
    
    This endpoint removes old forecasting resources that are no longer needed.
    Use with caution in production environments.
    """
    try:
        logger.info(f"Cleaning up forecast resources older than {max_age_hours} hours")
        
        await ml_service.cleanup_resources(
            tenant_id=tenant_id,
            max_age_hours=max_age_hours
        )
        
        return {
            "message": "Resource cleanup completed successfully",
            "tenant_id": tenant_id,
            "max_age_hours": max_age_hours,
            "cleaned_at": ml_service.data_service.get_current_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Resource cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Resource cleanup failed: {str(e)}")

@router.get("/methods")
async def get_available_forecast_methods():
    """
    Get list of available forecasting methods
    
    Returns information about each method including:
    - Availability status
    - Recommended use cases
    - Data requirements
    """
    try:
        aws_available = ml_service._is_aws_forecast_available()
        
        methods = {
            "aws_forecast": {
                "name": "AWS Forecast",
                "available": aws_available,
                "description": "Enterprise-grade time series forecasting using Amazon Forecast",
                "min_data_points": ml_service.min_data_points_aws,
                "recommended_for": ["High-volume items", "Long-term forecasting", "Complex seasonality"],
                "max_horizon_days": 365
            },
            "prophet": {
                "name": "Prophet",
                "available": True,
                "description": "Local Prophet model for time series forecasting",
                "min_data_points": 30,
                "recommended_for": ["Quick forecasts", "Seasonal patterns", "General purpose"],
                "max_horizon_days": 90
            },
            "xgboost": {
                "name": "XGBoost",
                "available": True,
                "description": "Gradient boosting for demand forecasting",
                "min_data_points": 20,
                "recommended_for": ["Feature-rich data", "Non-seasonal patterns", "Short-term forecasts"],
                "max_horizon_days": 30
            },
            "hybrid": {
                "name": "Hybrid (AWS + Prophet)",
                "available": aws_available,
                "description": "Combined approach using multiple methods",
                "min_data_points": 30,
                "recommended_for": ["Critical forecasts", "Improved accuracy", "Risk mitigation"],
                "max_horizon_days": 365
            },
            "auto": {
                "name": "Auto-selection",
                "available": True,
                "description": "Automatically selects the best method based on data quality",
                "min_data_points": 10,
                "recommended_for": ["Default choice", "Varied data quality", "Hands-off approach"],
                "max_horizon_days": 365
            }
        }
        
        return {
            "available_methods": methods,
            "current_aws_jobs": ml_service.current_aws_jobs,
            "max_aws_jobs": ml_service.max_concurrent_aws_jobs,
            "aws_forecast_configured": aws_available
        }
        
    except Exception as e:
        logger.error(f"Failed to get available methods: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get available methods: {str(e)}")

# Legacy endpoints for backward compatibility
@router.post("/train", response_model=dict)
async def train_forecast_model_legacy(request: ForecastRequest):
    """Legacy endpoint for backward compatibility"""
    logger.warning("Using deprecated /train endpoint, please use /generate instead")
    result = await generate_demand_forecast(request)
    return {
        "message": "Model training completed successfully",
        "item_id": request.item_id,
        "model_id": result.metadata.get('model_id', 'unknown'),
        "method": result.method,
        "status": result.status
    }

@router.post("/predict", response_model=ForecastResponse)
async def predict_demand_legacy(request: ForecastRequest):
    """Legacy endpoint for backward compatibility"""
    logger.warning("Using deprecated /predict endpoint, please use /generate instead")
    return await generate_demand_forecast(request)
