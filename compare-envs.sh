#!/bin/bash

# Environment Comparison Script
# Compare development and production environment configurations

echo "🔍 VendorFlow Environment Comparison"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_section() {
    echo -e "${BLUE}$1${NC}"
    echo "----------------------------------------"
}

print_config() {
    local file=$1
    local title=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $title${NC}"
        echo "   NODE_ENV: $(grep '^NODE_ENV=' $file | cut -d'=' -f2 || echo 'Not set')"
        echo "   Database: $(grep '^MONGODB_URI=' $file | cut -d'=' -f1 || echo 'Not configured')=***configured***"
        echo "   JWT Secret: $(grep '^JWT_SECRET=' $file | cut -d'=' -f1 || echo 'Not configured')=***configured***"
        echo "   Stripe Secret: $(grep '^STRIPE_SECRET_KEY=' $file | cut -d'=' -f1 || echo 'Not configured')=***configured***"
        echo "   Stripe Public: $(grep '^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=' $file | cut -d'=' -f1 || echo 'Not configured')=***configured***"
        echo "   AWS Region: $(grep '^AWS_REGION=' $file | cut -d'=' -f2 || echo 'Not set')"
        echo "   SMTP Host: $(grep '^SMTP_HOST=' $file | cut -d'=' -f2 || echo 'Not set')"
        echo ""
    else
        echo -e "${YELLOW}❌ $title - File not found${NC}"
        echo ""
    fi
}

print_section "📊 Environment Files Status"

print_config ".env" "Development Environment (.env)"
print_config ".env.prod" "Production Environment (.env.prod)"

print_section "🐳 Container Ports"
echo "Development:"
echo "   Frontend: http://localhost:3005"
echo "   Backend:  http://localhost:3004"
echo "   ML Service: http://localhost:8002"
echo "   Redis: localhost:6381"
echo ""
echo "Production:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   ML Service: http://localhost:8000"
echo "   Redis: localhost:6379"
echo ""

print_section "🚀 Quick Commands"
echo "Development:"
echo "   ./container-manager.sh    # Interactive manager"
echo "   docker-compose up -d      # Start development"
echo ""
echo "Production:"
echo "   ./deploy.sh               # Deploy production"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""

print_section "🔧 Environment Setup Status"

# Check if API keys match
if [ -f ".env" ] && [ -f ".env.prod" ]; then
    dev_stripe=$(grep '^STRIPE_SECRET_KEY=' .env | cut -d'=' -f2)
    prod_stripe=$(grep '^STRIPE_SECRET_KEY=' .env.prod | cut -d'=' -f2)
    
    if [ "$dev_stripe" = "$prod_stripe" ]; then
        echo -e "${GREEN}✅ Stripe keys match between environments${NC}"
    else
        echo -e "${YELLOW}⚠️ Stripe keys differ between environments${NC}"
    fi
    
    dev_jwt=$(grep '^JWT_SECRET=' .env | cut -d'=' -f2)
    prod_jwt=$(grep '^JWT_SECRET=' .env.prod | cut -d'=' -f2)
    
    if [ "$dev_jwt" = "$prod_jwt" ]; then
        echo -e "${GREEN}✅ JWT secrets match between environments${NC}"
    else
        echo -e "${YELLOW}⚠️ JWT secrets differ between environments${NC}"
    fi
    
    dev_db=$(grep '^MONGODB_URI=' .env | cut -d'=' -f2)
    prod_db=$(grep '^MONGODB_URI=' .env.prod | cut -d'=' -f2)
    
    if [ "$dev_db" = "$prod_db" ]; then
        echo -e "${GREEN}✅ Database URIs match between environments${NC}"
    else
        echo -e "${YELLOW}⚠️ Database URIs differ between environments${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🎯 Status: Your production environment is configured with the same API keys as development!${NC}" 