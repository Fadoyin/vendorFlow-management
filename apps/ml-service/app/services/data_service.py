import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from pymongo import MongoClient
from redis import Redis
import joblib
import os
from pathlib import Path

logger = logging.getLogger(__name__)

class DataService:
    """Service for handling data operations in the ML service"""
    
    def __init__(self, mongo_uri: str, redis_url: str):
        self.mongo_client = MongoClient(mongo_uri)
        self.redis_client = Redis.from_url(redis_url)
        self.models_dir = Path("models")
        self.models_dir.mkdir(exist_ok=True)
        
    def get_training_data(self, tenant_id: str, data_type: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> pd.DataFrame:
        """
        Retrieve training data for ML models
        
        Args:
            tenant_id: Tenant identifier
            data_type: Type of data ('demand', 'cost', 'vendor_performance')
            start_date: Start date for data range (ISO format)
            end_date: End date for data range (ISO format)
            
        Returns:
            DataFrame with training data
        """
        try:
            db = self.mongo_client[f"tenant_{tenant_id}"]
            
            if data_type == 'demand':
                return self._get_demand_data(db, start_date, end_date)
            elif data_type == 'cost':
                return self._get_cost_data(db, start_date, end_date)
            elif data_type == 'vendor_performance':
                return self._get_vendor_performance_data(db, start_date, end_date)
            else:
                raise ValueError(f"Unsupported data type: {data_type}")
                
        except Exception as e:
            logger.error(f"Error retrieving training data: {str(e)}")
            raise
    
    def _get_demand_data(self, db, start_date: Optional[str], end_date: Optional[str]) -> pd.DataFrame:
        """Get demand forecasting training data"""
        # Query inventory movements and sales data
        pipeline = []
        
        if start_date and end_date:
            pipeline.append({
                '$match': {
                    'createdAt': {
                        '$gte': datetime.fromisoformat(start_date),
                        '$lte': datetime.fromisoformat(end_date)
                    }
                }
            })
        
        pipeline.extend([
            {
                '$lookup': {
                    'from': 'items',
                    'localField': 'itemId',
                    'foreignField': '_id',
                    'as': 'item'
                }
            },
            {
                '$unwind': '$item'
            },
            {
                '$group': {
                    '_id': {
                        'date': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$createdAt'}},
                        'itemId': '$itemId',
                        'itemName': '$item.name',
                        'category': '$item.category'
                    },
                    'quantity': {'$sum': '$quantity'},
                    'type': {'$first': '$type'}
                }
            },
            {
                '$sort': {'_id.date': 1}
            }
        ])
        
        cursor = db.inventory_movements.aggregate(pipeline)
        data = list(cursor)
        
        if not data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['_id'].apply(lambda x: x['date']))
        df['itemId'] = df['_id'].apply(lambda x: x['itemId'])
        df['itemName'] = df['_id'].apply(lambda x: x['name'])
        df['category'] = df['_id'].apply(lambda x: x['category'])
        df['quantity'] = df['quantity']
        df['type'] = df['type']
        
        # Pivot to get daily demand by item
        df_pivot = df.pivot_table(
            index='date',
            columns='itemId',
            values='quantity',
            aggfunc='sum',
            fill_value=0
        )
        
        return df_pivot.reset_index()
    
    def _get_cost_data(self, db, start_date: Optional[str], end_date: Optional[str]) -> pd.DataFrame:
        """Get cost prediction training data"""
        # Query purchase orders and vendor data
        pipeline = []
        
        if start_date and end_date:
            pipeline.append({
                '$match': {
                    'createdAt': {
                        '$gte': datetime.fromisoformat(start_date),
                        '$lte': datetime.fromisoformat(end_date)
                    }
                }
            })
        
        pipeline.extend([
            {
                '$lookup': {
                    'from': 'vendors',
                    'localField': 'vendorId',
                    'foreignField': '_id',
                    'as': 'vendor'
                }
            },
            {
                '$unwind': '$vendor'
            },
            {
                '$lookup': {
                    'from': 'items',
                    'localField': 'items.itemId',
                    'foreignField': '_id',
                    'as': 'item'
                }
            },
            {
                '$unwind': '$item'
            },
            {
                '$project': {
                    'date': '$createdAt',
                    'vendorId': '$vendorId',
                    'vendorName': '$vendor.name',
                    'vendorRating': '$vendor.rating',
                    'itemId': '$item._id',
                    'itemName': '$item.name',
                    'itemCategory': '$item.category',
                    'quantity': '$items.quantity',
                    'unitPrice': '$items.unitPrice',
                    'totalAmount': '$totalAmount'
                }
            }
        ])
        
        cursor = db.purchase_orders.aggregate(pipeline)
        data = list(cursor)
        
        if not data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        
        return df
    
    def _get_vendor_performance_data(self, db, start_date: Optional[str], end_date: Optional[str]) -> pd.DataFrame:
        """Get vendor performance analysis data"""
        # Query vendor performance metrics
        pipeline = []
        
        if start_date and end_date:
            pipeline.append({
                '$match': {
                    'createdAt': {
                        '$gte': datetime.fromisoformat(start_date),
                        '$lte': datetime.fromisoformat(end_date)
                    }
                }
            })
        
        pipeline.extend([
            {
                '$lookup': {
                    'from': 'vendors',
                    'localField': 'vendorId',
                    'foreignField': '_id',
                    'as': 'vendor'
                }
            },
            {
                '$unwind': '$vendor'
            },
            {
                '$group': {
                    '_id': {
                        'vendorId': '$vendorId',
                        'vendorName': '$vendor.name',
                        'vendorCategory': '$vendor.category'
                    },
                    'totalOrders': {'$sum': 1},
                    'totalAmount': {'$sum': '$totalAmount'},
                    'avgDeliveryTime': {'$avg': {'$subtract': ['$completedAt', '$sentToVendorAt']}},
                    'onTimeDeliveries': {
                        '$sum': {
                            '$cond': [
                                {'$lte': ['$completedAt', '$expectedDeliveryDate']},
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                '$project': {
                    'vendorId': '$_id.vendorId',
                    'vendorName': '$_id.vendorName',
                    'vendorCategory': '$_id.vendorCategory',
                    'totalOrders': 1,
                    'totalAmount': 1,
                    'avgDeliveryTime': 1,
                    'onTimeDeliveries': 1,
                    'onTimeRate': {'$divide': ['$onTimeDeliveries', '$totalOrders']}
                }
            }
        ])
        
        cursor = db.purchase_orders.aggregate(pipeline)
        data = list(cursor)
        
        if not data:
            return pd.DataFrame()
        
        return pd.DataFrame(data)
    
    def save_model(self, model: Any, model_name: str, tenant_id: str, version: str = None) -> str:
        """
        Save a trained model to disk
        
        Args:
            model: Trained model object
            model_name: Name of the model
            tenant_id: Tenant identifier
            version: Model version (optional)
            
        Returns:
            Path to saved model
        """
        try:
            if version is None:
                version = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            model_filename = f"{model_name}_{tenant_id}_{version}.joblib"
            model_path = self.models_dir / model_filename
            
            # Save model
            joblib.dump(model, model_path)
            
            # Save metadata
            metadata = {
                'model_name': model_name,
                'tenant_id': tenant_id,
                'version': version,
                'created_at': datetime.now().isoformat(),
                'model_path': str(model_path)
            }
            
            # Store metadata in Redis
            self.redis_client.hset(
                f"model_metadata:{tenant_id}:{model_name}",
                version,
                str(metadata)
            )
            
            logger.info(f"Model saved: {model_path}")
            return str(model_path)
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise
    
    def load_model(self, model_name: str, tenant_id: str, version: str = None) -> Any:
        """
        Load a trained model from disk
        
        Args:
            model_name: Name of the model
            tenant_id: Tenant identifier
            version: Model version (optional, loads latest if not specified)
            
        Returns:
            Loaded model object
        """
        try:
            if version is None:
                # Get latest version
                versions = self.redis_client.hkeys(f"model_metadata:{tenant_id}:{model_name}")
                if not versions:
                    raise FileNotFoundError(f"No models found for {model_name} and tenant {tenant_id}")
                
                version = max(versions, key=lambda v: v.decode())
            
            # Get model metadata
            metadata_str = self.redis_client.hget(
                f"model_metadata:{tenant_id}:{model_name}",
                version
            )
            
            if not metadata_str:
                raise FileNotFoundError(f"Model version {version} not found")
            
            metadata = eval(metadata_str.decode())
            model_path = metadata['model_path']
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            # Load model
            model = joblib.load(model_path)
            logger.info(f"Model loaded: {model_path}")
            
            return model
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def get_model_versions(self, model_name: str, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Get available versions for a model
        
        Args:
            model_name: Name of the model
            tenant_id: Tenant identifier
            
        Returns:
            List of model versions with metadata
        """
        try:
            versions = self.redis_client.hkeys(f"model_metadata:{tenant_id}:{model_name}")
            model_versions = []
            
            for version in versions:
                metadata_str = self.redis_client.hget(
                    f"model_metadata:{tenant_id}:{model_name}",
                    version
                )
                
                if metadata_str:
                    metadata = eval(metadata_str.decode())
                    model_versions.append(metadata)
            
            # Sort by creation date
            model_versions.sort(key=lambda x: x['created_at'], reverse=True)
            
            return model_versions
            
        except Exception as e:
            logger.error(f"Error getting model versions: {str(e)}")
            return []
    
    def delete_model(self, model_name: str, tenant_id: str, version: str) -> bool:
        """
        Delete a specific model version
        
        Args:
            model_name: Name of the model
            tenant_id: Tenant identifier
            version: Model version to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get model metadata
            metadata_str = self.redis_client.hget(
                f"model_metadata:{tenant_id}:{model_name}",
                version
            )
            
            if not metadata_str:
                return False
            
            metadata = eval(metadata_str.decode())
            model_path = metadata['model_path']
            
            # Delete model file
            if os.path.exists(model_path):
                os.remove(model_path)
            
            # Remove metadata from Redis
            self.redis_client.hdel(f"model_metadata:{tenant_id}:{model_name}", version)
            
            logger.info(f"Model deleted: {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting model: {str(e)}")
            return False
    
    def cleanup_old_models(self, tenant_id: str, max_versions: int = 5) -> int:
        """
        Clean up old model versions, keeping only the most recent ones
        
        Args:
            tenant_id: Tenant identifier
            max_versions: Maximum number of versions to keep per model
            
        Returns:
            Number of models deleted
        """
        try:
            deleted_count = 0
            
            # Get all models for tenant
            model_keys = self.redis_client.keys(f"model_metadata:{tenant_id}:*")
            
            for key in model_keys:
                model_name = key.decode().split(':')[-1]
                versions = self.redis_client.hkeys(key)
                
                if len(versions) > max_versions:
                    # Sort versions by creation date
                    version_metadata = []
                    for version in versions:
                        metadata_str = self.redis_client.hget(key, version)
                        if metadata_str:
                            metadata = eval(metadata_str.decode())
                            version_metadata.append((version, metadata))
                    
                    version_metadata.sort(key=lambda x: x[1]['created_at'], reverse=True)
                    
                    # Delete old versions
                    for version, _ in version_metadata[max_versions:]:
                        if self.delete_model(model_name, tenant_id, version.decode()):
                            deleted_count += 1
            
            logger.info(f"Cleaned up {deleted_count} old model versions")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old models: {str(e)}")
            return 0
    
    def get_data_summary(self, tenant_id: str) -> Dict[str, Any]:
        """
        Get summary statistics for training data
        
        Args:
            tenant_id: Tenant identifier
            
        Returns:
            Dictionary with data summary statistics
        """
        try:
            db = self.mongo_client[f"tenant_{tenant_id}"]
            
            summary = {
                'inventory_movements': db.inventory_movements.count_documents({}),
                'purchase_orders': db.purchase_orders.count_documents({}),
                'vendors': db.vendors.count_documents({}),
                'items': db.items.count_documents({}),
                'data_range': {}
            }
            
            # Get data range
            if summary['inventory_movements'] > 0:
                first_movement = db.inventory_movements.find_one({}, sort=[('createdAt', 1)])
                last_movement = db.inventory_movements.find_one({}, sort=[('createdAt', -1)])
                
                if first_movement and last_movement:
                    summary['data_range']['start'] = first_movement['createdAt'].isoformat()
                    summary['data_range']['end'] = last_movement['createdAt'].isoformat()
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting data summary: {str(e)}")
            return {}
    
    def close(self):
        """Close database connections"""
        self.mongo_client.close()
        self.redis_client.close()
