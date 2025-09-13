# Frontend Deployment Issues - Fixed

## Issues Identified and Fixed

### 1. Port Configuration Mismatch
**Problem**: The production Dockerfile was exposing port 3000, but the docker-compose configuration expected port 3005.

**Fix Applied**:
- Updated `apps/frontend/Dockerfile` to expose port 3005
- Updated `apps/frontend/package.json` to run `next start -p 3005`
- Updated health check in Dockerfile to use port 3005

### 2. Environment Variable Configuration
**Problem**: Frontend was using localhost URLs in production, causing API calls to fail.

**Fix Applied**:
- Created `env.production.example` with proper production configuration
- Updated deployment script to automatically detect EC2 public IP
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ML_URL` to use nginx proxy paths

### 3. Docker Compose Configuration
**Problem**: The main docker-compose.yml was using development Dockerfiles.

**Fix Applied**:
- Created `docker-compose.prod.yml` with production configurations
- Uses production Dockerfiles instead of development ones
- Includes nginx reverse proxy for proper routing

### 4. API Routing Issues
**Problem**: Frontend API calls were going directly to backend ports instead of through reverse proxy.

**Fix Applied**:
- Created `nginx/nginx.conf` for proper request routing
- API calls now go through nginx proxy (`/api/` → backend, `/ml/` → ml-service)
- Frontend served through nginx on port 80

## Files Modified/Created

### Modified Files:
1. `apps/frontend/Dockerfile` - Fixed port configuration and health check
2. `apps/frontend/package.json` - Updated start script to use port 3005

### New Files:
1. `docker-compose.prod.yml` - Production Docker Compose configuration
2. `nginx/nginx.conf` - Nginx reverse proxy configuration
3. `env.production.example` - Production environment template
4. `scripts/deploy-production.sh` - Improved deployment script

## How to Deploy (Fixed Version)

### Quick Deployment
```bash
# Run the improved deployment script
sudo ./scripts/deploy-production.sh
```

### Manual Deployment
```bash
# 1. Create production environment file
cp env.production.example .env
# Edit .env and replace YOUR_DOMAIN_OR_IP with your actual domain or EC2 IP

# 2. Build and deploy with production configuration
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

## Access Your Application

After successful deployment, your application will be available at:

- **Frontend**: `http://YOUR_IP/` (port 80)
- **API**: `http://YOUR_IP/api/`
- **ML Service**: `http://YOUR_IP/ml/`
- **Health Check**: `http://YOUR_IP/health`

## Key Improvements

### 1. Automatic IP Detection
The deployment script automatically detects your EC2 public IP and configures the environment variables accordingly.

### 2. Nginx Reverse Proxy
All requests go through nginx, which properly routes them to the correct services:
- `/` → Frontend (Next.js on port 3005)
- `/api/` → Backend (NestJS on port 3001)
- `/ml/` → ML Service (FastAPI on port 8000)

### 3. Production-Ready Configuration
- Uses production Dockerfiles with optimized builds
- Proper security headers in nginx
- Gzip compression enabled
- Health checks configured

### 4. Environment Isolation
- Production environment variables properly configured
- No development volumes mounted in production
- Clean separation between dev and prod configurations

## Troubleshooting

### If services fail to start:
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker logs vendorflow-frontend
docker logs vendorflow-backend
docker logs vendorflow-ml
```

### If frontend shows connection errors:
1. Verify environment variables in `.env`
2. Check that `NEXT_PUBLIC_API_URL` uses your correct IP/domain
3. Ensure nginx is running: `docker logs vendorflow-nginx`

### If API calls fail:
1. Check nginx configuration: `docker exec vendorflow-nginx nginx -t`
2. Verify backend is running: `curl http://localhost:3004/api/health`
3. Check network connectivity between containers

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production (configure SSL certificate)
- Update database passwords
- Configure proper firewall rules
- Enable monitoring and logging

## Next Steps

1. **SSL/HTTPS**: Configure Let's Encrypt or AWS Certificate Manager
2. **Domain Setup**: Point your domain to the EC2 instance
3. **Monitoring**: Set up CloudWatch or other monitoring solutions
4. **Backup**: Configure automated database backups
5. **CI/CD**: Set up automated deployment pipeline 