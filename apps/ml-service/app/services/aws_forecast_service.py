import logging
import boto3
import pandas as pd
import numpy as np
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from botocore.exceptions import ClientError, BotoCoreError
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.core.config import settings
from app.services.data_service import DataService

logger = logging.getLogger(__name__)

class AWSForecastService:
    """
    AWS Forecast service for demand forecasting in VendorFlow
    Provides enterprise-grade time series forecasting using Amazon Forecast
    """
    
    def __init__(self):
        self.data_service = DataService(
            mongo_uri=settings.MONGODB_URI,
            redis_url=settings.REDIS_URL
        )
        self.region_name = settings.AWS_REGION or 'us-east-1'
        self.role_arn = settings.AWS_FORECAST_ROLE_ARN
        
        # Initialize AWS clients
        self.forecast_client = boto3.client('forecast', region_name=self.region_name)
        self.forecastquery_client = boto3.client('forecastquery', region_name=self.region_name)
        self.s3_client = boto3.client('s3', region_name=self.region_name)
        
        # Configuration
        self.bucket_name = settings.AWS_S3_BUCKET or 'vendorflow-forecast-data'
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        logger.info(f"AWS Forecast Service initialized for region: {self.region_name}")

    async def create_dataset_group(self, tenant_id: str, item_id: str) -> str:
        """
        Create a dataset group for organizing related datasets
        """
        dataset_group_name = f"vendorflow-{tenant_id}-{item_id}-{int(time.time())}"
        
        try:
            response = await self._run_in_executor(
                self.forecast_client.create_dataset_group,
                DatasetGroupName=dataset_group_name,
                Domain='CUSTOM',
                Tags=[
                    {'Key': 'TenantId', 'Value': tenant_id},
                    {'Key': 'ItemId', 'Value': item_id},
                    {'Key': 'Application', 'Value': 'VendorFlow'},
                    {'Key': 'CreatedAt', 'Value': datetime.utcnow().isoformat()}
                ]
            )
            
            dataset_group_arn = response['DatasetGroupArn']
            logger.info(f"Created dataset group: {dataset_group_arn}")
            return dataset_group_arn
            
        except ClientError as e:
            logger.error(f"Failed to create dataset group: {e}")
            raise

    async def create_dataset(self, dataset_group_arn: str, tenant_id: str, item_id: str) -> str:
        """
        Create a dataset for time series data
        """
        dataset_name = f"vendorflow-dataset-{tenant_id}-{item_id}-{int(time.time())}"
        
        # Define schema for demand forecasting
        schema = {
            "Attributes": [
                {"AttributeName": "timestamp", "AttributeType": "timestamp"},
                {"AttributeName": "target_value", "AttributeType": "float"},
                {"AttributeName": "item_id", "AttributeType": "string"}
            ]
        }
        
        try:
            response = await self._run_in_executor(
                self.forecast_client.create_dataset,
                DatasetName=dataset_name,
                Domain='CUSTOM',
                DatasetType='TARGET_TIME_SERIES',
                DataFrequency='D',  # Daily frequency
                Schema=schema,
                Tags=[
                    {'Key': 'TenantId', 'Value': tenant_id},
                    {'Key': 'ItemId', 'Value': item_id},
                    {'Key': 'Type', 'Value': 'TARGET_TIME_SERIES'}
                ]
            )
            
            dataset_arn = response['DatasetArn']
            logger.info(f"Created dataset: {dataset_arn}")
            return dataset_arn
            
        except ClientError as e:
            logger.error(f"Failed to create dataset: {e}")
            raise

    async def prepare_forecast_data(self, tenant_id: str, item_id: str, vendor_id: str) -> pd.DataFrame:
        """
        Prepare historical data for AWS Forecast
        """
        try:
            # Get historical order data
            historical_data = await self.data_service.get_training_data(
                tenant_id, item_id, vendor_id, 'forecast'
            )
            
            if historical_data.empty:
                raise ValueError("No historical data available for forecasting")
            
            # Transform data for AWS Forecast format
            forecast_data = pd.DataFrame()
            forecast_data['timestamp'] = pd.to_datetime(historical_data['date'])
            forecast_data['target_value'] = historical_data['quantity'].astype(float)
            forecast_data['item_id'] = item_id
            
            # Ensure daily frequency and fill missing dates
            date_range = pd.date_range(
                start=forecast_data['timestamp'].min(),
                end=forecast_data['timestamp'].max(),
                freq='D'
            )
            
            # Create complete time series with missing value interpolation
            complete_data = pd.DataFrame({'timestamp': date_range, 'item_id': item_id})
            forecast_data = complete_data.merge(forecast_data, on=['timestamp', 'item_id'], how='left')
            
            # Interpolate missing values
            forecast_data['target_value'] = forecast_data['target_value'].interpolate(method='linear')
            forecast_data['target_value'] = forecast_data['target_value'].fillna(0)
            
            # Format timestamp for AWS Forecast
            forecast_data['timestamp'] = forecast_data['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            logger.info(f"Prepared {len(forecast_data)} data points for forecasting")
            return forecast_data
            
        except Exception as e:
            logger.error(f"Failed to prepare forecast data: {e}")
            raise

    async def upload_data_to_s3(self, data: pd.DataFrame, tenant_id: str, item_id: str) -> str:
        """
        Upload prepared data to S3 for AWS Forecast
        """
        timestamp = int(time.time())
        s3_key = f"forecast-data/{tenant_id}/{item_id}/data-{timestamp}.csv"
        
        try:
            # Convert to CSV
            csv_buffer = data.to_csv(index=False)
            
            # Upload to S3
            await self._run_in_executor(
                self.s3_client.put_object,
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=csv_buffer,
                ContentType='text/csv',
                Metadata={
                    'tenant-id': tenant_id,
                    'item-id': item_id,
                    'created-at': datetime.utcnow().isoformat(),
                    'rows': str(len(data))
                }
            )
            
            s3_uri = f"s3://{self.bucket_name}/{s3_key}"
            logger.info(f"Uploaded data to S3: {s3_uri}")
            return s3_uri
            
        except ClientError as e:
            logger.error(f"Failed to upload data to S3: {e}")
            raise

    async def import_data(self, dataset_arn: str, s3_uri: str, tenant_id: str, item_id: str) -> str:
        """
        Import data from S3 into AWS Forecast dataset
        """
        import_job_name = f"import-{tenant_id}-{item_id}-{int(time.time())}"
        
        try:
            response = await self._run_in_executor(
                self.forecast_client.create_dataset_import_job,
                DatasetImportJobName=import_job_name,
                DatasetArn=dataset_arn,
                DataSource={
                    'S3Config': {
                        'Path': s3_uri,
                        'RoleArn': self.role_arn
                    }
                },
                Tags=[
                    {'Key': 'TenantId', 'Value': tenant_id},
                    {'Key': 'ItemId', 'Value': item_id}
                ]
            )
            
            import_job_arn = response['DatasetImportJobArn']
            logger.info(f"Started data import job: {import_job_arn}")
            return import_job_arn
            
        except ClientError as e:
            logger.error(f"Failed to start data import: {e}")
            raise

    async def create_predictor(self, dataset_group_arn: str, tenant_id: str, item_id: str) -> str:
        """
        Create a predictor (trained model) for forecasting
        """
        predictor_name = f"predictor-{tenant_id}-{item_id}-{int(time.time())}"
        
        try:
            response = await self._run_in_executor(
                self.forecast_client.create_predictor,
                PredictorName=predictor_name,
                ForecastHorizon=30,  # 30-day forecast
                ForecastFrequency='D',  # Daily predictions
                ForecastDimensions=['item_id'],
                InputDataConfig={
                    'DatasetGroupArn': dataset_group_arn
                },
                AlgorithmArn='arn:aws:forecast:::algorithm/Prophet',  # Use Prophet algorithm
                TrainingParameters={
                    'forecast_horizon': '30',
                    'forecast_frequency': 'D'
                },
                Tags=[
                    {'Key': 'TenantId', 'Value': tenant_id},
                    {'Key': 'ItemId', 'Value': item_id},
                    {'Key': 'Algorithm', 'Value': 'Prophet'}
                ]
            )
            
            predictor_arn = response['PredictorArn']
            logger.info(f"Created predictor: {predictor_arn}")
            return predictor_arn
            
        except ClientError as e:
            logger.error(f"Failed to create predictor: {e}")
            raise

    async def create_forecast(self, predictor_arn: str, tenant_id: str, item_id: str) -> str:
        """
        Generate forecasts using the trained predictor
        """
        forecast_name = f"forecast-{tenant_id}-{item_id}-{int(time.time())}"
        
        try:
            response = await self._run_in_executor(
                self.forecast_client.create_forecast,
                ForecastName=forecast_name,
                PredictorArn=predictor_arn,
                ForecastTypes=['0.1', '0.5', '0.9'],  # 10%, 50%, 90% quantiles
                Tags=[
                    {'Key': 'TenantId', 'Value': tenant_id},
                    {'Key': 'ItemId', 'Value': item_id}
                ]
            )
            
            forecast_arn = response['ForecastArn']
            logger.info(f"Created forecast: {forecast_arn}")
            return forecast_arn
            
        except ClientError as e:
            logger.error(f"Failed to create forecast: {e}")
            raise

    async def get_forecast_results(self, forecast_arn: str, item_id: str, start_date: str = None) -> Dict[str, Any]:
        """
        Retrieve forecast results from AWS Forecast
        """
        try:
            if not start_date:
                start_date = datetime.utcnow().strftime('%Y-%m-%d')
            
            # Query forecast results
            response = await self._run_in_executor(
                self.forecastquery_client.query_forecast,
                ForecastArn=forecast_arn,
                Filters={'item_id': item_id},
                StartDate=start_date
            )
            
            # Process forecast data
            forecast_data = []
            predictions = response.get('Forecast', {}).get('Predictions', {})
            
            for quantile, values in predictions.items():
                for point in values:
                    forecast_data.append({
                        'timestamp': point['Timestamp'],
                        'value': point['Value'],
                        'quantile': quantile
                    })
            
            # Convert to structured format
            df = pd.DataFrame(forecast_data)
            if not df.empty:
                pivot_df = df.pivot(index='timestamp', columns='quantile', values='value')
                forecast_result = {
                    'predictions': [],
                    'confidence_intervals': []
                }
                
                for timestamp in pivot_df.index:
                    prediction = {
                        'date': timestamp,
                        'predicted_value': float(pivot_df.loc[timestamp, '0.5']) if '0.5' in pivot_df.columns else 0,
                        'lower_bound': float(pivot_df.loc[timestamp, '0.1']) if '0.1' in pivot_df.columns else 0,
                        'upper_bound': float(pivot_df.loc[timestamp, '0.9']) if '0.9' in pivot_df.columns else 0
                    }
                    forecast_result['predictions'].append(prediction)
                    
                    confidence_interval = {
                        'date': timestamp,
                        'lower': prediction['lower_bound'],
                        'upper': prediction['upper_bound'],
                        'confidence_level': 0.8  # 80% confidence interval (0.1 to 0.9)
                    }
                    forecast_result['confidence_intervals'].append(confidence_interval)
                
                logger.info(f"Retrieved {len(forecast_result['predictions'])} forecast points")
                return forecast_result
            else:
                return {'predictions': [], 'confidence_intervals': []}
            
        except ClientError as e:
            logger.error(f"Failed to get forecast results: {e}")
            raise

    async def wait_for_completion(self, arn: str, operation_type: str, max_wait_time: int = 3600) -> bool:
        """
        Wait for AWS Forecast operation to complete
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            try:
                if operation_type == 'import':
                    response = await self._run_in_executor(
                        self.forecast_client.describe_dataset_import_job,
                        DatasetImportJobArn=arn
                    )
                    status = response['Status']
                elif operation_type == 'predictor':
                    response = await self._run_in_executor(
                        self.forecast_client.describe_predictor,
                        PredictorArn=arn
                    )
                    status = response['Status']
                elif operation_type == 'forecast':
                    response = await self._run_in_executor(
                        self.forecast_client.describe_forecast,
                        ForecastArn=arn
                    )
                    status = response['Status']
                else:
                    raise ValueError(f"Unknown operation type: {operation_type}")
                
                logger.info(f"{operation_type} status: {status}")
                
                if status == 'ACTIVE':
                    return True
                elif status in ['CREATE_FAILED', 'DELETE_FAILED']:
                    logger.error(f"{operation_type} failed with status: {status}")
                    return False
                
                # Wait before next check
                await asyncio.sleep(30)
                
            except ClientError as e:
                logger.error(f"Error checking {operation_type} status: {e}")
                await asyncio.sleep(30)
        
        logger.warning(f"{operation_type} did not complete within {max_wait_time} seconds")
        return False

    async def generate_demand_forecast(self, tenant_id: str, item_id: str, vendor_id: str, forecast_days: int = 30) -> Dict[str, Any]:
        """
        Complete pipeline to generate demand forecast using AWS Forecast
        """
        try:
            logger.info(f"Starting AWS Forecast pipeline for item {item_id}")
            
            # Step 1: Prepare data
            forecast_data = await self.prepare_forecast_data(tenant_id, item_id, vendor_id)
            
            # Step 2: Create dataset group
            dataset_group_arn = await self.create_dataset_group(tenant_id, item_id)
            
            # Step 3: Create dataset
            dataset_arn = await self.create_dataset(dataset_group_arn, tenant_id, item_id)
            
            # Step 4: Upload data to S3
            s3_uri = await self.upload_data_to_s3(forecast_data, tenant_id, item_id)
            
            # Step 5: Import data
            import_job_arn = await self.import_data(dataset_arn, s3_uri, tenant_id, item_id)
            
            # Step 6: Wait for import completion
            if not await self.wait_for_completion(import_job_arn, 'import'):
                raise Exception("Data import failed or timed out")
            
            # Step 7: Create predictor
            predictor_arn = await self.create_predictor(dataset_group_arn, tenant_id, item_id)
            
            # Step 8: Wait for predictor training completion
            if not await self.wait_for_completion(predictor_arn, 'predictor', max_wait_time=7200):  # 2 hours for training
                raise Exception("Predictor training failed or timed out")
            
            # Step 9: Create forecast
            forecast_arn = await self.create_forecast(predictor_arn, tenant_id, item_id)
            
            # Step 10: Wait for forecast completion
            if not await self.wait_for_completion(forecast_arn, 'forecast'):
                raise Exception("Forecast generation failed or timed out")
            
            # Step 11: Get forecast results
            forecast_results = await self.get_forecast_results(forecast_arn, item_id)
            
            # Add metadata
            forecast_results.update({
                'metadata': {
                    'tenant_id': tenant_id,
                    'item_id': item_id,
                    'vendor_id': vendor_id,
                    'forecast_arn': forecast_arn,
                    'predictor_arn': predictor_arn,
                    'generated_at': datetime.utcnow().isoformat(),
                    'forecast_horizon': forecast_days,
                    'algorithm': 'AWS_Forecast_Prophet',
                    'data_points_used': len(forecast_data)
                }
            })
            
            logger.info(f"AWS Forecast pipeline completed successfully for item {item_id}")
            return forecast_results
            
        except Exception as e:
            logger.error(f"AWS Forecast pipeline failed: {e}")
            raise

    async def cleanup_resources(self, forecast_arn: str = None, predictor_arn: str = None, dataset_group_arn: str = None):
        """
        Clean up AWS Forecast resources to manage costs
        """
        try:
            if forecast_arn:
                await self._run_in_executor(
                    self.forecast_client.delete_forecast,
                    ForecastArn=forecast_arn
                )
                logger.info(f"Deleted forecast: {forecast_arn}")
            
            if predictor_arn:
                await self._run_in_executor(
                    self.forecast_client.delete_predictor,
                    PredictorArn=predictor_arn
                )
                logger.info(f"Deleted predictor: {predictor_arn}")
            
            if dataset_group_arn:
                await self._run_in_executor(
                    self.forecast_client.delete_dataset_group,
                    DatasetGroupArn=dataset_group_arn
                )
                logger.info(f"Deleted dataset group: {dataset_group_arn}")
                
        except ClientError as e:
            logger.warning(f"Error during cleanup: {e}")

    async def _run_in_executor(self, func, *args, **kwargs):
        """
        Run synchronous AWS calls in thread executor
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, lambda: func(*args, **kwargs))

    def __del__(self):
        """
        Cleanup executor on service destruction
        """
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False) 