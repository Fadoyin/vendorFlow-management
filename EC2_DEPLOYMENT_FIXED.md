# VendorFlow AWS EC2 Deployment Guide (Fixed Version)

This guide will walk you through deploying VendorFlow to AWS EC2 with all frontend issues resolved.

## 🚀 Quick Start (Recommended)

### Step 1: Launch EC2 Instance

1. **Go to AWS EC2 Console**
   - Launch a new instance
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance Type**: t3.medium or larger (recommended: t3.large)
   - **Storage**: 30 GB SSD minimum
   - **Security Group**: Configure as shown below

2. **Security Group Configuration**
   ```
   Type        Protocol    Port Range    Source
   SSH         TCP         22           Your IP
   HTTP        TCP         80           0.0.0.0/0
   HTTPS       TCP         443          0.0.0.0/0
   Custom TCP  TCP         3000-3010    0.0.0.0/0 (for development)
   Custom TCP  TCP         8000-8010    0.0.0.0/0 (for ML service)
   ```

### Step 2: Connect to Your EC2 Instance

```bash
# Replace with your key file and EC2 public IP
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3: Automated Deployment

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clone the repository
git clone https://github.com/your-username/VendorFlow-Deploy.git /opt/vendorflow
cd /opt/vendorflow

# Run the fixed deployment script
sudo ./scripts/deploy-production.sh
```

That's it! The script will automatically:
- Install Docker and Docker Compose
- Detect your EC2 public IP
- Configure environment variables
- Build and deploy all services
- Set up nginx reverse proxy

## 🔧 Manual Deployment (Alternative)

If you prefer manual control:

### Step 1: System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Project Setup

```bash
# Create project directory
sudo mkdir -p /opt/vendorflow
sudo chown $USER:$USER /opt/vendorflow
cd /opt/vendorflow

# Clone repository
git clone https://github.com/your-username/VendorFlow-Deploy.git .
```

### Step 3: Environment Configuration

```bash
# Get your EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Your EC2 IP: $EC2_IP"

# Create production environment file
cp env.production.example .env

# Edit the environment file
nano .env
```

**Replace the following in `.env`:**
```env
# Replace YOUR_DOMAIN_OR_IP with your actual EC2 IP
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP/api
NEXT_PUBLIC_ML_URL=http://YOUR_EC2_IP/ml
```

### Step 4: Deploy Services

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🌐 Access Your Application

After deployment, access your application at:

- **Main Application**: `http://YOUR_EC2_IP/`
- **API Documentation**: `http://YOUR_EC2_IP/api/docs`
- **ML Service**: `http://YOUR_EC2_IP/ml/docs`
- **Health Check**: `http://YOUR_EC2_IP/health`

## 🔍 Verification & Troubleshooting

### Check Service Status
```bash
# View all containers
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker logs vendorflow-frontend
docker logs vendorflow-backend
docker logs vendorflow-ml
docker logs vendorflow-nginx
```

### Common Issues & Solutions

#### 1. Services Not Starting
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs --tail=100

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### 2. Frontend Shows Connection Errors
```bash
# Verify environment variables
cat .env | grep NEXT_PUBLIC

# Check nginx configuration
docker exec vendorflow-nginx nginx -t

# Test API connectivity
curl http://localhost:3004/api/health
```

#### 3. Port Already in Use
```bash
# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx

# Or kill processes using ports
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
```

## 🔒 Security Configuration

### 1. Configure Firewall
```bash
# Enable UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. SSL/HTTPS Setup (Optional but Recommended)

#### Using Let's Encrypt:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Maintenance

### Health Monitoring
```bash
# Create monitoring script
cat > /opt/vendorflow/monitor.sh << 'EOF'
#!/bin/bash
echo "=== VendorFlow Health Check ===" 
echo "Date: $(date)"
echo "Services Status:"
docker-compose -f /opt/vendorflow/docker-compose.prod.yml ps
echo "Disk Usage:"
df -h
echo "Memory Usage:"
free -h
EOF

chmod +x /opt/vendorflow/monitor.sh

# Run health check
./monitor.sh
```

### Backup Script
```bash
# Create backup script
cat > /opt/vendorflow/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup environment file
cp /opt/vendorflow/.env $BACKUP_DIR/env_$DATE.backup

# Backup database (if using local MongoDB)
# docker exec vendorflow-mongodb mongodump --out $BACKUP_DIR/mongodb_$DATE

echo "Backup completed: $DATE"
EOF

chmod +x /opt/vendorflow/backup.sh
```

## 🔄 Updates & Maintenance

### Update Application
```bash
cd /opt/vendorflow
git pull
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### View Logs
```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

## 🎯 Performance Optimization

### 1. Enable Swap (for smaller instances)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Docker Cleanup
```bash
# Clean unused images and containers
docker system prune -f

# Schedule weekly cleanup
echo "0 2 * * 0 docker system prune -f" | sudo crontab -
```

## 🆘 Support & Resources

### Useful Commands
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View resource usage
docker stats

# Access container shell
docker exec -it vendorflow-frontend sh
```

### Log Locations
- **Application Logs**: `docker-compose logs`
- **Nginx Logs**: `docker logs vendorflow-nginx`
- **System Logs**: `/var/log/syslog`

## 🎉 Success!

Your VendorFlow application should now be running successfully on AWS EC2 with all frontend issues resolved!

**Key Improvements Made:**
- ✅ Fixed port configuration mismatches
- ✅ Resolved environment variable issues
- ✅ Added nginx reverse proxy
- ✅ Proper production Docker configuration
- ✅ Automatic IP detection
- ✅ Health checks and monitoring

For any issues, check the troubleshooting section above or review the logs using the provided commands. 