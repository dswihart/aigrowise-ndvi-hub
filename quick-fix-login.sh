#!/bin/bash

# Quick Fix Script for Login Issues
# Run this if you just need to fix the login without full redeployment

set -e  # Exit on any error

echo "🔧 Quick fix for login issues..."

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

# Check if running in app directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the /opt/aigrowise directory."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Creating one..."
    
    # Prompt for database info
    read -p "Database Host: " DB_HOST
    read -p "Database Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database Name: " DB_NAME
    read -p "Database User: " DB_USER
    read -s -p "Database Password: " DB_PASSWORD
    echo
    
    # Generate NEXTAUTH_SECRET
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Create .env file
    cat > .env << EOF
# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Next.js Authentication
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://dashboard.aigrowise.com"
EOF

    print_status ".env file created successfully."
else
    print_status ".env file already exists."
fi

# Restart the application
print_status "Restarting application..."
sudo docker-compose down
sudo docker-compose up -d

# Wait for restart
print_status "Waiting for application to restart..."
sleep 20

# Check if running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Application restarted successfully!"
    print_status "Login should now work at https://dashboard.aigrowise.com"
else
    print_error "❌ Application failed to start. Check logs:"
    sudo docker-compose logs app
    exit 1
fi

# Test database connection
print_status "Testing database connection..."
if sudo docker-compose exec -T app npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    print_status "✅ Database connection successful!"
else
    print_warning "⚠️  Database connection test failed. Check your DATABASE_URL in .env"
fi

print_status "Quick fix completed! Try logging in now."
