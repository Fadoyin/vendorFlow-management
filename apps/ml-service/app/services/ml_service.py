import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import joblib
import os
from pathlib import Path

# ML Libraries
from prophet import Prophet
from xgboost import XGBRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from app.core.config import settings
from app.services.data_service import DataService
from app.models.forecast_model import ForecastModel

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        self.data_service = DataService(
            mongo_uri=settings.MONGODB_URI,
            redis_url=settings.REDIS_URL
        )
        self.model_path = Path(settings.MODEL_PATH)
        self.model_path.mkdir(exist_ok=True)
        
    async def train_model(
        self,
        model_type: str,
        item_id: str,
        vendor_id: str,
        tenant_id: str,
        parameters: Dict[str, Any]
    ) -> str:
        """
        Train a new ML model
        """
        try:
            logger.info(f"Starting training for {model_type} model")
            
            # Get training data
            training_data = self.data_service.get_training_data(
                tenant_id, 'demand'
            )
            
            if training_data.empty:
                raise ValueError("Insufficient training data")
            
            # Train model based on type
            if model_type == "demand_forecast":
                model = await self._train_demand_model(training_data, parameters)
            elif model_type == "cost_prediction":
                model = await self._train_cost_model(training_data, parameters)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
            
            # Save model
            model_id = f"{model_type}_{tenant_id}_{item_id}_{vendor_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            model_path = self.model_path / f"{model_id}.joblib"
            
            # Save model metadata
            model_metadata = {
                "model_id": model_id,
                "model_type": model_type,
                "tenant_id": tenant_id,
                "item_id": item_id,
                "vendor_id": vendor_id,
                "parameters": parameters,
                "training_date": datetime.now(),
                "data_points": len(training_data),
                "model_path": str(model_path)
            }
            
            # Save model and metadata
            joblib.dump((model, model_metadata), model_path)
            
            # Save metadata to database
            await self._save_model_metadata(model_metadata)
            
            logger.info(f"Model {model_id} trained and saved successfully")
            return model_id
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    async def generate_forecast(
        self,
        model_type: str,
        item_id: str,
        vendor_id: str,
        tenant_id: str,
        forecast_horizon: int,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate forecast predictions
        """
        try:
            # Load the best available model
            model_info = await self._get_best_model(tenant_id, item_id, vendor_id, model_type)
            
            if not model_info:
                raise ValueError(f"No trained model found for {model_type}")
            
            # Load model
            model_path = Path(model_info["model_path"])
            model, metadata = joblib.load(model_path)
            
            # Generate forecast
            if model_type == "demand_forecast":
                predictions = await self._generate_demand_forecast(
                    model, forecast_horizon, parameters
                )
            elif model_type == "cost_prediction":
                predictions = await self._generate_cost_forecast(
                    model, forecast_horizon, parameters
                )
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
            
            return {
                "model_id": model_info["model_id"],
                "predictions": predictions,
                "confidence_intervals": self._calculate_confidence_intervals(predictions, parameters),
                "model_metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            raise
    
    async def _train_demand_model(
        self, 
        data: pd.DataFrame, 
        parameters: Dict[str, Any]
    ) -> Any:
        """
        Train demand forecasting model using Prophet
        """
        try:
            # Prepare data for Prophet
            prophet_data = data.rename(columns={
                'date': 'ds',
                'quantity': 'y'
            })
            
            # Initialize Prophet model
            model = Prophet(
                yearly_seasonality=parameters.get('yearly_seasonality', True),
                weekly_seasonality=parameters.get('weekly_seasonality', True),
                daily_seasonality=parameters.get('daily_seasonality', False),
                seasonality_mode=parameters.get('seasonality_mode', 'multiplicative'),
                changepoint_prior_scale=parameters.get('changepoint_prior_scale', 0.05),
                seasonality_prior_scale=parameters.get('seasonality_prior_scale', 10.0)
            )
            
            # Add custom seasonality if specified
            if parameters.get('custom_seasonality'):
                for seasonality in parameters['custom_seasonality']:
                    model.add_seasonality(
                        name=seasonality['name'],
                        period=seasonality['period'],
                        fourier_order=seasonality.get('fourier_order', 10)
                    )
            
            # Fit model
            model.fit(prophet_data)
            
            logger.info("Demand forecasting model trained successfully")
            return model
            
        except Exception as e:
            logger.error(f"Error training demand model: {str(e)}")
            raise
    
    async def _train_cost_model(
        self, 
        data: pd.DataFrame, 
        parameters: Dict[str, Any]
    ) -> Any:
        """
        Train cost prediction model using XGBoost
        """
        try:
            # Prepare features
            feature_columns = ['quantity', 'vendor_rating', 'market_price', 'seasonality_factor']
            target_column = 'unit_cost'
            
            # Ensure all required columns exist
            available_features = [col for col in feature_columns if col in data.columns]
            if not available_features:
                raise ValueError("No suitable features found for cost prediction")
            
            X = data[available_features].fillna(0)
            y = data[target_column]
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Initialize XGBoost model
            model = XGBRegressor(
                n_estimators=parameters.get('n_estimators', 100),
                max_depth=parameters.get('max_depth', 6),
                learning_rate=parameters.get('learning_rate', 0.1),
                random_state=42
            )
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test_scaled)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"Cost prediction model trained successfully. MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.2f}")
            
            # Return model with scaler
            return {
                'model': model,
                'scaler': scaler,
                'feature_columns': available_features,
                'metrics': {'mae': mae, 'rmse': rmse, 'r2': r2}
            }
            
        except Exception as e:
            logger.error(f"Error training cost model: {str(e)}")
            raise
    
    async def _generate_demand_forecast(
        self, 
        model: Prophet, 
        forecast_horizon: int, 
        parameters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate demand forecast using Prophet
        """
        try:
            # Create future dates
            future_dates = model.make_future_dataframe(
                periods=forecast_horizon,
                freq='W'  # Weekly frequency
            )
            
            # Generate forecast
            forecast = model.predict(future_dates)
            
            # Extract future predictions
            future_forecast = forecast.tail(forecast_horizon)
            
            # Format results
            predictions = []
            for _, row in future_forecast.iterrows():
                predictions.append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'predicted_demand': max(0, row['yhat']),
                    'lower_bound': max(0, row['yhat_lower']),
                    'upper_bound': max(0, row['yhat_upper']),
                    'trend': row['trend'],
                    'seasonal': row['yearly'] + row['weekly']
                })
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error generating demand forecast: {str(e)}")
            raise
    
    async def _generate_cost_forecast(
        self, 
        model_data: Dict[str, Any], 
        forecast_horizon: int, 
        parameters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate cost forecast using XGBoost
        """
        try:
            model = model_data['model']
            scaler = model_data['scaler']
            feature_columns = model_data['feature_columns']
            
            # Generate future feature values (simplified approach)
            future_features = []
            for i in range(forecast_horizon):
                # This is a simplified approach - in practice, you'd use actual future data
                features = {
                    'quantity': np.random.normal(100, 20),  # Example future quantity
                    'vendor_rating': np.random.uniform(3.5, 5.0),
                    'market_price': np.random.normal(10, 2),
                    'seasonality_factor': np.sin(2 * np.pi * i / 52)  # Weekly seasonality
                }
                future_features.append([features[col] for col in feature_columns])
            
            # Scale features
            future_features_scaled = scaler.transform(future_features)
            
            # Generate predictions
            predictions_raw = model.predict(future_features_scaled)
            
            # Format results
            predictions = []
            for i, pred in enumerate(predictions_raw):
                predictions.append({
                    'week': i + 1,
                    'predicted_cost': max(0, pred),
                    'confidence': 0.8,  # Simplified confidence
                    'factors': {
                        'quantity': future_features[i][0],
                        'vendor_rating': future_features[i][1],
                        'market_price': future_features[i][2],
                        'seasonality': future_features[i][3]
                    }
                })
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error generating cost forecast: {str(e)}")
            raise
    
    def _calculate_confidence_intervals(
        self, 
        predictions: List[Dict[str, Any]], 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate confidence intervals for predictions
        """
        confidence_level = parameters.get('confidence_level', 0.95)
        
        if not predictions:
            return {}
        
        # Extract prediction values
        values = [pred.get('predicted_demand', pred.get('predicted_cost', 0)) for pred in predictions]
        
        # Calculate statistics
        mean_val = np.mean(values)
        std_val = np.std(values)
        
        # Calculate confidence intervals
        z_score = 1.96  # 95% confidence level
        margin_of_error = z_score * (std_val / np.sqrt(len(values)))
        
        return {
            'confidence_level': confidence_level,
            'mean': mean_val,
            'std': std_val,
            'margin_of_error': margin_of_error,
            'lower_bound': mean_val - margin_of_error,
            'upper_bound': mean_val + margin_of_error
        }
    
    async def _get_best_model(
        self, 
        tenant_id: str, 
        item_id: str, 
        vendor_id: str, 
        model_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the best available model for the given parameters
        """
        try:
            # Query database for available models
            models = await self._get_models_from_db(tenant_id, item_id, vendor_id, model_type)
            
            if not models:
                return None
            
            # Sort by training date (newest first) and return the best one
            sorted_models = sorted(models, key=lambda x: x['training_date'], reverse=True)
            return sorted_models[0]
            
        except Exception as e:
            logger.error(f"Error getting best model: {str(e)}")
            return None
    
    async def _save_model_metadata(self, metadata: Dict[str, Any]) -> None:
        """
        Save model metadata to database
        """
        try:
            # This would save to your MongoDB collection
            # Implementation depends on your data service
            pass
        except Exception as e:
            logger.error(f"Error saving model metadata: {str(e)}")
    
    async def _get_models_from_db(
        self, 
        tenant_id: str, 
        item_id: str, 
        vendor_id: str, 
        model_type: str
    ) -> List[Dict[str, Any]]:
        """
        Get models from database
        """
        try:
            # This would query your MongoDB collection
            # Implementation depends on your data service
            return []
        except Exception as e:
            logger.error(f"Error getting models from DB: {str(e)}")
            return []
    
    async def list_models(self, tenant_id: str, model_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List available models for a tenant
        """
        try:
            # Implementation to list models from database
            return []
        except Exception as e:
            logger.error(f"Error listing models: {str(e)}")
            return []
    
    async def get_model_info(self, tenant_id: str, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific model
        """
        try:
            # Implementation to get model info from database
            return None
        except Exception as e:
            logger.error(f"Error getting model info: {str(e)}")
            return None
    
    async def delete_model(self, tenant_id: str, model_id: str) -> None:
        """
        Delete a trained model
        """
        try:
            # Implementation to delete model from database and file system
            pass
        except Exception as e:
            logger.error(f"Error deleting model: {str(e)}")
            raise
    
    async def retrain_model(self, tenant_id: str, model_id: str) -> None:
        """
        Retrain an existing model
        """
        try:
            # Implementation to retrain existing model
            pass
        except Exception as e:
            logger.error(f"Error retraining model: {str(e)}")
            raise
    
    async def get_model_performance(self, tenant_id: str, model_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Get performance metrics for models
        """
        try:
            # Implementation to get performance metrics
            return {}
        except Exception as e:
            logger.error(f"Error getting performance metrics: {str(e)}")
            return {}
