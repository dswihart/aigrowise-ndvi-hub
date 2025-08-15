#!/bin/bash

# Aigrowise Deployment Fix Script
# This script addresses the database and storage connectivity issues

echo "🌱 Aigrowise Deployment Fix"
echo "============================"

# Check if we're on the server
if [ ! -f "/var/www/aigrowise/.env" ]; then
    echo "❌ Not running on production server. Please run this on dashboard.aigrowise.com"
    exit 1
fi

cd /var/www/aigrowise

echo "📋 Current System Status:"
echo "========================="

# Check if services are running
echo "Checking PM2 processes..."
pm2 list

echo -e "\nChecking Nginx status..."
systemctl status nginx --no-pager

echo -e "\nChecking PostgreSQL status..."
systemctl status postgresql --no-pager

echo -e "\n🔧 Fixing Issues:"
echo "=================="

# 1. Check and fix database connection
echo "1. Testing database connection..."
sudo -u postgres psql -d aigrowise_production -c "SELECT 1;" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Database connection OK"
else
    echo "   ❌ Database connection failed - attempting to fix..."
    
    # Create database if it doesn't exist
    sudo -u postgres createdb aigrowise_production 2>/dev/null || echo "   Database already exists"
    
    # Run migrations
    echo "   Running database migrations..."
    npm run db:migrate
    
    # Create admin user if doesn't exist
    echo "   Ensuring admin user exists..."
    node scripts/create-production-admin.js
fi

# 2. Check and fix environment variables
echo -e "\n2. Checking environment configuration..."
if [ -f ".env" ]; then
    echo "   ✅ Environment file exists"
    
    # Update environment file with production settings
    cp env.production .env
    echo "   ✅ Environment updated with production settings"
else
    echo "   ❌ Environment file missing - creating..."
    cp env.production .env
fi

# 3. Restart services
echo -e "\n3. Restarting services..."
echo "   Restarting PM2 application..."
pm2 restart aigrowise-dashboard || pm2 start ecosystem.config.js

echo "   Reloading Nginx configuration..."
nginx -t && systemctl reload nginx

# 4. Check DigitalOcean Spaces setup
echo -e "\n4. Checking DigitalOcean Spaces..."
if grep -q "your-do-spaces-access-key" .env; then
    echo "   ⚠️  DigitalOcean Spaces credentials not configured"
    echo "   Please update DO_SPACES_ACCESS_KEY and DO_SPACES_SECRET_KEY in .env"
else
    echo "   ✅ DigitalOcean Spaces credentials configured"
fi

# 5. Final verification
echo -e "\n5. Final verification..."
sleep 3

# Test health endpoint
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | {
    read status
    if [ "$status" = "200" ]; then
        echo "   ✅ Application is responding"
    else
        echo "   ❌ Application not responding (HTTP $status)"
    fi
}

echo -e "\n🎉 Deployment Fix Complete!"
echo "=============================="
echo "Next steps:"
echo "1. Configure DigitalOcean Spaces credentials in .env if not done"
echo "2. Test client creation at https://dashboard.aigrowise.com/admin"
echo "3. Monitor logs: pm2 logs aigrowise-dashboard"

echo -e "\nAdmin credentials can be found by running:"
echo "node scripts/create-production-admin.js"