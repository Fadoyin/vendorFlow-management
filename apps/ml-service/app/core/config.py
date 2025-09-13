from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Vendor Management ML Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    ALLOWED_HOSTS: List[str] = ["*"]
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3005"]
    
    # Database
    MONGODB_URI: str = "mongodb://admin:password123@localhost:27017/vendor_management?authSource=admin"
    MONGODB_DB: str = "vendor_management"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0
    
    # ML Models
    MODEL_PATH: str = "./models"
    DEFAULT_FORECAST_HORIZON: int = 12  # weeks
    DEFAULT_TRAINING_WINDOW: int = 52   # weeks
    
    # AWS Configuration
    AWS_REGION: Optional[str] = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # AWS Forecast Configuration
    AWS_FORECAST_ROLE_ARN: Optional[str] = None  # IAM role for Forecast service
    AWS_S3_BUCKET: str = "vendorflow-forecast-data"
    AWS_FORECAST_ALGORITHM: str = "Prophet"  # Default algorithm
    AWS_FORECAST_HORIZON_DAYS: int = 30  # Default forecast horizon
    AWS_FORECAST_FREQUENCY: str = "D"  # Daily frequency
    
    # AWS Forecast Cost Management
    FORECAST_AUTO_CLEANUP: bool = True  # Auto-cleanup resources after use
    FORECAST_MAX_CONCURRENT_JOBS: int = 5  # Limit concurrent forecast jobs
    FORECAST_RETENTION_DAYS: int = 7  # Keep forecasts for 7 days
    
    # Forecast Quality Settings
    FORECAST_MIN_DATA_POINTS: int = 60  # Minimum 60 days of data
    FORECAST_CONFIDENCE_LEVELS: List[str] = ["0.1", "0.5", "0.9"]  # 10%, 50%, 90%
    
    # API Keys and Authentication
    API_V1_STR: str = "/api/v1"
    JWT_SECRET_KEY: str = "your-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    
    # External API
    BACKEND_API_URL: str = "http://localhost:3004/api"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Ensure model directory exists
os.makedirs(settings.MODEL_PATH, exist_ok=True)
