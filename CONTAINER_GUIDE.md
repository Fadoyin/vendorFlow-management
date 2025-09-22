# 🐳 VendorFlow Container Guide

Complete guide for containerizing and managing your VendorFlow application.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Container Options](#container-options)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Container Management](#container-management)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Option 1: Interactive Container Manager
```bash
./container-manager.sh
```

### Option 2: Direct Commands
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 🐳 Container Options

### Current Development Setup (What you have)
- **Frontend**: `http://localhost:3005` (Next.js)
- **Backend**: `http://localhost:3004` (NestJS)
- **ML Service**: `http://localhost:8002` (FastAPI)
- **Redis**: `localhost:6381`

### Production Setup (New)
- **Frontend**: `http://localhost:3000` (Optimized Next.js)
- **Backend**: `http://localhost:3001` (Optimized NestJS)
- **ML Service**: `http://localhost:8000` (FastAPI)
- **Redis**: `localhost:6379`
- **Nginx**: `http://localhost:80` (Reverse Proxy)

## 🛠️ Development Setup

### Current Working Setup
```bash
# Start all services
docker-compose up -d

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services
- ✅ **Frontend** - Already working with forecasting
- ✅ **Backend** - Already working with APIs
- ✅ **Redis** - Caching and sessions
- ❌ **ML Service** - Optional (had timeout issues)

## 🏭 Production Setup

### 1. Create Production Environment
```bash
# Copy example environment file
cp env.prod.example .env.prod

# Edit with your production values
nano .env.prod
```

### 2. Required Environment Variables
```env
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
STRIPE_SECRET_KEY=your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-public-key
```

### 3. Deploy Production
```bash
# Option 1: Use deployment script
./deploy.sh

# Option 2: Manual deployment
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Container Management

### Interactive Manager
```bash
./container-manager.sh
```

**Features:**
- 🚀 Start Development/Production
- 🛑 Stop All Containers
- 📊 View Container Status
- 📝 View Logs
- 🔄 Restart Services
- 🧹 Clean Up
- 🏗️ Build Containers
- ❓ Help

### Manual Commands

#### Development
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache

# View logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart frontend
```

#### Production
```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Container Architecture

### Development (docker-compose.yml)
```yaml
services:
  frontend:    # Port 3005 - Development mode with hot reload
  backend:     # Port 3004 - Development mode with hot reload
  ml-service:  # Port 8002 - FastAPI with auto-reload
  redis:       # Port 6381 - Cache and sessions
```

### Production (docker-compose.prod.yml)
```yaml
services:
  frontend:    # Port 3000 - Optimized build
  backend:     # Port 3001 - Optimized build
  ml-service:  # Port 8000 - Production mode
  redis:       # Port 6379 - Persistent storage
  nginx:       # Port 80/443 - Reverse proxy
```

## 🔍 Container Status

### Check Running Containers
```bash
# All containers
docker ps

# VendorFlow containers only
docker-compose ps
docker-compose -f docker-compose.prod.yml ps

# Container resource usage
docker stats
```

### Health Checks
```bash
# Frontend
curl http://localhost:3005  # Development
curl http://localhost:3000  # Production

# Backend
curl http://localhost:3004/health  # Development
curl http://localhost:3001/health  # Production

# ML Service
curl http://localhost:8002/health  # Development
curl http://localhost:8000/health  # Production
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
sudo lsof -i :3005

# Kill process
sudo kill -9 <PID>

# Or use different ports in docker-compose.yml
```

#### 2. Container Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Rebuild without cache
docker-compose build --no-cache [service-name]

# Remove and recreate
docker-compose down
docker-compose up -d
```

#### 3. Database Connection Issues
```bash
# Check environment variables
docker-compose exec backend env | grep MONGODB

# Test connection
docker-compose exec backend npm run test:db
```

#### 4. Frontend Not Loading
```bash
# Check if built properly
docker-compose exec frontend ls -la .next/

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Clean Slate Reset
```bash
# Stop everything
docker-compose down
docker-compose -f docker-compose.prod.yml down

# Remove all containers and images
docker system prune -a -f

# Rebuild everything
docker-compose build --no-cache
```

## 📁 File Structure

```
vendorFlow-management/
├── docker-compose.yml              # Development containers
├── docker-compose.prod.yml         # Production containers
├── container-manager.sh            # Interactive management
├── deploy.sh                       # Production deployment
├── env.prod.example                # Production environment template
├── apps/
│   ├── frontend/
│   │   ├── Dockerfile              # Production frontend
│   │   └── Dockerfile.dev          # Development frontend
│   ├── backend/
│   │   ├── Dockerfile              # Production backend
│   │   └── Dockerfile.dev          # Development backend
│   └── ml-service/
│       └── Dockerfile.dev          # ML service
└── nginx/
    └── nginx.prod.conf             # Production reverse proxy
```

## 🎯 Best Practices

### Development
- Use `docker-compose up -d` for background services
- Use `docker-compose logs -f` to monitor logs
- Rebuild containers after major code changes
- Use volume mounts for hot reload

### Production
- Always use `.env.prod` for production variables
- Use multi-stage builds for smaller images
- Implement health checks
- Use reverse proxy (Nginx) for SSL and load balancing
- Monitor resource usage with `docker stats`

### Security
- Never commit `.env.prod` to version control
- Use strong JWT secrets
- Regularly update base images
- Run containers as non-root users
- Use Docker secrets for sensitive data

## 📊 Monitoring

### Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Resource Usage
```bash
# Real-time stats
docker stats

# Container details
docker inspect [container-name]
```

## 🚀 Deployment Options

### 1. Local Development
- Current setup with `docker-compose up -d`
- Perfect for development and testing

### 2. Production Server
- Use `docker-compose.prod.yml`
- Optimized builds and configurations
- Includes Nginx reverse proxy

### 3. Cloud Deployment
- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

---

## 💡 Quick Commands Reference

```bash
# Development
./container-manager.sh              # Interactive manager
docker-compose up -d                # Start dev environment
docker-compose down                 # Stop dev environment
docker-compose logs -f              # View dev logs

# Production
./deploy.sh                         # Deploy production
docker-compose -f docker-compose.prod.yml up -d    # Start prod
docker-compose -f docker-compose.prod.yml down     # Stop prod

# Maintenance
docker system prune -a -f           # Clean everything
docker-compose build --no-cache     # Rebuild containers
```

Your VendorFlow application is now fully containerized and ready for any deployment scenario! 🎉 