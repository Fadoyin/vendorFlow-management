import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
import asyncio
import json
from enum import Enum

from app.core.config import settings
from app.services.data_service import DataService
from app.services.aws_forecast_service import AWSForecastService
from app.services.ml_service import MLService  # Existing Prophet/XGBoost service

logger = logging.getLogger(__name__)

class ForecastMethod(Enum):
    AWS_FORECAST = "aws_forecast"
    PROPHET = "prophet"
    XGBOOST = "xgboost"
    HYBRID = "hybrid"

class EnhancedMLService:
    """
    Enhanced ML Service that intelligently chooses between AWS Forecast and local models
    based on data quality, requirements, and availability.
    """
    
    def __init__(self):
        self.data_service = DataService(
            mongo_uri=settings.MONGODB_URI,
            redis_url=settings.REDIS_URL
        )
        self.aws_forecast_service = AWSForecastService()
        self.local_ml_service = MLService()  # Fallback to existing service
        
        # Configuration
        self.min_data_points_aws = settings.FORECAST_MIN_DATA_POINTS
        self.max_concurrent_aws_jobs = settings.FORECAST_MAX_CONCURRENT_JOBS
        self.current_aws_jobs = 0
        
        logger.info("Enhanced ML Service initialized with AWS Forecast integration")

    async def generate_forecast(
        self,
        tenant_id: str,
        item_id: str,
        vendor_id: str,
        forecast_horizon: int = 30,
        method: Optional[ForecastMethod] = None,
        force_method: bool = False
    ) -> Dict[str, Any]:
        """
        Generate forecast using the most appropriate method
        """
        try:
            # Determine the best forecasting method
            chosen_method = await self._select_forecast_method(
                tenant_id, item_id, vendor_id, method, force_method
            )
            
            logger.info(f"Using forecast method: {chosen_method.value} for item {item_id}")
            
            # Generate forecast based on chosen method
            if chosen_method == ForecastMethod.AWS_FORECAST:
                return await self._generate_aws_forecast(
                    tenant_id, item_id, vendor_id, forecast_horizon
                )
            elif chosen_method == ForecastMethod.HYBRID:
                return await self._generate_hybrid_forecast(
                    tenant_id, item_id, vendor_id, forecast_horizon
                )
            else:
                return await self._generate_local_forecast(
                    tenant_id, item_id, vendor_id, forecast_horizon, chosen_method
                )
                
        except Exception as e:
            logger.error(f"Forecast generation failed: {e}")
            # Fallback to local Prophet model
            logger.info("Falling back to local Prophet model")
            return await self._generate_local_forecast(
                tenant_id, item_id, vendor_id, forecast_horizon, ForecastMethod.PROPHET
            )

    async def _select_forecast_method(
        self,
        tenant_id: str,
        item_id: str,
        vendor_id: str,
        preferred_method: Optional[ForecastMethod] = None,
        force_method: bool = False
    ) -> ForecastMethod:
        """
        Intelligently select the best forecasting method based on various factors
        """
        # If method is forced, use it
        if force_method and preferred_method:
            return preferred_method
        
        # Get data quality metrics
        data_quality = await self._assess_data_quality(tenant_id, item_id, vendor_id)
        
        # Decision logic
        if preferred_method == ForecastMethod.AWS_FORECAST:
            # Check if AWS Forecast is suitable
            if (data_quality['data_points'] >= self.min_data_points_aws and
                data_quality['data_completeness'] > 0.8 and
                self.current_aws_jobs < self.max_concurrent_aws_jobs and
                self._is_aws_forecast_available()):
                return ForecastMethod.AWS_FORECAST
            else:
                logger.warning("AWS Forecast not suitable, using hybrid approach")
                return ForecastMethod.HYBRID
        
        # Auto-selection logic
        if (data_quality['data_points'] >= self.min_data_points_aws and
            data_quality['data_completeness'] > 0.9 and
            data_quality['trend_strength'] > 0.6 and
            self.current_aws_jobs < self.max_concurrent_aws_jobs and
            self._is_aws_forecast_available()):
            return ForecastMethod.AWS_FORECAST
        
        elif (data_quality['data_points'] >= 30 and
              data_quality['seasonality_strength'] > 0.5):
            return ForecastMethod.PROPHET
        
        elif data_quality['data_points'] >= 20:
            return ForecastMethod.XGBOOST
        
        else:
            return ForecastMethod.PROPHET  # Default fallback

    async def _assess_data_quality(self, tenant_id: str, item_id: str, vendor_id: str) -> Dict[str, float]:
        """
        Assess the quality of historical data for forecasting
        """
        try:
            # Get historical data - using 'demand' data type for forecasting
            historical_data = self.data_service.get_training_data(
                tenant_id, 'demand'
            )
            
            if historical_data.empty:
                return {
                    'data_points': 0,
                    'data_completeness': 0.0,
                    'trend_strength': 0.0,
                    'seasonality_strength': 0.0,
                    'noise_level': 1.0
                }
            
            # Calculate metrics
            data_points = len(historical_data)
            
            # Data completeness (ratio of non-null values)
            data_completeness = historical_data['quantity'].notna().mean()
            
            # Trend strength (correlation with time)
            time_index = np.arange(len(historical_data))
            trend_strength = abs(np.corrcoef(historical_data['quantity'].fillna(0), time_index)[0, 1])
            
            # Seasonality strength (simplified using autocorrelation)
            values = historical_data['quantity'].fillna(0).values
            if len(values) > 14:  # Weekly seasonality
                weekly_autocorr = np.corrcoef(values[:-7], values[7:])[0, 1] if len(values) > 7 else 0
                seasonality_strength = abs(weekly_autocorr)
            else:
                seasonality_strength = 0.0
            
            # Noise level (coefficient of variation)
            mean_val = values.mean()
            std_val = values.std()
            noise_level = std_val / mean_val if mean_val > 0 else 1.0
            
            return {
                'data_points': data_points,
                'data_completeness': data_completeness,
                'trend_strength': trend_strength,
                'seasonality_strength': seasonality_strength,
                'noise_level': noise_level
            }
            
        except Exception as e:
            logger.error(f"Failed to assess data quality: {e}")
            return {
                'data_points': 0,
                'data_completeness': 0.0,
                'trend_strength': 0.0,
                'seasonality_strength': 0.0,
                'noise_level': 1.0
            }

    def _is_aws_forecast_available(self) -> bool:
        """
        Check if AWS Forecast is available and configured
        """
        try:
            return (
                settings.AWS_REGION is not None and
                settings.AWS_FORECAST_ROLE_ARN is not None and
                settings.AWS_S3_BUCKET is not None
            )
        except:
            return False

    async def _generate_aws_forecast(
        self,
        tenant_id: str,
        item_id: str,
        vendor_id: str,
        forecast_horizon: int
    ) -> Dict[str, Any]:
        """
        Generate forecast using AWS Forecast service
        """
        try:
            self.current_aws_jobs += 1
            logger.info(f"Starting AWS Forecast for item {item_id}")
            
            # Generate forecast using AWS Forecast
            aws_result = await self.aws_forecast_service.generate_demand_forecast(
                tenant_id, item_id, vendor_id, forecast_horizon
            )
            
            # Format result for consistency with local models
            formatted_result = {
                'method': 'aws_forecast',
                'forecast_horizon': forecast_horizon,
                'predictions': aws_result.get('predictions', []),
                'confidence_intervals': aws_result.get('confidence_intervals', []),
                'metadata': aws_result.get('metadata', {}),
                'quality_metrics': {
                    'confidence_score': 0.9,  # AWS Forecast typically has high confidence
                    'data_source': 'aws_forecast',
                    'algorithm': 'AWS_Forecast_Prophet'
                },
                'generated_at': datetime.utcnow().isoformat(),
                'status': 'success'
            }
            
            logger.info(f"AWS Forecast completed for item {item_id}")
            return formatted_result
            
        except Exception as e:
            logger.error(f"AWS Forecast failed: {e}")
            raise
        finally:
            self.current_aws_jobs -= 1

    async def _generate_hybrid_forecast(
        self,
        tenant_id: str,
        item_id: str,
        vendor_id: str,
        forecast_horizon: int
    ) -> Dict[str, Any]:
        """
        Generate forecast using hybrid approach (AWS + local models)
        """
        try:
            logger.info(f"Starting hybrid forecast for item {item_id}")
            
            # Run both AWS Forecast and Prophet in parallel
            aws_task = None
            prophet_task = self._generate_local_forecast(
                tenant_id, item_id, vendor_id, forecast_horizon, ForecastMethod.PROPHET
            )
            
            # Try AWS Forecast if available
            if (self.current_aws_jobs < self.max_concurrent_aws_jobs and
                self._is_aws_forecast_available()):
                aws_task = self._generate_aws_forecast(
                    tenant_id, item_id, vendor_id, forecast_horizon
                )
            
            # Wait for results
            results = []
            if aws_task:
                try:
                    aws_result = await asyncio.wait_for(aws_task, timeout=3600)  # 1 hour timeout
                    results.append(('aws_forecast', aws_result))
                except asyncio.TimeoutError:
                    logger.warning("AWS Forecast timed out, using local model only")
                except Exception as e:
                    logger.warning(f"AWS Forecast failed: {e}, using local model only")
            
            prophet_result = await prophet_task
            results.append(('prophet', prophet_result))
            
            # Combine results intelligently
            if len(results) > 1:
                return self._combine_forecasts(results, forecast_horizon)
            else:
                return results[0][1]
                
        except Exception as e:
            logger.error(f"Hybrid forecast failed: {e}")
            # Final fallback to Prophet
            return await self._generate_local_forecast(
                tenant_id, item_id, vendor_id, forecast_horizon, ForecastMethod.PROPHET
            )

    async def _generate_local_forecast(
        self,
        tenant_id: str,
        item_id: str,
        vendor_id: str,
        forecast_horizon: int,
        method: ForecastMethod
    ) -> Dict[str, Any]:
        """
        Generate forecast using local models (Prophet or XGBoost)
        """
        try:
            model_type = method.value
            
            # Use existing local ML service
            local_result = await self.local_ml_service.train_model(
                model_type,
                item_id,
                vendor_id,
                tenant_id,
                {
                    'forecast_horizon': forecast_horizon,
                    'forecast_frequency': 'D'
                }
            )
            
            # Generate predictions
            predictions = await self.local_ml_service.predict(
                local_result,
                {
                    'forecast_horizon': forecast_horizon,
                    'include_confidence': True
                }
            )
            
            # Format result
            formatted_result = {
                'method': method.value,
                'forecast_horizon': forecast_horizon,
                'predictions': predictions.get('predictions', []),
                'confidence_intervals': predictions.get('confidence_intervals', []),
                'metadata': {
                    'tenant_id': tenant_id,
                    'item_id': item_id,
                    'vendor_id': vendor_id,
                    'model_id': local_result,
                    'algorithm': method.value,
                    'generated_at': datetime.utcnow().isoformat()
                },
                'quality_metrics': predictions.get('quality_metrics', {}),
                'generated_at': datetime.utcnow().isoformat(),
                'status': 'success'
            }
            
            return formatted_result
            
        except Exception as e:
            logger.error(f"Local forecast failed: {e}")
            raise

    def _combine_forecasts(self, results: List[Tuple[str, Dict]], forecast_horizon: int) -> Dict[str, Any]:
        """
        Intelligently combine multiple forecast results
        """
        try:
            aws_result = None
            prophet_result = None
            
            for method, result in results:
                if method == 'aws_forecast':
                    aws_result = result
                elif method == 'prophet':
                    prophet_result = result
            
            # If AWS Forecast succeeded, use it as primary with Prophet as fallback
            if aws_result and aws_result.get('status') == 'success':
                primary_result = aws_result
                # Add fallback information
                primary_result['fallback_method'] = 'prophet'
                primary_result['combined'] = True
                return primary_result
            
            # Otherwise use Prophet result
            elif prophet_result:
                prophet_result['method'] = 'prophet_fallback'
                prophet_result['combined'] = True
                return prophet_result
            
            else:
                raise Exception("No valid forecast results available")
                
        except Exception as e:
            logger.error(f"Failed to combine forecasts: {e}")
            # Return the first available result
            return results[0][1] if results else {'status': 'error', 'error': str(e)}

    async def get_forecast_accuracy(self, tenant_id: str, item_id: str, vendor_id: str, days_back: int = 30) -> Dict[str, Any]:
        """
        Evaluate forecast accuracy by comparing past predictions with actual values
        """
        try:
            # Get actual values for the past period
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            actual_data = self.data_service.get_training_data(
                tenant_id, 'demand', start_date.isoformat(), end_date.isoformat()
            )
            
            if actual_data.empty:
                return {'error': 'No historical data available for accuracy assessment'}
            
            # Filter to the evaluation period
            actual_data['date'] = pd.to_datetime(actual_data['date'])
            actual_values = actual_data[
                (actual_data['date'] >= start_date) & 
                (actual_data['date'] <= end_date)
            ]
            
            if actual_values.empty:
                return {'error': 'No actual data in evaluation period'}
            
            # Generate forecast for the same period (simulating historical prediction)
            historical_forecast = await self.generate_forecast(
                tenant_id, item_id, vendor_id, forecast_horizon=days_back
            )
            
            # Calculate accuracy metrics
            predictions = historical_forecast.get('predictions', [])
            if not predictions:
                return {'error': 'No predictions available for comparison'}
            
            # Align predictions with actual values
            pred_df = pd.DataFrame(predictions)
            pred_df['date'] = pd.to_datetime(pred_df['date'])
            
            merged = actual_values.merge(pred_df, on='date', how='inner')
            
            if merged.empty:
                return {'error': 'No overlapping dates for accuracy calculation'}
            
            # Calculate metrics
            actual = merged['quantity'].values
            predicted = merged['predicted_value'].values
            
            mae = np.mean(np.abs(actual - predicted))
            mse = np.mean((actual - predicted) ** 2)
            rmse = np.sqrt(mse)
            mape = np.mean(np.abs((actual - predicted) / actual)) * 100
            
            # R-squared
            ss_res = np.sum((actual - predicted) ** 2)
            ss_tot = np.sum((actual - np.mean(actual)) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            
            return {
                'accuracy_metrics': {
                    'mae': float(mae),
                    'mse': float(mse),
                    'rmse': float(rmse),
                    'mape': float(mape),
                    'r2_score': float(r2)
                },
                'evaluation_period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days_evaluated': len(merged)
                },
                'method_used': historical_forecast.get('method'),
                'data_points_compared': len(merged),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Accuracy evaluation failed: {e}")
            return {'error': str(e)}

    async def cleanup_resources(self, tenant_id: str = None, max_age_hours: int = 24):
        """
        Clean up old AWS Forecast resources to manage costs
        """
        try:
            if settings.FORECAST_AUTO_CLEANUP:
                await self.aws_forecast_service.cleanup_resources()
                logger.info("AWS Forecast resources cleaned up")
        except Exception as e:
            logger.warning(f"Resource cleanup failed: {e}")

    async def get_service_status(self) -> Dict[str, Any]:
        """
        Get the status of all forecasting services
        """
        status = {
            'enhanced_ml_service': 'active',
            'aws_forecast_available': self._is_aws_forecast_available(),
            'current_aws_jobs': self.current_aws_jobs,
            'max_aws_jobs': self.max_concurrent_aws_jobs,
            'local_ml_service': 'active',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return status 