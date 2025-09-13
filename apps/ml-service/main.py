from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api import api_router
from app.core.logging import setup_logging

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    await init_db()
    print("🚀 ML Service started successfully")
    
    yield
    
    # Shutdown
    print("🛑 ML Service shutting down")

def create_application() -> FastAPI:
    application = FastAPI(
        title="Vendor Management ML Service",
        description="Machine Learning service for demand forecasting and cost prediction",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Security middleware
    application.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API router
    application.include_router(api_router, prefix="/api/v1")

    @application.get("/")
    async def root():
        return {
            "message": "Vendor Management ML Service",
            "version": "1.0.0",
            "status": "running"
        }

    @application.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "ml-service",
            "version": "1.0.0"
        }

    return application

app = create_application()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
