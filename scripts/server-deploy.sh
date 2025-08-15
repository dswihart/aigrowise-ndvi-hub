#!/bin/bash

# Aigrowise NDVI Hub - Server Deployment Script
# Run this script on your Ubuntu server with root access

set -e

echo "🌱 Aigrowise NDVI Hub - Server Deployment"
echo "========================================="

# Configuration
PROJECT_DIR="/opt/aigrowise"
REPO_URL="https://github.com/your-repo/bmad-aigrowise.git"  # Update with your actual repo
DOMAIN="dashboard.aigrowise.com"

# Step 1: Update system and install dependencies
echo "📦 Installing system dependencies..."
apt update && apt upgrade -y
apt install -y curl git docker.io docker-compose nginx certbot python3-certbot-nginx

# Step 2: Start Docker service
echo "🐳 Starting Docker service..."
systemctl start docker
systemctl enable docker

# Step 3: Create project directory
echo "📁 Setting up project directory..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Step 4: Clone or update repository
if [ -d ".git" ]; then
    echo "🔄 Updating existing repository..."
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL .
fi

# Step 5: Create required directories
mkdir -p ssl logs

# Step 6: Set permissions
chown -R root:root $PROJECT_DIR
chmod +x scripts/*.sh

# Step 7: Deploy with Docker Compose
echo "🚀 Deploying with Docker Compose..."
docker-compose down --remove-orphans || true
docker-compose build --no-cache
docker-compose up -d

# Step 8: Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Step 9: Run database migration
echo "🗄️ Running database migration..."
docker-compose exec app npx prisma migrate deploy --schema=./packages/db/schema.prisma

# Step 10: Create production admin user
echo "👤 Creating production admin user..."
docker-compose exec app node scripts/create-production-admin.js

# Step 11: Setup Nginx (if needed)
echo "🌐 Configuring Nginx..."
if ! nginx -t 2>/dev/null; then
    systemctl stop nginx
    docker-compose restart nginx
fi

# Step 12: Setup firewall
echo "🔥 Configuring firewall..."
ufw allow 22    # SSH
ufw allow 80    # HTTP  
ufw allow 443   # HTTPS
ufw --force enable

# Step 13: Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your Aigrowise NDVI Hub is now running!"
echo "📍 URL: http://$DOMAIN"
echo "📍 Admin: http://$DOMAIN/admin"
echo ""
echo "📝 Next steps:"
echo "1. Point your domain DNS to this server's IP"
echo "2. Run: certbot --nginx -d $DOMAIN (for SSL)"
echo "3. Check logs: docker-compose logs -f"
echo ""
echo "🔧 Admin credentials will be displayed above"
echo "🔒 Change the admin password after first login"