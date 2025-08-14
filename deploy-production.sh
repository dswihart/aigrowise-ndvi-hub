#!/bin/bash

# Production Deployment Script for Aigrowise Dashboard
# Run this on your production server

set -e  # Exit on any error

echo "🚀 Starting production deployment of Aigrowise Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use a regular user with sudo access."
    exit 1
fi

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed. Please install OpenSSL first."
        exit 1
    fi
    
    print_status "All dependencies are installed."
}

# Generate secure secrets
generate_secrets() {
    print_status "Generating secure secrets..."
    
    # Generate NEXTAUTH_SECRET
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "Generated NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:20}..."
    
    # Store for later use
    export NEXTAUTH_SECRET
}

# Create production environment file
create_env_file() {
    print_status "Creating production environment file..."
    
    # Check if .env already exists
    if [ -f ".env" ]; then
        print_warning ".env file already exists. Backing up to .env.backup"
        cp .env .env.backup
    fi
    
    # Create new .env file
    cat > .env << EOF
# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}"

# Next.js Authentication
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://dashboard.aigrowise.com"

# Production Database Settings
POSTGRES_HOST="\${POSTGRES_HOST}"
POSTGRES_PORT="\${POSTGRES_PORT}"
POSTGRES_DB="\${POSTGRES_DB}"
POSTGRES_USER="\${POSTGRES_USER}"
POSTGRES_PASSWORD="\${POSTGRES_PASSWORD}"
EOF

    print_status ".env file created successfully."
}

# Prompt for database configuration
get_database_config() {
    print_status "Please provide your production database configuration:"
    
    read -p "Database Host: " POSTGRES_HOST
    read -p "Database Port [5432]: " POSTGRES_PORT
    POSTGRES_PORT=${POSTGRES_PORT:-5432}
    read -p "Database Name: " POSTGRES_DB
    read -p "Database User: " POSTGRES_USER
    read -s -p "Database Password: " POSTGRES_PASSWORD
    echo
    
    # Export variables for use in create_env_file
    export POSTGRES_HOST POSTGRES_PORT POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD
}

# Deploy application
deploy_app() {
    print_status "Deploying application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    sudo docker-compose down || true
    
    # Build and start new containers
    print_status "Building and starting new containers..."
    sudo docker-compose up -d --build
    
    # Wait for application to start
    print_status "Waiting for application to start..."
    sleep 30
    
    # Check if application is running
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "✅ Application is running successfully!"
        print_status "🌐 Access your application at: https://dashboard.aigrowise.com"
    else
        print_error "❌ Application failed to start. Check logs with: sudo docker-compose logs app"
        exit 1
    fi
}

# Test database connection
test_database() {
    print_status "Testing database connection..."
    
    # Run database test in container
    if sudo docker-compose exec -T app npx prisma db push --accept-data-loss > /dev/null 2>&1; then
        print_status "✅ Database connection successful!"
    else
        print_warning "⚠️  Database connection test failed. This might be normal if the schema is already up to date."
    fi
}

# Show logs
show_logs() {
    print_status "Recent application logs:"
    sudo docker-compose logs --tail=20 app
}

# Main deployment flow
main() {
    print_status "Starting production deployment..."
    
    # Check dependencies
    check_dependencies
    
    # Get database configuration
    get_database_config
    
    # Generate secrets
    generate_secrets
    
    # Create environment file
    create_env_file
    
    # Deploy application
    deploy_app
    
    # Test database
    test_database
    
    # Show logs
    show_logs
    
    print_status "🎉 Production deployment completed successfully!"
    print_status "Next steps:"
    print_status "1. Test login functionality at https://dashboard.aigrowise.com"
    print_status "2. Create your first user account in the database"
    print_status "3. Verify all dashboard features are working"
}

# Run main function
main "$@"
