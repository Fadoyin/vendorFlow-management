# 🚀 Vendor Management Platform

A comprehensive, cloud-based SaaS platform for vendor management, inventory tracking, and machine learning-based forecasting designed specifically for small-scale food manufacturers.

## ✨ Features

### 🔐 **Authentication & Security**
- Multi-tenant architecture with row-level security
- AWS Cognito integration with JWT authentication
- Role-based access control (Admin, Manager, Staff)
- Comprehensive permission system

### 👥 **Vendor Management**
- Complete vendor profiles with contact information
- Performance tracking and rating systems
- Document storage and management
- Vendor categorization and search

### 📦 **Inventory Management**
- SKU and barcode tracking
- Real-time stock level monitoring
- Automated reorder points and alerts
- Multi-location inventory support
- Cost and pricing management

### 🛒 **Purchase Orders**
- Complete PO lifecycle management
- Multi-level approval workflows
- Vendor communication tracking
- Receipt and delivery management
- Cost analysis and reporting

### 🔮 **Machine Learning Forecasting**
- Demand forecasting using Prophet
- Cost prediction with XGBoost
- Automated model training and updates
- Forecast accuracy tracking
- Historical performance analysis

### 📊 **Analytics & Reporting**
- Real-time dashboards
- Interactive charts and visualizations
- Custom report generation
- Export capabilities (PDF, Excel)
- Performance metrics and KPIs

## 🏗️ Architecture

### **Frontend**
- **Framework**: Next.js 14 with React 18
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: Zustand
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

### **Backend**
- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for session and data caching
- **File Storage**: AWS S3 integration
- **API Documentation**: Swagger/OpenAPI

### **Machine Learning Service**
- **Framework**: FastAPI with Python
- **ML Libraries**: Prophet, XGBoost, Scikit-learn
- **Model Persistence**: Joblib with versioning
- **Data Processing**: Pandas, NumPy

### **Infrastructure**
- **Cloud Provider**: AWS
- **Containerization**: Docker with ECS Fargate
- **Load Balancing**: Application Load Balancer
- **CDN**: CloudFront for static assets
- **Monitoring**: CloudWatch with custom dashboards
- **CI/CD**: GitHub Actions with automated testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker and Docker Compose
- MongoDB (local or Atlas)
- Redis
- AWS CLI (for production deployment)

### 1. Clone Repository
```bash
git clone <repository-url>
cd vendor-management-platform
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Install ML service dependencies
cd ../ml-service && pip install -r requirements.txt
```

### 3. Environment Setup
```bash
# Copy environment files
cp env.example .env
cp env.example .env.local

# Edit environment variables
nano .env.local
```

### 4. Start Development Environment
```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individually
npm run dev:backend    # Backend API
npm run dev:frontend   # Frontend app
npm run dev:ml         # ML service
```

### 5. Access the Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **ML Service**: http://localhost:8000
- **API Docs**: http://localhost:3001/api/docs

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Individual Service Tests
```bash
# Backend tests
cd apps/backend && npm run test

# Frontend tests
cd apps/frontend && npm run test

# ML service tests
cd apps/ml-service && pytest
```

### Test Coverage
```bash
npm run test:coverage
```

## 🚀 Deployment

### Local Production Build
```bash
# Build all services
npm run build

# Start production build
npm run start:prod
```

### AWS Deployment
```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform apply

# Deploy services
npm run deploy:staging
npm run deploy:production
```

### Docker Deployment
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and architecture
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Testing Guide](docs/TESTING.md)** - Testing strategies and examples
- **[Monitoring Guide](docs/MONITORING.md)** - Observability and monitoring
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## 🔧 Configuration

### Environment Variables

#### Required
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/vendor-management
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

#### Optional
```bash
# ML Service
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_API_KEY=your-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
CLOUDWATCH_GROUP_NAME=/aws/ecs/vendor-management
```

### Database Setup
```bash
# Seed database with sample data
export MONGODB_URI="your-mongodb-uri"
export TENANT_ID="demo-tenant-001"
node scripts/seed-database.js
```

## 🏗️ Project Structure

```
vendor-management-platform/
├── apps/
│   ├── frontend/                 # Next.js frontend application
│   ├── backend/                  # NestJS backend API
│   └── ml-service/              # FastAPI ML service
├── packages/                     # Shared packages
│   ├── ui/                      # Shared UI components
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript type definitions
├── infrastructure/               # Infrastructure as Code
│   └── terraform/               # Terraform configurations
├── scripts/                     # Utility scripts
├── docs/                        # Documentation
└── docker-compose.yml           # Development environment
```

## 🔒 Security Features

- **Authentication**: JWT with AWS Cognito integration
- **Authorization**: Role-based access control with fine-grained permissions
- **Data Isolation**: Multi-tenant architecture with row-level security
- **Input Validation**: Comprehensive validation using Zod and class-validator
- **HTTPS**: TLS/SSL encryption for all communications
- **Rate Limiting**: API rate limiting to prevent abuse
- **Audit Logging**: Complete audit trail for all operations

## 📊 Performance Features

- **Caching**: Redis-based caching for frequently accessed data
- **Database Optimization**: Proper indexing and query optimization
- **Auto-scaling**: ECS auto-scaling based on CPU and memory usage
- **CDN**: CloudFront distribution for static assets
- **Load Balancing**: Application Load Balancer for traffic distribution
- **Monitoring**: Real-time performance monitoring and alerting

## 🚀 Getting Help

### Support Channels
- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

### Community
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS** - Backend framework
- **Next.js** - Frontend framework
- **TailwindCSS** - Styling framework
- **shadcn/ui** - UI component library
- **AWS** - Cloud infrastructure
- **MongoDB** - Database
- **Redis** - Caching layer

## 🚀 Roadmap

### Phase 1 (Current) ✅
- [x] Core vendor management
- [x] Inventory tracking
- [x] Purchase order management
- [x] Basic ML forecasting
- [x] Multi-tenant architecture
- [x] AWS infrastructure

### Phase 2 (Next) 🚧
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Advanced ML models
- [ ] Integration APIs
- [ ] Advanced reporting

### Phase 3 (Future) 🔮
- [ ] AI-powered insights
- [ ] Predictive analytics
- [ ] Advanced workflow automation
- [ ] Multi-language support
- [ ] Advanced security features

---

**Built with ❤️ for the food manufacturing industry**

For questions, support, or contributions, please reach out to our team!
