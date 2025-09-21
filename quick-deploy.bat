@echo off
REM 🚀 VendorFlow Quick Deploy Script for Windows
REM This script sets up and runs VendorFlow on any Docker-enabled Windows computer

echo 🚀 VendorFlow Quick Deploy Script for Windows
echo ================================================

REM Check if Docker is installed
echo ℹ️  Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop with Compose.
    echo Visit: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Check if .env file exists
echo ℹ️  Checking environment configuration...
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from example...
    if exist "env.example" (
        copy env.example .env >nul
        echo ✅ Created .env file from example
        echo ⚠️  Please edit .env file with your configurations before continuing
        echo ℹ️  At minimum, change the JWT_SECRET value
        echo.
        echo Press Enter after editing .env file to continue...
        pause >nul
    ) else (
        echo ❌ env.example file not found. Cannot create .env file.
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

REM Stop any existing containers
echo ℹ️  Stopping any existing containers...
docker-compose down >nul 2>&1

REM Pull/build images
echo ℹ️  Building Docker images (this may take a few minutes)...
docker-compose build
if %errorlevel% neq 0 (
    echo ❌ Failed to build Docker images
    pause
    exit /b 1
)
echo ✅ Docker images built successfully

REM Start services
echo ℹ️  Starting VendorFlow services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)
echo ✅ Services started successfully

REM Wait for services to be ready
echo ℹ️  Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service status
echo ℹ️  Checking service status...
docker-compose ps | find "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ Services are running
) else (
    echo ⚠️  Some services may not be running properly
    echo Service status:
    docker-compose ps
)

REM Test frontend
echo ℹ️  Testing frontend connectivity...
curl -s -I http://localhost:3005 | find "200 OK" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is accessible
) else (
    echo ⚠️  Frontend may not be ready yet (this is normal, wait a few more minutes)
)

REM Display access information
echo.
echo 🎉 VendorFlow Deployment Complete!
echo ==================================
echo.
echo 📱 Access URLs:
echo    Frontend:        http://localhost:3005
echo    Backend API:     http://localhost:3004
echo    API Docs:        http://localhost:3004/api/docs
echo    ML Service:      http://localhost:8002
echo.
echo 🔧 Management Commands:
echo    View logs:       docker-compose logs -f
echo    Stop services:   docker-compose down
echo    Restart:         docker-compose restart
echo    Service status:  docker-compose ps
echo.
echo ⏱️  Note: It may take 2-3 minutes for all services to be fully ready
echo     If the frontend doesn't load immediately, wait a moment and refresh
echo.

REM Open browser
echo 🌐 Opening browser...
start http://localhost:3005

echo ✅ Deployment script completed successfully!
echo.
echo 📋 Next Steps:
echo    1. Open http://localhost:3005 in your browser
echo    2. Login with your credentials
echo    3. Explore the dashboard and features
echo.
echo ❓ Need help? Check the logs: docker-compose logs -f
echo.
pause 