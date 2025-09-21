# 🐳 VendorFlow Docker Deployment Guide

## 📋 **Prerequisites**

Before deploying VendorFlow on another computer, ensure the following are installed:

### **Required Software:**
- **Docker**: Version 20.10+ 
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository
- **Web Browser**: For accessing the application

### **System Requirements:**
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 10GB free space
- **Network**: Internet connection for downloading images and accessing external services

---

## 🚀 **Quick Start Deployment**

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/hassandevelops/Vendor-Flow.git
cd Vendor-Flow
```

### **Step 2: Set Up Environment Variables**
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your configurations
nano .env  # or use any text editor
```

### **Step 3: Configure Environment Variables**
Edit the `.env` file with the following required configurations:

```env
# MongoDB Configuration (Already configured for Atlas)
MONGODB_URI=mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# AWS Configuration (Optional - for advanced features)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=vendorflow-bucket

# Stripe Configuration (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server Configuration
PORT=3001
NODE_ENV=production
```

### **Step 4: Start the Application**
```bash
# Start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### **Step 5: Access the Application**
- **Frontend**: http://localhost:3005
- **Backend API**: http://localhost:3004
- **API Documentation**: http://localhost:3004/api/docs
- **ML Service**: http://localhost:8002

---

## 🔧 **Detailed Configuration**

### **Environment Variables Explained:**

#### **Essential Variables (Required):**
```env
# Database - Uses MongoDB Atlas (already configured)
MONGODB_URI=mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority&appName=Cluster0

# Security - Change this for production!
JWT_SECRET=your-unique-secret-key-minimum-32-characters-long

# Application Mode
NODE_ENV=production
```

#### **Optional Variables (For Full Features):**
```env
# AWS (for file uploads and forecasting)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket-name

# Stripe (for subscription management)
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_...

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 📁 **Docker Services Overview**

### **Services Included:**
1. **Frontend (Next.js)** - Port 3005
   - User interface and dashboard
   - Built with React and TypeScript
   - Production optimized build

2. **Backend (NestJS)** - Port 3004  
   - REST API and business logic
   - Authentication and authorization
   - Database operations

3. **ML Service (FastAPI)** - Port 8002
   - Machine learning forecasting
   - AWS Forecast integration
   - Data analytics

4. **Redis Cache** - Port 6381
   - Session management
   - Caching layer
   - Performance optimization

### **External Services:**
- **MongoDB Atlas**: Cloud database (configured)
- **AWS Services**: S3, Forecast (optional)
- **Stripe**: Payment processing (optional)

---

## 🛠 **Deployment Commands**

### **Basic Operations:**
```bash
# Start all services
docker-compose up -d

# Stop all services  
docker-compose down

# Rebuild and start (after code changes)
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart frontend
```

### **Development Mode:**
```bash
# Start with logs visible
docker-compose up

# Start specific service
docker-compose up frontend backend redis

# Shell into container
docker-compose exec backend bash
docker-compose exec frontend sh
```

### **Production Deployment:**
```bash
# Use production configuration
NODE_ENV=production docker-compose up -d

# Monitor resource usage
docker stats

# Clean up unused resources
docker system prune -f
```

---

## 🔍 **Troubleshooting**

### **Common Issues & Solutions:**

#### **1. Port Already in Use**
```bash
# Check what's using the port
sudo lsof -i :3005
sudo lsof -i :3004

# Kill the process or change ports in docker-compose.yml
```

#### **2. Build Failures**
```bash
# Clean build cache
docker-compose build --no-cache

# Remove all containers and rebuild
docker-compose down -v
docker-compose up --build -d
```

#### **3. Database Connection Issues**
- Verify MongoDB Atlas connection string
- Check firewall settings
- Ensure internet connectivity

#### **4. Frontend Not Loading**
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend --no-cache
docker-compose up frontend -d
```

#### **5. Environment Variable Issues**
```bash
# Verify .env file exists and is properly formatted
cat .env

# Restart services after env changes
docker-compose down
docker-compose up -d
```

---

## 🔐 **Security Considerations**

### **For Production Deployment:**

1. **Change Default Secrets:**
   ```env
   JWT_SECRET=use-a-strong-32-character-random-string
   ```

2. **Use HTTPS:**
   - Set up reverse proxy with Nginx/Apache
   - Configure SSL certificates

3. **Firewall Configuration:**
   ```bash
   # Only expose necessary ports
   ufw allow 3005  # Frontend
   ufw allow 3004  # Backend API (if needed externally)
   ```

4. **Environment Security:**
   ```bash
   # Restrict .env file permissions
   chmod 600 .env
   ```

---

## 📊 **Resource Requirements**

### **Minimum Specifications:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB
- **Network**: 10 Mbps

### **Recommended Specifications:**
- **CPU**: 4+ cores  
- **RAM**: 8GB+
- **Storage**: 20GB+ SSD
- **Network**: 100 Mbps

### **Container Resource Usage:**
- **Frontend**: ~200MB RAM
- **Backend**: ~300MB RAM  
- **ML Service**: ~400MB RAM
- **Redis**: ~50MB RAM

---

## 🎯 **Testing Deployment**

### **Verification Steps:**

1. **Check All Services Running:**
   ```bash
   docker-compose ps
   # All services should show "Up" status
   ```

2. **Test Frontend Access:**
   ```bash
   curl -I http://localhost:3005
   # Should return 200 OK
   ```

3. **Test Backend API:**
   ```bash
   curl -I http://localhost:3004/api/health
   # Should return 200 OK
   ```

4. **Test Database Connection:**
   - Login to the application
   - Check dashboard loads with data
   - Verify all features work

### **Performance Testing:**
```bash
# Monitor resource usage
docker stats

# Check service logs for errors
docker-compose logs | grep -i error

# Test application responsiveness
time curl http://localhost:3005
```

---

## 📞 **Support & Troubleshooting**

### **Getting Help:**

1. **Check Logs First:**
   ```bash
   docker-compose logs -f
   ```

2. **Service-Specific Logs:**
   ```bash
   docker-compose logs frontend
   docker-compose logs backend
   docker-compose logs ml-service
   ```

3. **System Information:**
   ```bash
   docker version
   docker-compose version
   docker info
   ```

### **Common Log Locations:**
- Application logs: `docker-compose logs`
- Container logs: `/var/log/docker/`
- System logs: `/var/log/syslog`

---

## 🚀 **Quick Commands Reference**

```bash
# Clone and start (complete setup)
git clone https://github.com/hassandevelops/Vendor-Flow.git
cd Vendor-Flow
cp env.example .env
# Edit .env with your configuration
docker-compose up -d

# Access application
open http://localhost:3005

# Monitor
docker-compose ps
docker-compose logs -f

# Stop
docker-compose down
```

---

## ✅ **Success Indicators**

Your deployment is successful when:

- ✅ All 4 containers show "Up" status
- ✅ Frontend loads at http://localhost:3005
- ✅ Backend API responds at http://localhost:3004
- ✅ You can login and access the dashboard
- ✅ Dashboard shows real data (inventory, activities)
- ✅ All pages load without errors

---

**🎉 Congratulations! VendorFlow is now running on your computer!**

For any issues or questions, refer to the troubleshooting section above or check the application logs for specific error messages. 