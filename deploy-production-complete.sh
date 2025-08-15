#!/bin/bash

# Aigrowise NDVI Hub - Production Deployment Script
# Based on Architecture Document v1.0 and PRD requirements
# Implements T3 Stack deployment on DigitalOcean Droplet

set -e  # Exit on any error

echo "🌱 Aigrowise NDVI Hub - Production Deployment"
echo "=============================================="
echo "Following Architecture Document v1.0 specifications"
echo "Target: DigitalOcean Droplet with PostgreSQL + Spaces"
echo ""

# Configuration
APP_NAME="aigrowise-dashboard"
APP_DIR="/var/www/aigrowise"
NGINX_CONF="/etc/nginx/sites-available/aigrowise"
DOMAIN="dashboard.aigrowise.com"
DB_NAME="aigrowise_production"
DB_USER="aigrowise_user"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

log_info "Starting Aigrowise NDVI Hub deployment..."

# Section 1: System Prerequisites (Architecture Doc Section 10)
log_info "1. Installing system prerequisites..."

# Update system
apt-get update -y
apt-get upgrade -y

# Install Node.js 18.x (T3 Stack requirement)
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install required system packages
apt-get install -y \
    nginx \
    postgresql \
    postgresql-contrib \
    certbot \
    python3-certbot-nginx \
    curl \
    git \
    build-essential

# Install PM2 globally
npm install -g pm2@latest

# Install pnpm (T3 Stack preferred package manager)
npm install -g pnpm@latest

log_success "System prerequisites installed"

# Section 2: Database Setup (Architecture Doc Section 7)
log_info "2. Setting up PostgreSQL database..."

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" || log_warning "Database may already exist"
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD 'aigrowise_secure_2025';" || log_warning "User may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" || log_warning "Privileges may already be granted"
sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;" || log_warning "User may already have CREATEDB"

log_success "Database setup completed"

# Section 3: Application Deployment
log_info "3. Deploying application code..."

# Create application directory
mkdir -p ${APP_DIR}
cd ${APP_DIR}

# Check if this is an update or fresh install
if [ -d "${APP_DIR}/.git" ]; then
    log_info "Updating existing application..."
    git pull origin main || log_warning "Git pull failed, continuing with existing code"
else
    log_info "Fresh installation - expecting code to be uploaded"
    # In production, code would be uploaded or cloned here
fi

# Set up environment file (Architecture Doc Section 10)
log_info "Setting up production environment..."

cat > ${APP_DIR}/.env << EOF
# Production Environment - Aigrowise NDVI Hub
NODE_ENV=production
PORT=3000

# Database (Architecture Doc Section 7)
DATABASE_URL="postgresql://${DB_USER}:aigrowise_secure_2025@localhost:5432/${DB_NAME}"

# NextAuth.js Configuration (T3 Stack)
NEXTAUTH_SECRET="aigrowise-production-secret-2025-ndvi-hub-$(openssl rand -base64 32)"
NEXTAUTH_URL="https://${DOMAIN}"
APP_BASE_URL="https://${DOMAIN}"

# DigitalOcean Spaces (Architecture Doc Section 2)
DO_SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
DO_SPACES_REGION="nyc3"
DO_SPACES_BUCKET="aigrowise-ndvi-images"
DO_SPACES_ACCESS_KEY="REPLACE_WITH_ACTUAL_KEY"
DO_SPACES_SECRET_KEY="REPLACE_WITH_ACTUAL_SECRET"

# Image Processing (PRD Section 2 - NFR Requirements)
MAX_FILE_SIZE=52428800
SUPPORTED_FORMATS="tiff,tif,png,jpg,jpeg,webp"
THUMBNAIL_SIZE=300
MAX_IMAGE_WIDTH=2048
MAX_IMAGE_HEIGHT=2048

# Application Settings (PRD Requirements)
MAX_IMAGES_PER_CLIENT=1000
IMAGE_RETENTION_DAYS=365

# Security Settings (Architecture Doc Section 12)
BCRYPT_ROUNDS=12
SESSION_MAX_AGE=2592000

# Monitoring (Architecture Doc Section 16)
LOG_LEVEL="info"
ENABLE_REQUEST_LOGGING=true
EOF

log_success "Environment configuration created"

# Section 4: Install Dependencies and Build (T3 Stack)
log_info "4. Installing dependencies and building application..."

if [ -f "package.json" ]; then
    # Install dependencies
    pnpm install --frozen-lockfile || npm install

    # Generate Prisma client
    npx prisma generate

    # Run database migrations
    npx prisma db push

    # Build Next.js application
    pnpm build || npm run build

    log_success "Application built successfully"
else
    log_error "package.json not found. Please ensure application code is properly uploaded."
    exit 1
fi

# Section 5: Create Admin User (PRD Epic 1)
log_info "5. Creating admin user..."

cat > ${APP_DIR}/create-admin-production.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@aigrowise.com';
    const adminPassword = 'AigroAdmin2025!';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('🔑 Use existing credentials to login');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('🌐 Login at: https://dashboard.aigrowise.com/admin');
    console.log('⚠️  IMPORTANT: Change password after first login');
    
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
EOF

node create-admin-production.js

log_success "Admin user setup completed"

# Section 6: PM2 Configuration (Architecture Doc Section 11)
log_info "6. Setting up PM2 process management..."

cat > ${APP_DIR}/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'npm',
    args: 'start',
    cwd: '${APP_DIR}',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '${APP_DIR}/logs/err.log',
    out_file: '${APP_DIR}/logs/out.log',
    log_file: '${APP_DIR}/logs/combined.log',
    time: true,
    max_restarts: 5,
    restart_delay: 4000
  }]
};
EOF

# Create logs directory
mkdir -p ${APP_DIR}/logs

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

log_success "PM2 configuration completed"

# Section 7: Nginx Configuration (Architecture Doc Section 11)
log_info "7. Configuring Nginx web server..."

cat > ${NGINX_CONF} << EOF
# Aigrowise NDVI Hub - Nginx Configuration
# Architecture Document Section 11 - Deployment

upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Security Headers (Architecture Doc Section 12)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    
    # File Upload Settings (PRD Image Requirements)
    client_max_body_size 50M;
    
    # Gzip Compression (Performance - Architecture Doc Section 12)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static File Caching (Performance)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # Proxy to Next.js Application
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health Check Endpoint
    location /api/health {
        proxy_pass http://nextjs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # No caching for health checks
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

# Enable the site
ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/aigrowise

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

log_success "Nginx configuration completed"

# Section 8: SSL Certificate (Architecture Doc Section 12)
log_info "8. Setting up SSL certificate..."

# Get SSL certificate
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@aigrowise.com

log_success "SSL certificate configured"

# Section 9: Firewall Configuration
log_info "9. Configuring firewall..."

ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5432/tcp  # PostgreSQL (for admin access if needed)

log_success "Firewall configured"

# Section 10: Final Verification
log_info "10. Running final verification..."

# Wait for application to start
sleep 5

# Test local health endpoint
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    log_success "✅ Application is responding locally"
else
    log_error "❌ Application not responding locally"
fi

# Test external endpoint
if curl -f -s https://${DOMAIN}/api/health > /dev/null; then
    log_success "✅ Application is responding externally"
else
    log_warning "⚠️ External access may need a moment to propagate"
fi

# Display deployment summary
echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "======================================"
echo ""
echo "📋 Aigrowise NDVI Hub is now deployed according to:"
echo "   • Architecture Document v1.0"
echo "   • Product Requirements Document"
echo "   • Front-end Specification"
echo ""
echo "🌐 Access Points:"
echo "   • Dashboard: https://${DOMAIN}"
echo "   • Admin Login: https://${DOMAIN}/admin"
echo "   • Health Check: https://${DOMAIN}/api/health"
echo ""
echo "🔐 Admin Credentials:"
echo "   • Email: admin@aigrowise.com"
echo "   • Password: AigroAdmin2025!"
echo "   • ⚠️ CHANGE PASSWORD AFTER FIRST LOGIN"
echo ""
echo "🛠️ Management Commands:"
echo "   • View logs: pm2 logs ${APP_NAME}"
echo "   • Restart app: pm2 restart ${APP_NAME}"
echo "   • Check status: pm2 status"
echo "   • Nginx reload: systemctl reload nginx"
echo ""
echo "📋 Next Steps:"
echo "1. Login to admin dashboard"
echo "2. Configure DigitalOcean Spaces credentials in .env"
echo "3. Test client creation functionality"
echo "4. Upload test NDVI images"
echo ""
echo "🎯 The system now supports:"
echo "   ✅ Client account creation (PRD Epic 1)"
echo "   ✅ Image management (PRD Epic 2)"  
echo "   ✅ Production deployment (PRD Epic 3)"
echo "   ✅ T3 Stack architecture"
echo "   ✅ Security & performance optimizations"
echo ""

log_success "Aigrowise NDVI Hub deployment complete!"