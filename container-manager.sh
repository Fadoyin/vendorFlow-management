#!/bin/bash

# VendorFlow Container Manager
# Easy container management for development and production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "🐳 VendorFlow Container Manager"
    echo "==============================${NC}"
}

print_menu() {
    echo ""
    echo "Choose an option:"
    echo "1. 🚀 Start Development Environment"
    echo "2. 🏭 Start Production Environment"
    echo "3. 🛑 Stop All Containers"
    echo "4. 📊 View Container Status"
    echo "5. 📝 View Logs"
    echo "6. 🔄 Restart Services"
    echo "7. 🧹 Clean Up (Remove containers and images)"
    echo "8. 🏗️  Build Containers"
    echo "9. ❓ Help"
    echo "0. 🚪 Exit"
    echo ""
}

start_dev() {
    echo -e "${GREEN}🚀 Starting Development Environment...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo "🌐 Frontend: http://localhost:3005"
    echo "🔧 Backend: http://localhost:3004"
    echo "🤖 ML Service: http://localhost:8002"
}

start_prod() {
    echo -e "${GREEN}🏭 Starting Production Environment...${NC}"
    if [ ! -f ".env.prod" ]; then
        echo -e "${RED}❌ .env.prod file not found!${NC}"
        echo "Create it from env.prod.example first"
        return 1
    fi
    docker-compose -f docker-compose.prod.yml up -d
    echo -e "${GREEN}✅ Production environment started!${NC}"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend: http://localhost:3001"
    echo "🤖 ML Service: http://localhost:8000"
}

stop_all() {
    echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
    docker-compose down --remove-orphans || true
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    echo -e "${GREEN}✅ All containers stopped!${NC}"
}

view_status() {
    echo -e "${BLUE}📊 Container Status:${NC}"
    echo ""
    echo "Development containers:"
    docker-compose ps || echo "No development containers running"
    echo ""
    echo "Production containers:"
    docker-compose -f docker-compose.prod.yml ps || echo "No production containers running"
}

view_logs() {
    echo "Choose logs to view:"
    echo "1. Development logs"
    echo "2. Production logs"
    read -p "Enter choice (1-2): " log_choice
    
    case $log_choice in
        1)
            echo -e "${BLUE}📝 Development Logs:${NC}"
            docker-compose logs -f
            ;;
        2)
            echo -e "${BLUE}📝 Production Logs:${NC}"
            docker-compose -f docker-compose.prod.yml logs -f
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

restart_services() {
    echo "Choose environment to restart:"
    echo "1. Development"
    echo "2. Production"
    read -p "Enter choice (1-2): " restart_choice
    
    case $restart_choice in
        1)
            echo -e "${YELLOW}🔄 Restarting development services...${NC}"
            docker-compose restart
            echo -e "${GREEN}✅ Development services restarted!${NC}"
            ;;
        2)
            echo -e "${YELLOW}🔄 Restarting production services...${NC}"
            docker-compose -f docker-compose.prod.yml restart
            echo -e "${GREEN}✅ Production services restarted!${NC}"
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

cleanup() {
    echo -e "${RED}🧹 This will remove all containers and images. Are you sure? (y/N)${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping containers...${NC}"
        stop_all
        echo -e "${YELLOW}Removing containers...${NC}"
        docker container prune -f
        echo -e "${YELLOW}Removing images...${NC}"
        docker image prune -a -f
        echo -e "${YELLOW}Removing volumes...${NC}"
        docker volume prune -f
        echo -e "${GREEN}✅ Cleanup completed!${NC}"
    else
        echo "Cleanup cancelled"
    fi
}

build_containers() {
    echo "Choose what to build:"
    echo "1. Development containers"
    echo "2. Production containers"
    echo "3. Both"
    read -p "Enter choice (1-3): " build_choice
    
    case $build_choice in
        1)
            echo -e "${BLUE}🏗️ Building development containers...${NC}"
            docker-compose build --no-cache
            ;;
        2)
            echo -e "${BLUE}🏗️ Building production containers...${NC}"
            docker-compose -f docker-compose.prod.yml build --no-cache
            ;;
        3)
            echo -e "${BLUE}🏗️ Building all containers...${NC}"
            docker-compose build --no-cache
            docker-compose -f docker-compose.prod.yml build --no-cache
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
    echo -e "${GREEN}✅ Build completed!${NC}"
}

show_help() {
    echo -e "${BLUE}❓ Help - VendorFlow Container Manager${NC}"
    echo ""
    echo "This script helps you manage your VendorFlow application containers."
    echo ""
    echo "🚀 Development Environment:"
    echo "   - Frontend on port 3005"
    echo "   - Backend on port 3004"
    echo "   - ML Service on port 8002"
    echo "   - Uses docker-compose.yml"
    echo ""
    echo "🏭 Production Environment:"
    echo "   - Frontend on port 3000"
    echo "   - Backend on port 3001"
    echo "   - ML Service on port 8000"
    echo "   - Uses docker-compose.prod.yml"
    echo "   - Requires .env.prod file"
    echo ""
    echo "📁 Files:"
    echo "   - docker-compose.yml (development)"
    echo "   - docker-compose.prod.yml (production)"
    echo "   - .env (development environment variables)"
    echo "   - .env.prod (production environment variables)"
    echo ""
}

# Main menu loop
while true; do
    print_header
    view_status
    print_menu
    
    read -p "Enter your choice (0-9): " choice
    
    case $choice in
        1) start_dev ;;
        2) start_prod ;;
        3) stop_all ;;
        4) view_status ;;
        5) view_logs ;;
        6) restart_services ;;
        7) cleanup ;;
        8) build_containers ;;
        9) show_help ;;
        0) 
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *) 
            echo -e "${RED}❌ Invalid choice. Please try again.${NC}"
            sleep 2
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done 