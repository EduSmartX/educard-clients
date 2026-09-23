#!/bin/bash

# EduCard Frontend Docker Helper Script

echo "🎓 EduCard Frontend - Docker Development Environment"
echo "=================================================="
echo ""

# Function to show menu
show_menu() {
    echo "Please select an option:"
    echo "1) Build and start development server"
    echo "2) Start development server (if already built)"
    echo "3) Stop development server"
    echo "4) View logs"
    echo "5) Rebuild (clean build)"
    echo "6) Shell into container"
    echo "7) Install dependencies"
    echo "8) Build for production"
    echo "9) Exit"
    echo ""
    read -p "Enter choice [1-9]: " choice
}

# Function to build and start
build_and_start() {
    echo "🔨 Building and starting development server..."
    docker-compose up --build -d educard-frontend-dev
    echo "✅ Development server started at http://localhost:5173"
    echo "📝 View logs with: docker-compose logs -f educard-frontend-dev"
}

# Function to start
start() {
    echo "🚀 Starting development server..."
    docker-compose up -d educard-frontend-dev
    echo "✅ Development server started at http://localhost:5173"
}

# Function to stop
stop() {
    echo "🛑 Stopping development server..."
    docker-compose down
    echo "✅ Server stopped"
}

# Function to view logs
view_logs() {
    echo "📝 Viewing logs (Ctrl+C to exit)..."
    docker-compose logs -f educard-frontend-dev
}

# Function to rebuild
rebuild() {
    echo "🔄 Rebuilding (clean build)..."
    docker-compose down -v
    docker-compose build --no-cache educard-frontend-dev
    docker-compose up -d educard-frontend-dev
    echo "✅ Rebuild complete! Server started at http://localhost:5173"
}

# Function to shell into container
shell() {
    echo "🐚 Opening shell in container..."
    docker-compose exec educard-frontend-dev sh
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    docker-compose run --rm educard-frontend-dev npm install
    echo "✅ Dependencies installed"
}

# Function to build production
build_prod() {
    echo "🏗️  Building for production..."
    docker-compose build educard-frontend-prod
    echo "✅ Production build complete!"
    echo "To run: docker-compose up -d educard-frontend-prod"
    echo "Access at: http://localhost:3000"
}

# Main loop
while true; do
    show_menu
    case $choice in
        1)
            build_and_start
            ;;
        2)
            start
            ;;
        3)
            stop
            ;;
        4)
            view_logs
            ;;
        5)
            rebuild
            ;;
        6)
            shell
            ;;
        7)
            install_deps
            ;;
        8)
            build_prod
            ;;
        9)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
    echo ""
    echo "Press Enter to continue..."
    read
    clear
done
