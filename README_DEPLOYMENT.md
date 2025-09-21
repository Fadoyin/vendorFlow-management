# 🚀 VendorFlow Docker Deployment

Deploy VendorFlow on any computer with Docker in minutes!

## 📋 Quick Start (3 Steps)

### 1️⃣ **Clone Repository**
```bash
git clone https://github.com/hassandevelops/Vendor-Flow.git
cd Vendor-Flow
```

### 2️⃣ **Easy Deploy (Choose Your OS)**

#### 🐧 **Linux/Mac:**
```bash
./quick-deploy.sh
```

#### 🪟 **Windows:**
```cmd
quick-deploy.bat
```

#### 🔧 **Manual:**
```bash
cp env.example .env
# Edit .env with your settings
docker-compose up -d
```

### 3️⃣ **Access Application**
- **Frontend**: http://localhost:3005
- **Backend**: http://localhost:3004
- **API Docs**: http://localhost:3004/api/docs

## 🎯 What You Get

✅ **Complete VendorFlow Application**
- Admin Dashboard with real data
- Inventory Management with pagination
- Order Management with tracking
- Real-time Activity Logs
- ML-powered Forecasting
- Secure Multi-tenant System

✅ **All Latest Fixes Applied**
- Fixed infinite loading issues
- Real inventory value calculations
- Proper tenant isolation
- Enhanced pagination
- Optimized performance

## 📚 Documentation

- **Full Guide**: [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)
- **All Fixes**: [DASHBOARD_INFINITE_LOADING_FIX.md](DASHBOARD_INFINITE_LOADING_FIX.md)

## 🆘 Quick Help

**Check Status:**
```bash
docker-compose ps
```

**View Logs:**
```bash
docker-compose logs -f
```

**Stop/Start:**
```bash
docker-compose down
docker-compose up -d
```

**Troubleshooting:**
- Wait 2-3 minutes after starting
- Check logs if frontend doesn't load
- Ensure ports 3004, 3005, 8002 are free

## 🎉 Success!

When working, you'll see:
- ✅ 4 containers running
- ✅ Frontend loads at http://localhost:3005  
- ✅ Dashboard shows real data
- ✅ All features working smoothly

---

**Need detailed instructions?** See [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) 