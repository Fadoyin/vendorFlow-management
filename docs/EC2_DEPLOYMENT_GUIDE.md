# VendorFlow EC2 Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying VendorFlow to an AWS EC2 instance. VendorFlow is a multi-service application consisting of:

- **Backend API** (NestJS) - Port 3004
- **Frontend** (Next.js) - Port 3005  
- **ML Service** (FastAPI) - Port 8002
- **MongoDB** (Database) - Port 27017
- **Redis** (Cache) - Port 6379
- **Nginx** (Reverse Proxy) - Port 80/443

## Prerequisites

### AWS EC2 Instance Requirements

**Minimum Specifications:**
- **Instance Type**: t3.medium or larger
- **CPU**: 2 vCPUs
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **OS**: Ubuntu 20.04/22.04 LTS, Amazon Linux 2, or CentOS 7/8

**Recommended Specifications:**
- **Instance Type**: t3.large or larger
- **CPU**: 2+ vCPUs
- **RAM**: 8 GB
- **Storage**: 50 GB SSD

### Security Group Configuration

Configure your EC2 security group with the following inbound rules:

| Type | Protocol | Port Range | Source |
|------|----------|------------|--------|
| SSH | TCP | 22 | Your IP |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Custom TCP | TCP | 3000-3010 | 0.0.0.0/0 |
| Custom TCP | TCP | 8000-8010 | 0.0.0.0/0 |

### Required Information

Before starting deployment, gather:

1. **MongoDB Connection String** (if using external MongoDB)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/vendorflow_prod`
   - Or leave empty to install local MongoDB

2. **AWS Credentials** (optional, for AWS services)
   - AWS Access Key ID
   - AWS Secret Access Key
   - AWS Region

3. **Stripe Configuration** (optional, for payments)
   - Stripe Secret Key
   - Stripe Publishable Key
   - Stripe Webhook Secret

4. **Domain Name** (optional)
   - Your custom domain or use EC2 public IP

## Quick Deployment

### Option 1: Automated Script (Recommended)

1. **Connect to your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Download and run the deployment script:**
   ```bash
   # Clone the repository
   git clone <your-repo-url> /opt/vendorflow
   cd /opt/vendorflow
   
   # Run the deployment script
   sudo ./scripts/deploy-to-ec2.sh
   ```

3. **Follow the interactive prompts** to configure your deployment.

### Option 2: Manual Deployment

If you prefer manual control, follow the step-by-step instructions below.

## Step-by-Step Manual Deployment

### Step 1: System Preparation

1. **Update system packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl wget git unzip
   ```

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Install Docker Compose:**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Install Node.js 18:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

5. **Install Python 3.9:**
   ```bash
   sudo apt update
   sudo apt install -y python3.9 python3.9-pip python3.9-venv
   ```

### Step 2: Project Setup

1. **Create project directory:**
   ```bash
   sudo mkdir -p /opt/vendorflow
   sudo chown $USER:$USER /opt/vendorflow
   cd /opt/vendorflow
   ```

2. **Clone repository:**
   ```bash
   git clone <your-repo-url> .
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   nano .env
   ```

   Configure the following variables:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://admin:password123@localhost:27017/vendor_management?authSource=admin
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   
   # Server Configuration
   PORT=3001
   NODE_ENV=production
   
   # AWS Configuration (optional)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   
   # Stripe Configuration (optional)
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   
   # Application URLs
   NEXT_PUBLIC_API_URL=http://your-domain-or-ip/api
   NEXT_PUBLIC_ML_URL=http://your-domain-or-ip/ml
   ```

### Step 3: Service Configuration

1. **Create production Docker Compose file:**
   ```bash
   cp docker-compose.yml docker-compose.prod.yml
   ```

2. **Edit the production configuration:**
   ```bash
   nano docker-compose.prod.yml
   ```

   Update the following:
   - Change `dockerfile: Dockerfile.dev` to `dockerfile: Dockerfile`
   - Update environment variables for production
   - Remove development volume mounts

3. **Create Nginx configuration:**
   ```bash
   mkdir -p nginx
   ```

   Create `nginx/nginx.conf`:
   ```nginx
   events {
       worker_connections 1024;
   }
   
   http {
       upstream backend {
           server backend:3001;
       }
       
       upstream frontend {
           server frontend:3000;
       }
       
       upstream ml-service {
           server ml-service:8000;
       }
       
       server {
           listen 80;
           server_name your-domain-or-ip;
           
           location /api/ {
               proxy_pass http://backend;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
           }
           
           location /ml/ {
               proxy_pass http://ml-service/;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
           }
           
           location / {
               proxy_pass http://frontend;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
           }
       }
   }
   ```

### Step 4: Build and Deploy

1. **Install dependencies:**
   ```bash
   # Backend dependencies
   cd apps/backend && npm install && cd ../..
   
   # Frontend dependencies  
   cd apps/frontend && npm install && cd ../..
   
   # ML service dependencies
   cd apps/ml-service && pip3.9 install -r requirements.txt && cd ../..
   ```

2. **Build and start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Verify deployment:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

### Step 5: Post-Deployment Setup

1. **Configure firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

2. **Set up auto-start service:**
   ```bash
   sudo systemctl enable docker
   ```

3. **Create systemd service:**
   ```bash
   sudo tee /etc/systemd/system/vendorflow.service > /dev/null <<EOF
   [Unit]
   Description=VendorFlow Application
   Requires=docker.service
   After=docker.service
   
   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/opt/vendorflow
   ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
   ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
   
   [Install]
   WantedBy=multi-user.target
   EOF
   
   sudo systemctl daemon-reload
   sudo systemctl enable vendorflow.service
   ```

## SSL/HTTPS Setup (Optional)

### Using Let's Encrypt (Free)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Using AWS Certificate Manager

1. Request certificate in AWS Console
2. Update ALB/CloudFront configuration
3. Point domain to AWS resources

## Monitoring and Maintenance

### Health Checks

```bash
# Check service status
docker-compose -f /opt/vendorflow/docker-compose.prod.yml ps

# View logs
docker-compose -f /opt/vendorflow/docker-compose.prod.yml logs -f

# Check individual service logs
docker logs vendorflow-backend
docker logs vendorflow-frontend
docker logs vendorflow-ml
```

### Backup Procedures

1. **Database backup:**
   ```bash
   docker exec vendorflow-mongodb mongodump --out /backup/$(date +%Y%m%d)
   ```

2. **Application backup:**
   ```bash
   tar -czf /backup/vendorflow-$(date +%Y%m%d).tar.gz /opt/vendorflow
   ```

### Updates

```bash
cd /opt/vendorflow
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### Services Not Starting

**Problem**: Container fails to start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Common solutions:
1. Check environment variables in .env file
2. Verify port conflicts
3. Check disk space: df -h
4. Check memory: free -m
```

#### Database Connection Issues

**Problem**: Cannot connect to MongoDB
```bash
# Check MongoDB status
docker exec vendorflow-mongodb mongo --eval "db.runCommand({ping: 1})"

# Common solutions:
1. Verify MONGODB_URI in .env
2. Check MongoDB container logs
3. Ensure MongoDB is running
```

#### High Memory Usage

**Problem**: Server running out of memory
```bash
# Check memory usage
docker stats

# Solutions:
1. Increase EC2 instance size
2. Optimize Docker containers
3. Add swap space
```

#### SSL Certificate Issues

**Problem**: HTTPS not working
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

### Performance Optimization

1. **Enable gzip compression** in Nginx
2. **Set up CDN** (CloudFront) for static assets
3. **Configure database indexes**
4. **Enable Redis caching**
5. **Use PM2 for Node.js process management**

### Logs Location

- **Application logs**: `docker-compose logs`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `/var/log/syslog`

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure fail2ban:**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Use strong passwords and JWT secrets**

4. **Regularly backup data**

5. **Monitor logs for suspicious activity**

6. **Use HTTPS in production**

7. **Restrict database access**

## Support and Resources

### Useful Commands

```bash
# Restart all services
sudo systemctl restart vendorflow

# View system resources
htop

# Check disk usage
df -h

# Check network connections
netstat -tlnp

# Update application
cd /opt/vendorflow && git pull && docker-compose -f docker-compose.prod.yml up -d --build
```

### Getting Help

1. **Check application logs** first
2. **Review this documentation**
3. **Search for similar issues** in project repository
4. **Contact support** with specific error messages

## Conclusion

Your VendorFlow application should now be running successfully on your EC2 instance. Access it at:

- **Application**: `http://your-domain-or-ip`
- **API**: `http://your-domain-or-ip/api`
- **ML Service**: `http://your-domain-or-ip/ml`

Remember to:
- Set up SSL certificates for production
- Configure regular backups
- Monitor system performance
- Keep the application updated

Happy deploying! 🚀 