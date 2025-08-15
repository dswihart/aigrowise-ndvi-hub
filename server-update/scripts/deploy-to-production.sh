#!/bin/bash

# Production Deployment Script for Aigrowise NDVI Hub
# Follow the PRODUCTION-DEPLOYMENT.md guide

set -e  # Exit on any error

echo "🚀 Starting production deployment of Aigrowise NDVI Hub..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
APP_NAME="aigrowise-ndvi-hub"
APP_DIR="/var/www/aigrowise"
NGINX_SITE="aigrowise-ndvi-hub"
DB_NAME="aigrowise_production"
DB_USER="aigrowise_user"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo."
    exit 1
fi

# Step 1: Server Setup
print_header "Step 1: Server Setup"

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

print_status "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install postgresql postgresql-contrib -y
fi

print_status "Installing PM2 globally..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
fi

# Step 2: Database Setup
print_header "Step 2: Database Setup"

print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -f scripts/setup-production-db.sql

print_status "Verifying database creation..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_status "✅ Database '$DB_NAME' created successfully"
else
    print_error "❌ Failed to create database '$DB_NAME'"
    exit 1
fi

# Step 3: Application Deployment
print_header "Step 3: Application Deployment"

print_status "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

print_status "Installing dependencies..."
npm ci --only=production

print_status "Generating Prisma client..."
npx prisma generate --schema=./packages/db/schema.prisma

print_status "Running database migration..."
DATABASE_URL="postgresql://$DB_USER:aigrowise_pass@localhost:5432/$DB_NAME" \
npx prisma migrate deploy --schema=./packages/db/schema.prisma

print_status "Building Next.js application..."
cd apps/nextjs && npm run build && cd ../..

print_status "Creating logs directory..."
mkdir -p logs

print_status "Creating production admin user..."
DATABASE_URL="postgresql://$DB_USER:aigrowise_pass@localhost:5432/$DB_NAME" \
node scripts/create-production-admin.js

# Step 4: Process Manager (PM2)
print_header "Step 4: Process Manager Setup"

print_status "Stopping existing PM2 processes..."
pm2 stop $APP_NAME || true
pm2 delete $APP_NAME || true

print_status "Starting application with PM2..."
pm2 start config/ecosystem.config.js --env production

print_status "Saving PM2 configuration..."
pm2 save

print_status "Setting up PM2 to start on system boot..."
pm2 startup | tail -1 | bash

# Step 5: Nginx Configuration
print_header "Step 5: Nginx Configuration"

print_status "Copying Nginx configuration..."
cp config/nginx.conf /etc/nginx/sites-available/$NGINX_SITE

print_status "Enabling the site..."
ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

print_status "Removing default Nginx site..."
rm -f /etc/nginx/sites-enabled/default

print_status "Testing Nginx configuration..."
if nginx -t; then
    print_status "✅ Nginx configuration is valid"
else
    print_error "❌ Nginx configuration test failed"
    exit 1
fi

print_status "Reloading Nginx..."
systemctl reload nginx

# Step 6: SSL Certificate (Let's Encrypt)
print_header "Step 6: SSL Certificate Setup"

print_status "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt install snapd -y
    snap install core
    snap refresh core
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
fi

print_status "Getting SSL certificate..."
certbot --nginx -d dashboard.aigrowise.com --non-interactive --agree-tos --email admin@aigrowise.com

print_status "Testing auto-renewal..."
certbot renew --dry-run

# Step 7: Firewall Setup
print_header "Step 7: Firewall Setup"

print_status "Configuring UFW firewall..."
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw --force enable

# Final checks
print_header "Final Verification"

print_status "Waiting for application to start..."
sleep 10

print_status "Checking PM2 status..."
pm2 status

print_status "Testing application health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "✅ Application is running successfully!"
else
    print_error "❌ Application health check failed"
    print_status "Checking PM2 logs..."
    pm2 logs $APP_NAME --lines 20
fi

print_status "Testing HTTPS access..."
if curl -f https://dashboard.aigrowise.com/api/health > /dev/null 2>&1; then
    print_status "✅ HTTPS is working!"
else
    print_warning "⚠️  HTTPS test failed - check SSL certificate"
fi

# Summary
print_header "Deployment Summary"

echo -e "${GREEN}🎉 Production deployment completed!${NC}"
echo ""
echo "📊 System Status:"
echo "  • Application: Running on port 3000"
echo "  • Database: PostgreSQL ($DB_NAME)"
echo "  • Web Server: Nginx with SSL"
echo "  • Process Manager: PM2"
echo ""
echo "🌐 Access URLs:"
echo "  • Main Site: https://dashboard.aigrowise.com"
echo "  • Health Check: https://dashboard.aigrowise.com/api/health"
echo ""
echo "📋 Next Steps:"
echo "  1. Configure DigitalOcean Spaces credentials"
echo "  2. Test login functionality"
echo "  3. Create client accounts"
echo "  4. Upload test NDVI images"
echo "  5. Set up monitoring and backups"
echo ""
echo "🔧 Management Commands:"
echo "  • PM2 Status: pm2 status"
echo "  • PM2 Logs: pm2 logs $APP_NAME"
echo "  • PM2 Restart: pm2 restart $APP_NAME"
echo "  • Nginx Test: nginx -t"
echo "  • Nginx Reload: systemctl reload nginx"
echo ""
print_status "Deployment completed successfully! 🚀"